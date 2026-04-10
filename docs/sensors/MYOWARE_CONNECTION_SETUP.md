# MyoWare Connection Setup (No Arduino Changes Required)

This guide shows you how to connect your MyoWare device **without modifying the Arduino code**.

## Option 1: Use the Standalone EMG Server (Recommended)

The standalone EMG server runs on port 3001 (which your Arduino is already configured for) and forwards data to your Next.js app.

### Setup Steps:

1. **Start the EMG Server:**
   ```bash
   npm run emg-server
   ```
   
   Or manually:
   ```bash
   node emg-server.js
   ```

2. **Start your Next.js app** (in a separate terminal):
   ```bash
   npm run dev
   ```

3. **The EMG server will:**
   - Listen on port 3001 (where your Arduino sends data)
   - Forward all data to Next.js API at `http://localhost:3000/api/emg/ws`
   - Work even if Next.js isn't running (standalone mode)

### Your Arduino Configuration:
- **Server IP:** `192.168.254.204` (your computer's IP - no change needed)
- **Server Port:** `3001` (already configured - no change needed)
- **Endpoint:** `/api/emg/ws` (already configured - no change needed)

## Option 2: Run Both Servers Together

Use the convenience script to run both servers at once:

```bash
npm install -g concurrently
npm run dev:all
```

This starts both:
- Next.js on port 3000
- EMG server on port 3001

## Option 3: Configure Your Computer's IP Address

If your computer's IP address doesn't match `192.168.254.204`, you have two options:

### A. Set a Static IP (Windows)
1. Open Network Settings
2. Go to your WiFi/Ethernet adapter
3. Set a static IP address: `192.168.254.204`
4. Subnet mask: `255.255.255.0`
5. Gateway: Your router's IP (usually `192.168.254.1`)

### B. Use Port Forwarding (Advanced)
Set up port forwarding on your router to forward port 3001 to your computer's current IP.

## Troubleshooting

### Check if EMG Server is Running:
```bash
curl http://localhost:3001/api/emg/ws
```

Should return: `{"status":"EMG WebSocket server running",...}`

### Check if Data is Being Received:
Watch the EMG server console - you should see:
```
📥 Received request from MyoWare device: {...}
✅ Forwarded to Next.js API: {...}
```

### Verify Your Computer's IP:
- **Windows:** `ipconfig` (look for IPv4 Address)
- **Mac/Linux:** `ifconfig` or `ip addr`

### If Next.js isn't Running:
The EMG server will still work and log:
```
⚠️ Could not forward to Next.js API (it may not be running)
```

Just start Next.js and the forwarding will resume automatically.

## Environment Variables

You can customize the Next.js API URL:

```bash
NEXTJS_API_URL=http://localhost:3000/api/emg/ws npm run emg-server
```

Or set it in a `.env` file:
```
NEXTJS_API_URL=http://localhost:3000/api/emg/ws
```

## Summary

✅ **No Arduino code changes needed!**
✅ **Just run the EMG server on port 3001**
✅ **It automatically forwards to Next.js**
✅ **Works even if Next.js isn't running**

The EMG server acts as a bridge between your Arduino (port 3001) and Next.js (port 3000).








