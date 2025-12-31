import { EMGData, MoveMarker } from '@/types/emg';

/**
 * EMG data processing utilities
 */

/**
 * Processes raw MyoWare data to normalized percentage (0-100%)
 * @param rawValue Raw analog value from MyoWare sensor
 * @param calibrationData Calibration data with min and max values
 * @returns Normalized percentage (0-100)
 */
export function processMyoWareData(
  rawValue: number,
  calibrationData: { min: number; max: number } | null
): number {
  if (!calibrationData) return 0;
  const range = calibrationData.max - calibrationData.min;
  if (range <= 0) return 0;
  const normalized = Math.max(0, Math.min(100, ((rawValue - calibrationData.min) / range) * 100));
  return normalized;
}

/**
 * Calculates voltage from raw analog value (ESP32: 12-bit ADC, 3.3V reference)
 * @param rawValue Raw analog value (0-4095)
 * @returns Voltage in volts (0-3.3V)
 */
export function calculateVoltage(rawValue: number): number {
  return (rawValue * 3.3) / 4095.0;
}

/**
 * Detects a move based on voltage change threshold
 * @param currentVoltage Current voltage reading
 * @param lastVoltage Previous voltage reading
 * @param threshold Voltage change threshold (default: 0.15V)
 * @returns True if a move is detected
 */
export function detectMove(
  currentVoltage: number,
  lastVoltage: number | null,
  threshold: number = 0.15
): boolean {
  if (lastVoltage === null) return false;
  const voltageChange = Math.abs(currentVoltage - lastVoltage);
  return voltageChange >= threshold;
}

/**
 * Creates a sensed move marker
 * @param timestamp Timestamp of the move
 * @returns MoveMarker object
 */
export function createSensedMoveMarker(timestamp: number): MoveMarker {
  return {
    timestamp,
    type: 'sensed'
  };
}

/**
 * Calculates statistics from EMG readings
 * @param readings Array of EMG readings
 * @returns Statistics object
 */
export function calculateEMGStats(readings: EMGData[]) {
  const voltages = readings
    .map(r => r.voltage)
    .filter((v): v is number => v !== undefined && v !== null && !isNaN(v) && isFinite(v));

  if (voltages.length === 0) {
    return {
      averageVoltage: null,
      maxVoltage: null,
      minVoltage: null,
      sampleCount: readings.length
    };
  }

  return {
    averageVoltage: voltages.reduce((a, b) => a + b, 0) / voltages.length,
    maxVoltage: Math.max(...voltages),
    minVoltage: Math.min(...voltages),
    sampleCount: readings.length
  };
}

/**
 * Ensures voltage is present in EMG data, calculating if missing
 * @param data EMG data point
 * @returns EMG data with voltage guaranteed
 */
export function ensureVoltage(data: EMGData): EMGData {
  if (data.voltage === undefined || data.voltage === null) {
    return {
      ...data,
      voltage: calculateVoltage(data.muscleActivity)
    };
  }
  return data;
}

