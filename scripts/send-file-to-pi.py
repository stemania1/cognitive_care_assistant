#!/usr/bin/env python3
"""
Send a file to the Raspberry Pi over USB serial (COM3).

This works by:
1. Sending Ctrl+C to stop the thermal sender on the Pi
2. Waiting for a shell prompt
3. Writing the file contents via a heredoc-style echo command
4. Restarting the thermal sender

Usage:
  python scripts/send-file-to-pi.py
"""

import base64
import os
import sys
import time

try:
    import serial
except ImportError:
    print("pyserial is required: pip install pyserial")
    sys.exit(1)

PORT = os.environ.get("SERIAL_PORT", "COM3")
BAUD = 115200
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

LOCAL_FILE = os.path.join(PROJECT_ROOT, "sensor code", "thermal_sensor", "serial-wifi-listener.py")
REMOTE_PATH = "/home/pi/serial-wifi-listener.py"

THERMAL_SENDER_CMD = "python3 /home/pi/usb-serial-thermal-sender.py"


def wait_for_prompt(ser, timeout=5):
    """Read until we see a shell prompt or timeout."""
    deadline = time.time() + timeout
    buf = b""
    while time.time() < deadline:
        if ser.in_waiting:
            buf += ser.read(ser.in_waiting)
            text = buf.decode("utf-8", errors="replace")
            if "$" in text or "#" in text or ">>>" in text:
                return True, text
        time.sleep(0.1)
    return False, buf.decode("utf-8", errors="replace")


def main():
    if not os.path.isfile(LOCAL_FILE):
        print(f"File not found: {LOCAL_FILE}")
        sys.exit(1)

    with open(LOCAL_FILE, "r") as f:
        content = f.read()

    encoded = base64.b64encode(content.encode("utf-8")).decode("ascii")

    print(f"File: {LOCAL_FILE}")
    print(f"Size: {len(content)} bytes ({len(encoded)} base64)")
    print(f"Target: {REMOTE_PATH} on Pi via {PORT}")
    print()

    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
    except serial.SerialException as e:
        print(f"Cannot open {PORT}: {e}")
        sys.exit(1)

    time.sleep(0.5)

    print("[1/5] Sending Ctrl+C to stop thermal sender...")
    ser.write(b"\x03")
    time.sleep(1)
    ser.write(b"\x03")
    time.sleep(1)

    ser.read(ser.in_waiting or 4096)

    print("[2/5] Checking for shell prompt...")
    ser.write(b"\r\n")
    time.sleep(0.5)
    found, text = wait_for_prompt(ser, timeout=5)

    if not found:
        print(f"  No shell prompt detected. Got: {text[:200]!r}")
        print()
        print("  The serial port may not have a login shell.")
        print("  Try these alternatives:")
        print("    1. Pull the SD card and copy the file manually")
        print("    2. Connect a keyboard/monitor to the Pi")
        print("    3. If Pi was previously on WiFi, power cycle it to reconnect")
        ser.close()
        sys.exit(1)

    print(f"  Shell detected!")

    print(f"[3/5] Writing {REMOTE_PATH} via base64 decode...")
    chunk_size = 512
    chunks = [encoded[i:i + chunk_size] for i in range(0, len(encoded), chunk_size)]

    ser.write(f"echo '' > /tmp/_transfer.b64\r\n".encode())
    time.sleep(0.3)

    for i, chunk in enumerate(chunks):
        ser.write(f"echo '{chunk}' >> /tmp/_transfer.b64\r\n".encode())
        time.sleep(0.05)
        if (i + 1) % 20 == 0:
            print(f"  Sent {i + 1}/{len(chunks)} chunks...")
            time.sleep(0.2)

    time.sleep(0.5)
    ser.write(f"base64 -d /tmp/_transfer.b64 > {REMOTE_PATH}\r\n".encode())
    time.sleep(0.5)
    ser.write(f"chmod +x {REMOTE_PATH}\r\n".encode())
    time.sleep(0.3)
    ser.write(f"rm /tmp/_transfer.b64\r\n".encode())
    time.sleep(0.3)

    print(f"[4/5] Verifying...")
    ser.write(f"wc -c {REMOTE_PATH}\r\n".encode())
    time.sleep(0.5)
    ser.read(ser.in_waiting or 4096)
    ser.write(f"head -1 {REMOTE_PATH}\r\n".encode())
    time.sleep(0.5)
    verify_out = ser.read(ser.in_waiting or 4096).decode("utf-8", errors="replace")
    print(f"  {verify_out.strip()[:200]}")

    print(f"[5/5] Restarting thermal sender in background...")
    ser.write(f"nohup {THERMAL_SENDER_CMD} > /dev/null 2>&1 &\r\n".encode())
    time.sleep(0.5)

    ser.close()
    print()
    print("Done! The file should now be on the Pi.")
    print(f"To start the WiFi listener, SSH in or run on Pi:")
    print(f"  sudo python3 {REMOTE_PATH} &")


if __name__ == "__main__":
    main()
