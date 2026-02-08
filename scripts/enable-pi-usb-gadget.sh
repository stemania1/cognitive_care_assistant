#!/bin/bash
# Enable USB gadget (USB ethernet) on Raspberry Pi so it can be reached via USB cable
# at 192.168.7.2. Run on the Pi (e.g. via SSH). Reboot after running.
# See RASPBERRY_PI_USB_CONNECTION.md for full instructions.

set -euo pipefail

BOOT_CONFIG="${BOOT_CONFIG:-/boot/firmware/config.txt}"
BOOT_CMDLINE="${BOOT_CMDLINE:-/boot/firmware/cmdline.txt}"

# Older Raspberry Pi OS
if [[ ! -f "$BOOT_CONFIG" ]]; then
  BOOT_CONFIG="/boot/config.txt"
  BOOT_CMDLINE="/boot/cmdline.txt"
fi

if [[ ! -f "$BOOT_CONFIG" ]]; then
  echo "Could not find boot config (tried /boot/firmware/config.txt and /boot/config.txt)."
  exit 1
fi

echo "Using boot config: $BOOT_CONFIG"
echo "Using cmdline:    $BOOT_CMDLINE"
echo

# 1. dwc2 overlay
if grep -q '^dtoverlay=dwc2' "$BOOT_CONFIG" 2>/dev/null; then
  echo "[OK] dtoverlay=dwc2 already in $BOOT_CONFIG"
else
  echo "[ADD] dtoverlay=dwc2 to $BOOT_CONFIG"
  echo "dtoverlay=dwc2" | sudo tee -a "$BOOT_CONFIG" >/dev/null
fi

# 2. modules-load in cmdline (must be on the single long line, after rootwait)
if grep -q 'modules-load=dwc2,g_ether' "$BOOT_CMDLINE" 2>/dev/null; then
  echo "[OK] modules-load=dwc2,g_ether already in $BOOT_CMDLINE"
else
  echo "[ADD] modules-load=dwc2,g_ether to $BOOT_CMDLINE (after rootwait)"
  sudo sed -i 's/rootwait/rootwait modules-load=dwc2,g_ether/' "$BOOT_CMDLINE"
  if ! grep -q 'modules-load=dwc2,g_ether' "$BOOT_CMDLINE"; then
    echo "Warning: Add manually: after rootwait add a space and: modules-load=dwc2,g_ether"
  fi
fi

# 3. Static IP for usb0 in dhcpcd.conf
DHCPCD="/etc/dhcpcd.conf"
MARKER="# USB gadget static IP (cognitive_care_assistant)"
if grep -q "$MARKER" "$DHCPCD" 2>/dev/null; then
  echo "[OK] USB static IP block already in $DHCPCD"
else
  echo "[ADD] USB interface static IP to $DHCPCD"
  sudo tee -a "$DHCPCD" << 'EOF'

# USB gadget static IP (cognitive_care_assistant)
interface usb0
static ip_address=192.168.7.2/24
static routers=192.168.7.1
static domain_name_servers=192.168.7.1
EOF
fi

echo
echo "Done. Reboot the Pi for changes to take effect: sudo reboot"
echo "Then connect the Pi to your PC via USB (Pi 4: use the USB-C data port)."
echo "On the app, select Connection: USB and use 192.168.7.2 (already set in sensor-config)."
