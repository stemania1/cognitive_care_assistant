#!/bin/bash
# Launcher for thermal sender - run from desktop double-click.
# Keeps terminal open so you see output and can close with keypress.
MODE="${1:-usb}"
if [ "$MODE" = "bluetooth" ]; then
  SCRIPT="/home/pi/bluetooth-thermal-sender.py"
else
  SCRIPT="/home/pi/usb-serial-thermal-sender.py"
fi
if [ ! -f "$SCRIPT" ]; then
  echo "Script not found: $SCRIPT"
  echo "Copy it to the Pi first (e.g. scp from your PC)."
  read -p "Press Enter to close..."
  exit 1
fi
echo "Starting thermal sender ($MODE)..."
echo "Close this window to stop."
echo ""
python3 "$SCRIPT"
echo ""
read -p "Press Enter to close..."
