// Sensor Configuration
// Update these values to match your Raspberry Pi setup

export type ConnectionMode = 'wifi' | 'usb' | 'bluetooth';

export const SENSOR_CONFIG = {
  // Connection: 'wifi' = Pi on network, 'usb' = Pi over USB ethernet (no Pi code change), 'bluetooth' = bridge posts to /api/thermal/bt
  CONNECTION_MODE: 'wifi' as ConnectionMode,

  // Primary: Pi on laptop hotspot (Windows Mobile hotspot often uses 192.168.137.x)
  RASPBERRY_PI_IP: '192.168.137.2',

  // Backup: Pi on local WiFi when hotspot is unreachable. Set to '' to disable.
  RASPBERRY_PI_IP_BACKUP: '192.168.254.200',

  // Pi over USB (RNDIS / USB gadget: enable on Pi, same server—no Pi code change)
  RASPBERRY_PI_IP_USB: '192.168.7.2',

  // Common IP ranges to try (kept for legacy setups / fallback discovery)
  COMMON_IPS: [
    '192.168.254.200', // Headless Raspberry Pi static IP
    '192.168.254.16',
    '192.168.137.2',   // Pi on Windows Mobile hotspot
    '192.168.137.3',
    '192.168.7.2',     // USB gadget
    '192.168.1.100',
    '192.168.0.100',
    '192.168.1.50',
    '192.168.0.50',
    '10.0.0.100',
    '172.16.0.100',
  ],

  // Server ports
  HTTP_PORT: 8091,
  WEBSOCKET_PORT: 8092,

  // Connection settings
  WEBSOCKET_RECONNECT_INTERVAL: 5000, // 5 seconds
  HTTP_POLLING_INTERVAL: 2000, // 2 seconds
  
  // Sensor settings
  THERMAL_GRID_SIZE: {
    width: 8,
    height: 8
  },
  
  // Temperature display settings
  TEMPERATURE_UNIT: 'C', // 'C' for Celsius, 'F' for Fahrenheit
  DECIMAL_PLACES: 1
};

/** Current Pi host for TCP (WiFi or USB). Bluetooth uses /api/thermal from store. */
export function getPiHost(): string {
  return SENSOR_CONFIG.CONNECTION_MODE === 'usb'
    ? SENSOR_CONFIG.RASPBERRY_PI_IP_USB
    : SENSOR_CONFIG.RASPBERRY_PI_IP;
}

/** True when connecting to Pi over TCP (WiFi or USB). False for Bluetooth (data from bridge). */
export function isPiTcpConnection(): boolean {
  return SENSOR_CONFIG.CONNECTION_MODE !== 'bluetooth';
}

// Helper functions
export const getWebSocketUrl = () => {
  return `ws://${getPiHost()}:${SENSOR_CONFIG.WEBSOCKET_PORT}`;
};

export const getHttpUrl = () => {
  return `http://${getPiHost()}:${SENSOR_CONFIG.HTTP_PORT}`;
};

export const getThermalDataUrl = () => {
  return `${getHttpUrl()}/thermal-data`;
};

// Network discovery helper - uses API route to avoid CORS issues
export const testConnection = async (ip: string): Promise<boolean> => {
  try {
    // Use the API route which handles CORS and proxies to the Pi
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`/api/thermal?ip=${encodeURIComponent(ip)}&port=${SENSOR_CONFIG.HTTP_PORT}`, {
      method: 'GET',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      // Verify we got valid thermal data
      return data && (data.thermal_data || data.data) && !data.error;
    }
    return false;
  } catch (error: any) {
    // Handle timeout and other errors
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.log(`Connection test timeout for ${ip}`);
    } else {
      console.log(`Connection test failed for ${ip}:`, error.message);
    }
    return false;
  }
};

// Try to find the Raspberry Pi automatically
export const findRaspberryPi = async (): Promise<string | null> => {
  console.log('🔍 Starting Raspberry Pi discovery...');
  
  for (const ip of SENSOR_CONFIG.COMMON_IPS) {
    console.log(`Testing connection to ${ip}...`);
    const isConnected = await testConnection(ip);
    if (isConnected) {
      console.log(`✅ Found Raspberry Pi at ${ip}`);
      return ip;
    }
  }
  
  console.log('❌ Raspberry Pi not found in common IP ranges');
  return null;
};

// Test connection to configured IP (uses current connection mode host)
export const testConfiguredConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  if (!isPiTcpConnection()) {
    return { success: false, message: 'Bluetooth mode: data comes from bridge (POST /api/thermal/bt), not from Pi TCP.' };
  }
  const ip = getPiHost();
  const port = SENSOR_CONFIG.HTTP_PORT;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`/api/thermal?ip=${encodeURIComponent(ip)}&port=${port}`, {
      method: 'GET',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (data && (data.thermal_data || data.data) && !data.error) {
        return {
          success: true,
          message: `Successfully connected to Raspberry Pi at ${ip}:${port}`,
          details: {
            ip,
            port,
            hasData: true,
            timestamp: data.timestamp
          }
        };
      } else {
        return {
          success: false,
          message: `Connected but received invalid data from ${ip}:${port}`,
          details: { ip, port, response: data }
        };
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Connection failed: HTTP ${response.status}`,
        details: { ip, port, status: response.status, error: errorData }
      };
    }
  } catch (error: any) {
    let message = `Failed to connect to ${ip}:${port}`;
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      message = `Connection timeout: Raspberry Pi at ${ip}:${port} did not respond within 5 seconds`;
    } else if (error.message) {
      message = `Connection error: ${error.message}`;
    }
    
    return {
      success: false,
      message,
      details: {
        ip,
        port,
        error: error.message || error.toString(),
        code: error.code
      }
    };
  }
};
