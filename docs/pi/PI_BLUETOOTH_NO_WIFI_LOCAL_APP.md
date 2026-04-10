# Connect Pi Over Bluetooth (No Wi‑Fi, App Running Locally)

Use this when:
- **No Wi‑Fi** (or Wi‑Fi is off)
- The **app is running on your PC** at `http://localhost:3000`
- You want thermal data from the Raspberry Pi via **Bluetooth only**

Data path: **AMG8833 → Pi (Python) → Bluetooth Serial → PC (Node bridge) → `localhost:3000/api/thermal/bt` → app**

---

## Quick walkthrough: app (local) ↔ Pi via Bluetooth

1. **One-time:** Prepare the Pi for Bluetooth (discoverable, sensor + Bluetooth libs, copy `bluetooth-thermal-sender.py` to the Pi). Install the bridge on your PC: `npm install serialport @serialport/parser-readline` in the app repo.
2. **Start the app** on your PC: `npm run dev` → open **http://localhost:3000**.
3. **Power the Pi** (no USB data, no Wi‑Fi). On the PC: **Settings → Bluetooth** → pair with the Pi; note the **COM port** (e.g. COM9) under **Ports (COM & LPT)** in Device Manager.
4. **On the Pi:** run `python3 bluetooth-thermal-sender.py` (serial console or keyboard/monitor if no Wi‑Fi).
5. **On the PC** (second terminal): `node bluetooth-thermal-receiver.js COM9` (use your COM port). The bridge POSTs thermal data to `http://localhost:3000/api/thermal/bt`.
6. **In the browser:** open the app → **Sensors** or **Sleep Behaviors** → set connection to **Bluetooth** → **Start Sensor** / **Connect to Sensor**. Thermal data should appear.

Details for each step are below.

---

## One-time setup (do this while you still have Wi‑Fi or a way onto the Pi)

### 1. Prepare the Pi for Bluetooth

You need the Pi able to run the Bluetooth sender and to be **discoverable** so your PC can pair. Do one of:

**Option A – Over Wi‑Fi/SSH (easiest)**  
While the Pi is on Wi‑Fi, SSH in and run:

```bash
# Copy the autostart script to the Pi (from your PC)
scp setup-pi-bluetooth-autostart.sh pi@<PI_IP>:~/

# On the Pi
ssh pi@<PI_IP>
chmod +x setup-pi-bluetooth-autostart.sh
sudo bash setup-pi-bluetooth-autostart.sh
```

That makes the Pi Bluetooth-discoverable on every boot. Details: **SETUP_PI_BLUETOOTH_NO_WIFI.md**.

**Option B – No Wi‑Fi at all**  
Use a keyboard/monitor on the Pi, or copy scripts via USB. See **SETUP_PI_BLUETOOTH_NO_WIFI.md** (manual / USB methods).

### 2. Install what the Pi needs

On the Pi (SSH or keyboard):

```bash
# Bluetooth
sudo apt update
sudo apt install -y python3-bluetooth libbluetooth-dev
pip3 install pybluez --user
# or: pip3 install pybluez --break-system-packages

# Sensor
pip3 install --user adafruit-blinka adafruit-circuitpython-amg88xx
```

### 3. Copy the Bluetooth sender script to the Pi

From your PC (while you can reach the Pi, e.g. over Wi‑Fi):

```bash
scp "sensor code/thermal_sensor/bluetooth-thermal-sender.py" pi@<PI_IP>:/home/pi/
```

On the Pi: `chmod +x bluetooth-thermal-sender.py`

### 4. Make Bluetooth thermal sender start at boot (for demos without SSH)

Do this **once** while you have SSH (e.g. over Wi‑Fi). After this, when you power the Pi at the demo, the Bluetooth sender will start automatically — no need to SSH in.

**On your PC:**

```bash
# Copy the Bluetooth sender script and the systemd service to the Pi
scp "sensor code/thermal_sensor/bluetooth-thermal-sender.py" pi@<PI_IP>:/home/pi/
scp scripts/bluetooth-thermal-sender.service pi@<PI_IP>:/home/pi/
```

**On the Pi (SSH in):**

```bash
sudo cp /home/pi/bluetooth-thermal-sender.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable bluetooth-thermal-sender.service
sudo systemctl start bluetooth-thermal-sender.service
```

Also ensure Bluetooth is discoverable on boot (run **setup-pi-bluetooth-autostart.sh** once if you haven’t). Then at the demo: power the Pi → wait ~10 seconds → pair from the PC if needed → run the bridge with the Bluetooth COM port. The sender will already be running.

### 5. Demo without keyboard or monitor

You do **not** need a keyboard or monitor on the Pi at the demo. Do the **one-time setup** below while you have SSH (Wi‑Fi). After that, at the demo you only:

- **Power the Pi** (and connect the **USB cable** if using USB thermal).
- On the PC: **pair over Bluetooth** (if using Bluetooth), then run the **bridge** with the correct COM port.

**One-time setup (over SSH, while you have Wi‑Fi):**

1. **Bluetooth thermal at boot**  
   Copy and enable the Bluetooth sender service (section 4 above). Run **setup-pi-bluetooth-autostart.sh** once so the Pi is discoverable on boot.

2. **USB thermal at boot** (optional, if you want USB as well)  
   Copy `usb-serial-thermal-sender.py` and `scripts/usb-thermal-sender.service` to the Pi. On the Pi:
   ```bash
   sudo cp /home/pi/usb-thermal-sender.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable usb-thermal-sender.service
   ```

3. **Reboot the Pi once** so both services are active: `sudo reboot`.

At the demo: no SSH, no keyboard, no monitor — just power (and USB cable if using USB). The senders start automatically.

### 6. Desktop UI and shortcuts (optional — only if you want keyboard + monitor)

If you prefer to use a **keyboard and monitor** on the Pi at the demo, you can install the desktop and add double‑click shortcuts to start the thermal sender.

**Install the desktop (only if you have Raspberry Pi OS Lite):**

```bash
# On the Pi (over SSH)
sudo apt update
sudo apt install -y raspberrypi-ui-mods
sudo raspi-config
# → System Options → Boot / Auto Login → Desktop Autologin (or Desktop)
sudo reboot
```

**Add desktop shortcuts to start the sender:**

From your PC (project folder), copy the launcher and shortcuts to the Pi:

```bash
scp scripts/thermal-sender-desktop.sh pi@<PI_IP>:/home/pi/
scp scripts/Start-Thermal-Sender-USB.desktop pi@<PI_IP>:/home/pi/
scp scripts/Start-Thermal-Sender-Bluetooth.desktop pi@<PI_IP>:/home/pi/
```

On the Pi (SSH):

```bash
chmod +x /home/pi/thermal-sender-desktop.sh
mkdir -p /home/pi/Desktop
cp /home/pi/Start-Thermal-Sender-USB.desktop /home/pi/Desktop/
cp /home/pi/Start-Thermal-Sender-Bluetooth.desktop /home/pi/Desktop/
chmod +x /home/pi/Desktop/*.desktop
```

Ensure the sender scripts are on the Pi: `bluetooth-thermal-sender.py` and `usb-serial-thermal-sender.py` in `/home/pi/` (see sections 3 and “Receiving thermal data over USB”). At the demo: plug in keyboard and monitor, boot to desktop, double‑click **Start Thermal Sender (USB)** or **Start Thermal Sender (Bluetooth)**. A terminal will open and run the sender; leave it open.

### 7. Install the bridge on your PC (once)

On the PC where the app runs:

```bash
cd <your-project-dir>
npm install serialport @serialport/parser-readline
```

---

## Every time you use it (no Wi‑Fi, app local)

### Step 1: Start the app and bridge

```powershell
cd <your-project-dir>
npm run dev
```

This starts **both** the Next.js app and the thermal bridge. The app will be at **http://localhost:3000**; the bridge will try to auto-detect the Pi’s COM port (Bluetooth or USB). To use a specific port (e.g. COM9 for Bluetooth or COM4 for USB), set it in `.env.local`:

```text
THERMAL_BLUETOOTH_PORT=COM9
```

Leave the terminal running. To run only the app without the bridge, use `npm run dev:next`.

### Step 2: Power the Pi and pair over Bluetooth (if not already paired)

1. Power the Pi (no Ethernet, Wi‑Fi off or disconnected).
2. On your PC: **Settings → Bluetooth & devices → Add device → Bluetooth**.
3. Choose **raspberrypi** (or your Pi’s name) and complete pairing.
4. In **Device Manager → Ports (COM & LPT)** note the COM port (e.g. **COM9**) for “Standard Serial over Bluetooth link”.

### Step 3: Run the Bluetooth sender on the Pi

**If you set up the service in section 4 (Bluetooth sender at boot), the sender is already running — skip to Step 4.**

Otherwise you need a way to run a command on the Pi without Wi‑Fi (serial console, keyboard + monitor, or SSH over Bluetooth). On the Pi:

```bash
cd /home/pi
python3 bluetooth-thermal-sender.py
```

You should see something like: “Bluetooth server started… Waiting for connection from computer…”. Leave it running.

### Step 4: Bridge (already running with `npm run dev`)

If you started the app with `npm run dev`, the thermal bridge is already running in the same terminal. It will auto-detect the COM port or use `THERMAL_BLUETOOTH_PORT` from `.env.local`. To run the bridge in a separate terminal instead, use:

```powershell
node bluetooth-thermal-receiver.js COM9
```

Replace **COM9** with the COM port from Step 2. The bridge forwards serial data to **http://localhost:3000/api/thermal/bt**.

You should see: “Bluetooth Serial port opened… Waiting for thermal data…” and then “Forwarded to Next.js API” when data flows.

### Step 5: Use the app

1. Open **http://localhost:3000** in the browser.
2. Go to **Sensors** or **Sleep Behaviors**.
3. Set connection to **Bluetooth**.
4. Click **Start Sensor** (on Sleep Behaviors) or **Connect to Sensor** (on Sensors).

Thermal data should appear with **no Wi‑Fi**: Pi → Bluetooth → bridge → local app.

---

## Receiving thermal data over USB (COM port)

You can get thermal data over the **USB cable** using the same app and bridge. When the Pi is connected by USB, it can show up as **USB Serial Device (COM3)** on the PC. Use that COM port for thermal instead of (or in addition to) Wi‑Fi or Bluetooth.

**Data path:** **AMG8833 → Pi (Python) → USB serial → PC (same bridge) → `localhost:3000/api/thermal/bt` → app**

### One-time (Pi)

1. Copy the USB serial sender to the Pi (e.g. over Wi‑Fi):
   ```bash
   scp "sensor code/thermal_sensor/usb-serial-thermal-sender.py" pi@<PI_IP>:/home/pi/
   ```
2. On the Pi: `chmod +x usb-serial-thermal-sender.py`  
   No Bluetooth packages are required for this path; the Pi only needs the AMG8833 libraries.

### Every time (USB thermal)

1. **PC:** Start the app: `npm run dev` → open **http://localhost:3000**.
2. **Connect** the Pi to the PC with the **USB data cable**. In Device Manager → **Ports (COM & LPT)** note the port (e.g. **COM3** or **COM4** — try the one that opens successfully).
3. **Pi:** Run the USB serial sender:
   ```bash
   python3 usb-serial-thermal-sender.py
   ```
   It waits for `/dev/ttyGS0` to appear (it appears when the PC has the COM port open or the link is ready).
4. **PC** (second terminal): run the bridge with the USB COM port:
   ```powershell
   node bluetooth-thermal-receiver.js COM3
   ```
   If you get **"Unknown error code 31"** (common with the Pi’s USB serial on Windows), use the **Python bridge** instead:
   ```powershell
   pip install pyserial
   python usb-thermal-receiver.py COM3
   ```
   Use your actual COM port number. Both bridges POST to the same API (`/api/thermal/bt`).
5. In the app, set connection to **Bluetooth** and **Start Sensor** / **Connect to Sensor**. Thermal data will come from the USB serial stream.

You can use **either** Bluetooth **or** USB serial (or Wi‑Fi) for thermal; the app doesn’t care which physical link the bridge uses.

### USB only (no Wi‑Fi, no Bluetooth)

When Wi‑Fi and Bluetooth aren’t available, use **USB serial only**:

1. **Pi must be in serial gadget mode (g_serial).** The boot config should have `modules-load=dwc2,g_serial` in `/boot/firmware/cmdline.txt`. (If you see “USB device not recognized” or no COM port, avoid `g_multi`; use `g_serial` for serial only.)
2. **Connect the Pi to the PC** with the USB data cable. In Device Manager → **Ports (COM & LPT)** you should see **USB Serial Device (COMx)**. Note the COM number.
3. **On the PC:** Start the app (`npm run dev`), then run the bridge (use the Python one if Node gives error 31):
   ```powershell
   python usb-thermal-receiver.py COM3
   ```
   Use the COM port that works (often COM3 or COM4).
4. **On the Pi:** The thermal sender must be running. If you can’t SSH (no Wi‑Fi), set it to start at boot once (see **USB thermal sender at boot** below).

**USB thermal sender at boot (no SSH needed later)**  
Do this once while you have SSH (e.g. over Wi‑Fi):

```bash
# From your PC (replace with your Pi’s IP if needed)
scp scripts/usb-thermal-sender.service pi@192.168.254.200:/home/pi/

# On the Pi
ssh pi@192.168.254.200
sudo cp /home/pi/usb-thermal-sender.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable usb-thermal-sender.service
sudo systemctl start usb-thermal-sender.service
```

After that, whenever the Pi boots and is connected via USB, the sender will start and wait for the PC to open the COM port; then thermal data will flow.

---

## Quick checklist (no Wi‑Fi, app local)

| Step | Where | Action |
|------|--------|--------|
| 1 | PC | `npm run dev` (app at localhost:3000) |
| 2 | PC | Pair Pi in Settings → Bluetooth; note COM port |
| 3 | Pi | `python3 bluetooth-thermal-sender.py` (no Wi‑Fi needed once script is on Pi) |
| 4 | PC | `node bluetooth-thermal-receiver.js COM9` (use your COM port) |
| 5 | Browser | Open app → set **Bluetooth** → Start/Connect sensor |

---

## Addressing the API (for the bridge)

The bridge must POST to your **local** app:

- **URL:** `http://localhost:3000/api/thermal/bt`
- **Method:** POST  
- **Headers:** `Content-Type: application/json`
- **Body:** JSON with at least `thermal_data` (e.g. 8×8 array). Optional: `timestamp`, `sensor_info`, `grid_size`, `type`.

`bluetooth-thermal-receiver.js` is already configured to use:

```text
NEXTJS_API_URL = http://localhost:3000/api/thermal/bt
```

So as long as the app is running locally, the default is correct. For a different port:

```powershell
$env:NEXTJS_API_URL="http://localhost:3001/api/thermal/bt"; node bluetooth-thermal-receiver.js COM9
```

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| “No Bluetooth data yet” in app | Bridge running? Pi sender running? COM port correct? App set to **Bluetooth**? |
| “Cannot open serial port” | Pi paired and connected in Bluetooth settings; correct COM port; no other app using that port. |
| Pi “Waiting for connection” forever | Start **bluetooth-thermal-receiver.js** on the PC so the Pi’s Bluetooth serial client can connect. |
| App freezes when Wi‑Fi is off | Ensure connection is set to **Bluetooth** (no `ip` in request). See in-app note: “Bluetooth mode. Use a bridge that POSTs…” |  
| Windows shows “USB Serial Device (COMx)” but no USB Ethernet | Pi is in **serial gadget** mode only. Enable USB Ethernet: see **Enabling USB Ethernet on the Pi** below. |
| Node or Python: **error 31** / **Cannot configure port** on COM3 | The **Windows driver** for the Pi’s USB serial device is failing. See **USB serial error 31 (Windows driver)** below. Meanwhile use **Wi‑Fi** or **Bluetooth** for thermal. |

### USB serial error 31 (Windows driver)

If both the Node and Python bridges fail with “Unknown error code 31” or “Cannot configure port” (PermissionError 31), the Windows driver for the Pi’s **USB Serial Device** is not accepting serial settings. Try:

1. **Change the driver**  
   - Open **Device Manager** → **Ports (COM & LPT)** → right‑click **USB Serial Device (COM3)**.  
   - **Update driver** → **Browse my computer** → **Let me pick from a list**.  
   - Try **USB Serial Device** or **Communications Port** or **Standard COM port** if listed.  
   - Apply and test the bridge again.

2. **Unplug/replug and retry**  
   Use a different USB port and a data‑capable cable; then run the bridge again.

3. **Use Wi‑Fi or Bluetooth instead**  
   Thermal over **Wi‑Fi** (Pi’s thermal server + app connection) or over **Bluetooth** (pair Pi, run `bluetooth-thermal-sender.py` on Pi and `node bluetooth-thermal-receiver.js COM9` on PC with the Bluetooth COM port) avoids the USB serial driver entirely.

### Enabling USB Ethernet on the Pi

If the Pi appears only as a COM port (no network adapter), switch the USB gadget to Ethernet. **Over SSH** (e.g. `ssh pi@192.168.254.200`):

1. **Enable the USB device controller and ethernet gadget** in `/boot/config.txt`:
   ```bash
   echo "dtoverlay=dwc2" | sudo tee -a /boot/config.txt
   ```
   (If that line is already there, skip.)

2. **Load the ethernet gadget** in `/boot/cmdline.txt`:  
   Open the file: `sudo nano /boot/cmdline.txt`.  
   Find `rootwait` and insert **`modules-load=dwc2,g_ether`** right after it (same line, space-separated).  
   Example before: `... rootwait quiet ...`  
   Example after: `... rootwait modules-load=dwc2,g_ether quiet ...`  
   Save (Ctrl+O, Enter, Ctrl+X).

3. **Reboot**: `sudo reboot`. Unplug and replug the Pi’s USB cable to the PC.

4. **On Windows:** In Device Manager, check for a new device under **Other devices**; if it appears, install the **Remote NDIS Compatible** driver (see main doc). Then set the new adapter’s IPv4 to **192.168.7.1**, subnet **255.255.255.0**. You can then SSH to the Pi at **192.168.7.2** when Wi‑Fi is not available.

**Note:** Using `g_ether` replaces the serial gadget, so the COM port may disappear. To have both serial and Ethernet, use `g_multi` instead of `g_ether` (and add `g_multi` to `modules-load=...`); Windows may then show both a COM port and an RNDIS adapter.

More detail: **THERMAL_BLUETOOTH_SETUP.md** (full Bluetooth thermal setup), **SETUP_PI_BLUETOOTH_NO_WIFI.md** (making Pi discoverable without Wi‑Fi).
