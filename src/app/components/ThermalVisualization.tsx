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
}

export default function ThermalVisualization({ isActive, onDataReceived }: ThermalVisualizationProps) {
  const [thermalData, setThermalData] = useState<number[][]>([]);
  const [sensorInfo, setSensorInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'discovering'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [discoveredIP, setDiscoveredIP] = useState<string | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        setConnectionStatus('disconnected');
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

        ws.onopen = () => {
          setConnectionStatus('connected');
          console.log('WebSocket connected to thermal sensor');
        };

        ws.onmessage = (event) => {
          try {
            const data: ThermalData = JSON.parse(event.data);
            if (data.type === 'thermal_data') {
              setThermalData(data.thermal_data);
              setSensorInfo(data.sensor_info);
              setLastUpdate(new Date());
              onDataReceived(data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket data:', error);
          }
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
          console.log('WebSocket disconnected');
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('disconnected');
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
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
  }, [isActive, onDataReceived]);

  // Canvas rendering
  useEffect(() => {
    if (!canvasRef.current || thermalData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellWidth = width / 8;
    const cellHeight = height / 8;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find temperature range for color mapping
    let minTemp = Math.min(...thermalData.flat());
    let maxTemp = Math.max(...thermalData.flat());
    const tempRange = maxTemp - minTemp;

    // Draw thermal grid
    thermalData.forEach((row, y) => {
      row.forEach((temp, x) => {
        const normalizedTemp = tempRange > 0 ? (temp - minTemp) / tempRange : 0.5;
        
        // Color mapping: blue (cold) to red (hot)
        let r, g, b;
        if (normalizedTemp < 0.5) {
          // Blue to cyan
          r = 0;
          g = Math.floor(255 * normalizedTemp * 2);
          b = 255;
        } else {
          // Cyan to red
          r = Math.floor(255 * (normalizedTemp - 0.5) * 2);
          g = 255;
          b = Math.floor(255 * (1 - (normalizedTemp - 0.5) * 2));
        }

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

        // Draw temperature text
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${temp.toFixed(1)}°`,
          x * cellWidth + cellWidth / 2,
          y * cellHeight + cellHeight / 2 + 3
        );
      });
    });

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 8; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, height);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(width, i * cellHeight);
      ctx.stroke();
    }
  }, [thermalData]);

  // Fallback to HTTP polling if WebSocket fails
  useEffect(() => {
    if (!isActive || connectionStatus === 'connected' || !discoveredIP) return;

    const pollData = async () => {
      try {
        // Use discovered IP for HTTP URL
        const response = await fetch(`http://${discoveredIP}:${SENSOR_CONFIG.HTTP_PORT}/thermal-data`);
        if (response.ok) {
          const data: ThermalData = await response.json();
          setThermalData(data.thermal_data);
          setSensorInfo(data.sensor_info);
          setLastUpdate(new Date());
          onDataReceived(data);
        }
      } catch (error) {
        console.error('HTTP polling failed:', error);
      }
    };

    const interval = setInterval(pollData, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [isActive, connectionStatus, discoveredIP, onDataReceived]);

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
        </div>
      )}

      {/* Thermal Visualization */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="w-full h-auto rounded-lg border border-white/20 bg-gray-900"
        />
        
        {/* Temperature Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-300">Cold</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
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
