// Sensor Configuration
// Update these values to match your Raspberry Pi setup

export const SENSOR_CONFIG = {
  // Raspberry Pi IP address on your local network (static for headless deployment)
  RASPBERRY_PI_IP: '192.168.254.200',
  
  // Common IP ranges to try (kept for legacy setups / fallback discovery)
  COMMON_IPS: [
    '192.168.254.200', // Headless Raspberry Pi static IP
    '192.168.254.16',
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

// Helper functions
export const getWebSocketUrl = () => {
  return `ws://${SENSOR_CONFIG.RASPBERRY_PI_IP}:${SENSOR_CONFIG.WEBSOCKET_PORT}`;
};

export const getHttpUrl = () => {
  return `http://${SENSOR_CONFIG.RASPBERRY_PI_IP}:${SENSOR_CONFIG.HTTP_PORT}`;
};

export const getThermalDataUrl = () => {
  return `${getHttpUrl()}/thermal-data`;
};

// Network discovery helper
export const testConnection = async (ip: string): Promise<boolean> => {
  try {
    const response = await fetch(`http://${ip}:8091/thermal-data`, {
      method: 'GET',
      mode: 'no-cors', // This helps with CORS issues
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Try to find the Raspberry Pi automatically
export const findRaspberryPi = async (): Promise<string | null> => {
  for (const ip of SENSOR_CONFIG.COMMON_IPS) {
    if (await testConnection(ip)) {
      return ip;
    }
  }
  return null;
};
