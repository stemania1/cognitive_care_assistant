# Fix: "The device does not have a serial port service" / No COM port (no Wi‑Fi)

When **Wi‑Fi isn’t an option**, you need the Pi to advertise the **Serial Port Profile (SPP)** so Windows creates a COM port. Then the bridge can connect.

---

## One-time setup on the Pi (automated)

**On your PC**, copy the script to the Pi, then run it **on the Pi** over SSH:

```powershell
scp setup-pi-bluetooth-spp-for-windows.sh pi@192.168.254.200:/home/pi/
```

**On the Pi (SSH):**

```bash
chmod +x setup-pi-bluetooth-spp-for-windows.sh
sudo bash setup-pi-bluetooth-spp-for-windows.sh
```

The script will:

- Detect the correct `bluetoothd` path (Bookworm uses `/usr/libexec/bluetooth/bluetoothd`)
- Add the `-C` compatibility flag and register SPP with `sdptool add SP`
- Restart Bluetooth and show whether **Serial Port** appears in `sdptool browse local`

If Bluetooth **fails to start** after this, remove the override and use the fallback below.

---

## If the script breaks Bluetooth (service won’t start)

Remove the override and use only the post-start SPP step (no `-C`):

**On the Pi:**

```bash
sudo nano /etc/systemd/system/bluetooth.service.d/spp.conf
```

Replace the contents with **only**:

```ini
[Service]
ExecStartPost=/bin/sh -c '/usr/bin/sdptool add SP || true'
```

Save, then:

```bash
sudo systemctl daemon-reload
sudo systemctl restart bluetooth
sudo systemctl status bluetooth
```

Then run SPP manually and check:

```bash
sudo sdptool add SP
sdptool browse local
```

Look for **Serial Port** in the output.

---

## On Windows: add the COM port again

1. Open **Control Panel** → **Devices and Printers** (Win+R → `control printers`).
2. Right-click **raspberrypi** → **Properties** → **COM Ports** tab.
3. Click **Add** → **Outgoing** → select **raspberrypi**.
4. Windows should now offer the serial port (no more “does not have a serial port service”).
5. Note the COM number (e.g. **COM9**), then **OK**.

---

## Using the thermal sensor over this COM port

Because we’re using the system SPP (not the Python RFCOMM server), you use **rfcomm** and the **rfcomm sender** script.

### On the Pi (each session)

**Terminal 1 – listen for the Windows connection (leave running):**

```bash
sudo rfcomm watch hci0
```

You’ll see “Waiting for connection on channel 1”. When Windows connects (e.g. when you run the bridge), it will say “Connection from … to /dev/rfcomm0”. Leave this running.

**Terminal 2 – after `/dev/rfcomm0` appears (e.g. after Windows has connected once), run the thermal sender:**

```bash
cd /home/pi
python3 bluetooth-thermal-sender-rfcomm.py
```

This script waits for `/dev/rfcomm0`, then sends thermal data over it. Same JSON format as the original sender, so the Windows bridge works as before.

### On the PC

1. Start the app: `npm run dev`.
2. Run the bridge (use the COM port you added):  
   `node bluetooth-thermal-receiver.js COM9`
3. In the app, set connection to **Bluetooth** and connect the sensor.

---

## Summary

| Step | Where | Action |
|------|--------|--------|
| Once | Pi | Create `bluetooth.service.d/spp.conf` with `-C` and `sdptool add SP`, restart bluetooth |
| Once | Windows | Add Outgoing COM port for raspberrypi |
| Each time | Pi | Terminal 1: `sudo rfcomm watch hci0` |
| Each time | Pi | Terminal 2 (after connection): `python3 bluetooth-thermal-sender-rfcomm.py` |
| Each time | PC | `node bluetooth-thermal-receiver.js COM9` and use the app |
