/**
 * Thermal Data Store
 * 
 * In-memory storage for thermal sensor data received via Bluetooth.
 * Similar to emg-data-store.ts for EMG data.
 */

interface ThermalData {
  type: string;
  timestamp: string | number;
  thermal_data: number[][];
  sensor_info: any;
  grid_size: { width: number; height: number };
  status?: string;
}

let latestThermalData: ThermalData | null = null;
let lastUpdateTime: number = 0;

export function storeThermalData(data: ThermalData): void {
  latestThermalData = data;
  lastUpdateTime = Date.now();
  
  // Log every 10th update to reduce console spam
  if (lastUpdateTime % 10 === 0) {
    const avgTemp = data.thermal_data 
      ? (data.thermal_data.flat().reduce((a, b) => a + b, 0) / data.thermal_data.flat().length).toFixed(1)
      : 'N/A';
    console.log('💾 Storing thermal data (every 10th):', {
      timestamp: data.timestamp,
      avgTemp: `${avgTemp}°C`,
      gridSize: data.grid_size
    });
  }
}

export function getThermalData(): {
  data: ThermalData | null;
  lastUpdateTime: number;
  timeSinceLastUpdate: number;
  isConnected: boolean;
} {
  const now = Date.now();
  const timeSinceLastUpdate = latestThermalData ? (now - lastUpdateTime) : Infinity;
  
  // Consider connected if data was received in the last 30 seconds
  const isConnected = timeSinceLastUpdate < 30000;
  
  return {
    data: latestThermalData,
    lastUpdateTime,
    timeSinceLastUpdate,
    isConnected
  };
}

