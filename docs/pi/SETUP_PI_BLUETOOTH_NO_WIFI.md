# Setup Raspberry Pi Bluetooth Without WiFi Access

This guide shows how to set up the Raspberry Pi for Bluetooth connection when you won't have WiFi/SSH access.

## Method 1: Pre-Configure Before Losing WiFi (Recommended)

**Do this while you still have WiFi/SSH access to the Raspberry Pi:**

### Step 1: Copy the Setup Script to Pi

```bash
# From your computer (while you have WiFi)
scp setup-pi-bluetooth-autostart.sh pi@192.168.254.200:~/
```

### Step 2: SSH into Pi and Run Setup

```bash
ssh pi@192.168.254.200
chmod +x setup-pi-bluetooth-autostart.sh
sudo bash setup-pi-bluetooth-autostart.sh
```

This creates a systemd service that automatically makes Bluetooth discoverable every time the Pi boots.

### Step 3: Test It

```bash
# On Raspberry Pi
sudo systemctl start bluetooth-auto-discoverable.service
sudo bluetoothctl show
```

You should see `Discoverable: yes`.

### Step 4: Reboot to Test (Optional)

```bash
sudo reboot
```

After reboot, Bluetooth will automatically be discoverable.

---

## Method 2: Manual Setup with Physical Access

**If you have keyboard/monitor connected to the Raspberry Pi:**

### Step 1: Login to Raspberry Pi

Connect keyboard and monitor, then login as `pi` user.

### Step 2: Enable Bluetooth

```bash
sudo bluetoothctl
power on
discoverable on
pairable on
agent on
default-agent
exit
```

Keep this running, or create the auto-start service as shown in Method 1.

---

## Method 3: USB Flash Drive Script

**If you have USB access but no WiFi:**

### Step 1: Create Setup Script on USB Drive

On any computer, create a file `setup-bluetooth.sh` on a USB drive:

```bash
#!/bin/bash
sudo systemctl start bluetooth
sudo bluetoothctl <<EOF
power on
discoverable on
pairable on
agent on
default-agent
exit
EOF
echo "✅ Bluetooth is now discoverable!"
```

### Step 2: Copy to Raspberry Pi

Insert USB drive into Raspberry Pi, then:

```bash
# Mount USB (usually /media/pi/...)
cd /media/pi/USB_DRIVE_NAME
chmod +x setup-bluetooth.sh
sudo bash setup-bluetooth.sh
```

---

## Method 4: Bluetooth Control from Python Script

**If the thermal sensor script is already running:**

You could modify `bluetooth-thermal-sender.py` to also enable discoverable mode when it starts.

---

## After Setup - Pairing from New Computer

Once the Pi is discoverable (via any method above):

1. **On the new computer (no WiFi needed):**
   - Settings → Bluetooth & devices
   - Click "Add device" → "Bluetooth"
   - Look for "raspberrypi"
   - Click "Pair"
   - Enter PIN when prompted (or confirm on Pi if needed)

2. **Check Device Manager for COM port:**
   - Device Manager → Ports (COM & LPT)
   - Note the COM port number (e.g., COM9)

3. **Test connection:**
   ```bash
   node test-thermal-connection.js
   ```

---

## Quick Summary

**Best approach:** Run `setup-pi-bluetooth-autostart.sh` while you still have WiFi/SSH access. This makes Bluetooth discoverable automatically every time the Pi boots, so it will work on any computer without needing WiFi.

**No WiFi access?** Use physical keyboard/monitor or USB drive method.
