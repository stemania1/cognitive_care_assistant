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
}

export default function MyoWareClient({ onDataReceived, onConnectionChange }: MyoWareClientProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [calibrationData, setCalibrationData] = useState<{ min: number; max: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Determine server URL based on environment
  useEffect(() => {
    const isProduction = window.location.hostname !== 'localhost';
    const url = isProduction 
      ? 'https://cognitive-care-assistant.vercel.app'
      : 'http://localhost:3000';
    setServerUrl(url);
  }, []);

  // Connect to Socket.IO server
  const connectToServer = () => {
    if (socketRef.current?.connected) return;

    setConnectionStatus('connecting');
    
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('Connected to MyoWare server');
      setIsConnected(true);
      setConnectionStatus('connected');
      onConnectionChange(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from MyoWare server');
      setIsConnected(false);
      setConnectionStatus('disconnected');
      onConnectionChange(false);
    });

    socket.on('emg_data', (data: MyoWareData) => {
      console.log('Received EMG data:', data);
      onDataReceived(data);
    });

    socket.on('calibration_data', (data: { min: number; max: number }) => {
      console.log('Received calibration data:', data);
      setCalibrationData(data);
    });

    socket.on('heartbeat_ack', (data: { timestamp: number }) => {
      console.log('Heartbeat acknowledged:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
      onConnectionChange(false);
    });

    socketRef.current = socket;
  };

  // Disconnect from server
  const disconnectFromServer = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    onConnectionChange(false);
  };

  // Send command to MyoWare device
  const sendCommand = (command: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('myoware_command', { command });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <h3 className="text-lg font-medium text-white mb-4">MyoWare 2.0 Wireless Connection</h3>
      
      {/* Connection Status */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
          connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
          'bg-red-400'
        }`} />
        <span className="text-sm text-gray-300">
          {connectionStatus === 'connected' ? 'Connected' :
           connectionStatus === 'connecting' ? 'Connecting...' :
           'Disconnected'}
        </span>
        <span className="text-xs text-gray-500">
          ({serverUrl})
        </span>
      </div>

      {/* Connection Controls */}
      <div className="flex gap-2 mb-4">
        {!isConnected ? (
          <button
            onClick={connectToServer}
            disabled={connectionStatus === 'connecting'}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
        ) : (
          <button
            onClick={disconnectFromServer}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200"
          >
            Disconnect
          </button>
        )}
      </div>

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
