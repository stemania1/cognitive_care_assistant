# MyoWare 2.0 EMG Sensor Integration Guide

This guide explains how to integrate MyoWare 2.0 muscle sensors with the Cognitive Care Assistant EMG workout page.

## Hardware Requirements

### Essential Components
- **MyoWare 2.0 Muscle Sensor** - Main EMG sensor unit
- **Link Shield** - Solderless connection shield for MyoWare 2.0
- **Arduino Shield** - Connects up to 6 MyoWare 2.0 sensors to Arduino
- **Arduino Uno/Nano/ESP32** - Microcontroller for data processing
- **Biomedical Sensor Pads** - Electrodes for muscle contact
- **3.5mm TRS Cables** - Connect Link Shield to Arduino Shield

### Optional Components
- **Wireless Shield** - For Bluetooth data transmission
- **Multiple Arduino Boards** - For more than 6 sensors
- **Power Supply** - 5V for stable operation

## Hardware Setup

### 1. MyoWare 2.0 Assembly
1. **Solder Link Shield** to MyoWare 2.0 sensor
2. **Attach electrodes** to the sensor pads
3. **Connect 3.5mm TRS cable** from Link Shield to Arduino Shield

### 2. Arduino Shield Connection
1. **Mount Arduino Shield** on Arduino board
2. **Connect TRS cables** from each MyoWare 2.0 to shield ports
3. **Power the system** with 5V supply

### 3. Sensor Placement
- **Biceps**: Place electrodes on bicep muscle belly
- **Triceps**: Place electrodes on tricep muscle
- **Forearms**: Place electrodes on forearm flexors
- **Quads**: Place electrodes on quadriceps muscle
- **Hamstrings**: Place electrodes on hamstring muscle
- **Calves**: Place electrodes on calf muscle

## Software Setup

### 1. Arduino IDE Setup
1. **Install Arduino IDE** (latest version)
2. **Upload the provided code** (`myoware_2_0_arduino_code.ino`)
3. **Set baud rate** to 115200
4. **Open Serial Monitor** to view data

### 2. Web Application Integration
The EMG workout page is already configured for MyoWare 2.0:

- **Raw Data Range**: 0-1023 (Arduino analog input)
- **Voltage Range**: 0-5V
- **Sampling Rate**: 10Hz (100ms intervals)
- **Data Format**: JSON with timestamp and sensor values

### 3. Data Flow
```
MyoWare 2.0 → Link Shield → Arduino Shield → Arduino → Serial → Web App
```

## Calibration Process

### 1. Automatic Calibration
1. **Connect sensors** to Arduino
2. **Open Serial Monitor**
3. **Send "CALIBRATE" command**
4. **Contract and relax muscles** for 10 seconds
5. **Calibration complete** - min/max values stored

### 2. Manual Calibration
- **Min Value**: Resting muscle state (typically 400-500)
- **Max Value**: Maximum contraction (typically 600-800)
- **Range**: Should be at least 100 points for good sensitivity

## Data Format

### Raw Arduino Output
```json
{
  "timestamp": 12345,
  "leftBicep": 450,
  "rightBicep": 520,
  "leftTricep": 480,
  "rightTricep": 510,
  "leftForearm": 460,
  "rightForearm": 490
}
```

### Processed Web App Data
```json
{
  "timestamp": 12345,
  "leftBicep": 450,
  "leftBicepProcessed": 25.5,
  "rightBicep": 520,
  "rightBicepProcessed": 60.0,
  // ... other sensors
}
```

## Troubleshooting

### Common Issues

#### 1. No Data Received
- **Check connections** between shields and Arduino
- **Verify baud rate** is set to 115200
- **Ensure electrodes** are properly attached to skin
- **Check power supply** (5V recommended)

#### 2. Erratic Readings
- **Clean skin** where electrodes attach
- **Use conductive gel** for better contact
- **Check electrode placement** on muscle belly
- **Calibrate sensors** properly

#### 3. Low Signal Strength
- **Adjust gain potentiometer** on MyoWare 2.0
- **Check electrode contact** quality
- **Verify muscle placement** is correct
- **Increase sampling rate** if needed

#### 4. Web App Not Receiving Data
- **Check serial connection** to computer
- **Verify data format** matches expected JSON
- **Ensure proper baud rate** configuration
- **Check for data transmission** in Serial Monitor

### Calibration Tips
- **Relax completely** for minimum values
- **Contract maximally** for maximum values
- **Repeat calibration** if readings seem off
- **Test with known movements** to verify accuracy

## Advanced Configuration

### Multiple Arduino Setup
For more than 6 sensors:
1. **Use multiple Arduino boards**
2. **Assign different sensor groups** to each board
3. **Combine data streams** in web application
4. **Synchronize timestamps** across boards

### Wireless Integration
Using Wireless Shield:
1. **Pair Bluetooth** with computer
2. **Modify Arduino code** for wireless transmission
3. **Update web app** to receive Bluetooth data
4. **Handle connection drops** gracefully

### Custom Sensor Mapping
Modify the sensor pin assignments in Arduino code:
```cpp
const int SENSOR_PINS[] = {A0, A1, A2, A3, A4, A5};
const String SENSOR_NAMES[] = {
  "leftBicep", "rightBicep", "leftTricep", 
  "rightTricep", "leftForearm", "rightForearm"
};
```

## Performance Optimization

### Sampling Rate
- **10Hz (100ms)**: Good for general use
- **20Hz (50ms)**: Better for detailed analysis
- **50Hz (20ms)**: High-resolution monitoring

### Data Smoothing
- **10 samples**: Good balance of responsiveness and stability
- **20 samples**: Smoother but less responsive
- **5 samples**: More responsive but potentially noisy

### Power Management
- **5V supply**: Recommended for stable operation
- **Battery backup**: For portable use
- **Low power mode**: Reduce sampling when idle

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
- **Secure transmission** if using wireless
- **User consent** for data collection
- **Data retention policies** clearly defined

## Support and Resources

### Documentation
- [MyoWare 2.0 Official Guide](https://learn.sparkfun.com/tutorials/getting-started-with-the-myoware-20-muscle-sensor-ecosystem)
- [Arduino Reference](https://www.arduino.cc/reference/)
- [EMG Signal Processing](https://en.wikipedia.org/wiki/Electromyography)

### Community
- [MyoWare Forums](https://forum.sparkfun.com/viewforum.php?f=123)
- [Arduino Community](https://forum.arduino.cc/)
- [EMG Research Groups](https://www.researchgate.net/topic/Electromyography)

### Technical Support
- **Hardware issues**: Contact MyoWare support
- **Software problems**: Check Arduino IDE and code
- **Integration help**: Review this guide and examples
