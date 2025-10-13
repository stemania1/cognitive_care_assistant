'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import CalibrationChart from './CalibrationChart';

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
  const [commandStatus, setCommandStatus] = useState<string>('');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [lastDataReceived, setLastDataReceived] = useState<number>(0);
  const [deviceOnline, setDeviceOnline] = useState<boolean>(false);
  const [deviceStatus, setDeviceStatus] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const lastConnectionChange = useRef<number>(0);
  const connectionChangeCount = useRef<number>(0);

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

  // Handle parent connection status changes
  useEffect(() => {
    if (deviceConnected && connectionStatus === 'disconnected') {
      setConnectionStatus('connected');
      setIsConnected(true);
    } else if (!deviceConnected && connectionStatus === 'connected') {
      setConnectionStatus('disconnected');
      setIsConnected(false);
    }
  }, [deviceConnected, connectionStatus]);

  // Derive UI status from actual device connectivity
  const effectiveStatus: 'disconnected' | 'connecting' | 'connected' = deviceOnline
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
      
      // Check if device is already connected via parent
      if (deviceConnected) {
        setConnectionStatus('connected');
        setIsConnected(true);
      } else {
        // Set to disconnected initially, let parent handle connection detection
        setConnectionStatus('disconnected');
        console.log('Discovered EMG Server (Local) - waiting for connection confirmation');
      }
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

  // Check device connectivity with debouncing
  const checkDeviceConnectivity = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/emg/data`);
      if (response.ok) {
        const data = await response.json();
        if (data.lastHeartbeat) {
          const timeSinceHeartbeat = Date.now() - data.lastHeartbeat;
          // Use consistent 30-second timeout with hysteresis to prevent rapid state changes
          const isOnline = timeSinceHeartbeat < 30000; // 30 seconds timeout (consistent with data store)
          
          setDeviceOnline(isOnline);
          setLastDataReceived(data.lastHeartbeat);
          
          // Debouncing logic: only change connection state if we've been consistent for a while
          const now = Date.now();
          const timeSinceLastChange = now - lastConnectionChange.current;
          
          // Add hysteresis: only change connection state if we're confident about the change
          // This prevents rapid connect/disconnect cycles
          if (isOnline && !isConnected && timeSinceHeartbeat < 15000 && timeSinceLastChange > 10000) {
            // Only connect if heartbeat is recent AND we haven't changed state recently
            setIsConnected(true);
            setConnectionStatus('connected');
            lastConnectionChange.current = now;
            connectionChangeCount.current = 0;
            if (onConnectionChange) {
              onConnectionChange(true);
            }
          } else if (!isOnline && isConnected && timeSinceHeartbeat > 35000 && timeSinceLastChange > 10000) {
            // Only disconnect if heartbeat is definitely stale AND we haven't changed state recently
            setIsConnected(false);
            setConnectionStatus('disconnected');
            setIsTransmitting(false);
            lastConnectionChange.current = now;
            connectionChangeCount.current = 0;
            if (onConnectionChange) {
              onConnectionChange(false);
            }
          } else if (timeSinceLastChange < 10000) {
            // Count rapid state changes to help with debugging
            connectionChangeCount.current++;
            if (connectionChangeCount.current > 3) {
              console.warn('⚠️ Rapid connection state changes detected, stabilizing...');
              // Reset counters to prevent excessive logging
              connectionChangeCount.current = 0;
              lastConnectionChange.current = now;
            }
          }
        }
      }
      
      // Also check what commands are available for the ESP32 and status data
      const commandResponse = await fetch(`${serverUrl}/api/emg/command`);
      if (commandResponse.ok) {
        const commandData = await commandResponse.json();
        if (commandData.hasCommand) {
          console.log('🔍 ESP32 should receive command:', commandData.command);
        }
        
        // Check for status data
        if (commandData.statusData) {
          setDeviceStatus(commandData.statusData);
          console.log('📊 Device status received:', commandData.statusData);
        }
      }
    } catch (error) {
      console.error('Error checking device connectivity:', error);
      // Only disconnect on network error if we haven't had data for a while AND haven't changed recently
      const now = Date.now();
      const timeSinceLastChange = now - lastConnectionChange.current;
      if (isConnected && (Date.now() - lastDataReceived) > 45000 && timeSinceLastChange > 10000) {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setIsTransmitting(false);
        setDeviceOnline(false);
        lastConnectionChange.current = now;
        if (onConnectionChange) {
          onConnectionChange(false);
        }
      }
    }
  };

  // Poll for device connectivity
  useEffect(() => {
    const interval = setInterval(checkDeviceConnectivity, 8000); // Check every 8 seconds (much less aggressive)
    return () => clearInterval(interval);
  }, [serverUrl, isConnected]);

  // Handle calibration completion
  const handleCalibrationComplete = (min: number, max: number) => {
    setCalibrationData({ min, max });
    setIsCalibrating(false);
    setCommandStatus(`✅ Calibration complete! Range: ${min} - ${max}`);
    setTimeout(() => setCommandStatus(''), 5000);
  };

  // Send command to MyoWare device via API
  const sendCommand = async (command: string) => {
    try {
      console.log('🚀 Sending command:', command);
      console.log('🔗 API URL:', `${serverUrl}/api/emg/command`);
      console.log('📡 Device online status:', deviceOnline);
      
      // Check if device is online before sending command
      if (!deviceOnline) {
        console.log('⚠️ Device appears offline, but sending command anyway for testing');
        // Temporarily disable this check for debugging
        // setCommandStatus('❌ Cannot send command: Device is offline');
        // setTimeout(() => setCommandStatus(''), 5000);
        // return;
      }
      
      // Update UI based on command
      switch (command) {
        case 'CALIBRATE':
          setCommandStatus('Starting calibration...');
          setIsCalibrating(true);
          break;
        case 'START':
          setCommandStatus('Starting data transmission...');
          setIsTransmitting(true);
          break;
        case 'STOP':
          setCommandStatus('Stopping data transmission...');
          setIsTransmitting(false);
          break;
        case 'STATUS':
          setCommandStatus('Requesting device status...');
          break;
      }
      
      console.log('📤 Sending POST request with body:', JSON.stringify({ command }));
      
      const response = await fetch(`${serverUrl}/api/emg/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Command sent successfully:', result);
        
        // Update status based on command
        switch (command) {
          case 'CALIBRATE':
            setCommandStatus('Calibration started! Follow the instructions below.');
            setTimeout(() => {
              setCommandStatus('');
              setIsCalibrating(false);
            }, 15000); // Clear after 15 seconds
            break;
          case 'START':
            setCommandStatus('✅ Data transmission started successfully!');
            setTimeout(() => setCommandStatus(''), 3000);
            break;
          case 'STOP':
            setCommandStatus('⏹️ Data transmission stopped successfully!');
            setTimeout(() => setCommandStatus(''), 3000);
            break;
          case 'STATUS':
            setCommandStatus('✅ Status request sent! Check Serial Monitor for details.');
            setTimeout(() => setCommandStatus(''), 3000);
            break;
        }
      } else {
        console.error('❌ Failed to send command:', response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        setCommandStatus('❌ Failed to send command. Please try again.');
        setTimeout(() => setCommandStatus(''), 5000);
      }
    } catch (error) {
      console.error('💥 Error sending command:', error);
      setCommandStatus('❌ Error sending command. Please check connection.');
      setTimeout(() => setCommandStatus(''), 5000);
    }
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
        {!deviceOnline ? (
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

      {/* Command Status */}
      {commandStatus && (
        <div className={`p-3 rounded-lg border ${
          commandStatus.includes('❌') 
            ? 'bg-red-500/10 border-red-500/20' 
            : 'bg-blue-500/10 border-blue-500/20'
        }`}>
          <p className={`text-sm ${
            commandStatus.includes('❌') 
              ? 'text-red-200' 
              : 'text-blue-200'
          }`}>{commandStatus}</p>
        </div>
      )}

      {/* Device Offline Warning */}
      {!deviceOnline && lastDataReceived > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-200">
            ⚠️ Device appears to be offline. Last data received {Math.round((Date.now() - lastDataReceived) / 1000)} seconds ago.
          </p>
        </div>
      )}

      {/* MyoWare Commands */}
      {deviceOnline && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 mb-2">MyoWare Commands:</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => sendCommand('CALIBRATE')}
              disabled={isCalibrating || !deviceOnline}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                isCalibrating || !deviceOnline
                  ? 'bg-orange-500/30 text-orange-200 cursor-not-allowed' 
                  : 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30'
              }`}
            >
              {!deviceOnline ? 'Device Offline' : isCalibrating ? 'Calibrating...' : 'Calibrate'}
            </button>
            <button
              onClick={() => sendCommand('START')}
              disabled={isTransmitting || !deviceOnline}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                isTransmitting || !deviceOnline
                  ? 'bg-green-500/30 text-green-200 cursor-not-allowed' 
                  : 'bg-green-500/20 text-green-200 hover:bg-green-500/30'
              }`}
            >
              {!deviceOnline ? 'Device Offline' : isTransmitting ? 'Transmitting' : 'Start'}
            </button>
            <button
              onClick={() => sendCommand('STOP')}
              disabled={!isTransmitting || !deviceOnline}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                !isTransmitting || !deviceOnline
                  ? 'bg-red-500/30 text-red-200 cursor-not-allowed' 
                  : 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
              }`}
            >
              Stop
            </button>
            <button
              onClick={() => sendCommand('STATUS')}
              disabled={!deviceOnline}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                !deviceOnline
                  ? 'bg-gray-500/30 text-gray-200 cursor-not-allowed'
                  : 'bg-gray-500/20 text-gray-200 hover:bg-gray-500/30'
              }`}
            >
              Status
            </button>
          </div>
        </div>
      )}

      {/* Calibration Chart */}
      {isCalibrating && (
        <CalibrationChart 
          isCalibrating={isCalibrating}
          onCalibrationComplete={handleCalibrationComplete}
          serverUrl={serverUrl}
        />
      )}

      {/* Device Status */}
      {deviceOnline && (
        <div className={`mt-4 p-3 rounded-lg border ${
          deviceOnline 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <h4 className={`text-sm font-medium mb-2 ${
            deviceOnline ? 'text-green-200' : 'text-red-200'
          }`}>Device Status:</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <p>{deviceOnline ? '🟢' : '🔴'} <strong>Device:</strong> {deviceOnline ? 'Online' : 'Offline'}</p>
            {deviceOnline && (
              <>
                <p>{isTransmitting ? '🟢' : '⚫'} <strong>Data Transmission:</strong> {isTransmitting ? 'Active' : 'Stopped'}</p>
                <p>{isCalibrating ? '🟡' : '⚫'} <strong>Calibration:</strong> {isCalibrating ? 'In Progress' : 'Complete'}</p>
                {calibrationData && (
                  <p>📊 <strong>Calibration Range:</strong> {calibrationData.min} - {calibrationData.max}</p>
                )}
                {lastDataReceived && (
                  <p>⏰ <strong>Last Data:</strong> {Math.round((Date.now() - lastDataReceived) / 1000)}s ago</p>
                )}
                
                {/* Enhanced Status from ESP32 */}
                {deviceStatus && (
                  <>
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <p className="text-green-200 font-semibold">📡 ESP32 Status:</p>
                      <p>💓 <strong>Heart Rate:</strong> {deviceStatus.heartRateDetected ? `${deviceStatus.currentHeartRate?.toFixed(1)} BPM` : 'Not Detected'}</p>
                      <p>📊 <strong>Baseline:</strong> {deviceStatus.baseline?.toFixed(1)}</p>
                      <p>🔧 <strong>Calibrated:</strong> {deviceStatus.calibrated ? 'Yes' : 'No'}</p>
                      <p>📶 <strong>WiFi RSSI:</strong> {deviceStatus.rssi} dBm</p>
                      <p>💾 <strong>Free Memory:</strong> {deviceStatus.freeHeap} bytes</p>
                    </div>
                  </>
                )}
              </>
            )}
            {!deviceOnline && (
              <p className="text-red-300">Device appears to be offline. Please check power and connection.</p>
            )}
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
