#!/bin/bash
# Headless deployment helper for AMG883 + Raspberry Pi
# This does not run automatically—copy to your local machine and execute
# against the Pi once you've reviewed the paths/IP address.

set -euo pipefail

PI_HOST="${1:-192.168.254.200}"
PI_USER="${2:-pi}"
REPO_PATH="${3:-/home/pi/cognitive_care_assistant}"

echo "=============================================="
echo " Headless AMG883 Deployment Helper"
echo " Target: ${PI_USER}@${PI_HOST}"
echo " Repo path on Pi: ${REPO_PATH}"
echo "=============================================="
echo

read -rp "Proceed with static-IP headless setup? (y/N) " confirm
if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "[1/6] Copying systemd service template..."
scp "scripts/amg883-headless.service" "${PI_USER}@${PI_HOST}:/tmp/amg883-headless.service"

echo "[2/6] Installing service on the Pi..."
ssh "${PI_USER}@${PI_HOST}" <<EOF
sudo mv /tmp/amg883-headless.service /etc/systemd/system/amg883-headless.service
sudo sed -i "s|/home/pi/cognitive_care_assistant|${REPO_PATH}|g" /etc/systemd/system/amg883-headless.service
sudo systemctl daemon-reload
EOF

echo "[3/6] Enabling service to start on boot..."
ssh "${PI_USER}@${PI_HOST}" "sudo systemctl enable amg883-headless.service"

echo "[4/6] Starting service..."
ssh "${PI_USER}@${PI_HOST}" "sudo systemctl start amg883-headless.service"

echo "[5/6] Waiting a few seconds for first frame..."
sleep 5

echo "[6/6] Fetching service status and last log entries..."
ssh "${PI_USER}@${PI_HOST}" <<'EOF'
echo "----- systemctl status -----"
systemctl status amg883-headless.service --no-pager
echo
echo "----- recent log output -----"
sudo tail -n 50 /var/log/amg883-headless.log || true
EOF

echo
echo "Done. Test from the app by opening Sleep Behaviors and starting the sensor."
echo "*** If the IP ever changes, update src/app/config/sensor-config.ts and COMMON_IPS."

