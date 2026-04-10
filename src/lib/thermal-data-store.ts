/**
 * Thermal Data Store
 *
 * In-memory storage for thermal sensor data received via Bluetooth or USB serial bridge (POST /api/thermal/bt).
 * The Next.js app serves this via GET /api/thermal (no ?ip=) for bridge modes. Pi I2C/TCP uses a separate path.
 *
 * Debug: set THERMAL_STORE_DEBUG=1 on the server for every store log line (noisy).
 */

const STORE_DEBUG =
  typeof process !== "undefined" &&
  (process.env.THERMAL_STORE_DEBUG === "1" || process.env.THERMAL_STORE_DEBUG === "true");

interface ThermalData {
  type: string;
  timestamp: string | number;
  thermal_data: number[][];
  sensor_info: any;
  grid_size: { width: number; height: number };
  status?: string;
  min?: number;
  max?: number;
}

let latestThermalData: ThermalData | null = null;
let lastUpdateTime: number = 0;
let storeUpdateCount = 0;

export function storeThermalData(data: ThermalData): void {
  latestThermalData = data;
  lastUpdateTime = Date.now();
  storeUpdateCount++;

  if (STORE_DEBUG || storeUpdateCount % 10 === 0) {
    const avgTemp = data.thermal_data
      ? (
          data.thermal_data.flat().reduce((a, b) => a + b, 0) / data.thermal_data.flat().length
        ).toFixed(1)
      : "N/A";
    const flat = data.thermal_data?.flat() ?? [];
    const minT = flat.length ? Math.min(...flat) : null;
    const maxT = flat.length ? Math.max(...flat) : null;
    console.log("[thermal-data-store] frame stored" + (STORE_DEBUG ? " (debug)" : " (every 10th)"), {
      timestamp: data.timestamp,
      avgTemp: `${avgTemp}°C`,
      min: minT,
      max: maxT,
      gridSize: data.grid_size,
      count: storeUpdateCount,
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

