# USB serial thermal (AMG8833 via microcontroller)

The AMG8833 is an **I2C** sensor. It does not speak USB. A **microcontroller or bridge board** (Arduino, ESP32, Raspberry Pi Pico, etc.) reads the 8×8 grid over I2C and sends **newline-delimited** frames to the PC over USB CDC (virtual COM port).

The Cognitive Care Assistant (CCA) **does not open the serial port inside the Next.js server** (HMR and serverless would drop the connection). Instead:

1. A small **Node process** (`usb-serial-thermal-receiver.js`) reads the COM port and **POSTs JSON** to `http://127.0.0.1:3000/api/thermal/bt`.
2. The API **normalizes** the payload and stores it in the **in-memory thermal store** (`src/lib/thermal-data-store.ts`).
3. The browser polls **`GET /api/thermal`** (no `?ip=` query) when **Connection mode = USB serial** in the UI, which returns the latest frame from that store.

The **Raspberry Pi path** (sensor on Pi, `raspberry_pi_thermal_server.py`) is unchanged: it uses **Wi‑Fi or USB RNDIS** and `GET /api/thermal?ip=...` to proxy TCP to the Pi.

## Why USB thermal can “suddenly” stop working

1. **`npm run dev` runs `bluetooth-thermal-receiver.js`** — it scans and opens COM ports for Bluetooth. That can **block or race** with the USB bridge. Use **`npm run dev:next`** + **`npm run thermal:usb`**, or **`npm run dev:thermal-usb`** (Next + USB receiver only).
2. **Auto-detect only saw one baud** — older behavior probed **115200 only**. The receiver now tries **`THERMAL_PROBE_BAUDS`** (default `115200,9600,57600`) per port.
3. **Probe timeout too short** — increase **`THERMAL_PROBE_MS`** (default 6000 ms) if frames arrive slowly.
4. **Wrong line endings** — set **`THERMAL_SERIAL_DELIMITER`** to `crlf` or `cr` if lines never split.
5. **Not actually a regression in “I2C on PC”** — the AMG8833 is never exposed as PC I2C through a normal USB serial adapter; data must come as **serial text** from firmware.

## Configuration

### App / UI

- Set connection mode to **USB serial** on Sensors or Sleep Behaviors (stored in `localStorage` as `thermal-connection-mode`), or set at build/runtime:
  - `NEXT_PUBLIC_THERMAL_CONNECTION_MODE=usb_serial`

### Bridge process (terminal)

| Variable | Meaning |
|----------|---------|
| `THERMAL_INPUT_MODE` | `usb` or `usb_serial` (equivalent) |
| `SERIAL_PORT` | `auto` or empty = scan; or e.g. `COM7` |
| `BAUD_RATE` | Default `115200` (also `THERMAL_SERIAL_BAUD`) |
| `THERMAL_PROBE_BAUDS` | Comma-separated list tried during auto-detect (default `115200,9600,57600`) |
| `NEXTJS_API_URL` | Default `http://127.0.0.1:3000/api/thermal/bt` (use `127.0.0.1` on Windows) |
| `DEBUG_THERMAL` or `THERMAL_USB_DEBUG` | `1` = verbose logs |
| `THERMAL_USB_LOG_RAW` | `1` = log every raw line |
| `THERMAL_PROBE_MS` | Auto-detect timeout per port×baud (default `6000`) |
| `THERMAL_SERIAL_DELIMITER` | `lf` (default), `crlf`, or `cr` |
| `THERMAL_FALLBACK_SERIAL_PORT` | e.g. `COM3` — open this port even when auto-detect sees no valid frame (use with `THERMAL_USB_LOG_RAW=1`) |

Place values in `.env` or `.env.local` in the project root (both are loaded by the bridge script).

**Windows:** Documentation often writes `COMx` as a placeholder. Your real port is a **number**, e.g. `COM3` — copy it from Device Manager or from `npm run thermal:usb:test -- --list`. The literal string `COMx` is not a valid device name.

### Server-side debug (optional)

| Variable | Meaning |
|----------|---------|
| `THERMAL_API_DEBUG` | Log extra detail on each POST to `/api/thermal/bt` |
| `THERMAL_STORE_DEBUG` | Log every frame stored (very noisy) |

## Firmware: recommended JSON format

**One JSON object per line** (newline `\n` terminated), UTF-8.

Preferred fields:

```json
{
  "sensor": "AMG8833",
  "pixels": [ 23.1, 23.2, "... 64 floats, row-major ..." ],
  "min": 22.0,
  "max": 28.0,
  "timestamp": 1712563200123
}
```

Alternatively:

- `thermal_data`: 8×8 array of numbers (same row-major as Adafruit AMG8833 examples).
- `values`: alias of `pixels` (64 numbers) — accepted by the server normalizer.

## Firmware: CSV fallback

A single line of **64 comma- or semicolon-separated floats** (row-major) is accepted:

```text
23.1,23.2,23.0, ...
```

Optional prefix: `THERMAL:` before the numbers.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev:thermal-usb` | Next.js dev + USB serial receiver (concurrently) |
| `npm run thermal:usb` | USB serial receiver only |
| `npm run thermal:usb:test -- COM7` | Standalone COM test (no CCA) |
| `npm run thermal:usb:test -- --list` | List COM ports |

## Testing checklist

1. **List ports:** `npm run thermal:usb:test -- --list`
2. **Raw serial (no app):** `npm run thermal:usb:test -- COM7 115200` — confirm lines parse and min/max change when you warm the sensor.
3. **Start CCA:** `npm run dev` (or `npm run dev:thermal-usb` instead of the default Bluetooth helper in `dev` if you only use USB serial).
4. **Run bridge:** `npm run thermal:usb` with `SERIAL_PORT` set if auto-detect fails.
5. **UI:** Set mode to **USB serial**; thermal heatmap should update from polling `/api/thermal`.

## Auto-detect vs manual `SERIAL_PORT`

Auto-detect opens each port briefly and waits for a line that parses as a thermal frame (JSON or CSV). If another device grabs the port first, or the firmware is slow, set **`SERIAL_PORT=COMx`** explicitly.

## Why “nothing worked” when expecting I2C on the PC

Opening the AMG8833 from **Windows directly over I2C** requires an **I2C adapter** (not a generic USB serial bridge). If your hardware is **MCU → USB serial only**, the app must use **USB serial mode** and the bridge script above — not the Raspberry Pi TCP discovery path.
