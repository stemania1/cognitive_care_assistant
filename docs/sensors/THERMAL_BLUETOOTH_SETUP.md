# Thermal Sensor Bluetooth Setup Guide

This guide shows how to connect the AMG8833 thermal sensor via Bluetooth for reliable demos without WiFi.

## Overview

The Bluetooth setup consists of:
1. **Python script on Raspberry Pi** - Reads thermal data and sends via Bluetooth Serial
2. **Node.js receiver on your computer** - Receives Bluetooth data and forwards to Next.js API
3. **Next.js API endpoint** - Stores and serves thermal data from Bluetooth source

```
AMG8833 → Raspberry Pi (Python) → Bluetooth Serial → Computer (Node.js) → Next.js API → Web App
```

---

## Prerequisites

### On Raspberry Pi:
- Python 3 installed
- AMG8833 sensor libraries: `adafruit-blinka`, `adafruit-circuitpython-amg88xx`
- Bluetooth libraries: `pybluez`
- Bluetooth enabled and working

### On Your Computer:
- Node.js installed
- Serial port library: `serialport`, `@serialport/parser-readline` (already installed)
- Next.js app running locally

---

## Step 1: Install Dependencies on Raspberry Pi

### 1.1 Install Bluetooth Libraries

```bash
# On Raspberry Pi
sudo apt update
sudo apt install python3-bluetooth python3-pip python3-dev libbluetooth-dev

# For newer Raspberry Pi OS (externally-managed-environment error):
# Option 1: Use --break-system-packages flag (for system scripts)
pip3 install pybluez --break-system-packages

# Option 2: Install to user directory (recommended)
pip3 install --user pybluez

# Option 3: Use apt if available (but pybluez may not be in repos)
# sudo apt install python3-pybluez  # Try this first
```

### 1.2 Verify AMG8833 Libraries

```bash
# Check if already installed
python3 -c "import adafruit_amg88xx; print('✅ AMG8833 libraries installed')"

# If not installed:
pip3 install adafruit-blinka adafruit-circuitpython-amg88xx
```

### 1.3 Enable Bluetooth (if not already enabled)

```bash
# Check Bluetooth status
sudo systemctl status bluetooth

# Enable if needed
sudo systemctl enable bluetooth
sudo systemctl start bluetooth

# Check if Bluetooth adapter is visible
hciconfig
```

---

## Step 2: Copy Script to Raspberry Pi

### 2.1 Copy the Bluetooth Sender Script

The script is located at:
```
sensor code/thermal_sensor/bluetooth-thermal-sender.py
```

Copy it to your Raspberry Pi (via SCP, USB drive, or git):

```bash
# From your computer
scp "sensor code/thermal_sensor/bluetooth-thermal-sender.py" pi@192.168.254.200:/home/pi/

# Or use git if your repo is on the Pi
```

### 2.2 Make Script Executable

```bash
# On Raspberry Pi
chmod +x bluetooth-thermal-sender.py
```

---

## Step 3: Pair Raspberry Pi with Your Computer

### 3.1 On Raspberry Pi (Make Pi Discoverable)

```bash
# Make Bluetooth discoverable
sudo bluetoothctl
[bluetooth]# power on
[bluetooth]# discoverable on
[bluetooth]# pairable on
[bluetooth]# exit
```

### 3.2 On Your Computer (Pair with Pi)

**Windows:**
1. Open Settings → Bluetooth & devices
2. Click "Add device"
3. Look for "raspberrypi" or your Pi's hostname
4. Click "Pair"
5. Note the COM port assigned (check Device Manager → Ports)

**Mac:**
1. System Preferences → Bluetooth
2. Find "raspberrypi" and click "Pair"
3. Note the device path (usually `/dev/tty.Bluetooth-Incoming-Port`)

**Linux:**
```bash
# Scan for devices
bluetoothctl scan on

# Pair with Pi (replace MAC address)
bluetoothctl pair <MAC_ADDRESS>
bluetoothctl trust <MAC_ADDRESS>
bluetoothctl connect <MAC_ADDRESS>
```

---

## Step 4: Run the Bluetooth Sender (On Raspberry Pi)

```bash
# On Raspberry Pi
cd /home/pi
python3 bluetooth-thermal-sender.py
```

You should see:
```
✅ AMG8833 sensor initialized
🔵 Bluetooth server started on RFCOMM channel X
📡 Waiting for connection from computer...
```

**Keep this running** - it will wait for your computer to connect.

---

## Step 5: Run the Bluetooth Receiver (On Your Computer)

### 5.1 Find the COM Port

**Windows:**
- Open Device Manager → Ports (COM & LPT)
- Look for "Standard Serial over Bluetooth link" (e.g., COM9)

**Mac/Linux:**
- Usually `/dev/tty.Bluetooth-Incoming-Port` or `/dev/rfcomm0`

### 5.2 Start Next.js App (if not already running)

```bash
npm run dev
```

### 5.3 Run the Bluetooth Receiver

```bash
# Windows
node bluetooth-thermal-receiver.js COM9

# Mac/Linux
node bluetooth-thermal-receiver.js /dev/tty.Bluetooth-Incoming-Port
```

(Replace COM9 with your actual COM port)

You should see:
```
🔵 Bluetooth Thermal Receiver for AMG8833
==========================================
📡 Serial Port: COM9
🌐 Forwarding to: http://localhost:3000/api/thermal/bt

✅ Bluetooth Serial port opened successfully!
📥 Waiting for thermal data from Raspberry Pi...
```

### 5.4 Verify Connection

Once both scripts are running, you should see:
- **On Raspberry Pi:** `✅ Connected to <ADDRESS>`
- **On Computer:** `📥 Received thermal data: { avgTemp: 'XX.X°C', ... }`
- **On Computer:** `✅ Forwarded to Next.js API`

---

## Step 6: Test in Web App

1. Open http://localhost:3000 in your browser
2. Navigate to "Sleep Behaviors" page
3. Click "Start Sensor"
4. You should see thermal data appearing in real-time

The app automatically checks the Bluetooth data source first, then falls back to WiFi if Bluetooth is not available.

---

## Troubleshooting

### Raspberry Pi Script Won't Start

**Error: "AMG8833 dependencies missing"**
```bash
pip3 install adafruit-blinka adafruit-circuitpython-amg88xx
```

**Error: "Bluetooth library not found"**
```bash
sudo apt install python3-bluetooth
# For newer Raspberry Pi OS (externally-managed-environment):
pip3 install pybluez --break-system-packages
# Or:
pip3 install --user pybluez
```

**Error: "Bluetooth initialization failed"**
```bash
# Check Bluetooth is enabled
sudo systemctl status bluetooth

# Enable if needed
sudo systemctl enable bluetooth
sudo systemctl start bluetooth
```

### Computer Can't Connect

**Error: "Serial port error: Access is denied"**
- Close any other programs using the COM port
- Check Device Manager for port conflicts
- Try a different COM port
- Restart Bluetooth on your computer

**Error: "Cannot open serial port"**
- Verify pairing: Is Raspberry Pi connected in Bluetooth settings?
- Check COM port: Is it correct in Device Manager?
- Try re-pairing the devices

### No Data Received

**Raspberry Pi shows "Waiting for connection"**
- Make sure `bluetooth-thermal-receiver.js` is running
- Check pairing status on your computer
- Verify COM port is correct

**Computer shows "Waiting for thermal data"**
- Check Raspberry Pi script is running and shows "Connected"
- Verify sensor is working: `python3 -c "from sensor code.thermal_sensor.bluetooth-thermal-sender import *; print(read_sensor_frame())"`
- Check Bluetooth connection is stable

### Data Not Appearing in Web App

1. Check browser console (F12) for errors
2. Verify Next.js is running: http://localhost:3000
3. Check API endpoint: http://localhost:3000/api/thermal/bt (should return JSON)
4. Verify receiver is forwarding: Should see "✅ Forwarded to Next.js API" messages

---

## Running Both Sensors via Bluetooth (Complete Demo Setup)

For a complete demo with both sensors:

**Terminal 1: Next.js App**
```bash
npm run dev
```

**Terminal 2: EMG Server**
```bash
npm run emg-server
```

**Terminal 3: ESP32 Bluetooth Receiver**
```bash
node bluetooth-receiver.js COM8
```
(Replace COM8 with ESP32's COM port)

**Terminal 4: Thermal Bluetooth Receiver**
```bash
node bluetooth-thermal-receiver.js COM9
```
(Replace COM9 with Raspberry Pi's COM port)

**On Raspberry Pi (via SSH or directly):**
```bash
python3 bluetooth-thermal-sender.py
```

---

## Stopping the Setup

1. **Stop Raspberry Pi script:** Press `Ctrl+C` on the Pi
2. **Stop receivers:** Press `Ctrl+C` in each terminal
3. **Stop servers:** Press `Ctrl+C` in Next.js and EMG server terminals

---

## Summary

✅ **Raspberry Pi:** Run `bluetooth-thermal-sender.py`  
✅ **Your Computer:** Run `bluetooth-thermal-receiver.js COMX`  
✅ **Next.js:** Already running (`npm run dev`)  
✅ **Web App:** Automatically uses Bluetooth data when available

The setup provides a reliable, WiFi-independent connection for demos!

