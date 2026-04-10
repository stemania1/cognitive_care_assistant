# AMG8833 Thermal Sensor - Production & Local Setup Guide

## Current Architecture

The AMG8833 thermal sensor connects to a Raspberry Pi, which runs a Python HTTP server that the Next.js app accesses.

```
AMG8833 → Raspberry Pi (Python Server) → Next.js App (via HTTP)
```

## ✅ WiFi Connection (Production-Ready)

**Yes, the AMG8833 can work via WiFi in production!** The current setup is already WiFi-based.

### How It Works

1. **Raspberry Pi runs Python server:**
   - HTTP server on port 8091 (`/thermal-data` endpoint)
   - WebSocket server on port 8092 (optional)
   - Serves thermal data from AMG8833 sensor

2. **Next.js app connects via HTTP:**
   - Uses `/api/thermal` route as a proxy
   - Proxies requests to Raspberry Pi at configured IP
   - Currently configured for IP: `192.168.254.200`

### Production Setup Options

#### Option 1: Local Network (Same Network as Production Server)

**Works if:**
- Your production server (Vercel) can access your local network
- Raspberry Pi is on a network accessible to your server
- **Limitation:** Vercel cloud servers cannot access private IPs

**For this to work, you need:**
- A local proxy/bridge server that forwards to production
- OR run Next.js locally instead of on Vercel
- OR use a VPS/cloud server instead of Vercel

#### Option 2: Public IP / Domain (Recommended for Production)

**Make Raspberry Pi publicly accessible:**

1. **Get a public IP or use Dynamic DNS:**
   ```bash
   # On Raspberry Pi, check public IP
   curl ifconfig.me
   ```

2. **Set up port forwarding on your router:**
   - Forward external port 8091 → Raspberry Pi 192.168.254.200:8091
   - Or use a service like ngrok for testing: `ngrok http 8091`

3. **Update Next.js config for production:**
   ```typescript
   // src/app/config/sensor-config.ts
   export const SENSOR_CONFIG = {
     RASPBERRY_PI_IP: process.env.NODE_ENV === 'production' 
       ? 'your-public-domain.com'  // Your public domain or IP
       : '192.168.254.200',        // Local IP for development
     // ...
   };
   ```

4. **Use environment variables:**
   ```env
   # .env.production or Vercel environment variables
   PI_HOST=your-raspberry-pi-domain.com
   PI_PORT=8091
   ```

#### Option 3: Bridge Server (Most Flexible)

Run a bridge server that forwards data:

1. **Bridge server on local network or VPS:**
   ```javascript
   // bridge-server.js
   const express = require('express');
   const fetch = require('node-fetch');
   const app = express();
   
   app.get('/thermal-data', async (req, res) => {
     const data = await fetch('http://192.168.254.200:8091/thermal-data');
     const json = await data.json();
     res.json(json);
   });
   
   app.listen(3001);
   ```

2. **Make bridge server publicly accessible** (port forwarding, VPS, etc.)

3. **Next.js connects to bridge server** instead of Raspberry Pi directly

### Security Considerations for Production

⚠️ **Important:** Exposing your Raspberry Pi directly to the internet requires security:

1. **Use HTTPS/WSS:**
   - Set up SSL certificate on Raspberry Pi
   - Use HTTPS instead of HTTP
   - Update Next.js to use `https://` instead of `http://`

2. **Authentication:**
   - Add API key or token authentication
   - Rate limiting
   - IP whitelisting

3. **Firewall:**
   - Only expose necessary ports
   - Use fail2ban for intrusion prevention

---

## 🔵 Bluetooth Connection (Local Development)

**Yes, Bluetooth is possible, but not currently implemented.** You would need to add Bluetooth support.

### How Bluetooth Could Work

1. **Add Bluetooth module to Raspberry Pi:**
   - Raspberry Pi 4/5 has built-in Bluetooth
   - Enable Bluetooth: `sudo systemctl enable bluetooth`

2. **Create Bluetooth bridge script:**
   ```python
   # bluetooth-thermal-bridge.py
   import bluetooth
   import json
   import requests
   
   # Create Bluetooth server
   server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
   server_sock.bind(("", bluetooth.PORT_ANY))
   server_sock.listen(1)
   
   # Accept connections and forward data
   while True:
       client_sock, address = server_sock.accept()
       # Receive thermal data via Bluetooth
       # Forward to HTTP server or Next.js API
   ```

3. **Or use existing Python server with Bluetooth Serial:**
   - Use `pyserial` with Bluetooth COM port
   - Similar to how EMG Bluetooth bridge works

### Current Status

❌ **Bluetooth is NOT currently implemented** for the thermal sensor.

✅ **HTTP/WiFi is the current and recommended method.**

---

## Comparison: WiFi vs Bluetooth for Thermal Sensor

| Feature | WiFi (Current) | Bluetooth (Possible) |
|---------|---------------|---------------------|
| **Range** | Entire network (~30m+) | ~10m line-of-sight |
| **Production** | ✅ Yes (with public IP/domain) | ❌ Local only |
| **Setup Complexity** | Medium | High |
| **Data Rate** | High (HTTP) | Medium (Bluetooth Serial) |
| **Reliability** | High | Medium |
| **Multi-device** | ✅ Easy | ⚠️ Limited |
| **Security** | ✅ HTTPS possible | ⚠️ Basic |
| **Recommended** | ✅ **YES** | ❌ For local dev only |

---

## Recommended Setup

### For Production (WiFi):

1. **Keep current HTTP setup**
2. **Make Raspberry Pi publicly accessible:**
   - Use Dynamic DNS (noip.com, duckdns.org)
   - Set up port forwarding
   - Use HTTPS with SSL certificate
   - Add authentication

3. **Update config for production:**
   ```typescript
   // Use environment variables
   const PI_IP = process.env.NODE_ENV === 'production'
     ? process.env.PI_HOST || 'your-pi-domain.com'
     : '192.168.254.200';
   ```

### For Local Development:

1. **Current setup works perfectly:**
   - Raspberry Pi on local network
   - Next.js connects via local IP
   - No changes needed

2. **If you want Bluetooth (optional):**
   - Add Bluetooth bridge script
   - Use for testing without WiFi
   - More complex, less reliable than WiFi

---

## Migration Steps

### To Make Production-Ready (WiFi):

1. **Set up public access for Raspberry Pi:**
   ```bash
   # Option A: Dynamic DNS
   sudo apt install ddclient
   # Configure with your Dynamic DNS provider
   
   # Option B: Use ngrok for testing
   ngrok http 8091
   ```

2. **Update environment variables:**
   ```env
   # Vercel environment variables
   PI_HOST=your-raspberry-pi.duckdns.org
   PI_PORT=8091
   ```

3. **Update code to use environment variables:**
   ```typescript
   // Already supports this in api/thermal/route.ts
   host = ipParam || process.env.PI_HOST || SENSOR_CONFIG.RASPBERRY_PI_IP;
   ```

4. **Test from production:**
   - Deploy to Vercel
   - Verify thermal data loads
   - Check logs for connection issues

---

## Summary

✅ **WiFi (HTTP):** 
- ✅ Works in production (with public IP/domain)
- ✅ Current implementation
- ✅ Recommended approach

🔵 **Bluetooth:**
- ⚠️ Not currently implemented
- ⚠️ Would only work locally
- ⚠️ More complex setup
- ⚠️ Not recommended for production

**Recommendation:** Stick with WiFi/HTTP setup and make Raspberry Pi publicly accessible for production use.

