#!/usr/bin/env python3
"""
Serial WiFi Listener — runs on the Raspberry Pi alongside the thermal sender.

Listens on the USB gadget serial port (/dev/ttyGS0) for JSON commands from the
PC and executes them. This allows the CCA app (or sensor-setup.py on the PC) to
configure WiFi, check status, etc. over the same USB cable used for thermal data.

Protocol:
  - One JSON object per line (newline-delimited).
  - Thermal data lines (from usb-serial-thermal-sender.py) are ignored.
  - Commands are identified by a "cmd" key.

Supported commands:
  {"cmd": "wifi_config", "ssid": "MyNetwork", "password": "secret"}
  {"cmd": "wifi_status"}
  {"cmd": "ping"}

Responses are written back as JSON lines on the same serial port.

Usage on Pi:
  sudo python3 serial-wifi-listener.py &
  python3 usb-serial-thermal-sender.py

The listener only acts on lines containing "cmd"; thermal JSON is passed through.
Must run as root for WiFi configuration changes.
"""

import json
import logging
import os
import subprocess
import sys
import threading
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s [serial-wifi] %(message)s")
log = logging.getLogger("serial-wifi")

USB_SERIAL_DEV = os.environ.get("THERMAL_USB_SERIAL", "/dev/ttyGS0")
WPA_SUPPLICANT_CONF = "/etc/wpa_supplicant/wpa_supplicant.conf"


def run_cmd(cmd, timeout=15):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except Exception as e:
        return -1, "", str(e)


def get_wifi_status():
    code, out, err = run_cmd(["nmcli", "-t", "-f", "ACTIVE,SSID", "dev", "wifi"])
    if code == 0:
        for line in out.splitlines():
            if line.startswith("yes:"):
                return {"connected": True, "ssid": line.split(":", 1)[1]}
        return {"connected": False, "ssid": None}
    code2, out2, _ = run_cmd(["iwconfig", "wlan0"])
    if code2 == 0 and "ESSID:" in out2:
        for line in out2.splitlines():
            if "ESSID:" in line:
                ssid = line.split("ESSID:")[-1].strip(' "')
                return {"connected": bool(ssid and ssid != "off/any"), "ssid": ssid or None}
    return {"connected": False, "ssid": None, "error": err or "cannot determine"}


def configure_wifi(ssid, password):
    if not ssid or not ssid.strip():
        return False, "SSID is required"
    ssid = ssid.strip()
    password = (password or "").strip()

    cmd = ["nmcli", "device", "wifi", "connect", ssid]
    if password:
        cmd += ["password", password]
    code, out, err = run_cmd(cmd, timeout=30)
    if code == 0:
        return True, f"Connected to {ssid} via nmcli."

    if "not found" not in (out + err).lower():
        return False, f"nmcli failed: {err or out}"

    conf = WPA_SUPPLICANT_CONF if os.path.isfile(WPA_SUPPLICANT_CONF) else None
    if not conf:
        return False, "wpa_supplicant.conf not found and nmcli failed."
    try:
        with open(conf, "a") as f:
            f.write(f'\nnetwork={{\n    ssid="{ssid}"\n    psk="{password}"\n}}\n')
        run_cmd(["wpa_cli", "-i", "wlan0", "reconfigure"])
        return True, "Credentials written to wpa_supplicant.conf."
    except PermissionError:
        return False, "Permission denied. Run with sudo."


def handle_command(obj, ser):
    cmd = obj.get("cmd", "")
    resp = {"cmd": cmd}

    if cmd == "ping":
        resp["ok"] = True
        resp["msg"] = "pong"
    elif cmd == "wifi_status":
        status = get_wifi_status()
        resp["ok"] = True
        resp.update(status)
    elif cmd == "wifi_config":
        ssid = obj.get("ssid", "")
        password = obj.get("password", "")
        ok, msg = configure_wifi(ssid, password)
        resp["ok"] = ok
        resp["msg"] = msg
    else:
        resp["ok"] = False
        resp["msg"] = f"Unknown command: {cmd}"

    line = json.dumps(resp) + "\n"
    try:
        ser.write(line.encode("utf-8"))
        ser.flush()
    except Exception as e:
        log.error("Failed to write response: %s", e)
    log.info("Handled cmd=%s → ok=%s", cmd, resp.get("ok"))


def listen_loop():
    log.info("Waiting for %s ...", USB_SERIAL_DEV)
    while not os.path.exists(USB_SERIAL_DEV):
        time.sleep(1)

    # Disable echo so commands sent from the PC aren't bounced back
    os.system(f"stty -F {USB_SERIAL_DEV} -echo raw")

    ser_r = open(USB_SERIAL_DEV, "r")
    ser_w = open(USB_SERIAL_DEV, "wb", buffering=0)
    log.info("Listening on %s for commands (thermal data lines are ignored)", USB_SERIAL_DEV)

    try:
        for line in ser_r:
            line = line.strip()
            if not line:
                continue
            if not line.startswith("{"):
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if "cmd" not in obj:
                continue
            handle_command(obj, ser_w)
    except KeyboardInterrupt:
        log.info("Shutting down")
    finally:
        ser_r.close()
        ser_w.close()


def main():
    if os.geteuid() != 0:
        log.warning("Not running as root — WiFi config will likely fail. Use: sudo python3 %s", sys.argv[0])
    listen_loop()


if __name__ == "__main__":
    main()
