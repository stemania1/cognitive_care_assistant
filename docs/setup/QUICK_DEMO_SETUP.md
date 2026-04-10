# Quick Demo Setup - Bluetooth (No WiFi Required)

This guide shows how to run your app **completely offline using Bluetooth** for a reliable demo.

## Current Status

✅ **ESP32 (MyoWare) via Bluetooth:** Already implemented and working!  
⚠️ **AMG8833 (Raspberry Pi) via Bluetooth:** Needs implementation (script provided below)

---

## Quick Setup (4 Steps)

### Step 1: Start Next.js App Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Step 2: Start EMG Server

```bash
npm run emg-server
```

This runs on port 3001 and forwards data to Next.js.

### Step 3: Connect ESP32 via Bluetooth (Already Works!)

1. **Pair ESP32** (if not already paired):
   - Settings → Bluetooth & devices → Pair "MyoWare_EMG"

2. **Find COM port:**
   - Device Manager → Ports (COM & LPT) → Note the COM port (e.g., COM8)

3. **Run Bluetooth receiver:**
   ```bash
   node bluetooth-receiver.js COM8
   ```
   (Replace COM8 with your actual COM port)

✅ **ESP32 is now connected!** Data flows: ESP32 → Bluetooth → bluetooth-receiver.js → EMG server → Next.js → Web app

### Step 4: Connect AMG8833 via Bluetooth (New - See Below)

The thermal sensor needs a Bluetooth bridge. Two options:

**Option A: Quick Implementation (Recommended for Demo)**

Since the thermal sensor is less critical for demos, you can:
- **Skip thermal sensor** for the demo (EMG sensor works great standalone)
- OR use WiFi if it's available at the demo location

**Option B: Full Bluetooth Implementation**

If you need thermal sensor in the demo, implement the Bluetooth bridge (see detailed guide in `LOCAL_BLUETOOTH_DEMO_SETUP.md`).

---

## Demo Checklist

Before your demo:

- [ ] Next.js app running (`npm run dev`)
- [ ] EMG server running (`npm run emg-server`)
- [ ] ESP32 paired and Bluetooth receiver running (`node bluetooth-receiver.js COMX`)
- [ ] Both sensors powered on
- [ ] Browser open to http://localhost:3000
- [ ] Test EMG sensor connection (should show green "Connected" indicator)

---

## Troubleshooting

### ESP32 Not Connecting

1. Check pairing: Is "MyoWare_EMG" connected in Bluetooth settings?
2. Verify COM port: Device Manager → Ports
3. Check bluetooth-receiver.js is running: Should show "✅ Bluetooth Serial port opened successfully!"
4. Check EMG server is running: Should show "🚀 EMG Server running on port 3001"

### App Not Showing Data

1. Check browser console (F12) for errors
2. Verify Next.js is running on localhost:3000
3. Check EMG server logs for incoming data
4. Verify ESP32 Serial Monitor shows data being sent

---

## Summary

✅ **ESP32 (MyoWare):** Ready to go - just run `bluetooth-receiver.js`  
⚠️ **AMG8833 (Thermal):** Not implemented yet - skip for demo OR use WiFi if available

**For a reliable demo without WiFi:**
- Use ESP32 via Bluetooth (already works!)
- Skip thermal sensor or use WiFi if available
- Everything runs locally on your computer

The app will work perfectly with just the EMG sensor for your demo!

