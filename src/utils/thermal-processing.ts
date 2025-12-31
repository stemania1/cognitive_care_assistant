/**
 * Thermal data processing utilities
 */

export interface ThermalStats {
  average: number;
  min: number;
  max: number;
  range: number;
  variance: number;
}

export interface ThermalFrame {
  timestamp: number;
  thermal_data: number[][];
}

/**
 * Calculates thermal statistics from a 2D thermal data array
 * @param thermalData 2D array of temperature values
 * @returns Thermal statistics
 */
export function calculateThermalStats(thermalData: number[][]): ThermalStats {
  const flatTemps = thermalData.flat();
  if (flatTemps.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      range: 0,
      variance: 0
    };
  }

  const avgTemp = flatTemps.reduce((sum, temp) => sum + temp, 0) / flatTemps.length;
  const minTemp = Math.min(...flatTemps);
  const maxTemp = Math.max(...flatTemps);
  const range = maxTemp - minTemp;
  const variance =
    flatTemps.reduce((acc, temp) => acc + Math.pow(temp - avgTemp, 2), 0) / flatTemps.length;

  return {
    average: avgTemp,
    min: minTemp,
    max: maxTemp,
    range,
    variance
  };
}

/**
 * Checks if a thermal frame is stable (low variance and reasonable range)
 * @param stats Thermal statistics
 * @param baseline Baseline temperature (optional)
 * @param varianceThreshold Maximum variance for stability (default: 8.0)
 * @param rangeThreshold Maximum range for stability (default: 4.0)
 * @returns True if frame is stable
 */
export function isStableFrame(
  stats: ThermalStats,
  baseline: number | null = null,
  varianceThreshold: number = 8.0,
  rangeThreshold: number = 4.0
): boolean {
  return stats.range < rangeThreshold && stats.variance < varianceThreshold && baseline !== null;
}

/**
 * Calculates baseline temperature from recent frame statistics
 * @param frameStats Array of thermal statistics
 * @param sampleCount Number of recent samples to use (default: 10)
 * @returns Baseline temperature or null if not enough samples
 */
export function calculateBaseline(
  frameStats: ThermalStats[],
  sampleCount: number = 10
): number | null {
  if (frameStats.length < sampleCount) return null;
  const recent = frameStats.slice(-sampleCount);
  return recent.reduce((sum, stat) => sum + stat.average, 0) / recent.length;
}

/**
 * Calculates average thermal matrix from multiple samples
 * @param samples Array of thermal data matrices
 * @returns Averaged thermal matrix
 */
export function calculateAverageThermalMatrix(samples: number[][][]): number[][] {
  if (samples.length === 0) return [];

  const sampleCount = samples.length;
  return samples[0].map((row, y) =>
    row.map((_, x) => {
      let sum = 0;
      for (const sample of samples) {
        sum += sample[y][x];
      }
      return Math.round((sum / sampleCount) * 10) / 10;
    })
  );
}

/**
 * Detects thermal events (significant temperature changes)
 * @param currentTemp Current temperature
 * @param baseline Baseline temperature
 * @param threshold Temperature change threshold in degrees (default: 2.0)
 * @returns True if a thermal event is detected
 */
export function detectThermalEvent(
  currentTemp: number,
  baseline: number | null,
  threshold: number = 2.0
): boolean {
  if (baseline === null) return false;
  return Math.abs(currentTemp - baseline) >= threshold;
}

