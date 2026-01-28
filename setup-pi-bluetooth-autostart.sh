#!/bin/bash
# Script to set up Raspberry Pi Bluetooth to auto-enable on boot
# Run this ONCE while you still have WiFi/SSH access
# Usage: Run this on Raspberry Pi (via SSH or directly)

echo "🔵 Setting up Raspberry Pi Bluetooth for auto-start..."
echo ""

# Create a systemd service that makes Bluetooth discoverable on boot
sudo tee /etc/systemd/system/bluetooth-auto-discoverable.service > /dev/null <<'EOF'
[Unit]
Description=Make Bluetooth Discoverable on Boot
After=bluetooth.service
Requires=bluetooth.service

[Service]
Type=oneshot
ExecStart=/usr/bin/bluetoothctl power on
ExecStart=/usr/bin/bluetoothctl discoverable on
ExecStart=/usr/bin/bluetoothctl pairable on
ExecStart=/usr/bin/bluetoothctl agent on
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable bluetooth-auto-discoverable.service

echo "✅ Bluetooth will now be discoverable automatically on boot!"
echo ""
echo "💡 To test:"
echo "   sudo systemctl start bluetooth-auto-discoverable.service"
echo "   sudo bluetoothctl show"
echo ""
