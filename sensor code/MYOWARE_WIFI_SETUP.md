# MyoWare 2.0 WiFi Direct Setup Guide

This guide explains how to set up your MyoWare 2.0 sensor with wireless shield for **direct WiFi connection** without needing an Arduino. The MyoWare Wireless Shield is ESP32-based and can be programmed directly!

## Hardware Requirements

### Essential Components
- **MyoWare 2.0 Muscle Sensor** - Main EMG sensor unit
- **MyoWare Wireless Shield** - ESP32-based WiFi shield (programmable directly!)
- **USB Cable** - For programming and power
- **Biomedical Sensor Pads** - Electrodes for muscle contact

### What You DON'T Need
- ❌ **Arduino Uno/Nano** - Not needed!
- ❌ **Bluetooth modules** - Using WiFi instead
- ❌ **Additional wiring** - Direct programming

## Hardware Setup

### 1. MyoWare 2.0 Assembly
1. **Connect MyoWare 2.0** to the wireless shield
2. **Attach electrodes** to the sensor pads
3. **Connect USB cable** to the wireless shield
4. **Power on** the device

### 2. Pin Connections (Internal)
```
MyoWare 2.0 → Wireless Shield (ESP32)
- VCC → 3.3V
- GND → GND
- OUT → GPIO36 (A0)
```

## Software Setup

### 1. Arduino IDE Configuration
1. **Install Arduino IDE** (latest version)
2. **Install ESP32 board package**:
   - Go to File → Preferences
   - Add this URL: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Go to Tools → Board → Boards Manager
   - Search for "ESP32" and install "ESP32 by Espressif Systems"
3. **Select board**: Tools → Board → ESP32 Dev Module
4. **Select port**: Tools → Port → (your USB port)

### 2. Required Libraries
Install these libraries in Arduino IDE:
- **ArduinoJson** (by Benoit Blanchon)
- **WebSockets** (by Markus Sattler)
- **WebServer** (built-in with ESP32)

### 3. Code Configuration
1. **Open** `myoware_wifi_direct.ino` in Arduino IDE
2. **Update WiFi credentials**:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. **Update local server IP** (optional):
   ```cpp
   const char* ws_host_local = "192.168.1.100"; // Your computer's IP
   ```
4. **Upload code** to the MyoWare Wireless Shield

## Usage Instructions

### 1. First-Time Setup
1. **Power on** the MyoWare device
2. **Wait for WiFi connection** (check Serial Monitor)
3. **Note the IP address** displayed in Serial Monitor
4. **Open web browser** and go to `http://[DEVICE_IP]` for configuration

### 2. Web Configuration Interface
The device provides a web interface for configuration:
- **WiFi Settings**: Change network credentials
- **Server Settings**: Choose local or production server
- **Device Name**: Customize device identifier
- **Status Monitoring**: View connection status
- **Remote Control**: Calibrate, start/stop transmission

### 3. Connecting to Web App
1. **Open the EMG page** in your web browser
2. **Select "WiFi Direct"** mode
3. **Click "Discover Devices"** to find your MyoWare
4. **Select your device** from the discovered list
5. **Wait for connection** confirmation

## Configuration Options

### 1. Server Modes
- **Auto**: Automatically tries local then production
- **Local**: Connects to `ws://[YOUR_IP]:3000`
- **Production**: Connects to `wss://cognitive-care-assistant.vercel.app`

### 2. Device Discovery
The web app automatically scans common IP ranges:
- `192.168.1.100-103`
- `192.168.0.100-103`
- `192.168.254.100-103`

### 3. WebSocket Communication
- **Local**: `ws://[DEVICE_IP]:3000/api/emg/ws`
- **Production**: `wss://cognitive-care-assistant.vercel.app/api/emg/ws`

## Data Flow

```
MyoWare 2.0 → Wireless Shield (ESP32) → WiFi → Web App → EMG Page
```

## Troubleshooting

### Common Issues

#### 1. WiFi Connection Problems
- **Check credentials**: Verify SSID and password
- **Check signal strength**: Move closer to router
- **Check Serial Monitor**: Look for connection errors
- **Restart device**: Power cycle the MyoWare

#### 2. Device Not Discovered
- **Check IP address**: Note the IP from Serial Monitor
- **Check firewall**: Ensure device can be accessed
- **Try manual connection**: Use the device's IP directly
- **Check network**: Ensure device and computer are on same network

#### 3. WebSocket Connection Failed
- **Check server URL**: Verify correct local/production URL
- **Check port**: Ensure port 3000 is accessible
- **Check firewall**: Allow WebSocket connections
- **Try different mode**: Switch between local/production

#### 4. No Data Received
- **Check sensor placement**: Ensure electrodes are properly attached
- **Run calibration**: Use the web interface to calibrate
- **Check Serial Monitor**: Look for data transmission logs
- **Verify connection**: Ensure WebSocket is connected

### Debugging Steps

#### 1. Serial Monitor Debugging
```
Commands to check:
- WiFi status and IP address
- WebSocket connection status
- Data transmission logs
- Error messages
```

#### 2. Web Interface Debugging
- **Go to** `http://[DEVICE_IP]`
- **Check status page** for connection info
- **Use remote controls** to test functionality
- **View calibration data** and settings

#### 3. Network Debugging
- **Ping the device**: `ping [DEVICE_IP]`
- **Check port access**: `telnet [DEVICE_IP] 3000`
- **Verify WebSocket**: Use browser developer tools

## Advanced Configuration

### 1. Custom IP Address
Set a static IP in the Arduino code:
```cpp
IPAddress local_IP(192, 168, 1, 100);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
WiFi.config(local_IP, gateway, subnet);
```

### 2. OTA Updates
Enable Over-The-Air updates:
```cpp
#include <ArduinoOTA.h>
// Add OTA setup code
```

### 3. Custom WebSocket Port
Change the WebSocket port:
```cpp
const int ws_port = 8080; // Custom port
```

### 4. Data Encryption
Add SSL/TLS support for secure connections:
```cpp
// Use wss:// instead of ws://
```

## Performance Optimization

### 1. Sampling Rate
Adjust data transmission frequency:
```cpp
const unsigned long DATA_SEND_INTERVAL = 50; // 20Hz
```

### 2. Data Smoothing
Modify smoothing samples:
```cpp
const int SMOOTHING_SAMPLES = 20; // More smoothing
```

### 3. Buffer Management
Optimize memory usage:
```cpp
// Adjust JSON document sizes
DynamicJsonDocument doc(256); // Smaller for simple messages
```

## Safety Considerations

### Electrical Safety
- **Use proper power supplies** (5V USB)
- **Avoid high voltages** near sensors
- **Check connections** before powering on
- **Disconnect power** when not in use

### Network Security
- **Use secure WiFi** (WPA2/WPA3)
- **Change default passwords**
- **Enable device authentication**
- **Monitor network traffic**

### Data Privacy
- **Local processing** recommended
- **Secure transmission** via HTTPS/WSS
- **User consent** for data collection
- **Data retention policies**

## Success Indicators

### Device Status
- **Serial Monitor**: Shows "WiFi connected" and IP address
- **Web Interface**: Accessible at device IP
- **Status Page**: Shows all green indicators
- **WebSocket**: Connected and transmitting data

### Web App Status
- **Device Discovery**: Shows your MyoWare device
- **Connection**: Green "Connected" indicator
- **Data Flow**: Real-time EMG data updating
- **Calibration**: Min/max values displayed

## Comparison: WiFi vs Bluetooth

| Feature | WiFi Direct | Bluetooth |
|---------|-------------|-----------|
| **Range** | ~100m | ~10m |
| **Speed** | High | Medium |
| **Setup** | Network config | Pairing |
| **Stability** | Very stable | Can drop |
| **Power** | Higher | Lower |
| **Security** | WPA2/WPA3 | Bluetooth security |
| **Multi-device** | Easy | Limited |

## Support and Resources

### Documentation
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)
- [WebSockets Library](https://github.com/Links2004/arduinoWebSockets)
- [ArduinoJson Library](https://arduinojson.org/)
- [MyoWare 2.0 Guide](https://learn.sparkfun.com/tutorials/getting-started-with-the-myoware-20-muscle-sensor-ecosystem)

### Community
- [ESP32 Forum](https://esp32.com/)
- [Arduino Community](https://forum.arduino.cc/)
- [MyoWare Forums](https://forum.sparkfun.com/viewforum.php?f=123)

### Technical Support
- **Hardware issues**: Check MyoWare documentation
- **ESP32 problems**: Consult ESP32 forums
- **WiFi issues**: Check network configuration
- **Web app issues**: Check browser console and network logs

## Troubleshooting Checklist

- [ ] ESP32 board package installed
- [ ] Required libraries installed
- [ ] WiFi credentials correct
- [ ] Device powered on and connected
- [ ] IP address noted from Serial Monitor
- [ ] Web interface accessible
- [ ] Web app can discover device
- [ ] WebSocket connection established
- [ ] Calibration completed
- [ ] Data flowing in real-time

## Quick Start Summary

1. **Connect MyoWare 2.0** to wireless shield
2. **Install ESP32** board package in Arduino IDE
3. **Upload code** with your WiFi credentials
4. **Note IP address** from Serial Monitor
5. **Open web app** and select "WiFi Direct"
6. **Click "Discover Devices"** and select your device
7. **Start using** real-time EMG monitoring!

This WiFi-only solution eliminates the need for an Arduino and provides a more robust, long-range connection for your MyoWare 2.0 sensor! 🚀📡
