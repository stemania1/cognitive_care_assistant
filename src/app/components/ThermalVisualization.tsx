"use client";

import { useState, useEffect, useRef } from 'react';
import { SENSOR_CONFIG, getWebSocketUrl, getThermalDataUrl, findRaspberryPi, getPiHost, isPiTcpConnection } from '../config/sensor-config';

const BLUETOOTH_SENTINEL = '__bluetooth__';

interface ThermalData {
  type: string;
  timestamp: number;
  thermal_data: number[][];
  sensor_info: {
    type: string;
    device_id: string;
    status: string;
    bus: string | number;
  };
  grid_size: {
    width: number;
    height: number;
  };
}

interface ThermalVisualizationProps {
  isActive: boolean;
  onDataReceived: (data: ThermalData) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
  calibrationMatrix?: number[][] | null;
  isBaselineCalibrating?: boolean;
}

export default function ThermalVisualization({
  isActive,
  onDataReceived,
  onConnectionStatusChange,
  calibrationMatrix = null,
  isBaselineCalibrating = false,
}: ThermalVisualizationProps) {
  const [thermalData, setThermalData] = useState<number[][]>([]);
  const [sensorInfo, setSensorInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'discovering'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [discoveredIP, setDiscoveredIP] = useState<string | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastConnectionStatus = useRef<string>('disconnected');
  const lastThermalData = useRef<number[][]>([]);
  const onDataReceivedRef = useRef(onDataReceived);
  const calibrationRef = useRef<number[][] | null>(null);
  const USE_BASELINE = false;
  const ENABLE_DENOISING = false;
  const smoothingFactor = ENABLE_DENOISING ? 0.2 : 0; // No smoothing when disabled
  const calibrationDriftFactor = 0.02;
  const calibrationDriftThreshold = 0.6;
  const recentFramesRef = useRef<number[][][]>([]);
  const FRAMES_TO_AVERAGE = 5;
  const isPollingRef = useRef(false); // Guard to prevent concurrent polling requests

  const applyCalibration = (frame: number[][]): number[][] => {
    if (!USE_BASELINE) return frame;
    const ref = calibrationRef.current;
    if (!ref) return frame;
    return frame.map((row, y) =>
      row.map((value, x) => {
        const baseline = ref[y]?.[x];
        if (baseline === undefined) return value;
        const diff = value - baseline;
        if (!isBaselineCalibrating && Math.abs(diff) < calibrationDriftThreshold) {
          const nextBaseline = baseline + calibrationDriftFactor * diff;
          if (ref[y]) {
            ref[y][x] = Math.round(nextBaseline * 10) / 10;
          }
        }
        return Math.round(diff * 10) / 10;
      })
    );
  };

  const denoiseFrame = (frame: number[][]): number[][] => {
    if (!ENABLE_DENOISING) {
      return frame;
    }
    recentFramesRef.current.push(frame.map((row) => [...row]));
    if (recentFramesRef.current.length > FRAMES_TO_AVERAGE) {
      recentFramesRef.current.shift();
    }
    const frameCount = recentFramesRef.current.length;
    if (frameCount === 0) return frame;
    return frame.map((row, y) =>
      row.map((_, x) => {
        let sum = 0;
        for (const sample of recentFramesRef.current) {
          sum += sample[y][x];
        }
        return Math.round((sum / frameCount) * 10) / 10;
      })
    );
  };

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

  useEffect(() => {
    if (!calibrationMatrix) {
      calibrationRef.current = null;
      recentFramesRef.current = [];
      return;
    }
    calibrationRef.current = calibrationMatrix.map((row) => [...row]);
    lastThermalData.current = [];
    recentFramesRef.current = [];
  }, [calibrationMatrix]);

  useEffect(() => {
    if (!isActive) {
      recentFramesRef.current = [];
      lastThermalData.current = [];
    }
  }, [isActive]);

  // Smooth thermal data to reduce jumpiness
  const smoothThermalData = (newData: number[][]) => {
    if (!ENABLE_DENOISING) {
      lastThermalData.current = newData;
      return newData;
    }
    if (lastThermalData.current.length === 0) {
      lastThermalData.current = newData;
      return newData;
    }

    const smoothedData: number[][] = [];
    for (let y = 0; y < newData.length; y++) {
      smoothedData[y] = [];
      for (let x = 0; x < newData[y].length; x++) {
        const oldValue = lastThermalData.current[y]?.[x] || newData[y][x];
        const newValue = newData[y][x];
        const smoothedValue = oldValue + smoothingFactor * (newValue - oldValue);
        smoothedData[y][x] = Math.round(smoothedValue * 10) / 10; // Round to 1 decimal
      }
    }
    
    lastThermalData.current = smoothedData;
    return smoothedData;
  };

  // Notify parent component of connection status changes
  useEffect(() => {
    if (onConnectionStatusChange) {
      const isConnected = connectionStatus === 'connected';
      onConnectionStatusChange(isConnected);
    }
  }, [connectionStatus, onConnectionStatusChange]);

  // Auto-discover Raspberry Pi when component becomes active
  // Set connection target: Bluetooth (poll /api/thermal), USB (use getPiHost()), or Wi‑Fi (discover)
  useEffect(() => {
    if (!isActive) {
      setDiscoveredIP(null);
      return;
    }
    if (!isPiTcpConnection()) {
      setDiscoveredIP(BLUETOOTH_SENTINEL);
      setConnectionStatus('connecting');
      return;
    }
    if (SENSOR_CONFIG.CONNECTION_MODE === 'usb') {
      setDiscoveredIP(getPiHost());
      setConnectionStatus('connecting');
      return;
    }
    const discoverPi = async () => {
      setConnectionStatus('discovering');
      const foundIP = await findRaspberryPi();
      if (foundIP) {
        setDiscoveredIP(foundIP);
        setConnectionStatus('connecting');
        SENSOR_CONFIG.RASPBERRY_PI_IP = foundIP;
      } else {
        setDiscoveredIP(SENSOR_CONFIG.RASPBERRY_PI_IP);
        setConnectionStatus('connecting');
      }
    };
    discoverPi();
  }, [isActive]);

  // WebSocket connection (skip when Bluetooth — we only poll)
  useEffect(() => {
    if (!isActive || !discoveredIP || discoveredIP === BLUETOOTH_SENTINEL) {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      if (!isActive || !discoveredIP) {
        setConnectionStatus('disconnected');
      }
      return;
    }

    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      const wsUrl = `ws://${discoveredIP}:${SENSOR_CONFIG.WEBSOCKET_PORT}`;
      
      try {
        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;

        // Set connection timeout to prevent hanging
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            console.warn('⚠️ WebSocket connection timeout after 5 seconds - closing and falling back to HTTP polling');
            ws.close();
            if (lastConnectionStatus.current !== 'disconnected') {
              lastConnectionStatus.current = 'disconnected';
              setConnectionStatus('disconnected');
            }
          }
        }, 5000); // 5 second connection timeout

        // Set a timeout to check if we receive data
        let dataTimeout: NodeJS.Timeout;
        
        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          
          if (lastConnectionStatus.current !== 'connected') {
            lastConnectionStatus.current = 'connected';
            setConnectionStatus('connected');
            console.log('✅ WebSocket connected to thermal sensor at', wsUrl);
          }
          
          dataTimeout = setTimeout(() => {
            console.warn('⚠️ No data received within 10 seconds of WebSocket connection');
          }, 10000);
        };

        ws.onmessage = (event) => {
          try {
            // Clear the data timeout since we received data
            if (dataTimeout) {
              clearTimeout(dataTimeout);
            }
            
            console.log('📊 Received WebSocket data:', event.data.substring(0, 100) + '...');
            
            const data: ThermalData = JSON.parse(event.data);
            if (data.type === 'thermal_data') {
              const calibrated = applyCalibration(data.thermal_data);
              const denoised = denoiseFrame(calibrated);
              const smoothedData = smoothThermalData(denoised);
              setThermalData(smoothedData);
              setSensorInfo(data.sensor_info);
              setLastUpdate(new Date());
              onDataReceivedRef.current(data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket data:', error);
          }
        };

        ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          if (dataTimeout) {
            clearTimeout(dataTimeout);
          }
          
          console.log('WebSocket closed', { 
            wsUrl, 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean 
          });
          if (lastConnectionStatus.current !== 'disconnected') {
            lastConnectionStatus.current = 'disconnected';
            setConnectionStatus('disconnected');
          }
          
          // Auto-reconnect after a delay if connection was not clean and not a timeout
          // Limit reconnect attempts to prevent infinite loops
          if (!event.wasClean && isActive && event.code !== 1006) { // 1006 = abnormal closure
            console.log('Attempting to reconnect in 3 seconds...');
            setTimeout(() => {
              if (isActive && discoveredIP && websocketRef.current?.readyState === WebSocket.CLOSED) {
                connectWebSocket();
              }
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          // WebSocket errors are expected when using Bluetooth - HTTP polling will handle data
          console.warn('⚠️ WebSocket connection failed (expected with Bluetooth mode) - falling back to HTTP polling');
          // Handle WebSocket errors - HTTP polling will handle data retrieval
          if (lastConnectionStatus.current !== 'disconnected') {
            lastConnectionStatus.current = 'disconnected';
            setConnectionStatus('disconnected');
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket', { error, discoveredIP, port: SENSOR_CONFIG.WEBSOCKET_PORT });
        setConnectionStatus('disconnected');
      }
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [isActive, discoveredIP]);

  // Calculate average temperature
  const averageTemperature = thermalData.length > 0 
    ? thermalData.flat().reduce((sum, temp) => sum + temp, 0) / (thermalData.length * thermalData[0].length)
    : 0;

  // Canvas rendering with 32x32 upscaling and color blending
  useEffect(() => {
    if (!canvasRef.current || thermalData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to 96x96 for larger upscaling (bigger visual)
    const GRID_SIZE = 96;
    
    // Get the container size and set canvas to fit properly
    const container = canvas.parentElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      // Use a larger minimum size for the canvas
      const minSize = Math.max(600, Math.min(containerRect.width, containerRect.height) * 0.95);
      const pixelSize = Math.floor(minSize / GRID_SIZE);
      const actualSize = pixelSize * GRID_SIZE;
      
      canvas.width = actualSize;
      canvas.height = actualSize;
      canvas.style.width = `${actualSize}px`;
      canvas.style.height = `${actualSize}px`;
    } else {
      // Fallback to larger default size
      const defaultSize = 600;
      canvas.width = defaultSize;
      canvas.height = defaultSize;
      canvas.style.width = `${defaultSize}px`;
      canvas.style.height = `${defaultSize}px`;
    }

    // Use requestAnimationFrame for smooth rendering
    const renderFrame = () => {
      try {
        // Validate thermal data before processing
        if (!thermalData || thermalData.length === 0 || !Array.isArray(thermalData[0])) {
          console.warn('⚠️ Invalid thermal data, skipping render');
          return;
        }
        
        // Find temperature range for color mapping
        const allTemps = thermalData.flat();
        if (allTemps.length === 0) {
          console.warn('⚠️ Empty thermal data array, skipping render');
          return;
        }
        
        const minTemp = Math.min(...allTemps);
        const maxTemp = Math.max(...allTemps);
        const tempRange = maxTemp - minTemp;

      // Create upscaled thermal data (32x32 from 8x8)
      const upscaledData: number[][] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        upscaledData[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          // Map 32x32 coordinates to 8x8 coordinates with interpolation
          const sourceX = (x / GRID_SIZE) * 8;
          const sourceY = (y / GRID_SIZE) * 8;
          
          const x1 = Math.floor(sourceX);
          const y1 = Math.floor(sourceY);
          const x2 = Math.min(x1 + 1, 7);
          const y2 = Math.min(y1 + 1, 7);
          
          const fx = sourceX - x1;
          const fy = sourceY - y1;
          
          // Bilinear interpolation
          const temp = 
            thermalData[y1][x1] * (1 - fx) * (1 - fy) +
            thermalData[y1][x2] * fx * (1 - fy) +
            thermalData[y2][x1] * (1 - fx) * fy +
            thermalData[y2][x2] * fx * fy;
          
          upscaledData[y][x] = temp;
        }
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate pixel size for drawing
      const pixelSize = Math.floor(canvas.width / GRID_SIZE);

      // Draw upscaled thermal grid
      upscaledData.forEach((row, y) => {
        row.forEach((temp, x) => {
          const normalizedTemp = tempRange > 0 ? (temp - minTemp) / tempRange : 0.5;
          
          // Enhanced color mapping: blue (cold) to red (hot) with better contrast
          let r, g, b;
          
          // Use a more vibrant color scheme
          if (normalizedTemp < 0.33) {
            // Blue to cyan
            const factor = normalizedTemp / 0.33;
            r = Math.floor(0);
            g = Math.floor(255 * factor);
            b = Math.floor(255);
          } else if (normalizedTemp < 0.66) {
            // Cyan to yellow
            const factor = (normalizedTemp - 0.33) / 0.33;
            r = Math.floor(255 * factor);
            g = Math.floor(255);
            b = Math.floor(255 * (1 - factor));
          } else {
            // Yellow to red
            const factor = (normalizedTemp - 0.66) / 0.34;
            r = Math.floor(255);
            g = Math.floor(255 * (1 - factor));
            b = Math.floor(0);
          }

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        });
      });
      } catch (error) {
        console.error('❌ Error rendering thermal canvas:', error);
        // Don't throw - just skip this frame to prevent lockup
      }
    };

    // Use requestAnimationFrame for smooth updates
    const animationId = requestAnimationFrame(renderFrame);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [thermalData]);

  // Fallback to HTTP polling (or Bluetooth: poll /api/thermal with no query).
  // Keep polling even when 'connected' so data keeps updating (no early return on connectionStatus).
  useEffect(() => {
    if (!isActive || !discoveredIP) return;

    const pollData = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const isBluetooth = discoveredIP === BLUETOOTH_SENTINEL;
      const query = isBluetooth ? '' : `?ip=${encodeURIComponent(discoveredIP)}&port=${SENSOR_CONFIG.HTTP_PORT}`;

      try {
        const response = await fetch(`/api/thermal${query}`, {
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const grid = data?.thermal_data ?? data?.data;
          if (!grid || !Array.isArray(grid)) {
            if (lastConnectionStatus.current !== 'disconnected') {
              lastConnectionStatus.current = 'disconnected';
              setConnectionStatus('disconnected');
            }
            isPollingRef.current = false;
            return;
          }
          // Set connected as soon as we have valid data so UI shows "Connected via Wi‑Fi" (or USB/Bluetooth)
          lastConnectionStatus.current = 'connected';
          setConnectionStatus('connected');
          const calibrated = applyCalibration(grid);
          const denoised = denoiseFrame(calibrated);
          const smoothedData = smoothThermalData(denoised);
          setThermalData(smoothedData);
          setSensorInfo(data?.sensor_info ?? null);
          setLastUpdate(new Date());
          onDataReceivedRef.current({ ...data, thermal_data: grid, type: data?.type ?? 'thermal_data' } as ThermalData);
        } else {
          // Update connection status to disconnected if response is not ok
          if (lastConnectionStatus.current !== 'disconnected') {
            lastConnectionStatus.current = 'disconnected';
            setConnectionStatus('disconnected');
          }
        }
        } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Handle abort/timeout specifically
        if (error?.name === 'AbortError') {
          console.warn('⚠️ Thermal sensor polling timeout - request aborted after 6 seconds');
          if (lastConnectionStatus.current !== 'disconnected') {
            lastConnectionStatus.current = 'disconnected';
            setConnectionStatus('disconnected');
          }
        } else {
          // Update connection status to disconnected on error
          console.error('❌ Thermal sensor polling error:', error);
          if (lastConnectionStatus.current !== 'disconnected') {
            lastConnectionStatus.current = 'disconnected';
            setConnectionStatus('disconnected');
          }
        }
      } finally {
        // Always reset polling flag
        isPollingRef.current = false;
      }
    };

    // Poll every 100ms (10 FPS) for fast updates when WebSocket is not available
    const interval = setInterval(pollData, 100); // Poll every 100ms (10 FPS)
    return () => clearInterval(interval);
  }, [isActive, discoveredIP]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-400';
      case 'connecting': return 'bg-yellow-400';
      case 'disconnected': return 'bg-red-400';
      case 'discovering': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  const connectionMethodLabel =
    SENSOR_CONFIG.CONNECTION_MODE === 'usb' ? 'USB' :
    SENSOR_CONFIG.CONNECTION_MODE === 'bluetooth' ? 'Bluetooth' : 'Wi‑Fi';
  const connectionMethodIcon =
    SENSOR_CONFIG.CONNECTION_MODE === 'usb' ? '🔌' :
    SENSOR_CONFIG.CONNECTION_MODE === 'bluetooth' ? '📡' : '📶';

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return `Connected via ${connectionMethodLabel}`;
      case 'connecting': return `Connecting via ${connectionMethodLabel}...`;
      case 'disconnected': return 'Disconnected';
      case 'discovering': return 'Discovering Pi...';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="text-sm text-gray-300">
            {getStatusText()}
          </span>
          {connectionStatus !== 'connected' && (
            <span className="text-xs text-gray-500 flex items-center gap-1" title={`Connection method: ${connectionMethodLabel}`}>
              <span>{connectionMethodIcon}</span>
              <span>Via {connectionMethodLabel}</span>
            </span>
          )}
          {connectionStatus === 'connected' && SENSOR_CONFIG.CONNECTION_MODE !== 'bluetooth' && (
            <span className="text-xs text-gray-400">
              Pi: <code className="bg-black/20 px-1 rounded font-mono">{getPiHost()}</code>
            </span>
          )}
        </div>
        {lastUpdate && (
          <span className="text-xs text-gray-400">
            Last: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
      {SENSOR_CONFIG.CONNECTION_MODE === 'bluetooth' && connectionStatus !== 'connected' && (
        <div className="text-xs text-gray-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          Bluetooth mode active — waiting for data from <code className="bg-black/20 px-1 rounded">/api/thermal/bt</code>.
        </div>
      )}

      {/* Thermal Visualization */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="aspect-square w-full h-full max-w-full flex items-center justify-center">
          <div className="relative w-full">
            <canvas
              ref={canvasRef}
              className="rounded-lg border border-white/20 bg-gray-900"
              style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }}
            />
          </div>
        </div>
        
        {/* Temperature Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-300">Cold</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-cyan-400 rounded"></div>
            <span className="text-gray-300">Cool</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span className="text-gray-300">Warm</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-300">Hot</span>
          </div>
        </div>
      </div>

      {/* Connection Instructions */}
      {connectionStatus === 'disconnected' && (
        <div className="text-xs text-yellow-400 bg-yellow-400/10 p-3 rounded-lg">
          {discoveredIP === BLUETOOTH_SENTINEL ? (
            <>
              <strong>Bluetooth mode.</strong> Use a bridge that POSTs thermal data to <code className="bg-black/20 px-1 rounded">/api/thermal/bt</code> — no Pi or IP needed.
            </>
          ) : discoveredIP ? (
            <>
              <strong>Setup Required:</strong>{' '}
              Raspberry Pi found at: <code className="bg-black/20 px-1 rounded">{discoveredIP}</code>
              <br />
              Update <code className="bg-black/20 px-1 rounded">src/app/config/sensor-config.ts</code> with this IP address.
            </>
          ) : (
            <>
              <strong>Setup Required:</strong>{' '}
              Update the IP address in <code className="bg-black/20 px-1 rounded">src/app/config/sensor-config.ts</code> to match your Raspberry Pi's IP address.
              <br />
              Current: <code className="bg-black/20 px-1 rounded">{SENSOR_CONFIG.RASPBERRY_PI_IP}</code>
            </>
          )}
        </div>
      )}

      {/* Discovery Status */}
      {connectionStatus === 'discovering' && (
        <div className="text-xs text-blue-400 bg-blue-400/10 p-3 rounded-lg">
          <strong>Discovering Raspberry Pi...</strong>
          <br />
          Trying common IP addresses: {SENSOR_CONFIG.COMMON_IPS.join(', ')}
        </div>
      )}
    </div>
  );
}
