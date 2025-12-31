export interface ThermalData {
  type: string;
  timestamp: number;
  thermal_data: number[][];
  sensor_info: any;
  grid_size: { width: number; height: number };
}

export interface ThermalMetricSnapshot {
  averageSurfaceTemperature: number | null;
  temperatureRange: number | null;
  thermalEventCount: number;
  heatmapVariance: number | null;
  thermalPatternStability: number | null;
  calibrationDrift: number | null;
  thermalSleepCorrelation: number | null;
}

export interface ThermalMetric {
  metric: string;
  type: string;
  definition: string;
  purpose: string;
}

