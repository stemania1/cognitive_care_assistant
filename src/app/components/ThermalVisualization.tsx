"use client";

import { useState, useEffect, useRef } from 'react';
import { SENSOR_CONFIG, getWebSocketUrl, getThermalDataUrl, findRaspberryPi } from '../config/sensor-config';

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
  const smoothingFactor = 0.2; // Lower = more smoothing
  const calibrationDriftFactor = 0.02;
  const calibrationDriftThreshold = 0.6;
  const recentFramesRef = useRef<number[][][]>([]);
  const FRAMES_TO_AVERAGE = 5;

  const applyCalibration = (frame: number[][]): number[][] => {
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
  useEffect(() => {
    if (!isActive) return;

    const discoverPi = async () => {
      setConnectionStatus('discovering');
      const foundIP = await findRaspberryPi();
      
      if (foundIP) {
        setDiscoveredIP(foundIP);
        setConnectionStatus('connecting');
        // Update the config temporarily for this session
        SENSOR_CONFIG.RASPBERRY_PI_IP = foundIP;
      } else {
        // Fallback to configured IP if discovery fails
        setDiscoveredIP(SENSOR_CONFIG.RASPBERRY_PI_IP);
        setConnectionStatus('connecting');
      }
    };

    discoverPi();
  }, [isActive]);

  // WebSocket connection
  useEffect(() => {
    if (!isActive || !discoveredIP) {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      setConnectionStatus('disconnected');
      return;
    }

    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      
      // Use discovered IP for WebSocket URL
      const wsUrl = `ws://${discoveredIP}:${SENSOR_CONFIG.WEBSOCKET_PORT}`;
      
      try {
        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;

        // Set a timeout to check if we receive data
        let dataTimeout: NodeJS.Timeout;
        
        ws.onopen = () => {
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
          
          // Auto-reconnect after a delay if connection was not clean
          if (!event.wasClean && isActive) {
            console.log('Attempting to reconnect in 3 seconds...');
            setTimeout(() => {
              if (isActive && discoveredIP) {
                connectWebSocket();
              }
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          // Silently handle WebSocket errors - HTTP polling will handle data retrieval
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

    // Set canvas size to 32x32 for upscaling
    const GRID_SIZE = 32;
    
    // Get the container size and set canvas to fit properly
    const container = canvas.parentElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const size = Math.min(containerRect.width, containerRect.height);
      const pixelSize = Math.floor(size / GRID_SIZE);
      const actualSize = pixelSize * GRID_SIZE;
      
      canvas.width = actualSize;
      canvas.height = actualSize;
      canvas.style.width = `${actualSize}px`;
      canvas.style.height = `${actualSize}px`;
    } else {
      // Fallback to default size
      canvas.width = GRID_SIZE;
      canvas.height = GRID_SIZE;
    }

    // Use requestAnimationFrame for smooth rendering
    const renderFrame = () => {
      // Find temperature range for color mapping
      const allTemps = thermalData.flat();
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
    };

    // Use requestAnimationFrame for smooth updates
    const animationId = requestAnimationFrame(renderFrame);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [thermalData]);

  // Fallback to HTTP polling via Next.js API proxy (avoids CORS/mixed content)
  useEffect(() => {
    if (!isActive) return;

    const pollData = async () => {
      try {
        const query = discoveredIP ? `?ip=${encodeURIComponent(discoveredIP)}&port=${SENSOR_CONFIG.HTTP_PORT}` : "";
        const response = await fetch(`/api/thermal${query}`, { cache: 'no-store' });
        if (response.ok) {
          const data: ThermalData = await response.json();
          const calibrated = applyCalibration(data.thermal_data);
          const denoised = denoiseFrame(calibrated);
          const smoothedData = smoothThermalData(denoised);
          setThermalData(smoothedData);
          setSensorInfo(data.sensor_info);
          setLastUpdate(new Date());
          onDataReceivedRef.current(data);
          
          // Update connection status to connected when we successfully receive data
          if (lastConnectionStatus.current !== 'connected') {
            lastConnectionStatus.current = 'connected';
            setConnectionStatus('connected');
          }
        } else {
          // Update connection status to disconnected if response is not ok
          if (lastConnectionStatus.current !== 'disconnected') {
            lastConnectionStatus.current = 'disconnected';
            setConnectionStatus('disconnected');
          }
        }
      } catch (error) {
        // Update connection status to disconnected on error
        if (lastConnectionStatus.current !== 'disconnected') {
          lastConnectionStatus.current = 'disconnected';
          setConnectionStatus('disconnected');
        }
      }
    };

    const interval = setInterval(pollData, 3000); // Poll every 3 seconds
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

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'discovering': return 'Discovering Pi...';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="text-sm text-gray-300">
            {getStatusText()}
          </span>
        </div>
        {lastUpdate && (
          <span className="text-xs text-gray-400">
            Last: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Sensor Info */}
      {sensorInfo && (
        <div className="text-xs text-gray-400 space-y-1">
          <div>Sensor: {sensorInfo.type}</div>
          <div>Status: {sensorInfo.status}</div>
          {sensorInfo.bus !== 'none' && <div>Bus: {sensorInfo.bus}</div>}
          {thermalData.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div>Current Temperature: <span className="text-blue-400 font-semibold">{averageTemperature.toFixed(1)}°C</span></div>
              <div>Range: {Math.min(...thermalData.flat()).toFixed(1)}°C - {Math.max(...thermalData.flat()).toFixed(1)}°C</div>
            </div>
          )}
        </div>
      )}

      {/* Thermal Visualization */}
      <div className="relative">
        <div className="aspect-square max-w-lg mx-auto flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="rounded-lg border border-white/20 bg-gray-900"
            style={{ imageRendering: 'pixelated' }}
          />
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
          <strong>Setup Required:</strong> 
          {discoveredIP ? (
            <>
              Raspberry Pi found at: <code className="bg-black/20 px-1 rounded">{discoveredIP}</code>
              <br />
              Update <code className="bg-black/20 px-1 rounded">src/app/config/sensor-config.ts</code> with this IP address.
            </>
          ) : (
            <>
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
