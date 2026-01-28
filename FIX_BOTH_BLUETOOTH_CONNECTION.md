# Fix: Can't Connect to Both EMG and Raspberry Pi via Bluetooth

Windows can handle multiple Bluetooth connections simultaneously, but sometimes you need to pair them one at a time. Here's how to fix it:

## Step 1: Pair ESP32 (EMG) First

**1. Make sure ESP32 is powered on and in pairing mode**

**2. Pair from Windows:**
   - Settings → Bluetooth & devices
   - Click "Add device" → "Bluetooth"
   - Look for "MyoWare_EMG"
   - Click "Pair"
   - Enter PIN if prompted

**3. Verify connection:**
   - Should show "Connected" (green checkmark)
   - Check Device Manager → Ports → Note COM port (e.g., COM8)

**4. Test ESP32 connection:**
   ```bash
   node test-bluetooth-connection.js
   ```
   Should find ESP32 on COM8 (or your port)

---

## Step 2: Pair Raspberry Pi (Thermal) Second

**1. Make sure Raspberry Pi is powered on and Bluetooth is discoverable:**
   ```bash
   # On Raspberry Pi (via SSH or physical access)
   sudo bluetoothctl show
   ```
   Should show: `Discoverable: yes`

**2. Pair from Windows:**
   - Settings → Bluetooth & devices
   - Click "Add device" → "Bluetooth"
   - Look for "raspberrypi"
   - Click "Pair"
   - Enter PIN if prompted (or confirm on Pi)

**3. Verify connection:**
   - Should show "Connected" (green checkmark)
   - Check Device Manager → Ports → Note COM port (e.g., COM9)

**4. Test Raspberry Pi connection:**
   ```bash
   node test-thermal-connection.js
   ```
   Should find Raspberry Pi on COM9 (or your port)

---

## Step 3: Verify Both Are Connected

**Check Device Manager:**
1. Press Win + X → Device Manager
2. Expand "Ports (COM & LPT)"
3. You should see TWO Bluetooth Serial ports:
   - One for ESP32 (e.g., COM8) - "MyoWare_EMG"
   - One for Raspberry Pi (e.g., COM9) - "raspberrypi"

**Check Bluetooth Settings:**
- Settings → Bluetooth & devices
- Both "MyoWare_EMG" and "raspberrypi" should show "Connected"

---

## Troubleshooting

### Issue: Can only see one device when scanning

**Solution:**
- Pair them one at a time (don't scan for both simultaneously)
- Pair ESP32 first, wait for it to connect
- Then pair Raspberry Pi

### Issue: One device keeps disconnecting

**Solution:**
1. Remove the problematic device from Bluetooth settings
2. Power cycle that device (turn off/on)
3. Re-pair it
4. Make sure it shows "Connected" (not just "Paired")

### Issue: Both show "Paired" but not "Connected"

**Solution:**
- Click the three dots (⋮) next to each device
- Click "Connect" if available
- Or remove and re-pair

### Issue: COM ports not showing up

**Solution:**
- Make sure both devices are actually "Connected" (not just "Paired")
- Check Device Manager → Ports
- Try unplugging/reconnecting the Bluetooth adapter if using external one
- Restart Windows Bluetooth: Settings → Bluetooth → Toggle OFF, wait 5s, Toggle ON

---

## Testing Both Connections

### Test EMG Connection:
```bash
node test-bluetooth-connection.js
```
Should find ESP32 on COM8 (or your port)

### Test Thermal Connection:
```bash
node test-thermal-connection.js
```
Should find Raspberry Pi on COM9 (or your port)

### Test Both Together:
```bash
# Terminal 1: EMG
node bluetooth-receiver.js COM8

# Terminal 2: Thermal
node bluetooth-thermal-receiver.js COM9

# Terminal 3: App
npm run dev
```

Or use the combined script:
```bash
npm run start:emg  # This starts EMG server + receiver
# Then in another terminal:
node bluetooth-thermal-receiver.js COM9
```

---

## Quick Fix Checklist

- [ ] ESP32 powered on
- [ ] Raspberry Pi powered on
- [ ] Both paired in Windows (one at a time)
- [ ] Both show "Connected" (not just "Paired")
- [ ] Both COM ports visible in Device Manager
- [ ] Test each connection individually first
- [ ] Then test both together

---

## Summary

**Pair them one at a time:**
1. Pair ESP32 first → Wait for "Connected"
2. Pair Raspberry Pi second → Wait for "Connected"
3. Both should work simultaneously

**If still not working:**
- Remove both devices
- Power cycle both devices
- Re-pair them one at a time
- Test each individually before trying both
