/*
 * MyoWare 2.0 HTTP Client
 * 
 * Simplified version that uses HTTP POST instead of WebSocket
 * This is easier to get working initially
 * 
 * Hardware: MyoWare 2.0 + MyoWare Wireless Shield (ESP32)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "Dinosaur";
const char* password = "AnnoyingKid2010!";

// Server Configuration - UPDATE THESE!
const char* server_host = "192.168.254.204";  // Your computer's IP
const int server_port = 3001;  // EMG Server Port
const char* server_path = "/api/emg/ws";

// MyoWare 2.0 sensor pin (ESP32 GPIO36 = A0)
const int SENSOR_PIN = 36;

// Calibration data
int sensorMin = 1023;
int sensorMax = 0;
bool isCalibrated = false;

// Data smoothing and filtering
const int SMOOTHING_SAMPLES = 10;
int sensorReadings[SMOOTHING_SAMPLES];
int readingIndex = 0;
int sensorTotal = 0;

// Signal processing for heart rate separation
const int FILTER_SAMPLES = 20;
float filteredReadings[FILTER_SAMPLES];
int filterIndex = 0;
float baseline = 0;
bool baselineEstablished = false;

// Heart rate detection
const int MAX_HEART_RATE_SAMPLES = 50;
unsigned long heartRateTimestamps[MAX_HEART_RATE_SAMPLES];
int heartRateIndex = 0;
float currentHeartRate = 0;
bool heartRateDetected = false;
unsigned long lastHeartRateUpdate = 0;

// Timing
unsigned long lastDataSend = 0;
const unsigned long DATA_SEND_INTERVAL = 100; // 10Hz

// Connection status
bool isConnected = false;
bool isTransmitting = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 5000;

// HTTP client
HTTPClient http;

// Function declarations
void sendCalibrationData(int rawValue, int min, int max, int progress, float heartRate = 0, float muscleActivity = 0);
float processEMGSignal(int rawValue);
float detectHeartRate(int rawValue);
float separateMuscleActivity(int rawValue);
float calculateHeartRate(float heartRateComponent);
void sendStatusToApp();
void checkWebCommands();
void sendStatus();

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
  
  // Initialize filter array
  for (int i = 0; i < FILTER_SAMPLES; i++) {
    filteredReadings[i] = 0;
  }
  
  Serial.println("MyoWare 2.0 HTTP Client");
  Serial.println("=======================");
  
  // Setup WiFi
  setupWiFi();
  
  Serial.println("Setup complete!");
  Serial.println("Available commands:");
  Serial.println("  START - Begin EMG data transmission");
  Serial.println("  STOP - Stop EMG data transmission");
  Serial.println("  CALIBRATE - Calibrate the sensor");
  Serial.println("  STATUS - Show connection status");
}

void loop() {
  // Debug: Show ESP32 is running (every 30 seconds)
  static unsigned long lastDebugMessage = 0;
  if (millis() - lastDebugMessage > 30000) {
    lastDebugMessage = millis();
    Serial.println("🔄 ESP32 Running - Waiting for commands...");
  }
  
  // Check for serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    if (command == "START") {
      startTransmission();
    } else if (command == "STOP") {
      stopTransmission();
    } else if (command == "CALIBRATE") {
      calibrateSensor();
    } else if (command == "STATUS") {
      sendStatus();
    } else {
      Serial.println("Unknown command: " + command);
      Serial.println("Available commands: START, STOP, CALIBRATE, STATUS");
    }
  }
  
  // Check for web commands from API
  checkWebCommands();
  
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
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL * 2) {
    isConnected = false;
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
    isConnected = true;
    lastHeartbeat = millis();
  } else {
    Serial.println("");
    Serial.println("WiFi connection failed!");
    Serial.println("Please check your credentials and try again.");
  }
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
  
  // Send HTTP POST request
  String url = "http://" + String(server_host) + ":" + String(server_port) + server_path;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("HTTP Error: " + String(httpResponseCode));
    isConnected = false;
  }
  
  http.end();
}

// Signal processing functions
float processEMGSignal(int rawValue) {
  // High-pass filter to remove heart rate (low frequency)
  static float prevFiltered = 0;
  static float prevRaw = 0;
  
  // Simple high-pass filter: y[n] = 0.95 * (y[n-1] + x[n] - x[n-1])
  float filtered = 0.95 * (prevFiltered + rawValue - prevRaw);
  
  prevFiltered = filtered;
  prevRaw = rawValue;
  
  return filtered;
}

float detectHeartRate(int rawValue) {
  // Moving average to detect heart rate baseline
  filteredReadings[filterIndex] = rawValue;
  filterIndex = (filterIndex + 1) % FILTER_SAMPLES;
  
  // Calculate moving average (heart rate baseline)
  float sum = 0;
  for (int i = 0; i < FILTER_SAMPLES; i++) {
    sum += filteredReadings[i];
  }
  float currentBaseline = sum / FILTER_SAMPLES;
  
  // Establish baseline after first few samples
  if (!baselineEstablished) {
    baseline = currentBaseline;
    baselineEstablished = true;
  } else {
    // Slowly adapt baseline (exponential moving average)
    baseline = 0.99 * baseline + 0.01 * currentBaseline;
  }
  
  // Return heart rate component (deviation from baseline)
  return rawValue - baseline;
}

float separateMuscleActivity(int rawValue) {
  // Get heart rate component
  float heartRateComponent = detectHeartRate(rawValue);
  
  // Calculate heart rate if we have a significant component
  if (abs(heartRateComponent) > 10) {
    currentHeartRate = calculateHeartRate(heartRateComponent);
  }
  
  // Get filtered EMG signal
  float muscleSignal = processEMGSignal(rawValue);
  
  // Return muscle activity (high frequency, voluntary)
  return muscleSignal;
}

float calculateHeartRate(float heartRateComponent) {
  // Simple peak detection for heart rate
  static float lastHeartRateComponent = 0;
  static bool wasRising = false;
  static unsigned long lastPeakTime = 0;
  
  bool isRising = heartRateComponent > lastHeartRateComponent;
  
  // Detect peak (transition from rising to falling)
  if (wasRising && !isRising && heartRateComponent > 20) {
    unsigned long currentTime = millis();
    
    if (lastPeakTime > 0) {
      unsigned long timeBetweenPeaks = currentTime - lastPeakTime;
      
      // Only accept reasonable heart rate (30-200 BPM)
      if (timeBetweenPeaks > 300 && timeBetweenPeaks < 2000) {
        float bpm = 60000.0 / timeBetweenPeaks;
        
        // Store timestamp for averaging
        heartRateTimestamps[heartRateIndex] = currentTime;
        heartRateIndex = (heartRateIndex + 1) % MAX_HEART_RATE_SAMPLES;
        
        // Calculate average BPM from recent peaks
        int validPeaks = 0;
        float totalBPM = 0;
        
        for (int i = 0; i < MAX_HEART_RATE_SAMPLES; i++) {
          if (heartRateTimestamps[i] > 0) {
            validPeaks++;
            totalBPM += bpm;
          }
        }
        
        if (validPeaks > 0) {
          currentHeartRate = totalBPM / validPeaks;
          heartRateDetected = true;
          lastHeartRateUpdate = currentTime;
        }
      }
    }
    
    lastPeakTime = currentTime;
  }
  
  wasRising = isRising;
  lastHeartRateComponent = heartRateComponent;
  
  return currentHeartRate;
}

void sendHeartbeat() {
  DynamicJsonDocument doc(256);
  doc["type"] = "heartbeat";
  doc["timestamp"] = millis();
  doc["rssi"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send HTTP POST request
  String url = "http://" + String(server_host) + ":" + String(server_port) + server_path;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Heartbeat sent: " + String(httpResponseCode));
  } else {
    Serial.println("Heartbeat failed: " + String(httpResponseCode));
    isConnected = false;
  }
  
  http.end();
}

void calibrateSensor() {
  Serial.println("=====================");
  Serial.println("🎯 CALIBRATION STARTED");
  Serial.println("=====================");
  isTransmitting = false;
  
  unsigned long calibrationStart = millis();
  const unsigned long CALIBRATION_DURATION = 10000; // 10 seconds
  
  while (millis() - calibrationStart < CALIBRATION_DURATION) {
    int rawValue = analogRead(SENSOR_PIN);
    
    // Process signals to separate heart rate from muscle activity
    float heartRateComponent = detectHeartRate(rawValue);
    float muscleActivity = separateMuscleActivity(rawValue);
    
    // Update min/max values using processed muscle signal
    int processedValue = (int)muscleActivity;
    if (processedValue < sensorMin) {
      sensorMin = processedValue;
    }
    if (processedValue > sensorMax) {
      sensorMax = processedValue;
    }
    
    // Calculate progress
    int progress = ((millis() - calibrationStart) * 100) / CALIBRATION_DURATION;
    
    // Send calibration data to web app every 100ms for faster updates
    static unsigned long lastCalibrationSend = 0;
    if (millis() - lastCalibrationSend >= 100) {
      sendCalibrationData(rawValue, sensorMin, sensorMax, progress, heartRateComponent, muscleActivity);
      lastCalibrationSend = millis();
    }
    
    // Show progress and current values every second
    if (progress % 1000 == 0) {
      Serial.println("📊 CALIBRATION UPDATE:");
      Serial.print("   Progress: ");
      Serial.print(progress / 100);
      Serial.print("% | Current: ");
      Serial.print(rawValue);
      Serial.print(" | Range: ");
      Serial.print(sensorMin);
      Serial.print("-");
      Serial.println(sensorMax);
    }
    
    delay(50);
  }
  
  // Mark sensor as calibrated
  isCalibrated = true;
  
  Serial.println("=====================");
  Serial.println("✅ CALIBRATION COMPLETE!");
  Serial.println("=====================");
  Serial.print("📈 Final Range: ");
  Serial.print(sensorMin);
  Serial.print(" - ");
  Serial.print(sensorMax);
  Serial.print(" (Range: ");
  Serial.print(sensorMax - sensorMin);
  Serial.println(")");
  Serial.println("=====================");
  
  printCalibrationData();
  
  // Send calibration data
  DynamicJsonDocument calDoc(512);
  calDoc["type"] = "calibration_data";
  calDoc["min"] = sensorMin;
  calDoc["max"] = sensorMax;
  calDoc["range"] = sensorMax - sensorMin;
  
  String calJson;
  serializeJson(calDoc, calJson);
  
  // Send HTTP POST request
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
}

void stopTransmission() {
  Serial.println("Stopping EMG data transmission...");
  isTransmitting = false;
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

void sendStatus() {
  Serial.println("=== Device Status ===");
  Serial.println("WiFi Connected: " + String(WiFi.status() == WL_CONNECTED ? "Yes" : "No"));
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("IP Address: " + WiFi.localIP().toString());
    Serial.println("Signal Strength (RSSI): " + String(WiFi.RSSI()) + " dBm");
  }
  Serial.println("Server Connected: " + String(isConnected ? "Yes" : "No"));
  Serial.println("Transmitting: " + String(isTransmitting ? "Yes" : "No"));
  Serial.println("Calibrated: " + String(isCalibrated ? "Yes" : "No"));
  if (isCalibrated) {
    Serial.println("Calibration Range: " + String(sensorMin) + " - " + String(sensorMax));
  }
  Serial.println("Free Heap: " + String(ESP.getFreeHeap()) + " bytes");
  Serial.println("=====================");
}

void sendCalibrationData(int rawValue, int min, int max, int progress, float heartRate, float muscleActivity) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String commandUrl = "http://" + String(server_host) + ":" + String(server_port) + "/api/emg/command";
    
    http.begin(commandUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload with signal processing data
    DynamicJsonDocument doc(1024);
    doc["calibrationData"]["rawValue"] = rawValue;
    doc["calibrationData"]["min"] = min;
    doc["calibrationData"]["max"] = max;
    doc["calibrationData"]["progress"] = progress;
    doc["calibrationData"]["heartRateComponent"] = heartRate;
    doc["calibrationData"]["muscleActivity"] = muscleActivity;
    doc["calibrationData"]["baseline"] = baseline;
    doc["calibrationData"]["heartRateBPM"] = currentHeartRate;
    doc["calibrationData"]["heartRateDetected"] = heartRateDetected;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Debug: Print calibration data being sent
    Serial.println("Sending calibration data: " + jsonString);
    
    int httpCode = http.POST(jsonString);
    
    if (httpCode == HTTP_CODE_OK) {
      Serial.println("Calibration data sent successfully");
    } else {
      Serial.println("Failed to send calibration data: " + String(httpCode));
    }
    
    http.end();
  }
}

void sendStatusToApp() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String commandUrl = "http://" + String(server_host) + ":" + String(server_port) + "/api/emg/command";
    
    http.begin(commandUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create status JSON payload
    DynamicJsonDocument doc(1024);
    doc["statusData"]["connected"] = isConnected;
    doc["statusData"]["transmitting"] = isTransmitting;
    doc["statusData"]["calibrated"] = isCalibrated;
    doc["statusData"]["heartRateDetected"] = heartRateDetected;
    doc["statusData"]["currentHeartRate"] = currentHeartRate;
    doc["statusData"]["baseline"] = baseline;
    doc["statusData"]["sensorMin"] = sensorMin;
    doc["statusData"]["sensorMax"] = sensorMax;
    doc["statusData"]["freeHeap"] = ESP.getFreeHeap();
    doc["statusData"]["rssi"] = WiFi.RSSI();
    doc["statusData"]["timestamp"] = millis();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpCode = http.POST(jsonString);
    
    if (httpCode == HTTP_CODE_OK) {
      Serial.println("Status sent to app successfully");
    } else {
      Serial.println("Failed to send status to app: " + String(httpCode));
    }
    
    http.end();
  }
}

void checkWebCommands() {
  static unsigned long lastCommandCheck = 0;
  const unsigned long COMMAND_CHECK_INTERVAL = 1000; // Check every 1 second for faster response
  
  if (millis() - lastCommandCheck >= COMMAND_CHECK_INTERVAL) {
    lastCommandCheck = millis();
    
    // Debug: Show that we're checking for commands
    static int commandCheckCount = 0;
    commandCheckCount++;
    if (commandCheckCount % 5 == 0) { // Every 10 seconds
      Serial.println("🔍 Checking for web commands...");
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String commandUrl = "http://" + String(server_host) + ":" + String(server_port) + "/api/emg/command";
      
      http.begin(commandUrl);
      int httpCode = http.GET();
      
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        
        // Debug: Print the raw response
        Serial.println("📥 Raw API response: " + payload);
        
        // Parse JSON response
        DynamicJsonDocument doc(1024);
        DeserializationError error = deserializeJson(doc, payload);
        
        if (error) {
          Serial.println("❌ JSON parse error: " + String(error.c_str()));
          return;
        }
        
        Serial.println("📋 Parsed response - hasCommand: " + String(doc["hasCommand"].as<bool>()));
        Serial.println("📋 Parsed response - command: " + String(doc["command"].as<String>()));
        
        if (!error && doc["hasCommand"].as<bool>()) {
          String command = doc["command"].as<String>();
          command.toUpperCase();
          
          Serial.println("🎯 Web command received: " + command);
          
          // Execute the command
          if (command == "START") {
            Serial.println("Executing START command");
            startTransmission();
          } else if (command == "STOP") {
            Serial.println("Executing STOP command");
            stopTransmission();
          } else if (command == "CALIBRATE") {
            Serial.println("🎯 WEB CALIBRATE COMMAND RECEIVED!");
            Serial.println("Executing CALIBRATE command");
            calibrateSensor();
          } else if (command == "STATUS") {
            Serial.println("Executing STATUS command");
            sendStatus(); // Send to Serial Monitor
            sendStatusToApp(); // Send to web app
          } else {
            Serial.println("Unknown web command: " + command);
          }
        }
      } else {
        // Serial.println("Failed to check for commands: " + String(httpCode));
      }
      
      http.end();
    }
  }
}
