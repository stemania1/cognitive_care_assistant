# Local Bluetooth Demo Setup Guide

This guide shows you how to run the app **completely offline using Bluetooth** for both sensors. Perfect for demos where WiFi reliability is uncertain.

## Overview

For a local Bluetooth demo, you'll run:
1. **Next.js app** locally (localhost:3000)
2. **EMG server** locally (localhost:3001) 
3. **ESP32 (MyoWare)** → Bluetooth → `bluetooth-receiver.js` → EMG server
4. **AMG8833 (Raspberry Pi)** → Bluetooth → `bluetooth-thermal-bridge.py` → Next.js API

## Prerequisites

- Both sensors powered on
- ESP32 and Raspberry Pi paired with your computer via Bluetooth
- Node.js installed
- Python 3 installed (for thermal bridge)

---

## Part 1: ESP32 (MyoWare) via Bluetooth ✅

**Status:** Already implemented!

### Setup Steps:

1. **Upload Bluetooth code to ESP32:**
   - Use `MyoWare_Bluetooth.ino` (already created)
   - Device name: "MyoWare_EMG"

2. **Pair ESP32 with your computer:**
   - Windows: Settings → Bluetooth & devices → Pair "MyoWare_EMG"
   - Find COM port in Device Manager (e.g., COM8)

3. **Run Bluetooth receiver:**
   ```bash
   node bluetooth-receiver.js COM8
   ```
   (Replace COM8 with your actual COM port)

4. **Start EMG server:**
   ```bash
   npm run emg-server
   ```

5. **Start Next.js app:**
   ```bash
   npm run dev
   ```

The ESP32 will send data via Bluetooth → `bluetooth-receiver.js` → EMG server (port 3001) → Next.js API → Web app.

---

## Part 2: AMG8833 (Raspberry Pi) via Bluetooth ⚠️

**Status:** Needs to be implemented. Here's how to add it.

### Option A: Create Bluetooth Bridge Script (Recommended)

Create a Python script that:
1. Reads thermal data from AMG8833 sensor
2. Sends it via Bluetooth Serial to your computer
3. Your computer runs a receiver that forwards to Next.js API

**On Raspberry Pi:**
```python
# bluetooth-thermal-sender.py
import bluetooth
import time
import json
from datetime import datetime
# ... (sensor reading code)
```

**On Your Computer:**
```javascript
// bluetooth-thermal-receiver.js
const { SerialPort } = require('serialport');
// Receive Bluetooth data
// Forward to Next.js /api/thermal endpoint
```

### Option B: Use Raspberry Pi's Built-in Bluetooth (Simpler)

Since Raspberry Pi has Bluetooth built-in, you can:
1. Pair Raspberry Pi as a Bluetooth device with your computer
2. Create a Python script that sends thermal data via Bluetooth Serial
3. Receive on your computer and forward to Next.js

---

## Quick Setup: Raspberry Pi Bluetooth Thermal Bridge

### Step 1: Install Bluetooth Libraries on Raspberry Pi

```bash
# On Raspberry Pi
sudo apt update
sudo apt install python3-bluetooth python3-pip
pip3 install pybluez pyserial
```

### Step 2: Create Bluetooth Thermal Sender Script

Create `bluetooth-thermal-sender.py` on Raspberry Pi:

```python
#!/usr/bin/env python3
"""
Bluetooth Thermal Sender for AMG8833
Sends thermal data via Bluetooth Serial to computer
"""
import bluetooth
import json
import time
from datetime import datetime

# Import your existing sensor code
from raspberry_pi_thermal_server import read_sensor_frame, GRID_WIDTH, GRID_HEIGHT

# Bluetooth server setup
server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
server_sock.bind(("", bluetooth.PORT_ANY))
server_sock.listen(1)

port = server_sock.getsockname()[1]
uuid = "00001101-0000-1000-8000-00805f9b34fb"  # Serial Port Profile

bluetooth.advertise_service(
    server_sock,
    "AMG8833_Thermal",
    service_id=uuid,
    service_classes=[uuid, bluetooth.SERIAL_PORT_CLASS],
    profiles=[bluetooth.SERIAL_PORT_PROFILE]
)

print(f"Waiting for connection on RFCOMM channel {port}...")

try:
    client_sock, address = server_sock.accept()
    print(f"Accepted connection from {address}")
    
    while True:
        try:
            # Read thermal frame
            frame = read_sensor_frame()
            
            # Build payload
            payload = {
                "type": "thermal_data",
                "timestamp": datetime.utcnow().isoformat(),
                "thermal_data": frame,
                "grid_size": {"width": GRID_WIDTH, "height": GRID_HEIGHT},
                "sensor_info": {
                    "model": "AMG8833",
                    "temperature_unit": "C",
                    "data_source": "sensor"
                }
            }
            
            # Send via Bluetooth
            message = json.dumps(payload) + "\n"
            client_sock.send(message.encode('utf-8'))
            
            time.sleep(0.1)  # 10Hz update rate
            
        except bluetooth.BluetoothError as e:
            print(f"Bluetooth error: {e}")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)
            
except KeyboardInterrupt:
    print("\nStopping...")
finally:
    client_sock.close()
    server_sock.close()
```

### Step 3: Create Bluetooth Thermal Receiver (On Your Computer)

Create `bluetooth-thermal-receiver.js` in your project root:

```javascript
/**
 * Bluetooth Thermal Receiver for AMG8833
 * Receives thermal data via Bluetooth Serial from Raspberry Pi
 * and forwards it to Next.js API
 */
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Configuration
const NEXTJS_API_URL = process.env.NEXTJS_API_URL || 'http://localhost:3000/api/thermal';
const SERIAL_PORT = process.argv[2] || process.env.THERMAL_BLUETOOTH_PORT;

if (!SERIAL_PORT) {
  console.error('❌ Error: Serial port not specified!');
  console.log('\nUsage:');
  console.log('  node bluetooth-thermal-receiver.js <COM_PORT>');
  console.log('\nExamples:');
  console.log('  Windows: node bluetooth-thermal-receiver.js COM9');
  console.log('  Mac:     node bluetooth-thermal-receiver.js /dev/tty.Bluetooth-Incoming-Port');
  process.exit(1);
}

console.log('🔵 Bluetooth Thermal Receiver for AMG8833');
console.log('==========================================');
console.log(`📡 Serial Port: ${SERIAL_PORT}`);
console.log(`🌐 Forwarding to: ${NEXTJS_API_URL}`);
console.log('');

const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: 115200,
  autoOpen: true
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

let forwardStats = {
  success: 0,
  failures: 0,
  lastError: null
};

port.on('open', () => {
  console.log('✅ Bluetooth Serial port opened successfully!');
  console.log('📥 Waiting for thermal data from Raspberry Pi...\n');
});

port.on('error', (err) => {
  console.error('❌ Serial port error:', err.message);
  console.error('   Make sure:');
  console.error('   1. Raspberry Pi is paired and connected');
  console.error('   2. The correct COM port is specified');
  console.error('   3. No other program is using this port');
});

let lastLog = 0;

parser.on('data', async (line) => {
  try {
    const data = JSON.parse(line.trim());
    
    if (data.type === 'thermal_data') {
      const now = Date.now();
      if (now - lastLog > 5000) {
        console.log('📥 Received thermal data:', {
          gridSize: data.grid_size,
          timestamp: data.timestamp,
          avgTemp: data.thermal_data 
            ? (data.thermal_data.flat().reduce((a, b) => a + b, 0) / data.thermal_data.flat().length).toFixed(1)
            : 'N/A'
        });
        lastLog = now;
      }
      
      // Forward to Next.js API
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Create a response that mimics the Raspberry Pi HTTP server format
        const response = await fetch(NEXTJS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          forwardStats.success++;
        } else {
          forwardStats.failures++;
          console.error('❌ API returned error:', response.status);
        }
      } catch (fetchError) {
        forwardStats.failures++;
        if (fetchError.name !== 'AbortError') {
          console.error('❌ Error forwarding to API:', fetchError.message);
        }
      }
    }
  } catch (parseError) {
    if (line.trim().length > 0) {
      console.log('📄 Non-JSON data:', line.trim().substring(0, 100));
    }
  }
});

process.on('SIGINT', () => {
  console.log('\n\n📊 Statistics:');
  console.log(`   Success: ${forwardStats.success}`);
  console.log(`   Failures: ${forwardStats.failures}`);
  console.log('\n👋 Closing Bluetooth connection...');
  port.close(() => {
    console.log('✅ Port closed. Goodbye!');
    process.exit(0);
  });
});

console.log('💡 Press Ctrl+C to stop\n');
```

### Step 4: Update Next.js API to Accept Direct Data

You'll need to create an endpoint that accepts thermal data directly (bypassing the Raspberry Pi HTTP server):

```typescript
// src/app/api/thermal/direct/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Store data in memory or forward to existing thermal data store
    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
```

---

## Complete Demo Setup (All Steps)

### 1. Start All Services

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
(Replace COM8 with your ESP32 Bluetooth COM port)

**Terminal 4: Thermal Bluetooth Receiver**
```bash
node bluetooth-thermal-receiver.js COM9
```
(Replace COM9 with your Raspberry Pi Bluetooth COM port)

### 2. Start Raspberry Pi Bluetooth Sender

On Raspberry Pi (via SSH or directly):
```bash
cd /path/to/project
python3 bluetooth-thermal-sender.py
```

### 3. Verify Connections

- ESP32 should show: "✅ Bluetooth connected!" in Serial Monitor
- Raspberry Pi should show: "Accepted connection from..."
- Both receivers should show: "✅ Bluetooth Serial port opened successfully!"
- Web app at http://localhost:3000 should show both sensors connected

---

## Simplified Alternative: USB Connection for Thermal Sensor

If Bluetooth setup is too complex for a quick demo, you can:

1. **Connect Raspberry Pi to your computer via USB** (USB-to-USB or USB cable)
2. **Use USB networking** or **serial over USB**
3. **Modify the thermal receiver** to use USB serial instead of Bluetooth

This is simpler but requires a physical USB connection.

---

## Troubleshooting

### ESP32 Bluetooth Issues

- Check pairing: Settings → Bluetooth → Is "MyoWare_EMG" connected?
- Find COM port: Device Manager → Ports (COM & LPT)
- Test: `node bluetooth-receiver.js COMX` should connect

### Raspberry Pi Bluetooth Issues

- Enable Bluetooth: `sudo systemctl enable bluetooth`
- Check status: `sudo systemctl status bluetooth`
- Pair from computer first, then run sender script
- Check Python packages: `pip3 list | grep bluetooth`

### Connection Issues

- Make sure Next.js app is running (localhost:3000)
- Make sure EMG server is running (localhost:3001)
- Check browser console for errors
- Verify both receivers are showing "✅ Port opened successfully!"

---

## Summary

✅ **ESP32 (MyoWare):** Already set up for Bluetooth - just run `bluetooth-receiver.js`

⚠️ **AMG8833 (Raspberry Pi):** Needs Bluetooth implementation (scripts provided above)

🎯 **For quickest demo:** 
1. Use ESP32 Bluetooth (already works)
2. For thermal sensor, consider USB connection or stick with WiFi if available
3. OR implement the Bluetooth bridge scripts above

The Bluetooth setup gives you complete WiFi independence for reliable demos!

