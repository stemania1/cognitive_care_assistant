'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface MyoWareData {
  timestamp: number;
  muscleActivity: number;
  muscleActivityProcessed: number;
}

interface MyoWareClientProps {
  onDataReceived: (data: MyoWareData) => void;
  onConnectionChange: (connected: boolean) => void;
  deviceConnected?: boolean; // server-verified connection state from parent
}

interface MyoWareDevice {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'connecting';
  lastSeen: number;
}

export default function MyoWareClient({ onDataReceived, onConnectionChange, deviceConnected }: MyoWareClientProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [calibrationData, setCalibrationData] = useState<{ min: number; max: number } | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<MyoWareDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MyoWareDevice | null>(null);
  const [connectionMode, setConnectionMode] = useState<'wifi' | 'bluetooth'>('wifi');
  const socketRef = useRef<Socket | null>(null);

  // Determine server URL based on environment
  useEffect(() => {
    const isProduction = window.location.hostname !== 'localhost';
    const url = isProduction 
      ? 'https://cognitive-care-assistant.vercel.app'
      : 'http://localhost:3000';
    setServerUrl(url);
    
    // Auto-discover devices on mount
    discoverDevices();
  }, []);

  // Derive UI status from parent-verified connectivity when provided
  const effectiveStatus: 'disconnected' | 'connecting' | 'connected' = deviceConnected
    ? 'connected'
    : connectionStatus === 'connecting'
      ? 'connecting'
      : 'disconnected';

  // Discover MyoWare devices on local network
  const discoverDevices = async () => {
    setConnectionStatus('connecting');
    
    try {
      // Since we're using HTTP polling, just add localhost device
      const devices: MyoWareDevice[] = [{
        id: 'localhost',
        name: 'EMG Server (Local)',
        ip: 'localhost',
        status: 'online',
        lastSeen: Date.now()
      }];
      
      setDiscoveredDevices(devices);
      setSelectedDevice(devices[0]);
      
      // Keep in connecting until server confirms via parent
      setConnectionStatus('connecting');
      console.log('Discovered EMG Server (Local)');
    } catch (error) {
      console.error('Device discovery failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Connect to specific MyoWare device
  const connectToDevice = async (device: MyoWareDevice) => {
    if (!device) return;
    
    setConnectionStatus('connecting');
    setSelectedDevice(device);
    console.log('Attempting device connection:', device.name);
  };

  // Connect to server (simplified for HTTP polling)
  const connectToServer = () => {
    setConnectionStatus('connecting');
    setIsConnected(true);
    console.log('Initiated EMG server connection (HTTP polling)');
  };

  // Disconnect from server
  const disconnectFromServer = () => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    if (onConnectionChange) {
      onConnectionChange(false);
    }
  };

  // Send command to MyoWare device (simplified for HTTP polling)
  const sendCommand = (command: string) => {
    console.log('Command sent:', command);
    // Commands are handled by the ESP32 directly
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // No cleanup needed for HTTP polling
    };
  }, []);

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <h3 className="text-lg font-medium text-white mb-4">MyoWare 2.0 Wireless Connection</h3>
      
      {/* Connection Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setConnectionMode('wifi')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            connectionMode === 'wifi' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          WiFi Direct
        </button>
        <button
          onClick={() => setConnectionMode('bluetooth')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            connectionMode === 'bluetooth' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          Bluetooth
        </button>
      </div>
      
      {/* Connection Status */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          effectiveStatus === 'connected' ? 'bg-green-400 animate-pulse' :
          effectiveStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
          'bg-red-400'
        }`} />
        <span className="text-sm text-gray-300">
          {effectiveStatus === 'connected' ? 'Connected' :
           effectiveStatus === 'connecting' ? 'Connecting...' :
           'Disconnected'}
        </span>
        {selectedDevice && (
          <span className="text-xs text-blue-300">
            ({selectedDevice.name} - {selectedDevice.ip})
          </span>
        )}
      </div>

      {/* Connection Controls */}
      <div className="flex gap-2 mb-4">
        {!isConnected ? (
          <>
            {connectionMode === 'wifi' ? (
              <button
                onClick={discoverDevices}
                disabled={connectionStatus === 'connecting'}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectionStatus === 'connecting' ? 'Discovering...' : 'Discover Devices'}
              </button>
            ) : (
              <button
                onClick={connectToServer}
                disabled={connectionStatus === 'connecting'}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Bluetooth'}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={disconnectFromServer}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Discovered Devices */}
      {connectionMode === 'wifi' && discoveredDevices.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Discovered Devices:</h4>
          <div className="space-y-2">
            {discoveredDevices.map((device) => (
              <button
                key={device.id}
                onClick={() => connectToDevice(device)}
                className={`w-full p-2 rounded text-left transition-colors ${
                  selectedDevice?.id === device.id
                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{device.name}</div>
                    <div className="text-xs text-gray-400">{device.ip}</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    device.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MyoWare Commands */}
      {isConnected && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300 mb-2">MyoWare Commands:</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => sendCommand('CALIBRATE')}
              className="px-3 py-1 bg-blue-500/20 text-blue-200 text-xs rounded hover:bg-blue-500/30 transition-colors"
            >
              Calibrate
            </button>
            <button
              onClick={() => sendCommand('START')}
              className="px-3 py-1 bg-green-500/20 text-green-200 text-xs rounded hover:bg-green-500/30 transition-colors"
            >
              Start
            </button>
            <button
              onClick={() => sendCommand('STOP')}
              className="px-3 py-1 bg-red-500/20 text-red-200 text-xs rounded hover:bg-red-500/30 transition-colors"
            >
              Stop
            </button>
            <button
              onClick={() => sendCommand('STATUS')}
              className="px-3 py-1 bg-gray-500/20 text-gray-200 text-xs rounded hover:bg-gray-500/30 transition-colors"
            >
              Status
            </button>
          </div>
        </div>
      )}

      {/* Calibration Data */}
      {calibrationData && (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <h4 className="text-sm font-medium text-blue-200 mb-1">Calibration Data:</h4>
          <p className="text-xs text-gray-300">
            Range: {calibrationData.min} - {calibrationData.max}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
        <h4 className="text-sm font-medium text-gray-200 mb-2">Setup Instructions:</h4>
        <ol className="text-xs text-gray-300 space-y-1">
          <li>1. Upload the MyoWare client code to your Arduino</li>
          <li>2. Connect MyoWare 2.0 sensor to analog pin A0</li>
          <li>3. Attach MyoWare Wireless Shield</li>
          <li>4. Power on the Arduino and wait for Bluetooth pairing</li>
          <li>5. Click "Connect" above to establish WebSocket connection</li>
        </ol>
      </div>
    </div>
  );
}
