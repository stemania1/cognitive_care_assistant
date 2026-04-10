#!/usr/bin/env python3
"""
Quick diagnostic script for the AMG8833 thermal sensor.
Run this on the Raspberry Pi to inspect raw pixel values and min/max ranges.
"""

import time
import argparse
import sys

try:
    import board
    import busio
    import adafruit_amg88xx
except ImportError as exc:
    print("Missing dependencies. Install with:")
    print("  sudo apt install python3-pip python3-smbus i2c-tools")
    print("  pip3 install --break-system-packages adafruit-circuitpython-amg88xx adafruit-blinka")
    raise SystemExit(1) from exc


def main():
    parser = argparse.ArgumentParser(description="Print raw AMG8833 frames.")
    parser.add_argument(
        "--interval",
        type=float,
        default=0.5,
        help="Seconds between frames (default: 0.5)",
    )
    args = parser.parse_args()

    i2c = busio.I2C(board.SCL, board.SDA)
    sensor = adafruit_amg88xx.AMG88XX(i2c)

    print("Press Ctrl+C to stop…")
    try:
        while True:
            pixels = sensor.pixels  # 8×8 matrix
            for row in pixels:
                print(" ".join(f"{temp:6.2f}" for temp in row))
            flat = [temp for row in pixels for temp in row]
            print(
                f"min={min(flat):.2f}°C  max={max(flat):.2f}°C  span={(max(flat)-min(flat)):.2f}°C\n"
            )
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nStopped.")
        sys.exit(0)


if __name__ == "__main__":
    main()

