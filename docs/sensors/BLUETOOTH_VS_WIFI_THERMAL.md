# Thermal sensor: Wi‑Fi vs Bluetooth

## Recommendation: use Wi‑Fi when the Pi is on your network

When the Pi is on the **same Wi‑Fi as your PC** (e.g. at 192.168.254.200):

- **Use Wi‑Fi mode** in the app (Sensors → Wi‑Fi).
- No COM port, no Bluetooth pairing drops, no bridge script.
- The Pi runs its **HTTP thermal server**; the app talks to it over the network.

### Quick Wi‑Fi setup

1. **On the Pi (SSH):** Run the thermal HTTP server (same one you use for Wi‑Fi):
   ```bash
   cd /home/pi
   python3 raspberry_pi_thermal_server.py
   ```
   Or, if you use a systemd service: `sudo systemctl start amg883-headless` (or whatever your service is named).

2. **In the app:** Sensors → set connection to **Wi‑Fi** → **Connect to Sensor**.

3. The app will use `RASPBERRY_PI_IP` (e.g. 192.168.254.200) from config. No Bluetooth or COM port needed.

---

## When to use Bluetooth

Use **Bluetooth** only when:

- The Pi has **no Wi‑Fi** (or you don’t want it on the network), and
- You’re okay dealing with:
  - Windows often **not showing a COM port** for the Pi (no “serial port service”),
  - Connections that **drop** and need re-pairing or reconnecting.

Getting a COM port on Windows requires the Pi to advertise the **Serial Port Profile (SPP)**. On newer Raspberry Pi OS this often doesn’t work reliably (sdptool / bluetoothd issues), so Bluetooth is best treated as a fallback when Wi‑Fi isn’t available.

---

## Summary

| Situation                         | Use      | Why                                      |
|----------------------------------|----------|------------------------------------------|
| Pi on same Wi‑Fi as PC           | **Wi‑Fi**| Stable, no COM port, no Bluetooth setup  |
| Pi has no Wi‑Fi / off network    | Bluetooth| Only option; may need COM port + reconnects |

You can switch between Wi‑Fi and Bluetooth anytime in the app (Sensors → Wi‑Fi / Bluetooth).
