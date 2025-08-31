# AMG8833 Thermal Sensor Setup Guide

This guide will help you connect your AMG8833 thermal sensor (connected to a Raspberry Pi) to your Cognitive Care Assistant website.

## 🍓 Raspberry Pi Setup

### 1. Hardware Requirements
- Raspberry Pi (3B+, 4, or newer)
- AMG8833 thermal sensor
- I2C connection (SDA/SCL pins)
- Power supply
- Network connection (WiFi or Ethernet)

### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python dependencies
sudo apt install python3-pip python3-dev python3-venv
sudo apt install python3-smbus i2c-tools

# Enable I2C
sudo raspi-config
# Navigate to: Interface Options > I2C > Enable

# Install Python packages
pip3 install websockets numpy
```

### 3. Connect AMG8833 Sensor
```
AMG8833 Pin -> Raspberry Pi Pin
VCC        -> 3.3V (Pin 1)
GND        -> GND (Pin 6)
SDA        -> GPIO 2 (Pin 3)
SCL        -> GPIO 3 (Pin 5)
```

### 4. Test I2C Connection
```bash
# Check if sensor is detected
sudo i2cdetect -y 1

# You should see the AMG8833 at address 0x69
```

### 5. Run the Thermal Server
```bash
# Navigate to your project directory
cd /path/to/your/project

# Run the server
python3 raspberry_pi_thermal_server.py

# The server will start on port 8091
# You should see: "Starting HTTP server on port 8091..."
```

## 🌐 Website Integration

### 1. Update Configuration
Edit `src/app/config/sensor-config.ts`:
```typescript
export const SENSOR_CONFIG = {
  // Update this to your Raspberry Pi's IP address
  RASPBERRY_PI_IP: '192.168.1.100', // CHANGE THIS!
  
  // Keep these default values
  HTTP_PORT: 8091,
  WEBSOCKET_PORT: 8091,
  // ... rest of config
};
```

### 2. Find Your Raspberry Pi's IP Address
On your Raspberry Pi, run:
```bash
hostname -I
# or
ip addr show wlan0  # for WiFi
ip addr show eth0   # for Ethernet
```

### 3. Test the Connection
1. Make sure your Raspberry Pi server is running
2. Update the IP address in the config file
3. Start your Next.js development server
4. Navigate to the Sleep Behaviors page
5. Click "Start Camera" to test the connection

## 🔧 Troubleshooting

### Common Issues

#### 1. "Connection Failed" Error
- Check if Raspberry Pi server is running
- Verify IP address is correct
- Ensure both devices are on the same network
- Check firewall settings

#### 2. "Sensor Not Detected" Error
- Verify I2C is enabled: `sudo raspi-config`
- Check physical connections
- Run: `sudo i2cdetect -y 1`
- Ensure proper power supply

#### 3. WebSocket Connection Issues
- Check if port 8091 is accessible
- Try HTTP polling instead (automatic fallback)
- Check network connectivity

### Debug Commands
```bash
# Check I2C devices
sudo i2cdetect -y 1

# Check server logs
python3 raspberry_pi_thermal_server.py

# Test HTTP endpoint
curl http://YOUR_PI_IP:8091/thermal-data

# Check network connectivity
ping YOUR_PI_IP
```

## 📱 Features

### Real-time Thermal Visualization
- 8x8 thermal grid display
- Color-coded temperature mapping
- Live temperature updates
- Connection status monitoring

### Data Recording
- Session recording with timestamps
- Temperature statistics
- Data export capabilities
- Historical data storage

### Fallback Support
- WebSocket for real-time updates
- HTTP polling as backup
- Automatic reconnection
- Error handling and logging

## 🚀 Next Steps

1. **Customize the visualization** - Modify colors, grid size, update frequency
2. **Add data logging** - Store thermal data in a database
3. **Create alerts** - Set temperature thresholds for notifications
4. **Export data** - Add CSV/JSON export functionality
5. **Mobile optimization** - Make the interface mobile-friendly

## 📞 Support

If you encounter issues:
1. Check the console logs in your browser
2. Verify Raspberry Pi server logs
3. Test network connectivity
4. Ensure all dependencies are installed

The system includes comprehensive error handling and will guide you through the setup process with helpful messages.


