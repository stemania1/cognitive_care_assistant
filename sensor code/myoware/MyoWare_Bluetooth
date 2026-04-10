/*
 * MyoWare 2.0 Bluetooth Client
 * 
 * This sends data via Bluetooth Serial to the EMG server
 * 
 * Hardware: MyoWare 2.0 + MyoWare Wireless Shield (ESP32)
 */

#include "BluetoothSerial.h"
#include <ArduinoJson.h>

// Bluetooth Configuration
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error "Bluetooth is not enabled! Please run `make menuconfig` to and enable it"
#endif

#if !defined(CONFIG_BT_SPP_ENABLED)
#error "Serial Bluetooth not available or not enabled. It is only available for the ESP32 chip."
#endif

// Bluetooth device name
const char* device_name = "MyoWare_EMG";  // Change this to your preferred name

// Bluetooth Serial object
BluetoothSerial SerialBT;

// MyoWare 2.0 sensor pin 
// Try GPIO36 (A0) or GPIO39 (A3) depending on your MyoWare Wireless Shield
// GPIO39 (A3) is commonly used on MyoWare Wireless Shield
const int SENSOR_PIN = 39; // GPIO39 (A3) is input-only, perfect for analog reading

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
  
  Serial.println("MyoWare 2.0 Bluetooth Client");
  Serial.println("=============================");
  Serial.print("Reading from GPIO");
  Serial.print(SENSOR_PIN);
  Serial.print(" (A");
  Serial.print(SENSOR_PIN == 36 ? "0" : "3");
  Serial.println(")");
  Serial.println("ADC configured: 12-bit, 0-3.3V range");
  Serial.println("Watch Serial Monitor for RAW ADC values");
  Serial.println("If values don't change, check sensor connection!");
  
  // Setup Bluetooth
  setupBluetooth();
  
  // Automatically start transmission when Bluetooth is connected
  delay(1000);
  if (SerialBT.hasClient()) {
    Serial.println("✅ Auto-starting transmission...");
    isTransmitting = true;
    isConnected = true;
    lastDataSend = millis() - DATA_SEND_INTERVAL; // Start immediately
    Serial.println("✅ Transmission started automatically!");
  } else {
    Serial.println("⚠️ Waiting for Bluetooth connection...");
    Serial.println("   Connect to this device from your computer/phone");
  }
  
  Serial.println("Setup complete!");
  Serial.println("Commands:");
  Serial.println("1 - Start transmission");
  Serial.println("2 - Stop transmission");
  Serial.println("3 - Calibrate sensor");
  Serial.println("4 - Send test data");
}

void loop() {
  // Handle serial commands (USB Serial)
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    handleCommand(command);
  }
  
  // Check Bluetooth connection status
  if (SerialBT.hasClient()) {
    if (!isConnected) {
      // Bluetooth just connected
      isConnected = true;
      Serial.println("✅ Bluetooth connected!");
      // Auto-start transmission
      if (!isTransmitting) {
        Serial.println("✅ Auto-starting transmission...");
        isTransmitting = true;
        lastDataSend = millis() - DATA_SEND_INTERVAL;
      }
    }
  } else {
    // Bluetooth disconnected
    if (isConnected) {
      Serial.println("⚠️ Bluetooth disconnected!");
      isConnected = false;
      isTransmitting = false;
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

void setupBluetooth() {
  Serial.println("Initializing Bluetooth...");
  
  // Start Bluetooth Serial
  if (!SerialBT.begin(device_name)) {
    Serial.println("❌ Bluetooth initialization failed!");
    Serial.println("   Please check your ESP32 configuration");
    return;
  }
  
  Serial.println("✅ Bluetooth initialized successfully!");
  Serial.print("Device name: ");
  Serial.println(device_name);
  Serial.println("Waiting for Bluetooth connection...");
  Serial.println("   Pair this device from your computer/phone");
  Serial.println("   Look for: " + String(device_name));
}

void sendEMGData() {
  // Check Bluetooth connection first
  if (!SerialBT.hasClient()) {
    Serial.println("⚠️ Bluetooth not connected, skipping data send");
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
  
  // Send data via Bluetooth Serial
  // Add newline delimiter so receiver can parse each JSON message
  SerialBT.println(jsonString);
  
  // Debug: Print to USB Serial (only periodically to avoid spam)
  static unsigned long lastSuccessPrint = 0;
  if (millis() - lastSuccessPrint > 5000) { // Print every 5 seconds
    Serial.print("✅ Bluetooth - Data: ");
    Serial.print(smoothedValue);
    Serial.print(" (");
    Serial.print((smoothedValue * 3.3) / 4095.0, 3);
    Serial.println("V)");
    lastSuccessPrint = millis();
  }
}

void sendTestData() {
  Serial.println("Sending test data via Bluetooth...");
  
  if (!SerialBT.hasClient()) {
    Serial.println("❌ Bluetooth not connected!");
    return;
  }
  
  DynamicJsonDocument doc(256);
  doc["type"] = "test";
  doc["message"] = "Hello from MyoWare ESP32 (Bluetooth)";
  doc["timestamp"] = millis();
  doc["device_name"] = device_name;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send via Bluetooth Serial
  SerialBT.println(jsonString);
  
  Serial.println("Test data sent via Bluetooth!");
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
  
  // Send calibration data via Bluetooth
  if (SerialBT.hasClient()) {
    DynamicJsonDocument calDoc(512);
    calDoc["type"] = "calibration_data";
    calDoc["min"] = sensorMin;
    calDoc["max"] = sensorMax;
    calDoc["range"] = sensorMax - sensorMin;
    
    String calJson;
    serializeJson(calDoc, calJson);
    
    SerialBT.println(calJson);
    Serial.println("Calibration data sent via Bluetooth!");
  } else {
    Serial.println("⚠️ Bluetooth not connected, calibration data not sent");
  }
}

void startTransmission() {
  Serial.println("Starting EMG data transmission...");
  if (!SerialBT.hasClient()) {
    Serial.println("⚠️ Bluetooth not connected!");
    return;
  }
  isTransmitting = true;
  lastDataSend = millis();
  Serial.println("✅ Transmission started!");
}

void stopTransmission() {
  Serial.println("Stopping EMG data transmission...");
  isTransmitting = false;
  Serial.println("✅ Transmission stopped!");
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

