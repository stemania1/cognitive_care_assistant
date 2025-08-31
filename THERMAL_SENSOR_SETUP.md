# AMG8833 Thermal Sensor Setup Guide

This guide explains how to set up the AMG8833 thermal sensor with a Raspberry Pi and connect it to the Cognitive Care Assistant web application.

## Hardware Requirements

- **Raspberry Pi** (3B+, 4B, or newer recommended)
- **AMG8833 Thermal Sensor Module**
- **Jumper wires** (4 wires)
- **Breadboard** (optional, for prototyping)

## Hardware Connection

### AMG8833 Pinout
```
VCC   → 3.3V (Pin 1 or 17)
GND   → Ground (Pin 6, 9, 14, 20, 25, 30, 34, or 39)
SDA   → GPIO 2 (Pin 3) - I2C Data
SCL   → GPIO 3 (Pin 5) - I2C Clock
```

### Connection Diagram
```
Raspberry Pi          AMG8833
┌─────────────┐      ┌─────────────┐
│ 3.3V (Pin1)├──────┤ VCC         │
│ GND (Pin6) ├──────┤ GND         │
│ SDA (Pin3) ├──────┤ SDA         │
│ SCL (Pin5) ├──────┤ SCL         │
└─────────────┘      └─────────────┘
```

## Software Setup on Raspberry Pi

### 1. Enable I2C Interface
```bash
# Open Raspberry Pi configuration
sudo raspi-config

# Navigate to: Interface Options → I2C → Enable
# Reboot the Raspberry Pi
sudo reboot
```

### 2. Install Dependencies
```bash
# Update package list
sudo apt update

# Install Python packages
sudo apt install python3-pip python3-dev

# Install required Python libraries
pip3 install -r requirements.txt

# Verify I2C is working
sudo i2cdetect -y 1
```

### 3. Test Sensor Connection
```bash
# Check if AMG8833 is detected (should show address 0x69)
sudo i2cdetect -y 1

# Expected output:
#      0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
# 00:          -- -- -- -- -- -- -- -- -- -- -- -- -- 
# 10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
# 20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
# 30: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
# 40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
# 50: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
# 60: -- -- -- -- -- -- -- -- 69 -- -- -- -- -- -- -- 
# 70: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
```

## Running the Thermal Sensor Server

### 1. Start the Server
```bash
# Navigate to the script directory
cd /path/to/your/project

# Run the thermal sensor server
python3 raspberry_pi_thermal_server.py
```

### 2. Expected Output
```
AMG8833 Thermal Sensor Server
========================================
AMG8833 sensor initialized successfully
WebSocket server started on port 8090
WebSocket URL: ws://localhost:8090
```

### 3. Test the Connection
```bash
# Test HTTP endpoint
curl http://localhost:8090/thermal-data

# Expected response:
# {
#   "timestamp": 1703123456789,
#   "data": [[25.1, 25.3, ...], ...],
#   "thermistor": 25.0
# }
```

## Network Configuration

### 1. Find Raspberry Pi IP Address
```bash
# Get local IP address
hostname -I

# Example output: 192.168.1.100
```

### 2. Configure Firewall (if needed)
```bash
# Allow incoming connections on port 8090
sudo ufw allow 8090
```

### 3. Test Network Connectivity
```bash
# From your computer, test connection to Raspberry Pi
ping 192.168.1.100

# Test port connectivity
telnet 192.168.1.100 8090
```

## Web Application Integration

### 1. Update Web App Configuration
In your web application, update the connection URL to use the Raspberry Pi's IP address:

```javascript
// Instead of localhost, use the Raspberry Pi's IP
const ws = new WebSocket("ws://192.168.1.100:8090");
// or
const response = await fetch("http://192.168.1.100:8090/thermal-data");
```

### 2. CORS Configuration
The server includes CORS headers for cross-origin requests. If you encounter CORS issues, ensure your web application is accessing the correct endpoint.

## Troubleshooting

### Common Issues

#### 1. Sensor Not Detected
```bash
# Check I2C bus
sudo i2cdetect -y 1

# Verify connections
# Check for loose wires
# Ensure 3.3V power supply
```

#### 2. Permission Denied
```bash
# Add user to i2c group
sudo usermod -a -G i2c $USER

# Log out and back in, or reboot
sudo reboot
```

#### 3. Port Already in Use
```bash
# Check what's using port 8090
sudo netstat -tulpn | grep 8090

# Kill process if needed
sudo kill -9 <PID>
```

#### 4. Connection Refused
```bash
# Check if server is running
ps aux | grep python3

# Check firewall settings
sudo ufw status

# Verify network connectivity
ping <raspberry_pi_ip>
```

### Debug Mode
Enable debug logging by modifying the Python script:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Performance Optimization

### 1. Update Frequency
- **WebSocket**: Updates every 500ms (2 FPS)
- **HTTP**: Updates on request
- Adjust timing in the script for your needs

### 2. Data Resolution
- AMG8833 provides 8×8 pixel resolution
- Each pixel represents ~1cm² at typical distances
- Temperature range: -20°C to +80°C
- Accuracy: ±2.5°C

### 3. Network Optimization
- Use WebSocket for real-time updates
- HTTP fallback for compatibility
- Consider local network for best performance

## Advanced Features

### 1. Custom Temperature Ranges
Modify the temperature constants in the web application:
```javascript
const MIN_TEMP = 15; // Celsius
const MAX_TEMP = 85; // Celsius
```

### 2. Data Logging
Add data logging to the Raspberry Pi:
```python
import json
import datetime

# Log thermal data to file
with open(f"thermal_log_{datetime.date.today()}.json", "a") as f:
    json.dump(response_data, f)
    f.write("\n")
```

### 3. Multiple Sensors
Support multiple AMG8833 sensors by modifying the I2C addresses and data handling.

## Security Considerations

### 1. Network Security
- Only expose port 8090 on local network
- Use firewall rules to restrict access
- Consider VPN for remote access

### 2. Data Privacy
- Thermal data may reveal personal information
- Implement user authentication if needed
- Log access attempts

## Support and Resources

### Documentation
- [AMG8833 Datasheet](https://www.panasonic-electric-works.com/cps/rde/xbcr/pew_eu_en/amg8833.pdf)
- [Raspberry Pi I2C Guide](https://www.raspberrypi.org/documentation/hardware/raspberrypi/i2c/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)

### Community
- Raspberry Pi Forums
- Stack Overflow
- GitHub Issues

---

**Note**: This setup provides real-time thermal imaging capabilities. Ensure compliance with local privacy laws and regulations when using thermal sensors.


