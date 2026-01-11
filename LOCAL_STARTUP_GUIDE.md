# Local Startup Guide - Simplified

This guide shows the simplest way to start the app locally for development or demos.

## Quick Start (WiFi Mode)

If you have WiFi and both sensors connected via WiFi:

```bash
# Terminal 1: Start both servers together
npm run dev:all
```

That's it! Open http://localhost:3000 in your browser.

---

## Quick Start (Bluetooth Mode - No WiFi)

For demos without WiFi reliability, using Bluetooth for both sensors:

### Option A: Use Convenience Script (Recommended - If Created)

```bash
# Start everything in one command
npm run demo:bluetooth
```

### Option B: Manual Start (4 Terminals)

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
(Replace COM8 with your ESP32's COM port)

**Terminal 4: Thermal Bluetooth Receiver**
```bash
node bluetooth-thermal-receiver.js COM9
```
(Replace COM9 with your Raspberry Pi's COM port)

**On Raspberry Pi (via SSH):**
```bash
python3 bluetooth-thermal-sender.py
```

---

## Complete Startup Checklist

### Prerequisites
- [ ] Node.js installed
- [ ] Dependencies installed: `npm install`
- [ ] Environment variables set (`.env.local` file)
- [ ] Supabase configured

### WiFi Mode
- [ ] ESP32 connected to WiFi
- [ ] Raspberry Pi connected to WiFi
- [ ] Run: `npm run dev:all`
- [ ] Open: http://localhost:3000

### Bluetooth Mode
- [ ] ESP32 paired via Bluetooth
- [ ] Raspberry Pi paired via Bluetooth
- [ ] ESP32 Bluetooth receiver script running
- [ ] Thermal Bluetooth receiver script running
- [ ] Raspberry Pi Bluetooth sender script running
- [ ] Next.js app running: `npm run dev`
- [ ] EMG server running: `npm run emg-server`
- [ ] Open: http://localhost:3000

---

## Simplified Startup Script (Recommended)

We should create a startup script to make this easier. Here are options:

### Option 1: PowerShell Script (Windows)

Create `start-local.ps1`:
```powershell
# Start Local App (WiFi Mode)
Write-Host "Starting Cognitive Care Assistant locally..." -ForegroundColor Green

# Check if dependencies are installed
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start both servers
Write-Host "Starting Next.js and EMG server..." -ForegroundColor Cyan
npm run dev:all
```

### Option 2: Batch File (Windows)

Create `start-local.bat`:
```batch
@echo off
echo Starting Cognitive Care Assistant locally...

if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo Starting servers...
npm run dev:all
```

### Option 3: npm Script (Cross-platform)

Add to `package.json`:
```json
"scripts": {
  "start:local": "concurrently \"npm run dev\" \"npm run emg-server\"",
  "start:wifi": "npm run dev:all",
  "start:bluetooth": "echo 'Start: npm run dev (Terminal 1), npm run emg-server (Terminal 2), node bluetooth-receiver.js COMX (Terminal 3), node bluetooth-thermal-receiver.js COMY (Terminal 4)'"
}
```

---

## Current Startup Requirements

### Minimum (WiFi Mode - Easiest)
1. **One command:** `npm run dev:all`
2. **One URL:** http://localhost:3000

### Bluetooth Mode (More Complex)
1. **4 processes on your computer:**
   - Next.js app (`npm run dev`)
   - EMG server (`npm run emg-server`)
   - ESP32 Bluetooth receiver (`node bluetooth-receiver.js COM8`)
   - Thermal Bluetooth receiver (`node bluetooth-thermal-receiver.js COM9`)

2. **1 process on Raspberry Pi:**
   - Thermal Bluetooth sender (`python3 bluetooth-thermal-sender.py`)

3. **One URL:** http://localhost:3000

---

## Simplification Opportunities

### What Could Be Simplified:

1. **Create a single startup script** that starts all required services
2. **Combine Bluetooth receivers** into one script (would require refactoring)
3. **Use systemd services** on Pi for auto-start (already possible)
4. **Create a launcher script** that checks prerequisites and starts everything

### Recommended Simplifications:

#### 1. Create `start-local.ps1` Script
- Checks prerequisites
- Starts Next.js + EMG server together
- Shows helpful messages

#### 2. Create `start-bluetooth.ps1` Script
- Starts Next.js + EMG server
- Prompts for COM ports
- Starts both Bluetooth receivers
- Shows connection status

#### 3. Add npm scripts for common scenarios
```json
"scripts": {
  "start": "npm run dev:all",
  "start:dev": "npm run dev:all",
  "start:bluetooth": "node scripts/start-bluetooth.js"
}
```

---

## Recommended Approach

For now, the simplest is:

### WiFi Mode (Recommended for most cases):
```bash
npm run dev:all
```

### Bluetooth Mode (For demos without WiFi):
Use 4 terminals + Raspberry Pi script (as documented in `QUICK_DEMO_SETUP.md`)

Would you like me to create a startup script to automate this?

