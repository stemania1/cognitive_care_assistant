"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SENSOR_CONFIG, getPiHost, isPiTcpConnection, type ConnectionMode } from "../config/sensor-config";

const CONNECTION_MODE_KEY = "thermal-connection-mode";

interface ThermalFrame {
  timestamp: number;
  data: number[][]; // 8x8 grid for AMG8833
}

interface PiWebSocketPacket {
  type: string; // 'connection' | 'thermal_data'
  timestamp?: number;
  thermal_data?: number[][];
  sensor_info?: any;
  grid_size?: { width: number; height: number };
}

export default function Sensors() {
  const [thermalData, setThermalData] = useState<ThermalFrame | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Initial state must match server (no localStorage) to avoid hydration mismatch
  const [connectionMode, setConnectionModeState] = useState<ConnectionMode>(
    SENSOR_CONFIG.CONNECTION_MODE
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Apply saved preference after mount (client-only)
  useEffect(() => {
    const saved = localStorage.getItem(CONNECTION_MODE_KEY) as ConnectionMode | null;
    if (saved === "wifi" || saved === "usb" || saved === "bluetooth") {
      setConnectionModeState(saved);
      SENSOR_CONFIG.CONNECTION_MODE = saved;
    }
  }, []);

  const setConnectionMode = (mode: ConnectionMode) => {
    SENSOR_CONFIG.CONNECTION_MODE = mode;
    setConnectionModeState(mode);
    // Reset connection state so we don't show "Connected via X" until actually connected with this mode
    setIsConnected(false);
    setConnectionStatus("Disconnected");
    setThermalData(null);
    try {
      localStorage.setItem(CONNECTION_MODE_KEY, mode);
    } catch (_) {}
  };

  // AMG8833 specifications
  const GRID_SIZE = 8;
  const MIN_TEMP = 18;
  const MAX_TEMP = 40;

  useEffect(() => {
    SENSOR_CONFIG.CONNECTION_MODE = connectionMode;
  }, [connectionMode]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if ((window as any).demoInterval) {
        clearInterval((window as any).demoInterval);
        (window as any).demoInterval = null;
      }
    };
  }, [connectionMode]);

  const connectWebSocket = () => {
    try {
      setIsLoading(true);
      setError(null);
      wsRef.current = null;

      if (!isPiTcpConnection()) {
        setConnectionStatus("Bluetooth (polling)");
        startHttpPolling();
        return;
      }

      const wsUrl = `ws://${getPiHost()}:${SENSOR_CONFIG.WEBSOCKET_PORT}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("Connected");
        setError(null);
        setIsLoading(false);
        console.log("WebSocket connected:", wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const msg: PiWebSocketPacket = JSON.parse(event.data);
          if (msg.type === "thermal_data" && msg.thermal_data) {
            setThermalData({ timestamp: msg.timestamp || Date.now(), data: msg.thermal_data });
            setError(null);
          }
        } catch (err) {
          console.error("Error parsing thermal data:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus("Disconnected");
        setIsLoading(false);
        console.log("WebSocket disconnected");
      };

      ws.onerror = () => {
        console.warn("WebSocket connection failed:", wsUrl);
        setError("Failed to connect via WebSocket. Trying HTTP fallback...");
        startHttpPolling();
      };
    } catch (err) {
      console.error("Connection error:", err);
      setError("Connection failed. Trying HTTP fallback...");
      startHttpPolling();
    }
  };

  const startDemoMode = () => {
    setIsLoading(true);
    setError(null);
    
    // Generate demo data
    const demoData: ThermalFrame = {
      timestamp: Date.now(),
      data: generateDemoThermalData()
    };
    
    setThermalData(demoData);
    setIsConnected(true);
    setConnectionStatus("Demo Mode");
    setIsLoading(false);
    
    // Update demo data every 2 seconds
    const interval = setInterval(() => {
      const newDemoData: ThermalFrame = {
        timestamp: Date.now(),
        data: generateDemoThermalData()
      };
      setThermalData(newDemoData);
    }, 2000);
    
    // Store interval for cleanup
    (window as any).demoInterval = interval;
  };

  const generateDemoThermalData = (): number[][] => {
    const baseTemp = 25.0;
    const grid = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        // Create a realistic thermal pattern
        const center_x = 4;
        const center_y = 4;
        const distance = Math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2);
        
        // Simulate a heat source in the center
        let temp = baseTemp;
        if (distance < 2) {
          temp = baseTemp + 15 + (Math.random() - 0.5) * 4;
        } else if (distance < 4) {
          temp = baseTemp + 8 + (Math.random() - 0.5) * 3;
        } else {
          temp = baseTemp + (Math.random() - 0.5) * 2;
        }
        
        row.push(Number(temp.toFixed(1)));
      }
      grid.push(row);
    }
    
    return grid;
  };

  const stopDemoMode = () => {
    if ((window as any).demoInterval) {
      clearInterval((window as any).demoInterval);
      (window as any).demoInterval = null;
    }
    setIsConnected(false);
    setConnectionStatus("Disconnected");
    setThermalData(null);
  };

  const startHttpPolling = () => {
    setIsLoading(true);
    const pollData = async () => {
      try {
        const url = isPiTcpConnection()
          ? `/api/thermal?ip=${encodeURIComponent(getPiHost())}&port=${SENSOR_CONFIG.HTTP_PORT}`
          : "/api/thermal";
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          const grid: number[][] = data?.thermal_data || data?.data;
          const ts: number = data?.timestamp || Date.now();
          if (grid && Array.isArray(grid)) {
            setThermalData({ timestamp: ts, data: grid });
            setIsConnected(true);
            if (!isPiTcpConnection()) {
              setConnectionStatus("Connected (Bluetooth)");
            } else if (data._connection) {
              const { host, isBackup } = data._connection;
              setConnectionStatus(
                isBackup
                  ? `Connected (Local Wi‑Fi backup · ${host})`
                  : `Connected (Hotspot · ${host})`
              );
            } else {
              setConnectionStatus("Connected (HTTP)");
            }
            setError(null);
          } else {
            setIsConnected(false);
            setConnectionStatus("Disconnected");
            if (!isPiTcpConnection()) {
              setError("Bluetooth: Start the bridge (node bluetooth-thermal-receiver.js COMx) and Pi sender (python3 bluetooth-thermal-sender.py).");
            } else {
              setError("No thermal data received. On Pi run: python3 raspberry_pi_thermal_server.py");
            }
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        if (!isPiTcpConnection()) {
          setError(
            "Bluetooth: Run on PC — node bluetooth-thermal-receiver.js COMx (add Outgoing COM port in Devices and Printers → raspberrypi). On Pi — python3 bluetooth-thermal-sender.py."
          );
        } else if (connectionMode === "usb") {
          setError(
            `USB: 1) Pi connected via USB cable (data port). 2) Windows: set USB Ethernet adapter to 192.168.7.1. 3) On Pi run: python3 raspberry_pi_thermal_server.py`
          );
        } else {
          setError(
            `Failed to connect. Ensure Pi HTTP ${SENSOR_CONFIG.HTTP_PORT} at ${getPiHost()}.`
          );
        }
        setIsConnected(false);
        setConnectionStatus("Connection Failed");
      } finally {
        setIsLoading(false);
      }
    };

    pollData();
    const interval = setInterval(pollData, SENSOR_CONFIG.HTTP_POLLING_INTERVAL);
    return () => clearInterval(interval);
  };

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !thermalData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get the actual displayed size of the canvas
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Use the smaller dimension to ensure square aspect ratio
    const size = Math.min(displayWidth, displayHeight);
    const cellWidth = size / GRID_SIZE;
    const cellHeight = size / GRID_SIZE;
    
    // Set canvas internal resolution to match display size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw grid cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Clamp and normalize to reduce outlier impact
        const tempRaw = thermalData.data[y][x];
        const temp = Math.min(MAX_TEMP, Math.max(MIN_TEMP, tempRaw));
        const normalizedTemp = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
        
        // Color gradient from blue (cold) to red (hot)
        const hue = (1 - normalizedTemp) * 240; // 240 (blue) to 0 (red)
        const saturation = 80;
        const lightness = 50 + normalizedTemp * 30;
        
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        
        // Draw temperature value
        ctx.fillStyle = temp > (MIN_TEMP + MAX_TEMP) / 2 ? "white" : "black";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          `${temp.toFixed(1)}°C`,
          x * cellWidth + cellWidth / 2,
          y * cellHeight + cellHeight / 2 + 3
        );
      }
    }

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, size);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(size, i * cellHeight);
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (thermalData) {
      drawHeatmap();
    }
  }, [thermalData]);

  // Redraw on window resize
  useEffect(() => {
    const handleResize = () => {
      if (thermalData) {
        drawHeatmap();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [thermalData]);

  const getTemperatureStats = () => {
    if (!thermalData) return null;

    const allTemps = thermalData.data.flat();
    const minTemp = Math.min(...allTemps);
    const maxTemp = Math.max(...allTemps);
    const avgTemp = allTemps.reduce((sum, temp) => sum + temp, 0) / allTemps.length;

    return { minTemp, maxTemp, avgTemp };
  };

  const getStatusColor = () => {
    if (isConnected) return "text-emerald-400";
    if (isLoading) return "text-amber-400";
    return "text-red-400";
  };

  const getStatusIcon = () => {
    if (isConnected) return "🟢";
    if (isLoading) return "🟡";
    return "🔴";
  };

  const getConnectionMethodLabel = (): string => {
    if (isConnected && connectionStatus === "Demo Mode") return "Demo";
    if (connectionMode === "wifi") return "Wi‑Fi";
    if (connectionMode === "usb") return "USB";
    return "Bluetooth";
  };

  const getConnectionMethodIcon = (): string => {
    if (isConnected && connectionStatus === "Demo Mode") return "🎮";
    if (connectionMode === "wifi") return "📶";
    if (connectionMode === "usb") return "🔌";
    return "📡";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-6xl px-6 sm:px-8 py-12 sm:py-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414L7.828 11z" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Title and Status */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Thermal Sensor Monitor
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Real-time thermal imaging from AMG8833 sensor
          </p>
          
          {/* Connection Status */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-white/20">
              <span className="text-2xl">{getStatusIcon()}</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {isConnected
                  ? connectionStatus === "Demo Mode"
                    ? "Demo Mode"
                    : `Connected via ${getConnectionMethodLabel()}`
                  : connectionStatus}
              </span>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              )}
            </div>
            {connectionMode === "bluetooth" && !isConnected && (
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300">
                Bluetooth mode active — waiting for data from <code className="bg-black/20 px-1 rounded">/api/thermal/bt</code>.
              </div>
            )}
            {!isConnected && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300"
                title={`Connection method: ${getConnectionMethodLabel()}`}
              >
                <span className="opacity-80">{getConnectionMethodIcon()}</span>
                <span>Via {getConnectionMethodLabel()}</span>
              </div>
            )}
          </div>
          {(connectionMode === "wifi" || connectionMode === "usb") && (
            <p className="text-sm text-gray-400 mt-2">
              Raspberry Pi: <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-cyan-300/90">{getPiHost()}</code>
            </p>
          )}
          {connectionMode === "bluetooth" && (
            <p className="text-sm text-gray-400 mt-2">
              Raspberry Pi: <span className="text-gray-500">— (data via Bluetooth bridge)</span>
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center space-x-3">
              <span className="text-amber-400 text-xl">💡</span>
              <div>
                <p className="text-amber-400 font-medium">Connection Notice</p>
                <p className="text-amber-300 text-sm">{error}</p>
                <p className="text-amber-200 text-xs mt-2">
                  💡 Try Demo Mode to test the interface, or set up your Raspberry Pi sensor server.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Heatmap Visualization */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-sky-500/5 to-blue-500/10 blur-xl" />
              <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6 min-h-[500px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Thermal Heatmap</h2>
                  <div className="text-sm text-gray-400">
                    {thermalData ? new Date(thermalData.timestamp).toLocaleTimeString() : "No data"}
                  </div>
                </div>
                
                {/* Canvas Container */}
                <div className="flex justify-center items-center py-4">
                  <div className="relative w-full max-w-md">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={400}
                      className="w-full h-auto max-w-full max-h-80 border border-white/20 rounded-lg bg-black/20"
                      style={{ aspectRatio: '1/1' }}
                    />
                    
                    {/* Temperature Scale */}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
                        <span className="text-xs sm:text-sm text-gray-300">Cold ({MIN_TEMP}°C)</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
                        <span className="text-xs sm:text-sm text-gray-300">Warm</span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
                        <span className="text-xs sm:text-sm text-gray-300">Hot ({MAX_TEMP}°C)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sensor Info and Controls */}
          <div className="space-y-6">
            {/* Sensor Specifications */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-green-500/10 blur-xl" />
              <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-emerald-400 mr-2">🔬</span>
                  Sensor Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Model:</span>
                    <span className="text-white">AMG8833</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Resolution:</span>
                    <span className="text-white">8×8 pixels</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Range:</span>
                    <span className="text-white">-20°C to +80°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Accuracy:</span>
                    <span className="text-white">±2.5°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Update Rate:</span>
                    <span className="text-white">10 Hz</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature Statistics */}
            {thermalData && (
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 blur-xl" />
                <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <span className="text-purple-400 mr-2">📊</span>
                    Current Stats
                  </h3>
                  {(() => {
                    const stats = getTemperatureStats();
                    if (!stats) return null;
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Min:</span>
                          <span className="text-cyan-400 font-medium">{stats.minTemp.toFixed(1)}°C</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Max:</span>
                          <span className="text-red-400 font-medium">{stats.maxTemp.toFixed(1)}°C</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Average:</span>
                          <span className="text-emerald-400 font-medium">{stats.avgTemp.toFixed(1)}°C</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Connection Controls */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-red-500/10 blur-xl" />
              <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="text-amber-400 mr-2">⚙️</span>
                  Controls
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Connection</label>
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                      {(["wifi", "usb", "bluetooth"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setConnectionMode(mode);
                            connectWebSocket();
                          }}
                          className={`flex-1 py-2 px-3 text-sm font-medium capitalize transition-colors ${
                            connectionMode === mode
                              ? "bg-cyan-600 text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          {mode === "wifi" ? "Wi‑Fi" : mode === "usb" ? "USB" : "Bluetooth"}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {connectionMode === "usb" && "Pi over USB cable (same server, no Pi code change)."}
                      {connectionMode === "bluetooth" && "Data from bridge posting to /api/thermal/bt (no Pi in loop)."}
                    </p>
                  </div>
                  <button
                    onClick={connectWebSocket}
                    disabled={isLoading}
                    className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Connecting..." : "Connect to Sensor"}
                  </button>
                  
                  {!isConnected && (
                    <button
                      onClick={startDemoMode}
                      disabled={isLoading}
                      className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Start Demo Mode
                    </button>
                  )}
                  
                  {isConnected && connectionStatus === "Demo Mode" && (
                    <button
                      onClick={stopDemoMode}
                      className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200"
                    >
                      Stop Demo Mode
                    </button>
                  )}
                  
                  <div className="text-xs text-gray-400 text-center pt-2 border-t border-white/10">
                    <p className="mb-1">Demo Mode: Test the interface without hardware</p>
                    <p>Real Sensor: {connectionMode === "bluetooth" ? "Bluetooth bridge → /api/thermal/bt" : `Pi HTTP ${SENSOR_CONFIG.HTTP_PORT}, WS ${SENSOR_CONFIG.WEBSOCKET_PORT} at ${getPiHost()}`}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Format Info */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-slate-500/10 via-gray-500/5 to-zinc-500/10 blur-xl" />
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="text-slate-400 mr-2">📋</span>
                Expected Data Format
              </h3>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                <p className="text-gray-300 mb-2">// JSON format expected from Raspberry Pi:</p>
                <pre className="text-cyan-400">{`{
  "timestamp": 1703123456789,
  "thermal_data": [
    [25.1, 25.3, 25.2, ...],
    [25.4, 25.6, 25.5, ...],
    // ... 6 more rows
  ],
  "sensor_info": { /* ... */ },
  "grid_size": { "width": 8, "height": 8 }
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


