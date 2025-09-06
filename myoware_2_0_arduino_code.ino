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

// Sensor pin definitions
const int SENSOR_PINS[] = {A0, A1, A2, A3, A4, A5};
const int NUM_SENSORS = 6;
const String SENSOR_NAMES[] = {
  "leftBicep", "rightBicep", "leftTricep", 
  "rightTricep", "leftForearm", "rightForearm"
};

// Calibration data for each sensor
int sensorMin[NUM_SENSORS];
int sensorMax[NUM_SENSORS];
bool isCalibrated[NUM_SENSORS];

// Data smoothing
const int SMOOTHING_SAMPLES = 10;
int sensorReadings[NUM_SENSORS][SMOOTHING_SAMPLES];
int readingIndex[NUM_SENSORS];
int sensorTotals[NUM_SENSORS];

// Timing
unsigned long lastDataSend = 0;
const unsigned long DATA_SEND_INTERVAL = 100; // Send data every 100ms (10Hz)

void setup() {
  Serial.begin(115200);
  
  // Initialize sensor arrays
  for (int i = 0; i < NUM_SENSORS; i++) {
    sensorMin[i] = 1023;
    sensorMax[i] = 0;
    isCalibrated[i] = false;
    readingIndex[i] = 0;
    sensorTotals[i] = 0;
    
    // Initialize smoothing arrays
    for (int j = 0; j < SMOOTHING_SAMPLES; j++) {
      sensorReadings[i][j] = 0;
    }
  }
  
  Serial.println("MyoWare 2.0 EMG Sensor System Ready");
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
  Serial.println("Please contract and relax each muscle group for 10 seconds");
  
  unsigned long calibrationStart = millis();
  const unsigned long CALIBRATION_DURATION = 10000; // 10 seconds
  
  while (millis() - calibrationStart < CALIBRATION_DURATION) {
    for (int i = 0; i < NUM_SENSORS; i++) {
      int rawValue = analogRead(SENSOR_PINS[i]);
      
      // Update min/max values
      if (rawValue < sensorMin[i]) {
        sensorMin[i] = rawValue;
      }
      if (rawValue > sensorMax[i]) {
        sensorMax[i] = rawValue;
      }
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
  
  // Mark sensors as calibrated
  for (int i = 0; i < NUM_SENSORS; i++) {
    isCalibrated[i] = true;
  }
  
  Serial.println("Calibration complete!");
  printCalibrationData();
}

void printCalibrationData() {
  Serial.println("Calibration Results:");
  for (int i = 0; i < NUM_SENSORS; i++) {
    Serial.print(SENSOR_NAMES[i]);
    Serial.print(": Min=");
    Serial.print(sensorMin[i]);
    Serial.print(", Max=");
    Serial.println(sensorMax[i]);
  }
}

void startDataTransmission() {
  Serial.println("Starting EMG data transmission...");
  Serial.println("Format: TIMESTAMP,LEFT_BICEP,RIGHT_BICEP,LEFT_TRICEP,RIGHT_TRICEP,LEFT_FOREARM,RIGHT_FOREARM");
}

void stopDataTransmission() {
  Serial.println("Stopping EMG data transmission...");
}

void sendEMGData() {
  // Read and smooth sensor data
  int smoothedValues[NUM_SENSORS];
  
  for (int i = 0; i < NUM_SENSORS; i++) {
    smoothedValues[i] = readSmoothedSensor(i);
  }
  
  // Send data in JSON format
  Serial.print("{");
  Serial.print("\"timestamp\":");
  Serial.print(millis());
  Serial.print(",");
  
  for (int i = 0; i < NUM_SENSORS; i++) {
    Serial.print("\"");
    Serial.print(SENSOR_NAMES[i]);
    Serial.print("\":");
    Serial.print(smoothedValues[i]);
    
    if (i < NUM_SENSORS - 1) {
      Serial.print(",");
    }
  }
  
  Serial.println("}");
}

int readSmoothedSensor(int sensorIndex) {
  // Read raw value
  int rawValue = analogRead(SENSOR_PINS[sensorIndex]);
  
  // Add to smoothing array
  sensorTotals[sensorIndex] = sensorTotals[sensorIndex] - sensorReadings[sensorIndex][readingIndex[sensorIndex]];
  sensorReadings[sensorIndex][readingIndex[sensorIndex]] = rawValue;
  sensorTotals[sensorIndex] = sensorTotals[sensorIndex] + sensorReadings[sensorIndex][readingIndex[sensorIndex]];
  readingIndex[sensorIndex] = (readingIndex[sensorIndex] + 1) % SMOOTHING_SAMPLES;
  
  // Return smoothed average
  return sensorTotals[sensorIndex] / SMOOTHING_SAMPLES;
}

// Calculate muscle activation percentage
float calculateMuscleActivation(int sensorIndex, int rawValue) {
  if (!isCalibrated[sensorIndex]) {
    return 0.0;
  }
  
  int range = sensorMax[sensorIndex] - sensorMin[sensorIndex];
  if (range == 0) {
    return 0.0;
  }
  
  float activation = ((float)(rawValue - sensorMin[sensorIndex]) / range) * 100.0;
  return constrain(activation, 0.0, 100.0);
}

// Send processed data with muscle activation percentages
void sendProcessedEMGData() {
  Serial.print("{");
  Serial.print("\"timestamp\":");
  Serial.print(millis());
  Serial.print(",");
  
  for (int i = 0; i < NUM_SENSORS; i++) {
    int rawValue = readSmoothedSensor(i);
    float activation = calculateMuscleActivation(i, rawValue);
    
    Serial.print("\"");
    Serial.print(SENSOR_NAMES[i]);
    Serial.print("\":");
    Serial.print(rawValue);
    Serial.print(",");
    Serial.print("\"");
    Serial.print(SENSOR_NAMES[i]);
    Serial.print("Processed\":");
    Serial.print(activation);
    
    if (i < NUM_SENSORS - 1) {
      Serial.print(",");
    }
  }
  
  Serial.println("}");
}
