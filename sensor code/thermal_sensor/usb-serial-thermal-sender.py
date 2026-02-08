#!/usr/bin/env python3
"""
USB Serial Thermal Sender for AMG8833
-------------------------------------
Sends thermal data from the Pi to the PC over the USB serial gadget.
On the Pi this is /dev/ttyGS0; on Windows it appears as a COM port (e.g. COM3).

Use when the Pi is connected by USB cable (no Bluetooth/Wi‑Fi needed for the link).
Same JSON format as the Bluetooth sender, so use the same bridge on the PC:

  PC: node bluetooth-thermal-receiver.js COM3
  Pi: python3 usb-serial-thermal-sender.py

Requires the Pi to be in USB serial gadget mode (g_serial); no Bluetooth deps.
"""

import json
import logging
import os
import time
from datetime import datetime

try:
    import board
    import busio
    import adafruit_amg88xx
except ImportError as exc:
    print(f"AMG8833 dependencies missing ({exc}). Install with:")
    print("  pip3 install adafruit-blinka adafruit-circuitpython-amg88xx")
    raise SystemExit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("thermal-usb-serial")

GRID_WIDTH = 8
GRID_HEIGHT = 8
UPDATE_INTERVAL = 0.1  # 10 Hz
# USB serial gadget (g_serial) on Pi; over USB this becomes COMx on Windows
USB_SERIAL_DEV = os.environ.get("THERMAL_USB_SERIAL", "/dev/ttyGS0")
WAIT_INTERVAL = 2.0

sensor = None
try:
    i2c = busio.I2C(board.SCL, board.SDA)
    sensor = adafruit_amg88xx.AMG88XX(i2c)
    logger.info("✅ AMG8833 sensor initialized")
except Exception as exc:
    logger.error("Failed to initialize AMG8833 sensor: %s", exc)
    raise SystemExit(1)


def read_sensor_frame():
    frame = sensor.pixels
    return [[float(frame[row][col]) for col in range(GRID_WIDTH)] for row in range(GRID_HEIGHT)]


def build_payload(frame):
    return {
        "type": "thermal_data",
        "timestamp": datetime.utcnow().isoformat(),
        "thermal_data": frame,
        "grid_size": {"width": GRID_WIDTH, "height": GRID_HEIGHT},
        "sensor_info": {
            "model": "AMG8833",
            "temperature_unit": "C",
            "data_source": "sensor"
        },
        "status": "active"
    }


def main():
    logger.info("📡 Waiting for %s (connect Pi via USB; on PC run: node bluetooth-thermal-receiver.js COM3)", USB_SERIAL_DEV)
    while not os.path.exists(USB_SERIAL_DEV):
        time.sleep(WAIT_INTERVAL)

    try:
        ser = open(USB_SERIAL_DEV, "wb", buffering=0)
    except Exception as e:
        logger.error("Failed to open %s: %s", USB_SERIAL_DEV, e)
        raise SystemExit(1)

    logger.info("✅ Opened %s — sending thermal data (same format as Bluetooth)", USB_SERIAL_DEV)
    last_log_time = time.time()
    frame_count = 0

    try:
        while True:
            try:
                frame = read_sensor_frame()
                payload = build_payload(frame)
                message = (json.dumps(payload) + "\n").encode("utf-8")
                ser.write(message)
                frame_count += 1
                current_time = time.time()
                if current_time - last_log_time >= 5.0:
                    avg_temp = sum(sum(row) for row in frame) / (GRID_WIDTH * GRID_HEIGHT)
                    logger.info("📤 Sent frame #%d - Avg temp: %.2f°C", frame_count, avg_temp)
                    last_log_time = current_time
            except BrokenPipeError:
                logger.warning("Connection closed by PC; waiting for %s to be ready again...", USB_SERIAL_DEV)
                ser.close()
                while not os.path.exists(USB_SERIAL_DEV):
                    time.sleep(WAIT_INTERVAL)
                ser = open(USB_SERIAL_DEV, "wb", buffering=0)
                logger.info("✅ Reconnected to %s", USB_SERIAL_DEV)
            except OSError as e:
                if getattr(e, "errno", None) == 121:
                    logger.warning("I2C Remote I/O error (sensor glitch); retrying in 1s...")
                else:
                    logger.warning("OSError reading sensor: %s; retrying in 1s...", e)
                time.sleep(1.0)
            time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        logger.info("🛑 Stopping...")
    finally:
        ser.close()
        logger.info("✅ Closed %s", USB_SERIAL_DEV)


if __name__ == "__main__":
    main()
