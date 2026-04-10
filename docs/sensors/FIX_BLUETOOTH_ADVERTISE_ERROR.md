# Fix: "no advertisable device" Bluetooth Error

This error occurs when pybluez can't advertise a Bluetooth service on Raspberry Pi. Here are solutions:

## Quick Fixes

### Option 1: Run with sudo (Quick Test)

```bash
sudo python3 bluetooth-thermal-sender.py
```

**Note:** This works but runs as root (not ideal for production)

### Option 2: Check Bluetooth Adapter Status

```bash
# Check if Bluetooth adapter is up
hciconfig

# If adapter shows DOWN, bring it up:
sudo hciconfig hci0 up

# Check Bluetooth service
sudo systemctl status bluetooth

# Restart Bluetooth service
sudo systemctl restart bluetooth
```

### Option 3: Add User to Bluetooth Group

```bash
# Add pi user to bluetooth group
sudo usermod -a -G bluetooth pi

# Log out and log back in (or reboot) for changes to take effect
# Or use:
newgrp bluetooth
```

### Option 4: Use System Bluetooth (Recommended)

Instead of using pybluez's advertise_service (which has issues), use system Bluetooth to create an RFCOMM port:

```bash
# Set up RFCOMM port using system Bluetooth
sudo sdptool add SP
sudo rfcomm listen /dev/rfcomm0 1
```

Then modify the script to connect to `/dev/rfcomm0` instead of advertising.

---

## Alternative: Simpler Approach (Use bluetooth-simple library)

The `advertise_service` function in pybluez has known issues on Raspberry Pi. We might need to modify the script to use a simpler approach or use system Bluetooth commands.

---

## Recommended Solution

For a quick fix to test if it's a permissions issue:

1. **Try running with sudo first:**
   ```bash
   sudo python3 bluetooth-thermal-sender.py
   ```

2. **If that works, then fix permissions properly:**
   ```bash
   sudo usermod -a -G bluetooth pi
   sudo usermod -a -G dialout pi
   # Log out and log back in
   ```

3. **If that doesn't work, we may need to modify the script** to use system Bluetooth instead of pybluez's advertise_service function.

