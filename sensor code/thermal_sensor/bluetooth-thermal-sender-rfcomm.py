#!/usr/bin/env python3
"""
Bluetooth Thermal Sender (RFCOMM device mode)
--------------------------------------------
Sends thermal data to /dev/rfcomm0 (created by `rfcomm watch hci0` when
Windows connects). Use this when the Pi has SPP enabled via sdptool so
Windows can add a COM port; the connection is then handled by the kernel.

Usage:
  Terminal 1 (Pi): sudo rfcomm watch hci0
  Terminal 2 (Pi): python3 bluetooth-thermal-sender-rfcomm.py

Same JSON format as bluetooth-thermal-sender.py so bluetooth-thermal-receiver.js
on the PC works unchanged.
"""

import json
import logging
import os
import time
from datetime import datetime

# Sensor
try:
    import board
    import busio
    import adafruit_amg88xx
except ImportError as exc:
    print(f"AMG8833 dependencies missing ({exc}). Install with:")
    print("  pip3 install adafruit-blinka adafruit-circuitpython-amg88xx")
    raise SystemExit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("thermal-bt-rfcomm")

GRID_WIDTH = 8
GRID_HEIGHT = 8
UPDATE_INTERVAL = 0.1
RFCOMM_DEV = "/dev/rfcomm0"
WAIT_INTERVAL = 2.0

sensor = None
try:
    i2c = busio.I2C(board.SCL, board.SDA)
    sensor = adafruit_amg88xx.AMG88XX(i2c)
    logger.info("✅ AMG8833 sensor initialized")
except Exception as exc:
    logger.error(f"Failed to initialize AMG8833 sensor: {exc}")
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
    logger.info("📡 Waiting for %s (run 'sudo rfcomm watch hci0' and connect from Windows)...", RFCOMM_DEV)
    while not os.path.exists(RFCOMM_DEV):
        time.sleep(WAIT_INTERVAL)

    # 115200 to match bluetooth-thermal-receiver.js
    try:
        ser = open(RFCOMM_DEV, "wb", buffering=0)
    except Exception as e:
        logger.error("Failed to open %s: %s", RFCOMM_DEV, e)
        raise SystemExit(1)

    logger.info("✅ Opened %s — sending thermal data", RFCOMM_DEV)
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
                logger.warning("Connection closed by peer; waiting for %s to reappear...", RFCOMM_DEV)
                ser.close()
                while not os.path.exists(RFCOMM_DEV):
                    time.sleep(WAIT_INTERVAL)
                ser = open(RFCOMM_DEV, "wb", buffering=0)
                logger.info("✅ Reconnected to %s", RFCOMM_DEV)
            time.sleep(UPDATE_INTERVAL)
    except KeyboardInterrupt:
        logger.info("🛑 Stopping...")
    finally:
        ser.close()
        logger.info("✅ Closed %s", RFCOMM_DEV)


if __name__ == "__main__":
    main()
