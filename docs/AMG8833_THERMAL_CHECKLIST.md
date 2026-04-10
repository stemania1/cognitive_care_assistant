# AMG8833 thermal sensor — hardware & software checklist

Use this when live thermal data does not appear in Cognitive Care Assistant.

## Wiring (AMG8833 breakout → Raspberry Pi)

| AMG8833 pin | Pi GPIO / header |
|-------------|------------------|
| VIN / 3.3V  | **3.3V** (not 5V) |
| GND         | **GND** |
| SDA         | **GPIO2 (SDA)** — pin 3 |
| SCL         | **GPIO3 (SCL)** — pin 5 |

- Use short wires; bad joints cause intermittent I2C.
- Confirm the module is **3.3V logic** (most AMG8833 boards are).

## Power

- Pi must boot cleanly; undervoltage (`lightning` icon) can cause flaky I2C.
- `vcgencmd get_throttled` should return `0x0` on Pi.

## I2C on the Pi

```bash
sudo raspi-config   # Interface Options → I2C → Enable
sudo apt update && sudo apt install -y i2c-tools
sudo i2cdetect -y 1
```

Default **AMG8833 I2C address** is **0x69** (some boards 0x68). You should see `69` or `68` in the grid.

## Libraries (Python on Pi)

```bash
pip3 install --break-system-packages adafruit-circuitpython-amg88xx adafruit-blinka
# or in a venv:
pip install adafruit-circuitpython-amg88xx adafruit-blinka
```

## Standalone test (bypasses Next.js)

From the project repo on the Pi (or copy the script):

```bash
python3 tools/amg8833_diag.py
# or:
python3 scripts/test_amg8833_standalone.py
```

If this prints temperatures, hardware + I2C + Python libs are OK; focus on network and `raspberry_pi_thermal_server.py`.

## Thermal server on the Pi

```bash
python3 "sensor code/thermal_sensor/raspberry_pi_thermal_server.py"
# HTTP:  http://<pi-ip>:8091/thermal-data
# WS:    ws://<pi-ip>:8092
```

Quick check from your PC:

```bash
curl -s http://<pi-ip>:8091/thermal-data | head -c 400
```

You should see JSON with `"thermal_data": [[...8 rows...]]`.

## Cognitive Care Assistant (Next.js)

1. Match **`src/app/config/sensor-config.ts`** `CONNECTION_MODE` and Pi IP to your setup (`wifi` / `usb` / `bluetooth`).
2. **Wi‑Fi/USB:** browser polls `/api/thermal?ip=...&port=8091` → server proxies to the Pi. Ensure the Pi IP is reachable from the machine running `next dev`.
3. **Bluetooth:** run `node bluetooth-thermal-receiver.js COMx` on Windows and the Pi sender script; data posts to `/api/thermal/bt`.

## Common software issues (fixed in repo)

- **Bluetooth cache blocking Pi:** `/api/thermal` no longer prefers Bluetooth when the client sends `?ip=` for the Pi.
- **WebSocket frames ignored:** Pi payloads without `type` are now accepted if `thermal_data` is present; server also sends `type: thermal_data`.

## Remaining hardware risks

- Wrong voltage on VIN can damage the sensor.
- Long or loose I2C wires cause NACKs and empty reads.
- Some USB hubs interfere with Pi power — use a quality supply.
