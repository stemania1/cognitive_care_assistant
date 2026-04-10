#!/usr/bin/env python3
"""
Cognitive Care Assistant — Sensor Setup Tool
=============================================
Local CLI utility for configuring and connecting the AMG8833 thermal sensor
(Raspberry Pi) and MyoWare EMG sensor (ESP32) to the CCA app.

Features:
  1. Scan and list serial ports, identifying likely devices
  2. Send WiFi credentials to Pi or ESP32 over USB serial
  3. Test serial data from a connected device
  4. Launch bridge processes to forward sensor data to CCA

Requirements:
  pip install pyserial

Usage:
  python scripts/sensor-setup.py              # interactive menu
  python scripts/sensor-setup.py --scan       # list ports and exit
  python scripts/sensor-setup.py --wifi       # WiFi provisioning mode
  python scripts/sensor-setup.py --bridges    # launch bridge processes
"""

import argparse
import json
import os
import subprocess
import sys
import time

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    print("pyserial is required. Install with: pip install pyserial")
    sys.exit(1)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

PI_USB_VID_PID = ("0525", "A4A7")  # Linux USB Gadget serial
ESP32_KEYWORDS = ["cp210", "ch340", "ftdi", "silicon", "esp", "wch"]
BAUD_RATES = [115200, 9600, 57600]
DEFAULT_BAUD = 115200


def scan_ports():
    """Return list of serial port info dicts."""
    ports = serial.tools.list_ports.comports()
    results = []
    for p in sorted(ports, key=lambda x: x.device):
        device_type = identify_device(p)
        results.append({
            "port": p.device,
            "description": p.description or "",
            "manufacturer": p.manufacturer or "",
            "vid": f"{p.vid:04X}" if p.vid else "",
            "pid": f"{p.pid:04X}" if p.pid else "",
            "serial_number": p.serial_number or "",
            "device_type": device_type,
        })
    return results


def identify_device(port_info):
    """Guess what device is on this port."""
    vid = f"{port_info.vid:04X}" if port_info.vid else ""
    pid = f"{port_info.pid:04X}" if port_info.pid else ""
    desc = (port_info.description or "").lower()
    mfg = (port_info.manufacturer or "").lower()

    if vid == PI_USB_VID_PID[0] and pid == PI_USB_VID_PID[1]:
        return "Raspberry Pi (USB gadget serial)"

    for kw in ESP32_KEYWORDS:
        if kw in desc or kw in mfg:
            return "ESP32 / MCU (USB-serial adapter)"

    if "bluetooth" in desc or "bluetooth" in mfg:
        return "Bluetooth serial"

    if vid:
        return "USB serial device"

    return "Unknown"


def print_ports(ports):
    """Pretty-print port scan results."""
    if not ports:
        print("\n  No serial ports found.\n")
        return
    print(f"\n  Found {len(ports)} port(s):\n")
    print(f"  {'Port':<10} {'Device Type':<35} {'Manufacturer':<20} {'VID:PID'}")
    print(f"  {'-' * 10} {'-' * 35} {'-' * 20} {'-' * 12}")
    for p in ports:
        vid_pid = f"{p['vid']}:{p['pid']}" if p["vid"] else "-"
        print(f"  {p['port']:<10} {p['device_type']:<35} {p['manufacturer'] or '—':<20} {vid_pid}")
    print()


def find_pi_port(ports):
    """Find the Raspberry Pi port."""
    for p in ports:
        if "Raspberry Pi" in p["device_type"]:
            return p["port"]
    return None


def find_esp32_port(ports):
    """Find an ESP32/MCU port."""
    for p in ports:
        if "ESP32" in p["device_type"] or "MCU" in p["device_type"]:
            return p["port"]
    return None


def send_wifi_config_serial(port, ssid, password, baud=DEFAULT_BAUD, timeout=10):
    """Send WiFi config as a JSON command over serial. Returns (ok, message)."""
    cmd = json.dumps({"cmd": "wifi_config", "ssid": ssid, "password": password})
    print(f"\n  Sending WiFi config to {port} @ {baud}...")
    try:
        ser = serial.Serial(port, baud, timeout=timeout)
        time.sleep(0.5)
        ser.write((cmd + "\n").encode("utf-8"))
        ser.flush()

        deadline = time.time() + timeout
        while time.time() < deadline:
            if ser.in_waiting:
                line = ser.readline().decode("utf-8", errors="replace").strip()
                if not line:
                    continue
                try:
                    resp = json.loads(line)
                    if resp.get("cmd") == "wifi_config":
                        if "ok" not in resp:
                            continue
                        ser.close()
                        if resp.get("ok"):
                            return True, resp.get("msg", "Success")
                        return False, resp.get("msg", f"Device error (no detail in response: {resp})")
                except json.JSONDecodeError:
                    pass
            time.sleep(0.1)

        ser.close()
        return False, f"No response from device within {timeout}s. Is the WiFi listener running on the device?"
    except serial.SerialException as e:
        return False, f"Serial error: {e}"


def test_serial_data(port, baud=DEFAULT_BAUD, duration=5):
    """Read serial data from a port for a few seconds and print it."""
    print(f"\n  Reading from {port} @ {baud} for {duration}s...\n")
    try:
        ser = serial.Serial(port, baud, timeout=1)
        start = time.time()
        lines_read = 0
        thermal_frames = 0
        while time.time() - start < duration:
            if ser.in_waiting:
                line = ser.readline().decode("utf-8", errors="replace").strip()
                if not line:
                    continue
                lines_read += 1
                if lines_read <= 5:
                    preview = line[:120] + ("..." if len(line) > 120 else "")
                    print(f"    [{lines_read}] {preview}")
                try:
                    obj = json.loads(line)
                    if "thermal_data" in obj or "pixels" in obj:
                        thermal_frames += 1
                except json.JSONDecodeError:
                    pass
        ser.close()
        print(f"\n  Summary: {lines_read} lines, {thermal_frames} thermal frames in {duration}s")
        if thermal_frames > 0:
            print("  Thermal data is flowing!")
        elif lines_read > 0:
            print("  Data is arriving but no thermal frames detected. Check the data format.")
        else:
            print("  No data received. Check baud rate and that the sender is running on the device.")
    except serial.SerialException as e:
        print(f"  Error: {e}")


def launch_bridges(thermal_port=None, emg_mode=None, emg_port=None):
    """Launch the appropriate bridge processes.
    
    emg_mode: None (skip), "wifi" (emg-server.js), "usb" (usb-serial-emg-receiver.js)
    """
    procs = []
    env = os.environ.copy()

    if thermal_port:
        env["SERIAL_PORT"] = thermal_port
        env["THERMAL_INPUT_MODE"] = "usb_serial"
        bridge = os.path.join(PROJECT_ROOT, "bridges", "usb-serial-thermal-receiver.js")
        if os.path.isfile(bridge):
            print(f"\n  Starting thermal USB bridge: node {bridge} (port={thermal_port})")
            procs.append(subprocess.Popen(["node", bridge], env=env, cwd=PROJECT_ROOT))
        else:
            print(f"  Warning: {bridge} not found")

    if emg_mode == "wifi":
        emg_server = os.path.join(PROJECT_ROOT, "bridges", "emg-server.js")
        if os.path.isfile(emg_server):
            print(f"  Starting EMG WiFi server: node {emg_server}")
            procs.append(subprocess.Popen(["node", emg_server], env=env, cwd=PROJECT_ROOT))
        else:
            print(f"  Warning: {emg_server} not found")
    elif emg_mode == "usb":
        emg_env = env.copy()
        if emg_port:
            emg_env["EMG_SERIAL_PORT"] = emg_port
        emg_bridge = os.path.join(PROJECT_ROOT, "bridges", "usb-serial-emg-receiver.js")
        if os.path.isfile(emg_bridge):
            print(f"  Starting EMG USB bridge: node {emg_bridge}{' (port=' + emg_port + ')' if emg_port else ''}")
            procs.append(subprocess.Popen(["node", emg_bridge], env=emg_env, cwd=PROJECT_ROOT))
        else:
            print(f"  Warning: {emg_bridge} not found")

    if not procs:
        print("  No bridges started.")
        return

    print(f"\n  {len(procs)} bridge(s) running. Press Ctrl+C to stop.\n")
    try:
        for p in procs:
            p.wait()
    except KeyboardInterrupt:
        print("\n  Stopping bridges...")
        for p in procs:
            p.terminate()
        for p in procs:
            p.wait(timeout=5)
        print("  Done.")


def wifi_flow(ports):
    """Interactive WiFi provisioning flow."""
    pi_port = find_pi_port(ports)
    esp_port = find_esp32_port(ports)

    print("\n  WiFi Provisioning")
    print("  -----------------")
    if pi_port:
        print(f"  [1] Raspberry Pi on {pi_port}")
    if esp_port:
        print(f"  [2] ESP32 on {esp_port}")
    if not pi_port and not esp_port:
        print("  No recognized devices found. Enter a port manually.")

    if pi_port and esp_port:
        choice = input("\n  Which device? (1=Pi, 2=ESP32): ").strip()
        if choice == "2":
            target = esp_port
        elif choice == "1":
            target = pi_port
        else:
            target = input(f"  Enter port manually [{pi_port}]: ").strip() or pi_port
    else:
        default = pi_port or esp_port
        target = input(f"\n  Target port [{default or 'COM?'}]: ").strip()
        if not target:
            target = default
    if not target:
        print("  No port specified. Aborting.")
        return

    ssid = input("  WiFi SSID: ").strip()
    if not ssid:
        print("  SSID is required. Aborting.")
        return
    password = input("  WiFi password: ").strip()

    ok, msg = send_wifi_config_serial(target, ssid, password)
    status = "SUCCESS" if ok else "FAILED"
    print(f"\n  [{status}] {msg}\n")


def interactive_menu():
    """Main interactive menu."""
    print("\n" + "=" * 55)
    print("  Cognitive Care Assistant — Sensor Setup")
    print("=" * 55)

    ports = scan_ports()
    print_ports(ports)

    pi_port = find_pi_port(ports)
    esp_port = find_esp32_port(ports)

    while True:
        print("  Options:")
        print("    1. Rescan ports")
        print("    2. Send WiFi credentials to device")
        print("    3. Test serial data from a port")
        print("    4. Launch bridge processes")
        print("    5. Quit")
        choice = input("\n  Choose [1-5]: ").strip()

        if choice == "1":
            ports = scan_ports()
            print_ports(ports)
            pi_port = find_pi_port(ports)
            esp_port = find_esp32_port(ports)

        elif choice == "2":
            wifi_flow(ports)

        elif choice == "3":
            default_port = pi_port or esp_port or ""
            port = input(f"  Port to test [{default_port}]: ").strip() or default_port
            if not port:
                print("  No port specified.")
                continue
            baud_str = input(f"  Baud rate [{DEFAULT_BAUD}]: ").strip()
            baud = int(baud_str) if baud_str.isdigit() else DEFAULT_BAUD
            test_serial_data(port, baud)

        elif choice == "4":
            use_thermal = pi_port or ""
            port_input = input(f"  Thermal sensor port [{use_thermal or 'skip'}]: ").strip() or use_thermal
            emg_input = input("  EMG mode — (w)ifi server, (u)sb serial, or (n)one? [w/u/N]: ").strip().lower()
            emg_mode = None
            emg_port_val = None
            if emg_input in ("w", "wifi"):
                emg_mode = "wifi"
            elif emg_input in ("u", "usb"):
                emg_mode = "usb"
                default_emg = esp_port or ""
                emg_port_val = input(f"  EMG serial port [{default_emg or 'auto'}]: ").strip() or default_emg or None
            launch_bridges(
                thermal_port=port_input if port_input else None,
                emg_mode=emg_mode,
                emg_port=emg_port_val,
            )

        elif choice == "5":
            print("\n  Goodbye!\n")
            break
        else:
            print("  Invalid choice.\n")


def main():
    parser = argparse.ArgumentParser(description="CCA Sensor Setup Tool")
    parser.add_argument("--scan", action="store_true", help="Scan and list serial ports")
    parser.add_argument("--wifi", action="store_true", help="WiFi provisioning mode")
    parser.add_argument("--bridges", action="store_true", help="Launch bridge processes")
    parser.add_argument("--test", metavar="PORT", help="Test serial data from PORT")
    parser.add_argument("--baud", type=int, default=DEFAULT_BAUD, help="Baud rate (default: 115200)")
    args = parser.parse_args()

    if args.scan:
        ports = scan_ports()
        print_ports(ports)
        return

    if args.wifi:
        ports = scan_ports()
        print_ports(ports)
        wifi_flow(ports)
        return

    if args.test:
        test_serial_data(args.test, args.baud)
        return

    if args.bridges:
        ports = scan_ports()
        pi_port = find_pi_port(ports)
        esp_port = find_esp32_port(ports)
        launch_bridges(thermal_port=pi_port, emg_mode="usb" if esp_port else "wifi", emg_port=esp_port)
        return

    interactive_menu()


if __name__ == "__main__":
    main()
