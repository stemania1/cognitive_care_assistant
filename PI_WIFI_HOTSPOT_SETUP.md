# Connect Raspberry Pi via Wi‑Fi hotspot

Use this when the Pi can’t join your main network: create a **hotspot** (on your PC or phone), connect the Pi to it, then run the thermal server and use the app in **Wi‑Fi** mode.

---

## Option A: Windows PC as hotspot (PC and Pi only)

### 1. Turn on the hotspot on your PC

1. **Settings** → **Network & internet** → **Mobile hotspot** (or **Settings** → **Bluetooth & devices** → **Mobile hotspot** on some builds).
2. Turn **Mobile hotspot** **On**.
3. Note the **Network name** and **Password** (or set your own).
4. Under “Share my internet connection from”, choose **Wi‑Fi** or **Ethernet** (whichever your PC uses for the internet). The Pi only needs to be on the hotspot; it doesn’t need internet.

Windows usually uses **192.168.137.0/24**: the PC is **192.168.137.1**, and the Pi will get something like **192.168.137.2** or **192.168.137.3**.

### 2. Connect the Pi to the hotspot

You need to add the hotspot’s Wi‑Fi to the Pi **once**. Use whichever you have:

**If you can SSH into the Pi** (e.g. it’s still on your old network or you have another way in):

```bash
# On the Pi – add the hotspot (replace YOUR_HOTSPOT_NAME and YOUR_PASSWORD)
sudo raspi-config
# → System Options → Wireless LAN → set SSID and password to your hotspot
# then Finish and reboot if needed
```

Or edit Wi‑Fi config directly:

```bash
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
```

Add at the end (use your hotspot’s name and password):

```
network={
    ssid="YOUR_HOTSPOT_NAME"
    psk="YOUR_PASSWORD"
    key_mgmt=WPA-PSK
}
```

Save (Ctrl+O, Enter), exit (Ctrl+X), then:

```bash
sudo wpa_cli -i wlan0 reconfigure
# or reboot: sudo reboot
```

**If the Pi has no network at all:** connect a keyboard and monitor, log in, and run the same `nano /etc/wpa_supplicant/wpa_supplicant.conf` and `wpa_cli` (or `reboot`) on the Pi.

### 3. Find the Pi’s IP on the hotspot

**On the Pi** (SSH or keyboard):

```bash
hostname -I
```

The first number is the Pi’s IP (e.g. **192.168.137.2**).

**On the PC:**  
**Settings** → **Network & internet** → **Mobile hotspot** → check **Connected devices** (some builds show the Pi and its IP).

### 4. Point the app at the Pi (primary + backup)

In the project, edit **`src/app/config/sensor-config.ts`**:

- **Primary** (e.g. Pi on hotspot): set `RASPBERRY_PI_IP` to the Pi’s hotspot IP (from `hostname -I`), e.g. `'192.168.137.2'`.
- **Backup** (local Wi‑Fi): set `RASPBERRY_PI_IP_BACKUP` to your Pi’s local network IP (e.g. `'192.168.254.200'`). If the primary is unreachable, the app will try the backup automatically.

Example when using hotspot as primary and local Wi‑Fi as backup:

```ts
RASPBERRY_PI_IP: '192.168.137.2',        // Pi on hotspot (primary)
RASPBERRY_PI_IP_BACKUP: '192.168.254.200',  // local Wi‑Fi (backup)
```

Set `RASPBERRY_PI_IP_BACKUP: ''` to disable backup. Save the file.

### 5. Run the thermal server on the Pi

SSH (using the Pi’s **hotspot** IP) or use the keyboard:

```bash
ssh pi@192.168.137.2
cd /home/pi
python3 raspberry_pi_thermal_server.py
```

If the script isn’t on the Pi yet, copy it from the PC (run this from the PC **before** the Pi is only on the hotspot, or after the Pi is on the hotspot and you know its IP):

```powershell
scp "sensor code/thermal_sensor/raspberry_pi_thermal_server.py" pi@192.168.137.2:/home/pi/
```

### 6. Use the app

1. Start the app: `npm run dev`, open http://localhost:3000.
2. Go to **Sensors** → set connection to **Wi‑Fi** → **Connect to Sensor**.

Thermal data should appear. No Bluetooth or COM port needed.

---

## Option B: Phone as hotspot (PC and Pi both join phone)

1. On the **phone**: turn on **Personal hotspot** / **Mobile hotspot**, note name and password.
2. **PC**: Connect the PC’s Wi‑Fi to the phone’s hotspot.
3. **Pi**: Add the same hotspot in `wpa_supplicant.conf` (or raspi-config) as in Option A, then reconnect or reboot.
4. **Find Pi IP:** On the Pi run `hostname -I`, or check the phone’s hotspot “Connected devices” if it shows IPs.
5. In **`sensor-config.ts`** set **`RASPBERRY_PI_IP`** to that IP (and add it to **`COMMON_IPS`** if you use discovery).
6. On the Pi run **`python3 raspberry_pi_thermal_server.py`**.
7. In the app: **Sensors** → **Wi‑Fi** → **Connect to Sensor**.

---

## Quick checklist (PC hotspot)

| Step | Where   | Action |
|------|--------|--------|
| 1    | PC     | Settings → Mobile hotspot → On, note name/password |
| 2    | Pi     | Add hotspot to `/etc/wpa_supplicant/wpa_supplicant.conf`, then `wpa_cli reconfigure` or reboot |
| 3    | Pi     | `hostname -I` → note IP (e.g. 192.168.137.2) |
| 4    | PC     | In `sensor-config.ts` set `RASPBERRY_PI_IP` to that IP |
| 5    | Pi     | `python3 raspberry_pi_thermal_server.py` |
| 6    | Browser| App → Sensors → Wi‑Fi → Connect to Sensor |

---

## Troubleshooting

- **Pi not on hotspot:** Check SSID and password in `wpa_supplicant.conf`; run `sudo wpa_cli -i wlan0 status` on the Pi to see current network.
- **Can’t reach Pi from PC:** Ensure the PC is using the hotspot (not another Wi‑Fi). Ping the Pi: `ping 192.168.137.2`.
- **App doesn’t connect:** Confirm `RASPBERRY_PI_IP` matches `hostname -I` on the Pi and the thermal server is running on the Pi.
