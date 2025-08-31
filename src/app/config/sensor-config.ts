// Sensor Configuration
// Update these values to match your Raspberry Pi setup

export const SENSOR_CONFIG = {
  // Raspberry Pi IP address on your local network
  RASPBERRY_PI_IP: '192.168.1.100', // UPDATE THIS TO YOUR PI'S IP
  
  // Server ports
  HTTP_PORT: 8091,
  WEBSOCKET_PORT: 8091,
  
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
