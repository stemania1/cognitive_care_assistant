# Demo Mode Setup - No WiFi Required

This guide sets up your Raspberry Pi to work automatically for demos without WiFi. Everything runs via Bluetooth.

## Quick Setup (Do This Now While You Have WiFi)

### Step 1: Copy Setup Script to Raspberry Pi

```bash
# From your computer
scp setup-pi-demo-mode.sh pi@192.168.254.200:~/
```

### Step 2: Copy Thermal Sender Script (if not already there)

```bash
# From your computer
scp "sensor code/thermal_sensor/bluetooth-thermal-sender.py" pi@192.168.254.200:~/
```

### Step 3: SSH into Raspberry Pi and Run Setup

```bash
ssh pi@192.168.254.200
chmod +x setup-pi-demo-mode.sh
sudo bash setup-pi-demo-mode.sh
```

This will:
- ✅ Configure Bluetooth to be discoverable automatically on boot
- ✅ Configure thermal sensor to start automatically on boot
- ✅ Test both services

---

## What Gets Configured

### 1. Bluetooth Auto-Discoverable Service
- Makes Bluetooth discoverable every time Pi boots
- No manual setup needed for demos

### 2. Thermal Sensor Auto-Start Service
- Automatically starts `bluetooth-thermal-sender.py` on boot
- Sends thermal data via Bluetooth Serial
- Auto-restarts if it crashes

---

## For Your Demo (No WiFi Needed)

### On Raspberry Pi:
1. **Power on the Pi**
2. **Wait ~30 seconds** for services to start
3. **That's it!** Bluetooth is discoverable and thermal sensor is running

### On Your Computer:
1. **Pair Raspberry Pi:**
   - Settings → Bluetooth & devices
   - Add device → Bluetooth
   - Look for "raspberrypi" → Pair
   - Note the COM port (Device Manager → Ports)

2. **Start the app:**
   ```bash
   npm run start:thermal
   ```
   Or:
   ```powershell
   .\start-thermal.ps1
   ```

3. **Open browser:**
   - http://localhost:3000
   - Navigate to Sleep Behaviors page
   - Click "Start Sensor"
   - Thermal data should appear!

---

## Verify Setup

### Check Services Are Running

**On Raspberry Pi (via SSH or physical access):**
```bash
# Check Bluetooth service
sudo systemctl status bluetooth-auto-discoverable.service

# Check thermal sender service
sudo systemctl status thermal-bluetooth-sender.service
```

**Check Bluetooth is discoverable:**
```bash
sudo bluetoothctl show
```
Should show: `Discoverable: yes`

**Check thermal sender is running:**
```bash
sudo journalctl -u thermal-bluetooth-sender.service -n 20
```
Should show sensor initialization and "Waiting for connection..."

---

## Troubleshooting

### Bluetooth Not Discoverable

```bash
# Manually enable
sudo systemctl start bluetooth-auto-discoverable.service
sudo bluetoothctl show
```

### Thermal Sensor Not Starting

```bash
# Check logs
sudo journalctl -u thermal-bluetooth-sender.service -n 50

# Check script exists
ls -la /home/pi/bluetooth-thermal-sender.py

# Manually test
python3 /home/pi/bluetooth-thermal-sender.py
```

### Services Not Starting on Boot

```bash
# Re-enable services
sudo systemctl enable bluetooth-auto-discoverable.service
sudo systemctl enable thermal-bluetooth-sender.service

# Reboot to test
sudo reboot
```

---

## Demo Checklist

Before your demo:

- [ ] Setup script run successfully on Raspberry Pi
- [ ] Services enabled and tested
- [ ] Raspberry Pi paired with demo computer
- [ ] COM port noted (Device Manager)
- [ ] Test connection: `node test-thermal-connection.js`
- [ ] App tested locally: `npm run start:thermal`

During demo:

- [ ] Power on Raspberry Pi
- [ ] Wait 30 seconds
- [ ] Pair from computer (if not already paired)
- [ ] Run: `npm run start:thermal`
- [ ] Open: http://localhost:3000
- [ ] Navigate to Sleep Behaviors page
- [ ] Click "Start Sensor"
- [ ] Verify thermal data appears

---

## Summary

**Setup (once, while you have WiFi):**
```bash
scp setup-pi-demo-mode.sh pi@192.168.254.200:~/
ssh pi@192.168.254.200
sudo bash setup-pi-demo-mode.sh
```

**Demo (no WiFi needed):**
1. Power on Pi → Wait 30 seconds
2. Pair from computer → Note COM port
3. Run: `npm run start:thermal`
4. Open: http://localhost:3000

That's it! Everything works automatically via Bluetooth.
