#!/usr/bin/env python3
"""
Raspberry Pi WiFi & Bluetooth configuration server.
Run on the Pi when connected via USB so the app (running locally) can configure
WiFi and Bluetooth. Must be run with sudo for config changes.

  sudo python3 pi-config-server.py

Listens on 0.0.0.0:8093. Endpoints:
  POST /configure-wifi   { "ssid": "...", "password": "..." }
  POST /configure-bluetooth  { "discoverable": true }
  GET  /status   { "wifi": {...}, "bluetooth": {...} }
"""

import json
import logging
import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

CONFIG_PORT = int(os.getenv("PI_CONFIG_PORT", "8093"))
WPA_SUPPLICANT_CONF = "/etc/wpa_supplicant/wpa_supplicant.conf"
WPA_SUPPLICANT_CONF_ALT = "/boot/firmware/wpa_supplicant.conf"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("pi-config")


def run_cmd(cmd, check=True, capture=True, timeout=15):
    try:
        r = subprocess.run(
            cmd,
            capture_output=capture,
            text=True,
            timeout=timeout,
            check=check,
        )
        return (r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip())
    except subprocess.CalledProcessError as e:
        return (e.returncode, (e.stdout or "").strip(), (e.stderr or "").strip())
    except Exception as e:
        logger.exception("run_cmd failed: %s", e)
        return (-1, "", str(e))


def get_wifi_status():
    """Return current WiFi connection status."""
    code, out, err = run_cmd(["nmcli", "-t", "-f", "ACTIVE,SSID", "dev", "wifi"], check=False)
    if code != 0:
        code2, out2, _ = run_cmd(["iwconfig", "wlan0"], check=False)
        if code2 == 0 and "ESSID:" in out2:
            for line in out2.splitlines():
                if "ESSID:" in line:
                    ssid = line.split("ESSID:")[-1].strip(' "')
                    return {"connected": bool(ssid and ssid != "off/any"), "ssid": ssid or None}
        return {"connected": False, "ssid": None, "error": err or "nmcli/iwconfig failed"}
    for line in out.splitlines():
        if line.startswith("yes:"):
            _, ssid = line.split(":", 1)
            return {"connected": True, "ssid": ssid or None}
    return {"connected": False, "ssid": None}


def configure_wifi(ssid: str, password: str) -> tuple[bool, str]:
    """Configure WiFi. Returns (success, message)."""
    if not ssid or not ssid.strip():
        return False, "SSID is required"
    ssid = ssid.strip()
    password = (password or "").strip()

    # Prefer nmcli (Raspberry Pi OS with NetworkManager)
    code, out, err = run_cmd(
        ["nmcli", "device", "wifi", "connect", ssid, "password", password] if password
        else ["nmcli", "device", "wifi", "connect", ssid],
        check=False,
        timeout=30,
    )
    if code == 0:
        return True, "WiFi configured (nmcli). Reconnect may take a few seconds."
    if "not found" in (out + err).lower() or "not running" in (out + err).lower():
        pass  # fallback to wpa_supplicant
    else:
        return False, f"nmcli failed: {err or out}"

    # Fallback: append to wpa_supplicant.conf (needs root)
    conf_path = WPA_SUPPLICANT_CONF if os.path.isfile(WPA_SUPPLICANT_CONF) else WPA_SUPPLICANT_CONF_ALT
    if not os.path.isfile(conf_path):
        return False, f"wpa_supplicant not found at {conf_path}. Install NetworkManager or create config."

    network_block = f'''
network={{
    ssid="{ssid}"
    psk="{password}"
}}
'''
    try:
        with open(conf_path, "a") as f:
            f.write(network_block)
    except PermissionError:
        return False, f"Permission denied writing {conf_path}. Run with sudo."
    run_cmd(["wpa_cli", "-i", "wlan0", "reconfigure"], check=False)
    return True, "WiFi credentials written. Interface may reconnect shortly."


def get_bluetooth_status():
    """Return Bluetooth discoverable/pairable status."""
    code, out, err = run_cmd(["bluetoothctl", "show"], check=False)
    if code != 0:
        return {"discoverable": False, "pairable": False, "error": err or "bluetoothctl failed"}
    discoverable = "Discoverable: yes" in out
    pairable = "Pairable: yes" in out
    return {"discoverable": discoverable, "pairable": pairable}


def configure_bluetooth(discoverable: bool = True, pairable: bool = True) -> tuple[bool, str]:
    """Set Bluetooth discoverable/pairable. Returns (success, message)."""
    commands = []
    if discoverable:
        commands.append("discoverable on")
    else:
        commands.append("discoverable off")
    if pairable:
        commands.append("pairable on")
    else:
        commands.append("pairable off")
    for cmd in commands:
        code, out, err = run_cmd(["bluetoothctl", cmd], check=False)
        if code != 0:
            return False, f"bluetoothctl {cmd}: {err or out}"
    return True, "Bluetooth settings updated."


class ConfigHandler(BaseHTTPRequestHandler):
    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        if urlparse(self.path).path == "/status":
            wifi = get_wifi_status()
            bluetooth = get_bluetooth_status()
            body = json.dumps({"wifi": wifi, "bluetooth": bluetooth}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors_headers()
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        path = urlparse(self.path).path
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        try:
            data = json.loads(body.decode("utf-8")) if body else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        if path == "/configure-wifi":
            ssid = data.get("ssid", "")
            password = data.get("password", "")
            ok, msg = configure_wifi(ssid, password)
            self._send_json(200 if ok else 400, {"success": ok, "message": msg})
            return
        if path == "/configure-bluetooth":
            discoverable = data.get("discoverable", True)
            pairable = data.get("pairable", True)
            ok, msg = configure_bluetooth(discoverable=discoverable, pairable=pairable)
            self._send_json(200 if ok else 400, {"success": ok, "message": msg})
            return
        self.send_response(404)
        self.end_headers()

    def _send_json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        logger.info(format % args)


def main():
    if os.geteuid() != 0:
        logger.warning("Not running as root. WiFi/Bluetooth config may fail. Run with: sudo python3 %s", sys.argv[0])
    server = HTTPServer(("0.0.0.0", CONFIG_PORT), ConfigHandler)
    logger.info("Pi config server listening on 0.0.0.0:%s (WiFi & Bluetooth)", CONFIG_PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down")
        server.shutdown()


if __name__ == "__main__":
    main()
