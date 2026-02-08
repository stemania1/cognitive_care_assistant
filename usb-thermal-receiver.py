#!/usr/bin/env python3
"""
USB (and Bluetooth) thermal receiver – alternative to bluetooth-thermal-receiver.js.
Reads newline-delimited JSON from a COM port and POSTs to the Next.js thermal API.

Use this if the Node bridge fails with "Unknown error code 31" on Windows with
the Pi's USB serial (COM3). Uses PySerial by default; on Windows, if that fails
with error 31, falls back to opening the port without configuring it (raw read).

Requires: pip install pyserial

Usage:
  python usb-thermal-receiver.py COM3
  python usb-thermal-receiver.py COM9
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

# Same API as the Node bridge
API_URL = os.environ.get("NEXTJS_API_URL", "http://localhost:3000/api/thermal/bt")
DEFAULT_BAUD = int(os.environ.get("THERMAL_SERIAL_BAUD", "115200"))


def post_thermal(data, success_count, last_log):
    """Parse one line and POST if it's thermal_data; return (new_success_count, new_last_log)."""
    try:
        data = json.loads(data)
        if data.get("type") != "thermal_data":
            return success_count, last_log
        success_count += 1
        now = time.time()
        if now - last_log >= 5.0 and data.get("thermal_data"):
            grid = data["thermal_data"]
            n = sum(len(r) for r in grid)
            avg = sum(sum(r) for r in grid) / n if n else 0
            print(f"Received thermal data: avg {avg:.1f}C, forwarded #{success_count}")
            last_log = now
        body = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(
            API_URL,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=5)
    except json.JSONDecodeError:
        pass
    except urllib.error.URLError as e:
        print("API error:", e)
    return success_count, last_log


def run_with_pyserial(port_name):
    try:
        import serial
    except ImportError:
        print("pyserial not installed. Run: pip install pyserial")
        return False
    baud = DEFAULT_BAUD
    while True:
        try:
            ser = serial.Serial(
                port=port_name,
                baudrate=baud,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=0.5,
                rtscts=False,
                xonxoff=False,
            )
            break
        except serial.SerialException as e:
            err = str(e).lower()
            if ("31" in err or "cannot open" in err or "cannot configure" in err) and baud == 115200:
                print("115200 failed, trying 9600...")
                baud = 9600
                continue
            print(f"Error opening {port_name}: {e}")
            return False
    if baud != DEFAULT_BAUD:
        print(f"Opened at {baud} baud (115200 was rejected).\n")
    else:
        print("Serial port opened. Waiting for thermal data...\n")
    success_count = 0
    last_log = 0
    buf = b""
    try:
        while True:
            chunk = ser.read(4096)
            if not chunk:
                continue
            buf += chunk
            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                line = line.decode("utf-8", errors="ignore").strip()
                if not line:
                    continue
                success_count, last_log = post_thermal(line, success_count, last_log)
    except KeyboardInterrupt:
        print(f"\nStopped. Forwarded {success_count} payloads.")
    finally:
        ser.close()
    return True


def run_with_windows_raw(port_name):
    """Open COM port with Windows API and read only (no SetCommState). Use when driver fails error 31."""
    if sys.platform != "win32":
        return False
    try:
        import ctypes
        from ctypes import wintypes
    except ImportError:
        return False
    kernel32 = ctypes.windll.kernel32
    GENERIC_READ = 0x80000000
    OPEN_EXISTING = 3
    INVALID_HANDLE_VALUE = -1
    path = "\\\\.\\" + port_name
    handle = kernel32.CreateFileW(
        path,
        GENERIC_READ,
        0,
        None,
        OPEN_EXISTING,
        0,
        None,
    )
    if handle == INVALID_HANDLE_VALUE:
        err = ctypes.get_last_error()
        print(f"CreateFile failed (error {err}). Is {port_name} in use or unplugged?")
        return False
    print("Opened port (raw read, no baud config). Waiting for thermal data...\n")
    success_count = 0
    last_log = 0
    buf = b""
    read_buf = ctypes.create_string_buffer(4096)
    nread = wintypes.DWORD()
    try:
        while True:
            ok = kernel32.ReadFile(ctypes.c_void_p(handle), read_buf, 4096, ctypes.byref(nread), None)
            if not ok or nread.value == 0:
                time.sleep(0.01)
                continue
            chunk = read_buf.raw[: nread.value]
            buf += chunk
            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                line = line.decode("utf-8", errors="ignore").strip()
                if not line:
                    continue
                success_count, last_log = post_thermal(line, success_count, last_log)
    except KeyboardInterrupt:
        print(f"\nStopped. Forwarded {success_count} payloads.")
    finally:
        kernel32.CloseHandle(ctypes.c_void_p(handle))
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python usb-thermal-receiver.py COM3")
        sys.exit(1)
    port_name = sys.argv[1]

    print("USB/Bluetooth Thermal Receiver (PySerial)")
    print("==========================================")
    print(f"Serial port: {port_name}")
    print(f"Forwarding to: {API_URL}")
    print("Press Ctrl+C to stop\n")

    # Try PySerial first
    try:
        import serial
        ser = serial.Serial(
            port=port_name,
            baudrate=DEFAULT_BAUD,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=0.5,
            rtscts=False,
            xonxoff=False,
        )
        ser.close()
        # Open worked; run the normal loop
        run_with_pyserial(port_name)
        return
    except Exception as e:
        err = str(e).lower()
        if "31" not in err and "cannot configure" not in err and "permission" not in err:
            print(f"Error opening {port_name}: {e}")
            sys.exit(1)
        # Try 9600
        try:
            ser = serial.Serial(port=port_name, baudrate=9600, timeout=0.5)
            ser.close()
            run_with_pyserial(port_name)
            return
        except Exception:
            pass
    # PySerial failed with error 31; on Windows try raw open (no config)
    if sys.platform == "win32":
        print("PySerial failed (error 31). Trying raw Windows open (no baud config)...")
        if run_with_windows_raw(port_name):
            return
    print("Could not open port. Use Wi-Fi or Bluetooth for thermal, or try another driver for COM3.")
    sys.exit(1)


if __name__ == "__main__":
    main()
