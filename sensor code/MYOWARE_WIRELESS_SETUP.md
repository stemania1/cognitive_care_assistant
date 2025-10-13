# MyoWare 2.0 Wireless Integration Setup Guide

This guide explains how to set up your MyoWare 2.0 sensor with wireless shield to connect to the Cognitive Care Assistant application.

## Hardware Requirements

### Essential Components
- **MyoWare 2.0 Muscle Sensor** - Main EMG sensor unit
- **MyoWare Wireless Shield** - Bluetooth communication shield
- **Arduino Uno/Nano/ESP32** - Microcontroller for data processing
- **Biomedical Sensor Pads** - Electrodes for muscle contact
- **Power Supply** - 5V for stable operation

### Optional Components
- **USB Cable** - For programming and power
- **Breadboard** - For prototyping (if needed)
- **Jumper Wires** - For connections

## Hardware Setup

### 1. MyoWare 2.0 Assembly
1. **Solder MyoWare 2.0** to the wireless shield following the manufacturer's instructions
2. **Attach electrodes** to the sensor pads
3. **Connect to Arduino** using the provided pins

### 2. Arduino Connections
```
MyoWare 2.0 Wireless Shield → Arduino
- VCC → 5V
- GND → GND
- OUT → A0 (analog pin)
- TX → Pin 2 (for SoftwareSerial)
- RX → Pin 3 (for SoftwareSerial)
```

### 3. Power and Programming
1. **Connect USB cable** to Arduino for programming
2. **Upload the client code** (`myoware_wireless_client.ino`)
3. **Power the system** with 5V supply

## Software Setup

### 1. Arduino IDE Configuration
1. **Install Arduino IDE** (latest version)
2. **Install required libraries**:
   - SoftwareSerial (built-in)
3. **Upload the client code** to your Arduino
4. **Open Serial Monitor** to view connection status

### 2. Web Application Setup
The web application automatically detects whether you're running locally or in production:

- **Localhost**: `http://localhost:3000`
- **Production**: `https://cognitive-care-assistant.vercel.app`

### 3. Bluetooth Pairing
1. **Power on the Arduino** with MyoWare wireless shield
2. **Wait for Bluetooth** to become discoverable
3. **Pair with your computer** (the web app handles the connection)

## Usage Instructions

### 1. Starting the System
1. **Power on Arduino** with MyoWare sensor
2. **Open the EMG page** in your web browser
3. **Click "Connect"** in the MyoWare Client section
4. **Wait for connection** confirmation

### 2. Calibration Process
1. **Click "Calibrate"** in the MyoWare Client section
2. **Contract and relax** your muscle for 10 seconds
3. **Wait for calibration** to complete
4. **Check calibration data** in the client interface

### 3. Starting a Workout
1. **Select a workout** from the workout list
2. **Ensure MyoWare is connected** (blue indicator)
3. **Click "Start Workout"** to begin
4. **Monitor real-time data** in the EMG visualization

## Data Flow

```
MyoWare 2.0 → Wireless Shield → Arduino → Bluetooth → Web App → EMG Page
```

## Troubleshooting

### Common Issues

#### 1. Connection Problems
- **Check power supply** - Ensure 5V stable power
- **Verify Bluetooth pairing** - Check computer Bluetooth settings
- **Restart Arduino** - Power cycle the device
- **Check serial monitor** - Look for error messages

#### 2. No Data Received
- **Verify sensor placement** - Ensure electrodes are properly attached
- **Check calibration** - Run calibration process
- **Test sensor** - Use serial monitor to check raw values
- **Check connections** - Verify all wiring

#### 3. Web App Not Connecting
- **Check server URL** - Ensure correct localhost/production URL
- **Verify WebSocket** - Check browser console for errors
- **Try reconnecting** - Click disconnect then connect again
- **Check firewall** - Ensure WebSocket connections are allowed

#### 4. Data Quality Issues
- **Clean skin** - Ensure clean contact where electrodes attach
- **Adjust gain** - Use potentiometer on MyoWare 2.0 if available
- **Check placement** - Position electrodes on muscle belly
- **Recalibrate** - Run calibration process again

### Debugging Steps

#### 1. Arduino Serial Monitor
```
Commands to try:
- CONNECT_LOCAL - Connect to localhost
- CONNECT_PROD - Connect to production
- CALIBRATE - Start calibration
- START - Begin data transmission
- STOP - Stop data transmission
- STATUS - Show connection status
```

#### 2. Browser Console
- **Open Developer Tools** (F12)
- **Check Console tab** for error messages
- **Look for WebSocket** connection logs
- **Check Network tab** for failed requests

#### 3. Connection Status
- **Green indicator** - Connected and receiving data
- **Yellow indicator** - Connected but no data
- **Red indicator** - Disconnected
- **Blue indicator** - Real MyoWare data active

## Configuration Options

### 1. Server URLs
The system automatically detects the environment:
- **Development**: `ws://localhost:3000`
- **Production**: `wss://cognitive-care-assistant.vercel.app`

### 2. Data Transmission
- **Sampling Rate**: 10Hz (100ms intervals)
- **Data Format**: JSON with timestamp and sensor values
- **Smoothing**: 10-sample moving average
- **Calibration**: Automatic min/max detection

### 3. Workout Integration
- **Real-time monitoring** during workouts
- **Data recording** for session analysis
- **Calibration support** for accurate readings
- **Visual feedback** with progress indicators

## Safety Considerations

### Electrical Safety
- **Use proper power supplies** (5V, regulated)
- **Avoid high voltages** near sensors
- **Check connections** before powering on
- **Disconnect power** when not in use

### Skin Contact
- **Clean skin** before electrode placement
- **Use medical-grade electrodes** when possible
- **Avoid broken or irritated skin**
- **Remove electrodes** after use

### Data Privacy
- **Local processing** recommended for sensitive data
- **Secure transmission** via WebSocket
- **User consent** for data collection
- **Data retention policies** clearly defined

## Advanced Configuration

### 1. Custom Server URLs
Modify the Arduino code to use custom server URLs:
```cpp
String serverUrl = "ws://your-custom-server.com/api/emg/ws";
```

### 2. Sampling Rate Adjustment
Change the data transmission interval:
```cpp
const unsigned long DATA_SEND_INTERVAL = 50; // 20Hz sampling
```

### 3. Data Smoothing
Adjust the smoothing samples:
```cpp
const int SMOOTHING_SAMPLES = 20; // More smoothing
```

## Support and Resources

### Documentation
- [MyoWare 2.0 Official Guide](https://learn.sparkfun.com/tutorials/getting-started-with-the-myoware-20-muscle-sensor-ecosystem)
- [MyoWare Wireless Shield Guide](https://www.sparkfun.com/products/retired/13911)
- [Arduino SoftwareSerial Reference](https://www.arduino.cc/reference/en/language/functions/communication/software-serial/)

### Community
- [MyoWare Forums](https://forum.sparkfun.com/viewforum.php?f=123)
- [Arduino Community](https://forum.arduino.cc/)
- [EMG Research Groups](https://www.researchgate.net/topic/Electromyography)

### Technical Support
- **Hardware issues**: Contact MyoWare support
- **Software problems**: Check Arduino IDE and code
- **Integration help**: Review this guide and examples
- **Web app issues**: Check browser console and network logs

## Troubleshooting Checklist

- [ ] Arduino powered on and programmed
- [ ] MyoWare sensor properly connected
- [ ] Electrodes attached to clean skin
- [ ] Bluetooth pairing successful
- [ ] Web app loaded and connected
- [ ] Calibration completed
- [ ] Workout selected and started
- [ ] Data flowing in real-time

## Success Indicators

- **Arduino Serial Monitor**: Shows "Connected to WebSocket server"
- **Web App**: Blue "Real MyoWare Data" indicator active
- **EMG Visualization**: Real-time data updating
- **Workout Interface**: Data recording during exercises
- **Calibration**: Min/max values displayed in client interface
