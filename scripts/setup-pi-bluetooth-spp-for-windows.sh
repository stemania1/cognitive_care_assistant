#!/bin/bash
# One-time setup on the Pi so Windows can add a COM port (Bluetooth Serial/SPP).
# Run on the Pi:  sudo bash setup-pi-bluetooth-spp-for-windows.sh
# Then on Windows: Devices and Printers → raspberrypi → Properties → COM Ports → Add Outgoing.

set -e
echo "🔵 Raspberry Pi Bluetooth SPP setup for Windows COM port"
echo ""

# 1. Find bluetoothd path from the system service
BLUETOOTHD=""
if [ -x /usr/libexec/bluetooth/bluetoothd ]; then
  BLUETOOTHD="/usr/libexec/bluetooth/bluetoothd"
elif [ -x /usr/lib/bluetooth/bluetoothd ]; then
  BLUETOOTHD="/usr/lib/bluetooth/bluetoothd"
else
  BLUETOOTHD=$(grep -E '^ExecStart=' /lib/systemd/system/bluetooth.service 2>/dev/null | head -1 | sed 's/ExecStart=//' | awk '{print $1}')
  if [ -z "$BLUETOOTHD" ] || [ ! -x "$BLUETOOTHD" ]; then
    echo "❌ Could not find bluetoothd. Install bluetooth: sudo apt install bluez"
    exit 1
  fi
fi
echo "   Using bluetoothd: $BLUETOOTHD"

# 2. Create override with -C (compatibility for SPP) and sdptool add SP
sudo mkdir -p /etc/systemd/system/bluetooth.service.d
sudo tee /etc/systemd/system/bluetooth.service.d/spp.conf > /dev/null << EOF
[Service]
ExecStart=
ExecStart=$BLUETOOTHD -C
ExecStartPost=/bin/sh -c '/usr/bin/sdptool add SP || true'
EOF
echo "✅ Created /etc/systemd/system/bluetooth.service.d/spp.conf"

# 3. Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart bluetooth
sleep 2

# 4. Check status
if ! sudo systemctl is-active --quiet bluetooth; then
  echo "❌ Bluetooth service failed to start. Check: journalctl -u bluetooth -n 20 --no-pager"
  exit 1
fi
echo "✅ Bluetooth service is running"

# 5. Register SPP now (in case ExecStartPost was too early)
if command -v sdptool >/dev/null 2>&1; then
  sudo sdptool add SP 2>/dev/null || true
  echo "✅ Ran sdptool add SP"
  echo ""
  echo "   Local SDP services (look for 'Serial Port'):"
  sdptool browse local 2>/dev/null | head -30 || true
else
  echo "⚠️  sdptool not found; SPP may still be added by ExecStartPost."
fi

echo ""
echo "=========================================="
echo "Next steps on your Windows PC:"
echo "  1. Win+R → control printers → Enter"
echo "  2. Right-click 'raspberrypi' → Properties → COM Ports"
echo "  3. Add → Outgoing → select raspberrypi → OK"
echo "  4. Note the COM number (e.g. COM9)"
echo "  5. Run: node bluetooth-thermal-receiver.js COM9"
echo "=========================================="
