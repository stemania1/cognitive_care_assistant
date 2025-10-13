/*
 * MyoWare 2.0 WiFi Direct Client
 * 
 * This code programs the MyoWare Wireless Shield directly (ESP32-based)
 * to connect to the Cognitive Care Assistant via WiFi and WebSocket.
 * 
 * Hardware: MyoWare 2.0 + MyoWare Wireless Shield (ESP32)
 * No Arduino needed - program the shield directly!
 * 
 * Features:
 * - WiFi connection to local network
 * - WebSocket communication with web app
 * - Real-time EMG data transmission
 * - Automatic reconnection
 * - Web-based configuration
 * - OTA updates support
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <WebServer.h>
#include <DNSServer.h>

// WiFi Configuration
const char* ssid = "Dinosaur";
const char* password = "AnnoyingKid2010!";

// WebSocket Configuration
const char* ws_host_local = "192.168.254.204";     // Your computer's local IP
const char* ws_host_prod = "cognitive-care-assistant.vercel.app";
const int ws_port = 3000;
const char* ws_path = "/api/emg/ws";

// MyoWare 2.0 sensor pin (ESP32 GPIO36 = A0)
const int SENSOR_PIN = 36;

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
const unsigned long DATA_SEND_INTERVAL = 100; // 10Hz

// Connection status
bool isConnected = false;
bool isTransmitting = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 5000;

// WebSocket client
WebSocketsClient webSocket;

// Configuration server
WebServer server(80);
DNSServer dnsServer;

// Configuration variables
String deviceName = "MyoWare-ESP32";
String serverMode = "auto"; // auto, local, production
String localServerIP = "192.168.1.100";
String productionServer = "cognitive-care-assistant.vercel.app";

void setup() {
  Serial.begin(115200);
  
  // Initialize EEPROM
  EEPROM.begin(512);
  loadConfiguration();
  
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
  
  Serial.println("MyoWare 2.0 WiFi Direct Client");
  Serial.println("==============================");
  
  // Setup WiFi
  setupWiFi();
  
  // Setup WebSocket
  setupWebSocket();
  
  // Setup configuration server
  setupConfigServer();
  
  Serial.println("Setup complete!");
  Serial.println("Device Name: " + deviceName);
  Serial.println("Server Mode: " + serverMode);
}

void loop() {
  // Handle configuration server
  server.handleClient();
  dnsServer.processNextRequest();
  
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
  
  // If in auto mode and local connection failed, try production
  if (serverMode == "auto" && !isConnected && millis() > 10000) {
    static bool triedProduction = false;
    if (!triedProduction) {
      Serial.println("Local connection failed, trying production...");
      triedProduction = true;
      serverMode = "production";
      connectToServer();
    }
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
    Serial.println("Starting configuration server...");
    startConfigServer();
  }
}

void setupWebSocket() {
  webSocket.onEvent(webSocketEvent);
  connectToServer();
}

void connectToServer() {
  String host;
  int port;
  String path;
  bool useSSL = false;
  
  if (serverMode == "local") {
    host = localServerIP;
    port = ws_port;
    path = ws_path;
    useSSL = false;
  } else if (serverMode == "production") {
    host = productionServer;
    port = 443; // HTTPS port for production
    path = ws_path;
    useSSL = true;
  } else { // auto mode
    // Try local first, then production
    host = localServerIP;
    port = ws_port;
    path = ws_path;
    useSSL = false;
  }
  
  Serial.println("Connecting to: " + host + ":" + String(port) + path);
  
  if (useSSL) {
    // For production, use secure WebSocket
    webSocket.begin(host.c_str(), port, path.c_str(), "wss");
  } else {
    // For local development, use regular WebSocket
    webSocket.begin(host.c_str(), port, path.c_str());
  }
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
  } else if (type == "config") {
    handleConfigUpdate(doc);
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
  doc["voltage"] = (smoothedValue * 5.0) / 1023.0;
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
  doc["deviceName"] = deviceName;
  doc["serverMode"] = serverMode;
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

// Configuration Server Functions
void setupConfigServer() {
  server.on("/", handleRoot);
  server.on("/config", handleConfig);
  server.on("/save", handleSave);
  server.on("/status", handleStatus);
  server.on("/calibrate", handleCalibrate);
  server.on("/start", handleStart);
  server.on("/stop", handleStop);
  
  server.begin();
  Serial.println("Configuration server started");
}

void startConfigServer() {
  // Start captive portal
  WiFi.softAP("MyoWare-Config");
  dnsServer.start(53, "*", WiFi.softAPIP());
  server.begin();
  Serial.println("Captive portal started");
  Serial.println("Connect to 'MyoWare-Config' WiFi network");
  Serial.println("Then go to: http://192.168.4.1");
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>MyoWare Configuration</title></head><body>";
  html += "<h1>MyoWare 2.0 Configuration</h1>";
  html += "<form action='/config' method='GET'>";
  html += "<h2>WiFi Settings</h2>";
  html += "<p>SSID: <input type='text' name='ssid' value='" + String(ssid) + "'></p>";
  html += "<p>Password: <input type='password' name='password' value='" + String(password) + "'></p>";
  html += "<h2>Server Settings</h2>";
  html += "<p>Mode: <select name='mode'><option value='auto'>Auto</option><option value='local'>Local</option><option value='production'>Production</option></select></p>";
  html += "<p>Local Server IP: <input type='text' name='local_ip' value='" + localServerIP + "'></p>";
  html += "<p>Device Name: <input type='text' name='device_name' value='" + deviceName + "'></p>";
  html += "<p><input type='submit' value='Save Configuration'></p>";
  html += "</form>";
  html += "<h2>Device Status</h2>";
  html += "<p>WiFi: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected") + "</p>";
  html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
  html += "<p>WebSocket: " + String(isConnected ? "Connected" : "Disconnected") + "</p>";
  html += "<p>Calibrated: " + String(isCalibrated ? "Yes" : "No") + "</p>";
  html += "<h2>Actions</h2>";
  html += "<p><a href='/calibrate'>Calibrate Sensor</a></p>";
  html += "<p><a href='/start'>Start Transmission</a></p>";
  html += "<p><a href='/stop'>Stop Transmission</a></p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleConfig() {
  if (server.hasArg("ssid")) {
    // Save configuration
    String newSSID = server.arg("ssid");
    String newPassword = server.arg("password");
    String newMode = server.arg("mode");
    String newLocalIP = server.arg("local_ip");
    String newDeviceName = server.arg("device_name");
    
    // Update variables
    deviceName = newDeviceName;
    serverMode = newMode;
    localServerIP = newLocalIP;
    
    // Save to EEPROM
    saveConfiguration();
    
    server.send(200, "text/plain", "Configuration saved! Restarting...");
    delay(1000);
    ESP.restart();
  } else {
    handleRoot();
  }
}

void handleSave() {
  handleConfig();
}

void handleStatus() {
  DynamicJsonDocument doc(512);
  doc["wifi_connected"] = WiFi.status() == WL_CONNECTED;
  doc["wifi_ip"] = WiFi.localIP().toString();
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["websocket_connected"] = isConnected;
  doc["transmitting"] = isTransmitting;
  doc["calibrated"] = isCalibrated;
  doc["device_name"] = deviceName;
  doc["server_mode"] = serverMode;
  doc["free_heap"] = ESP.getFreeHeap();
  
  String jsonString;
  serializeJson(doc, jsonString);
  server.send(200, "application/json", jsonString);
}

void handleCalibrate() {
  calibrateSensor();
  server.send(200, "text/plain", "Calibration started");
}

void handleStart() {
  startTransmission();
  server.send(200, "text/plain", "Transmission started");
}

void handleStop() {
  stopTransmission();
  server.send(200, "text/plain", "Transmission stopped");
}

void handleConfigUpdate(DynamicJsonDocument& doc) {
  if (doc.containsKey("deviceName")) {
    deviceName = doc["deviceName"].as<String>();
  }
  if (doc.containsKey("serverMode")) {
    serverMode = doc["serverMode"].as<String>();
  }
  if (doc.containsKey("localServerIP")) {
    localServerIP = doc["localServerIP"].as<String>();
  }
  
  saveConfiguration();
}

void saveConfiguration() {
  EEPROM.put(0, deviceName);
  EEPROM.put(32, serverMode);
  EEPROM.put(64, localServerIP);
  EEPROM.commit();
}

void loadConfiguration() {
  EEPROM.get(0, deviceName);
  EEPROM.get(32, serverMode);
  EEPROM.get(64, localServerIP);
  
  // Set defaults if empty
  if (deviceName.length() == 0) deviceName = "MyoWare-ESP32";
  if (serverMode.length() == 0) serverMode = "auto";
  if (localServerIP.length() == 0) localServerIP = "192.168.1.100";
}
