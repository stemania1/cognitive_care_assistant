/*
 * MyoWare 2.0 Simple HTTP Client
 * 
 * This sends data to the EMG server running on port 3000
 * 
 * Hardware: MyoWare 2.0 + MyoWare Wireless Shield (ESP32)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "";  //Your WiFi network
const char* password = "";   //Your WiFi password

// Server Configuration
const char* server_host = "192.168.254.204";  // Your computer's IP
const int server_port = 3001;  // EMG server port
const char* server_path = "/api/emg/ws";

// MyoWare 2.0 sensor pin 
// Try GPIO36 (A0) or GPIO39 (A3) depending on your MyoWare Wireless Shield
// GPIO39 (A3) is commonly used on MyoWare Wireless Shield
const int SENSOR_PIN = 39; // Changed from 36 to 39 - GPIO39 (A3) is input-only, perfect for analog reading

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
const unsigned long DATA_SEND_INTERVAL = 100; // 10Hz (100ms) - good for real-time EMG data

// Connection status
bool isConnected = false;
bool isTransmitting = false;

// HTTP client
HTTPClient http;

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
  
  // ESP32 ADC Configuration
  // GPIO39 (A3) is an input-only pin, perfect for analog reading
  // Set ADC attenuation to 11dB for 0-3.3V range (default)
  analogSetAttenuation(ADC_11db); // 0-3.3V range
  analogSetWidth(12); // 12-bit resolution (0-4095)
  
  Serial.println("MyoWare 2.0 Simple HTTP Client");
  Serial.println("=============================");
  Serial.print("Reading from GPIO");
  Serial.print(SENSOR_PIN);
  Serial.print(" (A");
  Serial.print(SENSOR_PIN == 36 ? "0" : "3");
  Serial.println(")");
  Serial.println("ADC configured: 12-bit, 0-3.3V range");
  Serial.println("Watch Serial Monitor for RAW ADC values");
  Serial.println("If values don't change, check sensor connection!");
  
  // Setup WiFi
  setupWiFi();
  
  // Automatically start transmission when WiFi is connected
  // Wait a moment for WiFi to fully initialize
  delay(1000);
  if (WiFi.status() == WL_CONNECTED && isConnected) {
    Serial.println("✅ Auto-starting transmission...");
    isTransmitting = true;
    lastDataSend = millis() - DATA_SEND_INTERVAL; // Start immediately
    Serial.println("✅ Transmission started automatically!");
  } else {
    Serial.println("⚠️ WiFi not connected, transmission will start when WiFi connects");
  }
  
  Serial.println("Setup complete!");
  Serial.println("Commands:");
  Serial.println("1 - Start transmission");
  Serial.println("2 - Stop transmission");
  Serial.println("3 - Calibrate sensor");
  Serial.println("4 - Send test data");
}

void loop() {
  // Handle serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    handleCommand(command);
  }
  
  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    if (isConnected) {
      Serial.println("⚠️ WiFi disconnected! Reconnecting...");
      isConnected = false;
      isTransmitting = false;
    }
    // Try to reconnect every 10 seconds
    static unsigned long lastReconnectAttempt = 0;
    if (millis() - lastReconnectAttempt > 10000) {
      setupWiFi();
      lastReconnectAttempt = millis();
    }
  } else {
    // WiFi is connected
    if (!isConnected) {
      // WiFi just connected
      isConnected = true;
      Serial.println("✅ WiFi connected!");
    }
    // Auto-start transmission if not already transmitting
    if (!isTransmitting) {
      Serial.println("✅ Auto-starting transmission...");
      isTransmitting = true;
      lastDataSend = millis() - DATA_SEND_INTERVAL; // Start immediately
    }
  }
  
  // Send data if connected and transmitting
  if (isConnected && isTransmitting && millis() - lastDataSend >= DATA_SEND_INTERVAL) {
    sendEMGData();
    lastDataSend = millis();
  }
  
  delay(10); // Reduced delay for faster loop (10ms = 100Hz loop rate)
}

void handleCommand(String command) {
  if (command == "1") {
    startTransmission();
  } else if (command == "2") {
    stopTransmission();
  } else if (command == "3") {
    calibrateSensor();
  } else if (command == "4") {
    sendTestData();
  } else {
    Serial.println("Unknown command: " + command);
  }
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
    isConnected = true;
  } else {
    Serial.println("");
    Serial.println("WiFi connection failed!");
    Serial.println("Please check your credentials and try again.");
  }
}

void sendEMGData() {
  // Check WiFi connection first
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi not connected, skipping data send");
    isConnected = false;
    isTransmitting = false;
    return;
  }
  
  // Read and smooth sensor data
  int smoothedValue = readSmoothedSensor();
  float activation = calculateMuscleActivation(smoothedValue);
  
  // Create JSON data
  DynamicJsonDocument doc(512);
  doc["type"] = "emg_data";
  doc["timestamp"] = millis();
  doc["muscleActivity"] = smoothedValue;
  doc["muscleActivityProcessed"] = activation;
  doc["voltage"] = (smoothedValue * 3.3) / 4095.0;
  doc["calibrated"] = isCalibrated;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send HTTP POST request
  String url = "http://" + String(server_host) + ":" + String(server_port) + server_path;
  
  // Debug: Print URL and data being sent (only first time or on error)
  static bool firstSend = true;
  if (firstSend) {
    Serial.print("📡 Sending to: ");
    Serial.println(url);
    firstSend = false;
  }
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000); // 3 second timeout
  http.setReuse(true); // Reuse connection
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    static unsigned long lastSuccessPrint = 0;
    if (millis() - lastSuccessPrint > 5000) { // Print success every 5 seconds
      Serial.print("✅ HTTP ");
      Serial.print(httpResponseCode);
      Serial.print(" - Data: ");
      Serial.print(smoothedValue);
      Serial.print(" (");
      Serial.print((smoothedValue * 3.3) / 4095.0, 3);
      Serial.println("V)");
      lastSuccessPrint = millis();
    }
  } else {
    // HTTP Error -1 means connection failed
    Serial.print("❌ HTTP Error: ");
    Serial.print(httpResponseCode);
    if (httpResponseCode == -1) {
      Serial.println(" - Connection failed!");
      Serial.print("   Check: 1) emg-server.js running? 2) IP correct? (");
      Serial.print(server_host);
      Serial.print(") 3) Port correct? (");
      Serial.print(server_port);
      Serial.println(")");
      Serial.println("   Try: ping " + String(server_host));
    } else {
      Serial.print(" - Failed to send to ");
      Serial.println(url);
    }
  }
  
  http.end();
}

void sendTestData() {
  Serial.println("Sending test data...");
  
  DynamicJsonDocument doc(256);
  doc["type"] = "test";
  doc["message"] = "Hello from MyoWare ESP32";
  doc["timestamp"] = millis();
  doc["device_ip"] = WiFi.localIP().toString();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  String url = "http://" + String(server_host) + ":" + String(server_port) + server_path;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Test data sent successfully!");
    Serial.println("Response: " + response);
  } else {
    Serial.println("Test data failed: " + String(httpResponseCode));
  }
  
  http.end();
}

void calibrateSensor() {
  Serial.println("Starting calibration...");
  isTransmitting = false;
  
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
  
  String url = "http://" + String(server_host) + ":" + String(server_port) + server_path;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(calJson);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Calibration data sent: " + String(httpResponseCode));
  } else {
    Serial.println("Calibration data failed: " + String(httpResponseCode));
  }
  
  http.end();
}

void startTransmission() {
  Serial.println("Starting EMG data transmission...");
  isTransmitting = true;
  lastDataSend = millis();
}

void stopTransmission() {
  Serial.println("Stopping EMG data transmission...");
  isTransmitting = false;
}

int readSmoothedSensor() {
  // Read raw value
  int rawValue = analogRead(SENSOR_PIN);
  
  // DEBUG: Print raw ADC value to Serial Monitor (less frequently to avoid spam)
  // This helps diagnose if ESP32 is reading varying values
  static unsigned long lastDebugPrint = 0;
  if (millis() - lastDebugPrint > 2000) { // Print every 2 seconds (reduced frequency)
    Serial.print("RAW ADC Value: ");
    Serial.print(rawValue);
    Serial.print(" (Voltage: ");
    Serial.print((rawValue * 3.3) / 4095.0, 3);
    Serial.println("V)");
    lastDebugPrint = millis();
  }
  
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
