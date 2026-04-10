#!/usr/bin/env python3
"""
USB Serial EMG Receiver (Python)

Reads EMG JSON data from an ESP32 via USB serial and POSTs it to the
Next.js API at /api/emg/ws. Same function as usb-serial-emg-receiver.js
but uses pyserial instead of the Node.js serialport module.

Usage:
  python bridges/usb-serial-emg-receiver.py              # auto-detect ESP32
  python bridges/usb-serial-emg-receiver.py COM4          # specify port
  python bridges/usb-serial-emg-receiver.py COM4 115200   # specify port + baud

Env:
  EMG_SERIAL_PORT=auto|COMx   EMG_BAUD_RATE=115200
  EMG_API_URL=http://127.0.0.1:3000/api/emg/ws
  DEBUG_EMG=1

Requirements: pip install pyserial requests
"""

import json
import os
import sys
import time
import threading

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    print("pyserial is required: pip install pyserial")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("requests is required: pip install requests")
    sys.exit(1)

TAG = "[emg-usb-py]"

API_URL = os.environ.get("EMG_API_URL", "http://127.0.0.1:3000/api/emg/ws")
SERIAL_PORT = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("EMG_SERIAL_PORT", "")
BAUD = int(sys.argv[2]) if len(sys.argv) > 2 else int(os.environ.get("EMG_BAUD_RATE", "115200"))
DEBUG = os.environ.get("DEBUG_EMG", "").strip().lower() in ("1", "true", "yes")
RECONNECT_DELAY = 5

PI_VID_PID = ("0525", "A4A7")
ESP32_KEYWORDS = ["cp210", "ch340", "ch341", "ftdi", "silicon", "esp", "wch"]

stats = {"posted": 0, "failures": 0, "parse_errors": 0, "skipped": 0}


def is_esp32_port(p):
    desc = ((p.description or "") + " " + (p.manufacturer or "")).lower()
    if p.vid and f"{p.vid:04X}" != PI_VID_PID[0]:
        for kw in ESP32_KEYWORDS:
            if kw in desc:
                return True
        if p.vid:
            return True
    return False


def is_bluetooth(p):
    desc = ((p.description or "") + " " + (p.manufacturer or "") + " " + (p.hwid or "")).lower()
    return "bluetooth" in desc or "bthenum" in desc


def is_raspberry_pi(p):
    return p.vid and f"{p.vid:04X}" == PI_VID_PID[0] and f"{p.pid:04X}" == PI_VID_PID[1]


def auto_detect():
    print(f"{TAG} scanning for ESP32/MCU ports...\n")
    ports = sorted(serial.tools.list_ports.comports(), key=lambda x: x.device)

    for p in ports:
        vid_pid = f"{p.vid:04X}:{p.pid:04X}" if p.vid else "-"
        print(f"  {p.device:<10} {p.description or '?':<40} {vid_pid}")
    print()

    candidates = [p for p in ports if is_esp32_port(p) and not is_bluetooth(p) and not is_raspberry_pi(p)]

    if not candidates:
        non_bt = [p for p in ports if not is_bluetooth(p) and not is_raspberry_pi(p)]
        candidates = non_bt

    for p in candidates:
        print(f"{TAG} probing {p.device} @ {BAUD}...")
        try:
            ser = serial.Serial(p.device, BAUD, timeout=6)
            deadline = time.time() + 6
            while time.time() < deadline:
                if ser.in_waiting:
                    line = ser.readline().decode("utf-8", errors="replace").strip()
                    if looks_like_emg(line):
                        ser.close()
                        print(f"{TAG} EMG data detected on {p.device}\n")
                        return p.device
                time.sleep(0.05)
            ser.close()
            print(f"{TAG}   no EMG data on {p.device}")
        except serial.SerialException as e:
            print(f"{TAG}   cannot open {p.device}: {e}")

    print(f"{TAG} no ESP32/MCU with EMG data found.")
    return None


def looks_like_emg(line):
    try:
        obj = json.loads(line)
        return (
            obj.get("type") in ("emg_data", "calibration_data", "heartbeat", "test")
            or isinstance(obj.get("muscleActivity"), (int, float))
            or isinstance(obj.get("voltage"), (int, float))
        )
    except (json.JSONDecodeError, ValueError):
        return False


def post_data(payload):
    try:
        r = requests.post(API_URL, json=payload, timeout=5)
        if r.ok:
            stats["posted"] += 1
        else:
            stats["failures"] += 1
            if DEBUG:
                print(f"{TAG} API {r.status_code}")
    except Exception as e:
        stats["failures"] += 1
        if stats["failures"] <= 3 or stats["failures"] % 50 == 0:
            print(f"{TAG} API error: {e} (failures: {stats['failures']})")


def log_summary():
    while True:
        time.sleep(10)
        if stats["posted"] > 0 or stats["failures"] > 0:
            print(f"{TAG} summary: posted={stats['posted']} failures={stats['failures']} parse_errors={stats['parse_errors']} skipped={stats['skipped']}")


def run(port_path):
    print(f"{TAG} opening {port_path} @ {BAUD}...")
    ser = serial.Serial(port_path, BAUD, timeout=1)
    print(f"{TAG} connected — forwarding to {API_URL}")
    print(f"{TAG} debug: {'on' if DEBUG else 'off'}\n")

    first_frame = True

    try:
        while True:
            if ser.in_waiting:
                line = ser.readline().decode("utf-8", errors="replace").strip()
                if not line or not line.startswith("{"):
                    stats["skipped"] += 1
                    continue

                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    stats["parse_errors"] += 1
                    continue

                if "type" not in obj:
                    if isinstance(obj.get("muscleActivity"), (int, float)):
                        obj["type"] = "emg_data"
                    else:
                        stats["skipped"] += 1
                        continue

                if first_frame:
                    first_frame = False
                    print(f"{TAG} first frame: type={obj.get('type')} muscleActivity={obj.get('muscleActivity')} voltage={obj.get('voltage')}")

                post_data(obj)
            else:
                time.sleep(0.01)
    except serial.SerialException as e:
        print(f"{TAG} serial error: {e}")
    except KeyboardInterrupt:
        print(f"\n{TAG} stopped.")
    finally:
        ser.close()


def main():
    port = SERIAL_PORT.strip()
    if not port or port.lower() == "auto":
        port = auto_detect()
        if not port:
            print(f"\n{TAG} Could not find an ESP32/MCU.")
            print(f"{TAG} Plug in the ESP32 via USB and try again, or specify: python {sys.argv[0]} COM4")
            sys.exit(1)

    summary_thread = threading.Thread(target=log_summary, daemon=True)
    summary_thread.start()

    while True:
        try:
            run(port)
        except serial.SerialException as e:
            print(f"{TAG} {e} — reconnecting in {RECONNECT_DELAY}s...")
        except KeyboardInterrupt:
            break
        time.sleep(RECONNECT_DELAY)


if __name__ == "__main__":
    main()
