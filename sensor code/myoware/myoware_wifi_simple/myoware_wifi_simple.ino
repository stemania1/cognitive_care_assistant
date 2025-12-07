/*
 * MyoWare 2.0 WiFi Simple Client
 * 
 * Simplified version for testing WebSocket connection
 * 
 * Hardware: MyoWare 2.0 + MyoWare Wireless Shield (ESP32)
 * 
 * Features:
 * - WiFi connection to local network
 * - WebSocket communication with web app
 * - Real-time EMG data transmission
 * - Simple configuration
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi Configuration - UPDATE THESE!
const char* ssid = "Dinosaur";
const char* password = "AnnoyingKid2010!";

// Server Configuration - UPDATE THESE!
const char* server_host = "192.168.254.204";  // Your computer's IP
const int server_port = 3000;
const char* server_path = "/api/emg/ws";

// MyoWare 2.0 sensor pin (ESP32 GPIO36 = A0)
const int SENSOR_PIN = 36;

// Calibration data
int sensorMin = 4095; // ESP32: 12-bit ADC max value (0-4095)
int sensorMax = 0;
bool isCalibrated = false;

// Data smoothing
const int SMOOTHING_SAMPLES = 10;
int sensorReadings[SMOOTHING_SAMPLES];
int readingIndex = 0;
int sensorTotal = 0;

// Timing
unsigned long lastDataSend = 0;
const unsigned long DATA_SEND_INTERVAL = 100; // 10Hz

// Connection status
bool isConnected = false;
bool isTransmitting = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 5000;

// WebSocket client
WebSocketsClient webSocket;

void setup() {
  Serial.begin(115200);
  
  // Initialize sensor data
  sensorMin = 4095; // ESP32: 12-bit ADC max value (0-4095)
  sensorMax = 0;
  isCalibrated = false;
  readingIndex = 0;
  sensorTotal = 0;
  
  // Initialize smoothing array
  for (int i = 0; i < SMOOTHING_SAMPLES; i++) {
    sensorReadings[i] = 0;
  }
  
  Serial.println("MyoWare 2.0 WiFi Simple Client");
  Serial.println("==============================");
  
  // Setup WiFi
  setupWiFi();
  
  // Setup WebSocket
  setupWebSocket();
  
  Serial.println("Setup complete!");
}

void loop() {
  // Handle WebSocket
  webSocket.loop();
  
  // Send data if connected and transmitting
  if (isConnected && isTransmitting && millis() - lastDataSend >= DATA_SEND_INTERVAL) {
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
    connectToServer();
  }
  
  delay(10);
}

void setupWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected!");
    Serial.println("IP address: " + WiFi.localIP().toString());
    Serial.println("MAC address: " + WiFi.macAddress());
  } else {
    Serial.println("");
    Serial.println("WiFi connection failed!");
    Serial.println("Please check your credentials and try again.");
  }
}

void setupWebSocket() {
  webSocket.onEvent(webSocketEvent);
  connectToServer();
}

void connectToServer() {
  Serial.println("Connecting to: " + String(server_host) + ":" + String(server_port) + server_path);
  webSocket.begin(server_host, server_port, server_path);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket disconnected");
      isConnected = false;
      break;
      
    case WStype_CONNECTED:
      Serial.println("WebSocket connected!");
      isConnected = true;
      lastHeartbeat = millis();
      break;
      
    case WStype_TEXT:
      handleWebSocketMessage((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.println("WebSocket error");
      isConnected = false;
      break;
  }
}

void handleWebSocketMessage(String message) {
  Serial.println("Received: " + message);
  
  // Parse JSON message
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  String type = doc["type"];
  
  if (type == "calibrate") {
    calibrateSensor();
  } else if (type == "start") {
    startTransmission();
  } else if (type == "stop") {
    stopTransmission();
  } else if (type == "status") {
    sendStatus();
  }
}

void calibrateSensor() {
  Serial.println("Starting calibration...");
  isTransmitting = false;
  
  // Send calibration start message
  sendMessage("calibration_start", "Calibration started");
  
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
  
  // Send calibration data
  DynamicJsonDocument calDoc(512);
  calDoc["type"] = "calibration_data";
  calDoc["min"] = sensorMin;
  calDoc["max"] = sensorMax;
  calDoc["range"] = sensorMax - sensorMin;
  
  String calJson;
  serializeJson(calDoc, calJson);
  webSocket.sendTXT(calJson);
  
  sendMessage("calibration_complete", "Calibration completed");
}

void startTransmission() {
  Serial.println("Starting EMG data transmission...");
  isTransmitting = true;
  sendMessage("transmission_started", "Data transmission started");
}

void stopTransmission() {
  Serial.println("Stopping EMG data transmission...");
  isTransmitting = false;
  sendMessage("transmission_stopped", "Data transmission stopped");
}

void sendEMGData() {
  // Read and smooth sensor data
  int smoothedValue = readSmoothedSensor();
  float activation = calculateMuscleActivation(smoothedValue);
  
  // Create JSON data
  DynamicJsonDocument doc(512);
  doc["type"] = "emg_data";
  doc["timestamp"] = millis();
  doc["muscleActivity"] = smoothedValue;
  doc["muscleActivityProcessed"] = activation;
  doc["voltage"] = (smoothedValue * 3.3) / 4095.0; // ESP32 uses 3.3V and 12-bit ADC
  doc["calibrated"] = isCalibrated;
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
}

void sendHeartbeat() {
  DynamicJsonDocument doc(256);
  doc["type"] = "heartbeat";
  doc["timestamp"] = millis();
  doc["rssi"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
}

void sendStatus() {
  DynamicJsonDocument doc(512);
  doc["type"] = "status";
  doc["connected"] = isConnected;
  doc["transmitting"] = isTransmitting;
  doc["calibrated"] = isCalibrated;
  doc["deviceName"] = "MyoWare-ESP32";
  doc["wifiRSSI"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  
  if (isCalibrated) {
    doc["calibrationMin"] = sensorMin;
    doc["calibrationMax"] = sensorMax;
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
}

void sendMessage(String type, String message) {
  DynamicJsonDocument doc(256);
  doc["type"] = type;
  doc["message"] = message;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
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

void printCalibrationData() {
  Serial.println("Calibration Results:");
  Serial.println("Min: " + String(sensorMin));
  Serial.println("Max: " + String(sensorMax));
  Serial.println("Range: " + String(sensorMax - sensorMin));
}
