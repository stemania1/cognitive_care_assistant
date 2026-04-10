#!/usr/bin/env python3
"""
Standalone AMG8833 test — run ON THE RASPBERRY PI (not on your PC).

Purpose: prove I2C + Adafruit driver + sensor work outside Next.js and the thermal server.

Usage:
  python3 scripts/test_amg8833_standalone.py
  python3 scripts/test_amg8833_standalone.py --once

Exit codes: 0 = OK, 1 = import/init failure, 2 = read failure
"""

from __future__ import annotations

import argparse
import sys
import time

def main() -> int:
    parser = argparse.ArgumentParser(description="AMG8833 standalone read loop")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Read one frame and exit",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=0.5,
        help="Seconds between frames (default 0.5)",
    )
    args = parser.parse_args()

    print("[amg8833-standalone] Importing Blinka + AMG88xx…")
    try:
        import board
        import busio
        import adafruit_amg88xx
    except ImportError as e:
        print("[amg8833-standalone] FAILED import:", e)
        print("Install: pip3 install adafruit-blinka adafruit-circuitpython-amg88xx")
        return 1

    print("[amg8833-standalone] Opening I2C (SCL/SDA)…")
    try:
        i2c = busio.I2C(board.SCL, board.SDA)
        sensor = adafruit_amg88xx.AMG88XX(i2c)
    except Exception as e:
        print("[amg8833-standalone] FAILED init:", e)
        print("Check wiring (3.3V, GND, SDA, SCL) and: sudo i2cdetect -y 1")
        return 1

    print("[amg8833-standalone] Sensor OK. Default I2C address 0x69 (driver handles it).")

    def one_frame() -> bool:
        try:
            pixels = sensor.pixels
            flat = [float(pixels[r][c]) for r in range(8) for c in range(8)]
            print(
                "[amg8833-standalone] min={:.2f}°C max={:.2f}°C avg={:.2f}°C".format(
                    min(flat),
                    max(flat),
                    sum(flat) / len(flat),
                )
            )
            return True
        except Exception as e:
            print("[amg8833-standalone] read error:", e)
            return False

    if args.once:
        return 0 if one_frame() else 2

    print("[amg8833-standalone] Ctrl+C to stop.\n")
    try:
        while True:
            if not one_frame():
                return 2
            time.sleep(max(0.05, args.interval))
    except KeyboardInterrupt:
        print("\n[amg8833-standalone] Stopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
