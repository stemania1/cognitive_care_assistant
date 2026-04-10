#!/bin/bash
# Complete Raspberry Pi Demo Mode Setup
# This configures the Pi to work automatically for demos without WiFi
# Run this ONCE while you have WiFi/SSH access
# Usage: Run on Raspberry Pi (via SSH or directly)

echo "🔵 Setting up Raspberry Pi for Demo Mode (Bluetooth Only)..."
echo "============================================================"
echo ""

# Get the script directory (assumes script is in /home/pi or project root)
SCRIPT_DIR="/home/pi"
if [ -f "sensor code/thermal_sensor/bluetooth-thermal-sender.py" ]; then
    SCRIPT_DIR="$(pwd)"
elif [ -f "/home/pi/bluetooth-thermal-sender.py" ]; then
    SCRIPT_DIR="/home/pi"
elif [ -f "/home/pi/cognitive_care_assistant/sensor code/thermal_sensor/bluetooth-thermal-sender.py" ]; then
    SCRIPT_DIR="/home/pi/cognitive_care_assistant"
fi

THERMAL_SENDER_SCRIPT="$SCRIPT_DIR/sensor code/thermal_sensor/bluetooth-thermal-sender.py"
if [ ! -f "$THERMAL_SENDER_SCRIPT" ]; then
    # Try alternative locations
    if [ -f "/home/pi/bluetooth-thermal-sender.py" ]; then
        THERMAL_SENDER_SCRIPT="/home/pi/bluetooth-thermal-sender.py"
    else
        echo "⚠️  Warning: Could not find bluetooth-thermal-sender.py"
        echo "   Please ensure the script is in the correct location"
        echo "   Expected: $THERMAL_SENDER_SCRIPT"
        read -p "   Enter full path to bluetooth-thermal-sender.py (or press Enter to skip): " CUSTOM_PATH
        if [ -n "$CUSTOM_PATH" ] && [ -f "$CUSTOM_PATH" ]; then
            THERMAL_SENDER_SCRIPT="$CUSTOM_PATH"
        else
            echo "❌ Cannot proceed without thermal sender script"
            exit 1
        fi
    fi
fi

echo "📁 Using thermal sender script: $THERMAL_SENDER_SCRIPT"
echo ""

# Step 1: Set up Bluetooth auto-discoverable service
echo "Step 1: Setting up Bluetooth auto-discoverable..."
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

sudo systemctl daemon-reload
sudo systemctl enable bluetooth-auto-discoverable.service
echo "✅ Bluetooth auto-discoverable service configured"
echo ""

# Step 2: Set up thermal sensor Bluetooth sender service
echo "Step 2: Setting up thermal sensor auto-start..."
sudo tee /etc/systemd/system/thermal-bluetooth-sender.service > /dev/null <<EOF
[Unit]
Description=Thermal Sensor Bluetooth Sender
After=bluetooth.service bluetooth-auto-discoverable.service
Requires=bluetooth.service

[Service]
Type=simple
User=pi
WorkingDirectory=$(dirname "$THERMAL_SENDER_SCRIPT")
ExecStart=/usr/bin/python3 "$THERMAL_SENDER_SCRIPT"
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable thermal-bluetooth-sender.service
echo "✅ Thermal sensor Bluetooth sender service configured"
echo ""

# Step 3: Make script executable
echo "Step 3: Making scripts executable..."
chmod +x "$THERMAL_SENDER_SCRIPT"
echo "✅ Scripts are executable"
echo ""

# Step 4: Test services
echo "Step 4: Testing services..."
echo ""

echo "Testing Bluetooth service..."
sudo systemctl start bluetooth-auto-discoverable.service
sleep 2
if sudo systemctl is-active --quiet bluetooth-auto-discoverable.service; then
    echo "✅ Bluetooth service started successfully"
    sudo bluetoothctl show | grep -E "(Powered|Discoverable|Pairable)" || true
else
    echo "⚠️  Bluetooth service may need manual start"
fi
echo ""

echo "Testing thermal sender service (will start in background)..."
sudo systemctl start thermal-bluetooth-sender.service
sleep 3
if sudo systemctl is-active --quiet thermal-bluetooth-sender.service; then
    echo "✅ Thermal sender service started successfully"
    echo "   Check status with: sudo systemctl status thermal-bluetooth-sender.service"
else
    echo "⚠️  Thermal sender service may have issues"
    echo "   Check logs with: sudo journalctl -u thermal-bluetooth-sender.service -n 20"
fi
echo ""

echo "============================================================"
echo "✅ Demo Mode Setup Complete!"
echo "============================================================"
echo ""
echo "📋 What was configured:"
echo "   1. Bluetooth auto-discoverable on boot"
echo "   2. Thermal sensor Bluetooth sender auto-start on boot"
echo ""
echo "💡 For your demo (no WiFi needed):"
echo "   1. Power on Raspberry Pi"
echo "   2. Wait ~30 seconds for services to start"
echo "   3. On your computer: Settings → Bluetooth → Pair 'raspberrypi'"
echo "   4. Note the COM port in Device Manager"
echo "   5. Run: npm run start:thermal"
echo "   6. Open: http://localhost:3000"
echo ""
echo "🔍 Check status:"
echo "   sudo systemctl status bluetooth-auto-discoverable.service"
echo "   sudo systemctl status thermal-bluetooth-sender.service"
echo ""
echo "📊 View logs:"
echo "   sudo journalctl -u thermal-bluetooth-sender.service -f"
echo ""
