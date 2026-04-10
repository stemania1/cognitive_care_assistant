# Demo Startup Guide - Bluetooth Only (No WiFi)

This guide shows how to start the app **completely offline using Bluetooth** for your demo. Perfect for locations without reliable WiFi.

## Overview

For your demo with Bluetooth-only access, you need:

**On Your Laptop (4 processes):**
1. Next.js app
2. EMG server  
3. ESP32 Bluetooth receiver
4. Thermal Bluetooth receiver

**On Raspberry Pi (1 process - via SSH):**
1. Thermal Bluetooth sender script

---

## Quick Start Checklist

### Prerequisites
- [ ] ESP32 powered on and paired with laptop (device: "MyoWare_EMG")
- [ ] Raspberry Pi powered on and paired with laptop
- [ ] Node.js installed on laptop
- [ ] Dependencies installed: `npm install`
- [ ] Environment variables configured (`.env.local` file)

### Step 1: Find Bluetooth COM Ports

**Windows:**
1. Open Device Manager (Win + X → Device Manager)
2. Expand "Ports (COM & LPT)"
3. Find:
   - ESP32 Bluetooth port (e.g., COM8) - Look for "MyoWare_EMG"
   - Raspberry Pi Bluetooth port (e.g., COM9) - Look for "raspberrypi"

**Note the COM port numbers - you'll need them for the receiver scripts.**

### Step 2: Start All Services

Open **4 PowerShell/Terminal windows** on your laptop:

**Terminal 1: Next.js App**
```powershell
cd C:\Users\bobby\cognitive_care_assistant
npm run dev
```

**Terminal 2: EMG Server**
```powershell
cd C:\Users\bobby\cognitive_care_assistant
npm run emg-server
```

**Terminal 3: ESP32 Bluetooth Receiver**
```powershell
cd C:\Users\bobby\cognitive_care_assistant
node bluetooth-receiver.js COM8
```
*(Replace COM8 with your ESP32's COM port)*

**Terminal 4: Thermal Bluetooth Receiver**
```powershell
cd C:\Users\bobby\cognitive_care_assistant
node bluetooth-thermal-receiver.js COM9
```
*(Replace COM9 with your Raspberry Pi's COM port)*

### Step 3: Start Raspberry Pi Script (via SSH)

**Terminal 5 (or SSH session):**

```bash
# SSH into Raspberry Pi
ssh pi@192.168.254.200

# Run the Bluetooth sender script
python3 bluetooth-thermal-sender.py
```

*(If you don't know the password, see `RESET_RASPBERRY_PI_PASSWORD.md`)*

### Step 4: Verify Everything is Running

You should see:

**Terminal 1 (Next.js):**
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
```

**Terminal 2 (EMG Server):**
```
🚀 EMG Server running on port 3001
📡 HTTP endpoint: http://localhost:3001/api/emg/ws
```

**Terminal 3 (ESP32 Receiver):**
```
✅ Bluetooth Serial port opened successfully!
📥 Waiting for data from ESP32...
📥 Received EMG data: { muscleActivity: ..., voltage: ... }
✅ Forwarded to EMG server
```

**Terminal 4 (Thermal Receiver):**
```
✅ Bluetooth Serial port opened successfully!
📥 Waiting for thermal data from Raspberry Pi...
📥 Received thermal data: { avgTemp: 'XX.X°C', ... }
✅ Forwarded to Next.js API
```

**Terminal 5 (Raspberry Pi):**
```
✅ AMG8833 sensor initialized
🔵 Bluetooth server started on RFCOMM channel X
✅ Connected to <ADDRESS>
📤 Sending thermal data...
```

### Step 5: Open the App

1. Open browser to: **http://localhost:3000**
2. Navigate to:
   - **EMG page** - Should show ESP32 data
   - **Sleep Behaviors page** - Should show thermal data

---

## Simplified Startup Script (Future Enhancement)

For future, we could create a script that starts everything, but for now, use the 4 terminals above.

---

## Troubleshooting

### ESP32 Not Connecting

**Check pairing:**
- Settings → Bluetooth & devices → Is "MyoWare_EMG" connected?

**Check COM port:**
- Device Manager → Ports → Find ESP32 port
- Make sure you're using the correct COM port number

**Check receiver:**
- Should see "✅ Bluetooth Serial port opened successfully!"
- If error: Port might be in use by another program

### Thermal Sensor Not Connecting

**Check pairing:**
- Settings → Bluetooth & devices → Is Raspberry Pi connected?

**Check COM port:**
- Device Manager → Ports → Find Raspberry Pi port

**Check Raspberry Pi script:**
- SSH into Pi and verify script is running
- Should see "✅ Connected to <ADDRESS>"

**Check receiver:**
- Should see "✅ Bluetooth Serial port opened successfully!"
- Should see "📥 Received thermal data" messages

### App Not Showing Data

1. **Check browser console (F12)** for errors
2. **Verify Next.js is running** on http://localhost:3000
3. **Check EMG server** - should show incoming data
4. **Check receivers** - should show "✅ Forwarded" messages

### Port Already in Use

If ports 3000 or 3001 are busy:
- Close other Node.js/Next.js processes
- Check Task Manager for node processes
- Restart terminal and try again

---

## Demo Flow

1. **Before demo:**
   - Test all connections (run everything once)
   - Verify data appears in browser
   - Check battery levels on sensors

2. **During demo:**
   - Start all 4 terminals on laptop
   - SSH into Raspberry Pi and start script
   - Open browser to http://localhost:3000
   - Navigate to EMG and Sleep Behaviors pages

3. **If something breaks:**
   - Check receiver terminal logs
   - Check browser console (F12)
   - Restart the problematic process
   - Verify Bluetooth pairing

---

## Summary

✅ **Start 4 terminals on laptop:**
- `npm run dev`
- `npm run emg-server`
- `node bluetooth-receiver.js COM8`
- `node bluetooth-thermal-receiver.js COM9`

✅ **SSH into Raspberry Pi:**
- `python3 bluetooth-thermal-sender.py`

✅ **Open browser:** http://localhost:3000

**That's it!** Everything runs completely offline via Bluetooth.

