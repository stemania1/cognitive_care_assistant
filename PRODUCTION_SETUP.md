# Production Setup Guide

## Overview

This guide explains how to set up MyoWare device connections for production deployment.

## Connection Options

### ❌ Bluetooth (Development Only)

**Bluetooth connections will NOT work in production** because:
- Production servers (Vercel, AWS, etc.) are cloud-based and don't have access to local Bluetooth hardware
- The `bluetooth-receiver.js` script must run locally on your computer
- Cloud servers cannot access COM ports or Bluetooth devices

**Use Bluetooth only for:**
- Local development
- Testing without WiFi
- Personal use on your computer

---

### ✅ WiFi (Production-Ready)

**WiFi connections WILL work in production** if properly configured.

## Production WiFi Setup

### Option 1: Direct to Production API (Recommended)

Configure your ESP32 to connect directly to your production API:

1. **Get your production API URL:**
   ```
   https://your-app.vercel.app/api/emg/ws
   ```

2. **Update ESP32 WiFi code:**
   ```cpp
   const char* server_host = "your-app.vercel.app";  // Your Vercel domain
   const int server_port = 443;  // HTTPS port
   const char* server_path = "/api/emg/ws";
   ```

3. **Use HTTPS instead of HTTP:**
   - Vercel automatically provides HTTPS
   - Update ESP32 code to use `WiFiClientSecure` for HTTPS

### Option 2: Use EMG Server Bridge (Local)

Keep using the local EMG server, but make it accessible:

1. **Run EMG server on a local machine or Raspberry Pi**
2. **Make it publicly accessible:**
   - Use a service like ngrok for development: `ngrok http 3001`
   - Or set up port forwarding on your router
   - Or deploy EMG server to a VPS/cloud server

3. **ESP32 connects to the bridge server:**
   ```cpp
   const char* server_host = "your-bridge-server.com";
   const int server_port = 3001;
   ```

4. **Bridge server forwards to production API:**
   ```javascript
   const NEXTJS_API_URL = process.env.NEXTJS_API_URL || 'https://your-app.vercel.app/api/emg/ws';
   ```

---

## Recommended Production Architecture

### Architecture 1: Direct Connection (Simplest)

```
ESP32 (WiFi) → HTTPS → Vercel API → Database
```

**Pros:**
- Simple, no middleman
- Low latency
- Works globally

**Cons:**
- Requires HTTPS support on ESP32
- All ESP32 devices need WiFi credentials

### Architecture 2: Bridge Server (Flexible)

```
ESP32 (WiFi) → Local Bridge Server → Production API → Database
```

**Pros:**
- Can use HTTP (simpler for ESP32)
- Can add local processing/caching
- Works with multiple devices

**Cons:**
- Requires maintaining bridge server
- Additional infrastructure

---

## Environment Variables for Production

### Vercel Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=production
```

### Bridge Server Environment Variables:

```env
NEXTJS_API_URL=https://your-app.vercel.app/api/emg/ws
PORT=3001
```

---

## HTTPS Support for ESP32

If using direct connection to production, ESP32 needs HTTPS support:

### Option A: Use WiFiClientSecure (ESP32)

```cpp
#include <WiFiClientSecure.h>

WiFiClientSecure client;
client.setInsecure(); // For development/testing only

// For production, add certificate:
// client.setCACert(root_ca);
```

### Option B: Use HTTP-to-HTTPS Proxy

Use a local bridge server that converts HTTP to HTTPS:
- ESP32 sends HTTP to bridge
- Bridge forwards as HTTPS to production

---

## Migration Steps: Development → Production

1. **Test WiFi connection locally first**
   - Make sure ESP32 connects via WiFi
   - Verify data flow works

2. **Update ESP32 code for production:**
   - Change server host to production domain
   - Update to use HTTPS (port 443)
   - Test with production API

3. **Verify production API works:**
   - Check logs in Vercel dashboard
   - Test API endpoint manually
   - Ensure Supabase connection works

4. **Deploy and monitor:**
   - Deploy Next.js app to Vercel
   - Monitor API logs
   - Check device connection status

---

## Troubleshooting Production Connections

### ESP32 Can't Connect to Production API

1. **Check WiFi credentials** - ESP32 must be on WiFi network
2. **Verify API URL** - Check Vercel deployment URL
3. **Check HTTPS** - Production uses HTTPS, not HTTP
4. **Firewall rules** - Ensure port 443 is open

### No Data Received in Production

1. **Check Vercel logs** - Look for API errors
2. **Verify Supabase connection** - Check environment variables
3. **Test API endpoint** - Use curl/Postman to test
4. **Check CORS** - Ensure CORS is configured correctly

### Bridge Server Issues

1. **Check bridge server is running** - Monitor process
2. **Verify bridge can reach production** - Test network connectivity
3. **Check bridge logs** - Look for forwarding errors
4. **Port forwarding** - Ensure ports are accessible

---

## Summary

- ✅ **WiFi → Production API**: Works (recommended)
- ✅ **WiFi → Bridge Server → Production API**: Works (flexible)
- ❌ **Bluetooth → Local Script → Production API**: Won't work (local only)

For production, use WiFi-based connections and avoid Bluetooth dependencies.

