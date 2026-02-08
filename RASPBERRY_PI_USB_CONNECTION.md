# Raspberry Pi: Connect via USB

This guide enables **USB gadget (USB ethernet)** on your Raspberry Pi so you can plug it into your computer with a USB cable and reach the thermal sensor at a fixed IP—no Wi‑Fi needed. The thermal server does not need any code changes; it already listens on all interfaces (`0.0.0.0`).

---

## Requirements

- **Raspberry Pi 4**: Use the **USB-C power/data port** (the one you normally use for power). Only this port supports gadget mode.
- **Raspberry Pi Zero / Zero W**: Use the **micro-USB data port** (often labeled "USB").
- **Raspberry Pi 5**: USB gadget is supported; use the appropriate USB port per Pi 5 docs.
- A **USB data cable** (not charge-only) between the Pi and your PC.

---

## 1. Enable USB gadget on the Pi

SSH into the Pi (e.g. over Wi‑Fi first) or use a keyboard/monitor.

### 1.1 Edit `/boot/config.txt`

```bash
sudo nano /boot/firmware/config.txt
```

On older Raspberry Pi OS versions the file may be `/boot/config.txt` instead of `/boot/firmware/config.txt`.

Add this line at the end (if not already present):

```
dtoverlay=dwc2
```

Save and exit (Ctrl+O, Enter, Ctrl+X).

### 1.2 Edit the kernel command line

```bash
sudo nano /boot/firmware/cmdline.txt
```

Again, on older images it may be `/boot/cmdline.txt`. The line is one long line. **After** `rootwait` (with a space), add:

```
modules-load=dwc2,g_ether
```

So it looks like:

```
... rootwait modules-load=dwc2,g_ether ...
```

Do **not** add a newline; keep everything on one line. Save and exit.

### 1.3 Reboot

```bash
sudo reboot
```

After reboot, plug the Pi into your computer with the USB cable. On the Pi, check that the `usb0` interface exists:

```bash
ip link show usb0
```

You should see a `usb0` link (may be DOWN until the host side is configured).

---

## 2. Give the Pi a static IP on USB

So the app can connect to a fixed address (e.g. `192.168.7.2`), set a static IP on the Pi’s USB interface.

### 2.1 Edit `dhcpcd.conf`

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end:

```
# USB gadget (connect via USB cable to PC)
interface usb0
static ip_address=192.168.7.2/24
static routers=192.168.7.1
static domain_name_servers=192.168.7.1
```

Save and exit, then reboot again:

```bash
sudo reboot
```

---

## 3. Configure your computer (host)

When you plug the Pi in, your PC will get a new network adapter (e.g. "USB Ethernet", "RNDIS", "usb0").

- **Windows**: You may need to install an RNDIS/CDC driver so Windows sees the Pi as a network device. Once it appears, set the adapter’s IPv4 address to `192.168.7.1`, subnet `255.255.255.0`, no gateway needed.
- **macOS**: The interface often appears automatically. Set it to Manual, IP `192.168.7.1`, subnet `255.255.255.0`.
- **Linux**: Bring up the USB interface and set IP, e.g.  
  `sudo ip addr add 192.168.7.1/24 dev usb0` (or the name your system gives it).

After that, from your PC you should be able to ping the Pi:

```bash
ping 192.168.7.2
```

---

## 4. Use the app over USB

1. In the app, open **Sensors** or **Sleep Behaviors** and set the connection to **USB**.
2. In `src/app/config/sensor-config.ts`, ensure:
   - `CONNECTION_MODE: 'usb'` when using USB, or leave as `'wifi'` and only switch to USB in the UI.
   - `RASPBERRY_PI_IP_USB: '192.168.7.2'` (this is the Pi’s IP on the USB link).

The thermal server on the Pi listens on `0.0.0.0:8091` (HTTP) and `0.0.0.0:8092` (WebSocket), so it will accept connections on the USB interface at `192.168.7.2` with no code changes.

---

## 5. Using Bluetooth instead of USB

The in-app "Configure Pi over USB" utility has been removed (USB often doesn’t provide enough power for the Pi). To connect the app (running locally) to the Pi via **Bluetooth** and get sensor data into the app, see **[PI_BLUETOOTH_NO_WIFI_LOCAL_APP.md](PI_BLUETOOTH_NO_WIFI_LOCAL_APP.md)**.

---

## Troubleshooting

### Windows: "I don't see a USB Ethernet adapter"

Two things must be true: **the Pi is in USB gadget mode**, and **Windows is using a driver that exposes it as a network adapter**.

**Step 1 — Check Device Manager when the Pi is plugged in**

1. Plug the Pi into your PC (Pi 4: use the **USB-C power port**; use a **data-capable** cable).
2. Open **Device Manager** (Win + X → Device Manager).
3. Look for **any** new or changed device: **Other devices** → "Unknown device" (yellow mark), or **Network adapters** → "USB Ethernet" / "RNDIS". If you see an unknown device but nothing under Network adapters, Windows is using the wrong driver.

**Step 2 — Enable USB gadget on the Pi (if you haven't)**  
The Pi must be configured and rebooted first. If you have Wi‑Fi or SSH to the Pi, run `scripts/enable-pi-usb-gadget.sh` on the Pi and reboot. Then unplug/replug the Pi and check Device Manager again.

**Step 3 — Install or assign the RNDIS driver on Windows**  
In Device Manager, find the new device when the Pi is plugged in → Right‑click → **Update driver** → **Browse my computer** → **Let me pick** → **Network adapters** → choose **Remote NDIS Compatible Device** if listed. If not, search for "Raspberry Pi USB RNDIS driver Windows" and install a compatible driver, then set the new adapter's IP to **192.168.7.1**.

**Step 4 — Cable and port**  
Pi 4: only the **USB‑C power port** supports gadget mode. Use a **data** USB cable.

---

| Issue | What to try |
|-------|-------------|
| No `usb0` after reboot | Confirm `dtoverlay=dwc2` and `modules-load=dwc2,g_ether` are correct and that you used the correct USB port (Pi 4: USB-C data port). |
| Cannot ping 192.168.7.2 | Set the host adapter to `192.168.7.1/24` and ensure the Pi has rebooted after editing `dhcpcd.conf`. |
| Windows doesn’t see a new adapter | See **Windows: "I don't see a USB Ethernet adapter"** above (Device Manager + RNDIS). |
| App still can’t connect | Ensure you selected **USB** in the app and that `RASPBERRY_PI_IP_USB` is `192.168.7.2` (or the IP you set in `dhcpcd.conf`). |

---

## Optional: One-time setup script on the Pi

You can run the steps above once by hand, or use the script in this repo (run it on the Pi, e.g. via SSH):

```bash
# From your PC, copy and run the script on the Pi
scp scripts/enable-pi-usb-gadget.sh pi@192.168.254.200:
ssh pi@192.168.254.200 "chmod +x enable-pi-usb-gadget.sh && ./enable-pi-usb-gadget.sh"
```

Then reboot the Pi and plug it in via USB.
