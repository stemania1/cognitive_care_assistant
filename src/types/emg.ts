export interface EMGData {
  timestamp: number;
  // Single MyoWare 2.0 sensor data (ESP32: 0-4095 analog range, 0-3.3V)
  muscleActivity: number;      // Raw analog value from MyoWare 2.0 (ESP32: 0-4095)
  muscleActivityProcessed: number; // Processed muscle activation (0-100%)
  voltage?: number; // Voltage in volts (ESP32: 0-3.3V)
  moveMarker?: 'request' | 'sensed' | 'end'; // Optional move marker type
}

export interface MoveMarker {
  timestamp: number;
  type: 'request' | 'sensed' | 'end'; // 'request' = user clicked Move button, 'sensed' = detected from EMG data, 'end' = user clicked End Move button
}

export interface WorkoutExercise {
  id: string;
  name: string;
  duration: number; // in seconds
  targetMuscles: string[];
  description: string;
  instructions: string[];
  myoWareSuitable: boolean; // Whether this workout benefits from MyoWare monitoring
  myoWareReason: string; // Why MyoWare is useful for this workout
  sensorPlacement: string; // Where to place the MyoWare sensor
  videoUrl?: string; // Optional demonstration video URL
}

export interface EMGMetric {
  metric: string;
  type: string;
  definition: string;
  purpose: string;
}

