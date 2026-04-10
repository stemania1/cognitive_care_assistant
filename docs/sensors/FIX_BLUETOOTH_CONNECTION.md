# Fix: ESP32 in Bluetooth List But Won't Connect

If "MyoWare_EMG" appears in Windows Bluetooth settings but won't connect, try these steps:

## Step 1: Remove and Re-Pair the Device

1. **Open Settings → Bluetooth & devices**
2. **Find "MyoWare_EMG" in the list**
3. **Click the three dots (⋮) next to it**
4. **Click "Remove device"**
5. **Confirm removal**

6. **Power cycle your ESP32:**
   - Turn off/unplug ESP32
   - Wait 5 seconds
   - Turn on/plug back in

7. **Re-pair the device:**
   - Settings → Bluetooth & devices → Add device
   - Click "Bluetooth" (not "Everything else")
   - Look for "MyoWare_EMG"
   - Click "Pair"

8. **Make sure it shows as "Connected"** (green checkmark, not just "Paired")

---

## Step 2: Check Bluetooth Service

**Open PowerShell as Administrator** and run:

```powershell
Get-Service bthserv
```

If it's not running:
```powershell
Start-Service bthserv
Set-Service bthserv -StartupType Automatic
```

---

## Step 3: Check Device Manager for COM Port

After pairing, check if a COM port was created:

1. **Press Win + X → Device Manager**
2. **Expand "Ports (COM & LPT)"**
3. **Look for "Standard Serial over Bluetooth link"** or similar
4. **Note the COM port number** (e.g., COM8)

**If no COM port appears:**
- The Bluetooth Serial profile might not be working
- Try removing and re-pairing again
- Check if ESP32 Bluetooth code is set to Serial mode

---

## Step 4: Check ESP32 Status

**Verify ESP32 is in pairing mode:**
- Check the ESP32 code: Is it advertising Bluetooth?
- LED should blink/change when in pairing mode
- Try uploading the Bluetooth code again to ESP32

---

## Step 5: Restart Bluetooth Service

**If still not connecting, restart Bluetooth:**

**PowerShell (as Administrator):**
```powershell
Restart-Service bthserv
```

Or via GUI:
1. Settings → Bluetooth & devices
2. Toggle Bluetooth OFF
3. Wait 5 seconds
4. Toggle Bluetooth ON
5. Try pairing again

---

## Step 6: Check Windows Bluetooth Settings

1. **Settings → Bluetooth & devices → More Bluetooth settings**
2. **Check "Allow Bluetooth devices to find this PC"**
3. **Check "Alert me when a new Bluetooth device wants to connect"**
4. **Click "OK"**

---

## Step 7: Try Alternative Connection Method

If pairing via Settings doesn't work:

1. **Open Control Panel → Hardware and Sound → Devices and Printers**
2. **Click "Add a device"**
3. **Select "MyoWare_EMG"**
4. **Follow pairing wizard**

---

## Step 8: Update Bluetooth Drivers

If nothing works, try updating Bluetooth drivers:

1. **Device Manager → Bluetooth**
2. **Right-click your Bluetooth adapter**
3. **Update driver → Search automatically**

---

## Quick Test After Fixing

Once connected, test the connection:

```bash
node test-bluetooth-connection.js
```

Or manually with COM port:
```bash
node bluetooth-receiver.js COM8
```

---

## Most Common Fix

**90% of the time, this fixes it:**
1. Remove device from Bluetooth settings
2. Power cycle ESP32 (turn off/on)
3. Re-pair in Windows Settings
4. Make sure it shows as "Connected" (not just "Paired")
