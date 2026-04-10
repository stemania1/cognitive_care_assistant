# Quick Local Startup Guide

## Fastest Way to Start (WiFi Mode)

**Just one command:**

```bash
npm run dev:all
```

Then open http://localhost:3000 in your browser.

**That's it!** This starts:
- Next.js app (port 3000)
- EMG server (port 3001)

---

## Alternative: Use Startup Script

**Windows (PowerShell):**
```powershell
.\start-local.ps1
```

This script:
- Checks prerequisites
- Installs dependencies if needed
- Starts both servers
- Shows helpful messages

---

## Bluetooth Mode (No WiFi)

For demos without WiFi, see `QUICK_DEMO_SETUP.md` or `THERMAL_BLUETOOTH_SETUP.md` for Bluetooth setup.

**Quick summary:**
1. `npm run dev` (Terminal 1)
2. `npm run emg-server` (Terminal 2)
3. `node bluetooth-receiver.js COM8` (Terminal 3 - ESP32)
4. `node bluetooth-thermal-receiver.js COM9` (Terminal 4 - Thermal)
5. `python3 bluetooth-thermal-sender.py` (On Raspberry Pi via SSH)

---

## Prerequisites

- Node.js installed
- `npm install` run at least once
- `.env.local` file configured (Supabase credentials)
- Sensors connected (WiFi or Bluetooth)

---

## Troubleshooting

**Port already in use?**
- Stop other processes using ports 3000 or 3001
- Or change ports in `next.config.ts` and `emg-server.js`

**Dependencies missing?**
```bash
npm install
```

**Environment variables missing?**
- Copy `.env.example` to `.env.local`
- Add your Supabase credentials

---

## Summary

✅ **WiFi Mode (Recommended):** `npm run dev:all`  
✅ **Bluetooth Mode:** See `QUICK_DEMO_SETUP.md`  
✅ **Startup Script:** `.\start-local.ps1` (Windows)

