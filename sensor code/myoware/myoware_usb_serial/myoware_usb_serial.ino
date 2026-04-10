/*
 * MyoWare 2.0 USB Serial Sender
 * 
 * Reads EMG data from the MyoWare sensor and sends it over USB serial
 * as JSON lines — no WiFi needed. The PC runs usb-serial-emg-receiver.js
 * to read this data and forward it to the CCA app.
 *
 * Also listens for JSON commands on serial (e.g. WiFi provisioning).
 *
 * Hardware: MyoWare 2.0 + MyoWare Wireless Shield (ESP32)
 * Baud: 115200
 *
 * Data format (one JSON object per line):
 *   {"type":"emg_data","timestamp":12345,"muscleActivity":1024,"muscleActivityProcessed":0.25,"voltage":0.82,"calibrated":false}
 *   {"type":"calibration_data","min":100,"max":3500,"range":3400,"timestamp":12345}
 */

#include <ArduinoJson.h>

#ifdef ESP32
  #include <WiFi.h>
#endif

const int SENSOR_PIN = 39;

int sensorMin = 4095;
int sensorMax = 0;
bool isCalibrated = false;
bool isTransmitting = true;

const int SMOOTHING_SAMPLES = 10;
int sensorReadings[SMOOTHING_SAMPLES];
int readingIndex = 0;
int sensorTotal = 0;

unsigned long lastDataSend = 0;
const unsigned long DATA_SEND_INTERVAL = 100; // 10Hz

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < SMOOTHING_SAMPLES; i++) {
    sensorReadings[i] = 0;
  }

#ifdef ESP32
  analogSetAttenuation(ADC_11db);
  analogSetWidth(12);
#endif

  delay(500);
  Serial.println("{\"type\":\"status\",\"msg\":\"MyoWare USB Serial ready\"}");
}

void loop() {
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    handleSerialInput(line);
  }

  if (isTransmitting && millis() - lastDataSend >= DATA_SEND_INTERVAL) {
    lastDataSend = millis();
    sendEMGData();
  }
}

int readSmoothed() {
  sensorTotal -= sensorReadings[readingIndex];
  sensorReadings[readingIndex] = analogRead(SENSOR_PIN);
  sensorTotal += sensorReadings[readingIndex];
  readingIndex = (readingIndex + 1) % SMOOTHING_SAMPLES;
  return sensorTotal / SMOOTHING_SAMPLES;
}

void sendEMGData() {
  int smoothedValue = readSmoothed();
  float voltage = (smoothedValue * 3.3) / 4095.0;

  if (isCalibrated) {
    sensorMin = min(sensorMin, smoothedValue);
    sensorMax = max(sensorMax, smoothedValue);
  }

  float activation = 0.0;
  if (isCalibrated && sensorMax > sensorMin) {
    activation = (float)(smoothedValue - sensorMin) / (float)(sensorMax - sensorMin);
    activation = constrain(activation, 0.0, 1.0);
  }

  DynamicJsonDocument doc(512);
  doc["type"] = "emg_data";
  doc["timestamp"] = millis();
  doc["muscleActivity"] = smoothedValue;
  doc["muscleActivityProcessed"] = activation;
  doc["voltage"] = voltage;
  doc["calibrated"] = isCalibrated;

  serializeJson(doc, Serial);
  Serial.println();
}

void calibrate() {
  sensorMin = 4095;
  sensorMax = 0;
  isCalibrated = true;

  for (int i = 0; i < 50; i++) {
    int val = analogRead(SENSOR_PIN);
    sensorMin = min(sensorMin, val);
    sensorMax = max(sensorMax, val);
    delay(20);
  }

  DynamicJsonDocument doc(256);
  doc["type"] = "calibration_data";
  doc["min"] = sensorMin;
  doc["max"] = sensorMax;
  doc["range"] = sensorMax - sensorMin;
  doc["timestamp"] = millis();
  serializeJson(doc, Serial);
  Serial.println();
}

void handleSerialInput(String line) {
  if (line.length() == 0) return;

  // Simple single-char commands
  if (line == "1") { isTransmitting = true; return; }
  if (line == "2") { isTransmitting = false; return; }
  if (line == "3") { calibrate(); return; }

  // JSON commands (for WiFi provisioning from sensor-setup.py or the app)
  if (line.startsWith("{")) {
    DynamicJsonDocument cmd(512);
    DeserializationError err = deserializeJson(cmd, line);
    if (err) return;

    const char* cmdType = cmd["cmd"];
    if (!cmdType) return;

    if (strcmp(cmdType, "wifi_config") == 0) {
#ifdef ESP32
      const char* ssid = cmd["ssid"];
      const char* password = cmd["password"];
      if (ssid) {
        WiFi.begin(ssid, password);
        unsigned long start = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
          delay(500);
        }
        DynamicJsonDocument resp(256);
        resp["cmd"] = "wifi_config";
        if (WiFi.status() == WL_CONNECTED) {
          resp["ok"] = true;
          resp["msg"] = "Connected to " + String(ssid);
          resp["ip"] = WiFi.localIP().toString();
        } else {
          resp["ok"] = false;
          resp["msg"] = "Failed to connect to " + String(ssid);
        }
        serializeJson(resp, Serial);
        Serial.println();
      }
#else
      DynamicJsonDocument resp(128);
      resp["cmd"] = "wifi_config";
      resp["ok"] = false;
      resp["msg"] = "WiFi not supported on this board";
      serializeJson(resp, Serial);
      Serial.println();
#endif
    } else if (strcmp(cmdType, "ping") == 0) {
      Serial.println("{\"cmd\":\"ping\",\"ok\":true,\"msg\":\"pong\"}");
    }
  }
}
