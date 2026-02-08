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

### 4. Install the bridge on your PC (once)

On the PC where the app runs:

```bash
cd c:\Users\bobby\cognitive_care_assistant
npm install serialport @serialport/parser-readline
```

---

## Every time you use it (no Wi‑Fi, app local)

### Step 1: Start the app locally

```powershell
cd c:\Users\bobby\cognitive_care_assistant
npm run dev
```

Leave this running. The app will be at **http://localhost:3000**.

### Step 2: Power the Pi and pair over Bluetooth (if not already paired)

1. Power the Pi (no Ethernet, Wi‑Fi off or disconnected).
2. On your PC: **Settings → Bluetooth & devices → Add device → Bluetooth**.
3. Choose **raspberrypi** (or your Pi’s name) and complete pairing.
4. In **Device Manager → Ports (COM & LPT)** note the COM port (e.g. **COM9**) for “Standard Serial over Bluetooth link”.

### Step 3: Run the Bluetooth sender on the Pi

You need a way to run a command on the Pi without Wi‑Fi:

- **Serial console** (USB‑to‑serial cable to Pi’s UART), or  
- **Keyboard + monitor**, or  
- **Already paired and have SSH over Bluetooth** (advanced). See **[SSH_OVER_BLUETOOTH.md](SSH_OVER_BLUETOOTH.md)** for PAN (real SSH) or RFCOMM (serial console).

Then on the Pi:

```bash
cd /home/pi
python3 bluetooth-thermal-sender.py
```

You should see something like: “Bluetooth server started… Waiting for connection from computer…”. Leave it running.

### Step 4: Run the bridge on your PC

In a **second** terminal on the PC (app still running in the first):

```powershell
cd c:\Users\bobby\cognitive_care_assistant
node bluetooth-thermal-receiver.js COM9
```

Replace **COM9** with the COM port from Step 2.  
The bridge forwards Bluetooth serial data to **http://localhost:3000/api/thermal/bt**.

You should see: “Bluetooth Serial port opened… Waiting for thermal data…” and then “Forwarded to Next.js API” when data flows.

### Step 5: Use the app

1. Open **http://localhost:3000** in the browser.
2. Go to **Sensors** or **Sleep Behaviors**.
3. Set connection to **Bluetooth**.
4. Click **Start Sensor** (on Sleep Behaviors) or **Connect to Sensor** (on Sensors).

Thermal data should appear with **no Wi‑Fi**: Pi → Bluetooth → bridge → local app.

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

More detail: **THERMAL_BLUETOOTH_SETUP.md** (full Bluetooth thermal setup), **SETUP_PI_BLUETOOTH_NO_WIFI.md** (making Pi discoverable without Wi‑Fi).
