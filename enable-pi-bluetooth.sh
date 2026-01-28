#!/bin/bash
# Script to enable and make Raspberry Pi Bluetooth discoverable
# Run this on the Raspberry Pi: sudo bash enable-pi-bluetooth.sh

echo "🔵 Enabling Bluetooth on Raspberry Pi..."
echo ""

# Step 1: Enable and start Bluetooth service
echo "Step 1: Enabling Bluetooth service..."
sudo systemctl enable bluetooth
sudo systemctl start bluetooth

if sudo systemctl is-active --quiet bluetooth; then
    echo "✅ Bluetooth service is running"
else
    echo "⚠️  Bluetooth service status: $(sudo systemctl is-active bluetooth)"
fi
echo ""

# Step 2: Make Bluetooth discoverable and pairable
echo "Step 2: Making Bluetooth discoverable..."
sudo bluetoothctl <<EOF
power on
discoverable on
pairable on
agent on
default-agent
exit
EOF

echo ""
echo "✅ Bluetooth is now discoverable and pairable!"
echo ""
echo "💡 Next steps:" 
echo "   1. Open Windows Settings → Bluetooth & devices"
echo "   2. Click 'Add device' → 'Bluetooth'"
echo "   3. Look for 'raspberrypi' in the device list"
echo "   4. Click 'Pair'"
echo "   5. Make sure it shows as 'Connected' (green checkmark)"
echo ""
