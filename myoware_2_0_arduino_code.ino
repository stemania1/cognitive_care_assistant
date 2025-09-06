/*
 * MyoWare 2.0 EMG Sensor Integration for Cognitive Care Assistant
 * 
 * This Arduino code reads data from up to 6 MyoWare 2.0 sensors
 * and sends it via Serial communication to the web application.
 * 
 * Hardware Setup:
 * - MyoWare 2.0 Muscle Sensor
 * - Link Shield (soldered to MyoWare 2.0)
 * - Arduino Shield (connects up to 6 sensors)
 * - Arduino Uno/Nano/ESP32
 * 
 * Pin Connections (Arduino Shield):
 * - Sensor 1: A0 (Left Bicep)
 * - Sensor 2: A1 (Right Bicep)
 * - Sensor 3: A2 (Left Tricep)
 * - Sensor 4: A3 (Right Tricep)
 * - Sensor 5: A4 (Left Forearm)
 * - Sensor 6: A5 (Right Forearm)
 * 
 * Additional sensors can be connected to digital pins with analog capability
 * or use multiple Arduino boards for more sensors.
 */

// Single MyoWare 2.0 sensor configuration
const int SENSOR_PIN = A0;  // Connect MyoWare 2.0 to analog pin A0
const String SENSOR_NAME = "muscleActivity";

// Calibration data for single sensor
int sensorMin = 1023;
int sensorMax = 0;
bool isCalibrated = false;

// Data smoothing
const int SMOOTHING_SAMPLES = 10;
int sensorReadings[SMOOTHING_SAMPLES];
int readingIndex = 0;
int sensorTotal = 0;

// Timing
unsigned long lastDataSend = 0;
const unsigned long DATA_SEND_INTERVAL = 100; // Send data every 100ms (10Hz)

void setup() {
  Serial.begin(115200);
  
  // Initialize sensor data
  sensorMin = 1023;
  sensorMax = 0;
  isCalibrated = false;
  readingIndex = 0;
  sensorTotal = 0;
  
  // Initialize smoothing array
  for (int i = 0; i < SMOOTHING_SAMPLES; i++) {
    sensorReadings[i] = 0;
  }
  
  Serial.println("MyoWare 2.0 Single Sensor System Ready");
  Serial.println("Commands:");
  Serial.println("CALIBRATE - Start calibration process");
  Serial.println("START - Begin data transmission");
  Serial.println("STOP - Stop data transmission");
}

void loop() {
  // Check for serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "CALIBRATE") {
      calibrateSensors();
    } else if (command == "START") {
      startDataTransmission();
    } else if (command == "STOP") {
      stopDataTransmission();
    }
  }
  
  // Send data at regular intervals
  if (millis() - lastDataSend >= DATA_SEND_INTERVAL) {
    sendEMGData();
    lastDataSend = millis();
  }
}

void calibrateSensors() {
  Serial.println("Starting calibration...");
  Serial.println("Please contract and relax your muscle for 10 seconds");
  
  unsigned long calibrationStart = millis();
  const unsigned long CALIBRATION_DURATION = 10000; // 10 seconds
  
  while (millis() - calibrationStart < CALIBRATION_DURATION) {
    int rawValue = analogRead(SENSOR_PIN);
    
    // Update min/max values
    if (rawValue < sensorMin) {
      sensorMin = rawValue;
    }
    if (rawValue > sensorMax) {
      sensorMax = rawValue;
    }
    
    // Show progress
    int progress = ((millis() - calibrationStart) * 100) / CALIBRATION_DURATION;
    if (progress % 1000 == 0) {
      Serial.print("Calibration progress: ");
      Serial.print(progress / 100);
      Serial.println("%");
    }
    
    delay(50);
  }
  
  // Mark sensor as calibrated
  isCalibrated = true;
  
  Serial.println("Calibration complete!");
  printCalibrationData();
}

void printCalibrationData() {
  Serial.println("Calibration Results:");
  Serial.print(SENSOR_NAME);
  Serial.print(": Min=");
  Serial.print(sensorMin);
  Serial.print(", Max=");
  Serial.println(sensorMax);
}

void startDataTransmission() {
  Serial.println("Starting EMG data transmission...");
  Serial.println("Format: TIMESTAMP,MUSCLE_ACTIVITY");
}

void stopDataTransmission() {
  Serial.println("Stopping EMG data transmission...");
}

void sendEMGData() {
  // Read and smooth sensor data
  int smoothedValue = readSmoothedSensor();
  
  // Send data in JSON format
  Serial.print("{");
  Serial.print("\"timestamp\":");
  Serial.print(millis());
  Serial.print(",\"");
  Serial.print(SENSOR_NAME);
  Serial.print("\":");
  Serial.print(smoothedValue);
  Serial.println("}");
}

int readSmoothedSensor() {
  // Read raw value
  int rawValue = analogRead(SENSOR_PIN);
  
  // Add to smoothing array
  sensorTotal = sensorTotal - sensorReadings[readingIndex];
  sensorReadings[readingIndex] = rawValue;
  sensorTotal = sensorTotal + sensorReadings[readingIndex];
  readingIndex = (readingIndex + 1) % SMOOTHING_SAMPLES;
  
  // Return smoothed average
  return sensorTotal / SMOOTHING_SAMPLES;
}

// Calculate muscle activation percentage
float calculateMuscleActivation(int rawValue) {
  if (!isCalibrated) {
    return 0.0;
  }
  
  int range = sensorMax - sensorMin;
  if (range == 0) {
    return 0.0;
  }
  
  float activation = ((float)(rawValue - sensorMin) / range) * 100.0;
  return constrain(activation, 0.0, 100.0);
}

// Send processed data with muscle activation percentages
void sendProcessedEMGData() {
  int rawValue = readSmoothedSensor();
  float activation = calculateMuscleActivation(rawValue);
  
  Serial.print("{");
  Serial.print("\"timestamp\":");
  Serial.print(millis());
  Serial.print(",\"");
  Serial.print(SENSOR_NAME);
  Serial.print("\":");
  Serial.print(rawValue);
  Serial.print(",\"");
  Serial.print(SENSOR_NAME);
  Serial.print("Processed\":");
  Serial.print(activation);
  Serial.println("}");
}
