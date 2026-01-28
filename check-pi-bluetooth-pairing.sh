#!/bin/bash
# Script to check Bluetooth pairing status and PIN on Raspberry Pi

echo "🔵 Checking Raspberry Pi Bluetooth Status..."
echo "=========================================="
echo ""

# Check Bluetooth service status
echo "1️⃣  Bluetooth Service Status:"
if sudo systemctl is-active --quiet bluetooth; then
    echo "   ✅ Bluetooth service is running"
else
    echo "   ❌ Bluetooth service is NOT running"
    echo "   💡 Run: sudo systemctl start bluetooth"
fi
echo ""

# Check Bluetooth status via bluetoothctl
echo "2️⃣  Bluetooth Controller Status:"
sudo bluetoothctl <<EOF | grep -E "(Controller|Powered|Discoverable|Pairable|Agent)"
show
EOF

echo ""
echo "3️⃣  Recent Pairing Attempts:"
echo "   (Check terminal output when pairing was attempted)"
echo ""

# Show paired devices
echo "4️⃣  Currently Paired Devices:"
sudo bluetoothctl devices

echo ""
echo "5️⃣  To see pairing PIN in real-time:"
echo "   Run this in a separate terminal on the Pi:"
echo "   sudo bluetoothctl"
echo "   Then when Windows tries to pair, you'll see the PIN here"
echo ""
