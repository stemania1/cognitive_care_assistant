/*
 * MyoWare 2.0 Wireless Client for Cognitive Care Assistant
 * 
 * This Arduino code connects a MyoWare 2.0 sensor with wireless shield
 * to the Cognitive Care Assistant web application via WebSocket.
 * 
 * Hardware Setup:
 * - MyoWare 2.0 Muscle Sensor
 * - MyoWare Wireless Shield (Bluetooth)
 * - Arduino Uno/Nano/ESP32
 * 
 * Features:
 * - Bluetooth communication with web app
 * - Real-time EMG data transmission
 * - Automatic reconnection
 * - Calibration support
 * - Works with both localhost and production
 */

#include <SoftwareSerial.h>

// Bluetooth configuration
SoftwareSerial bluetooth(2, 3); // RX, TX pins for Bluetooth

// MyoWare 2.0 sensor pin
const int SENSOR_PIN = A0;

// Calibration data
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

// Connection status
bool isConnected = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 5000; // Send heartbeat every 5 seconds

// WebSocket server URLs (will be set via serial commands)
String serverUrl = "ws://localhost:3000/api/emg/ws"; // Default to localhost
bool useProduction = false;

void setup() {
  Serial.begin(115200);
  bluetooth.begin(9600);
  
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
  
  Serial.println("MyoWare 2.0 Wireless Client Ready");
  Serial.println("Commands:");
  Serial.println("CONNECT_LOCAL - Connect to localhost");
  Serial.println("CONNECT_PROD - Connect to production");
  Serial.println("CALIBRATE - Start calibration");
  Serial.println("START - Begin data transmission");
  Serial.println("STOP - Stop data transmission");
  Serial.println("STATUS - Show connection status");
  
  // Try to connect to localhost by default
  connectToServer("ws://localhost:3000/api/emg/ws");
}

void loop() {
  // Check for serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    handleCommand(command);
  }
  
  // Check for Bluetooth data
  if (bluetooth.available()) {
    String data = bluetooth.readStringUntil('\n');
    data.trim();
    handleBluetoothData(data);
  }
  
  // Send data at regular intervals if connected
  if (isConnected && millis() - lastDataSend >= DATA_SEND_INTERVAL) {
    sendEMGData();
    lastDataSend = millis();
  }
  
  // Send heartbeat
  if (isConnected && millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Check connection status
  if (isConnected && millis() - lastHeartbeat > HEARTBEAT_INTERVAL * 2) {
    Serial.println("Connection lost, attempting to reconnect...");
    isConnected = false;
    connectToServer(serverUrl);
  }
}

void handleCommand(String command) {
  if (command == "CONNECT_LOCAL") {
    serverUrl = "ws://localhost:3000/api/emg/ws";
    useProduction = false;
    connectToServer(serverUrl);
  } else if (command == "CONNECT_PROD") {
    serverUrl = "ws://cognitive-care-assistant.vercel.app/api/emg/ws";
    useProduction = true;
    connectToServer(serverUrl);
  } else if (command == "CALIBRATE") {
    calibrateSensor();
  } else if (command == "START") {
    startDataTransmission();
  } else if (command == "STOP") {
    stopDataTransmission();
  } else if (command == "STATUS") {
    printStatus();
  } else {
    Serial.println("Unknown command: " + command);
  }
}

void handleBluetoothData(String data) {
  // Handle WebSocket responses and commands from the web app
  if (data.startsWith("WS_CONNECTED")) {
    isConnected = true;
    Serial.println("WebSocket connected successfully");
  } else if (data.startsWith("WS_DISCONNECTED")) {
    isConnected = false;
    Serial.println("WebSocket disconnected");
  } else if (data.startsWith("CALIBRATE_REQUEST")) {
    calibrateSensor();
  } else if (data.startsWith("START_REQUEST")) {
    startDataTransmission();
  } else if (data.startsWith("STOP_REQUEST")) {
    stopDataTransmission();
  }
}

void connectToServer(String url) {
  Serial.println("Connecting to: " + url);
  
  // Send WebSocket connection request via Bluetooth
  String connectMsg = "WS_CONNECT:" + url;
  bluetooth.println(connectMsg);
  
  // Wait for connection confirmation
  unsigned long startTime = millis();
  while (millis() - startTime < 5000 && !isConnected) {
    if (bluetooth.available()) {
      String response = bluetooth.readStringUntil('\n');
      if (response.startsWith("WS_CONNECTED")) {
        isConnected = true;
        Serial.println("Connected to WebSocket server");
        break;
      }
    }
    delay(100);
  }
  
  if (!isConnected) {
    Serial.println("Failed to connect to WebSocket server");
  }
}

void calibrateSensor() {
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
  
  // Send calibration data to web app
  String calData = "CALIBRATION_DATA:" + String(sensorMin) + "," + String(sensorMax);
  bluetooth.println(calData);
}

void printCalibrationData() {
  Serial.println("Calibration Results:");
  Serial.print("Min: ");
  Serial.print(sensorMin);
  Serial.print(", Max: ");
  Serial.println(sensorMax);
}

void startDataTransmission() {
  Serial.println("Starting EMG data transmission...");
  String startMsg = "START_TRANSMISSION";
  bluetooth.println(startMsg);
}

void stopDataTransmission() {
  Serial.println("Stopping EMG data transmission...");
  String stopMsg = "STOP_TRANSMISSION";
  bluetooth.println(stopMsg);
}

void sendEMGData() {
  // Read and smooth sensor data
  int smoothedValue = readSmoothedSensor();
  float activation = calculateMuscleActivation(smoothedValue);
  
  // Send data in JSON format via Bluetooth
  String jsonData = "{";
  jsonData += "\"timestamp\":" + String(millis()) + ",";
  jsonData += "\"muscleActivity\":" + String(smoothedValue) + ",";
  jsonData += "\"muscleActivityProcessed\":" + String(activation, 2);
  jsonData += "}";
  
  bluetooth.println("EMG_DATA:" + jsonData);
}

void sendHeartbeat() {
  bluetooth.println("HEARTBEAT:" + String(millis()));
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

void printStatus() {
  Serial.println("=== MyoWare 2.0 Client Status ===");
  Serial.println("Connected: " + String(isConnected ? "Yes" : "No"));
  Serial.println("Server: " + serverUrl);
  Serial.println("Calibrated: " + String(isCalibrated ? "Yes" : "No"));
  if (isCalibrated) {
    Serial.println("Calibration Range: " + String(sensorMin) + " - " + String(sensorMax));
  }
  Serial.println("Data Transmission: " + String(isConnected ? "Active" : "Inactive"));
  Serial.println("================================");
}
