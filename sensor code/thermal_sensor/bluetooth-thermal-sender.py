#!/usr/bin/env python3
"""
Bluetooth Thermal Sender for AMG8833
-------------------------------------
Sends thermal data from AMG8833 sensor via Bluetooth Serial to computer.
This script runs on the Raspberry Pi and sends data to bluetooth-thermal-receiver.js

Usage:
    python3 bluetooth-thermal-sender.py
"""

import json
import logging
import time
from datetime import datetime

# Try to import AMG8833 sensor libraries
try:
    import board
    import busio
    import adafruit_amg88xx
    HAVE_AMG8833 = True
except ImportError as exc:
    print(f"AMG8833 dependencies missing ({exc}). Install with:")
    print("  pip3 install adafruit-blinka adafruit-circuitpython-amg88xx")
    raise SystemExit(1)

# Try to import Bluetooth libraries
try:
    import bluetooth
    HAVE_BLUETOOTH = True
except ImportError:
    print("Bluetooth library not found. Install with:")
    print("  sudo apt install python3-bluetooth")
    print("  pip3 install pybluez")
    raise SystemExit(1)

# Sensor configuration
GRID_WIDTH = 8
GRID_HEIGHT = 8
UPDATE_INTERVAL = 0.1  # 10Hz update rate (100ms)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("thermal-bt-sender")

# Initialize AMG8833 sensor
sensor = None
try:
    i2c = busio.I2C(board.SCL, board.SDA)
    sensor = adafruit_amg88xx.AMG88XX(i2c)
    logger.info("✅ AMG8833 sensor initialized")
except Exception as exc:
    logger.error(f"Failed to initialize AMG8833 sensor: {exc}")
    raise SystemExit(1)


def read_sensor_frame():
    """Return an 8×8 grid of raw temperature readings from the AMG8833."""
    if sensor is None:
        raise RuntimeError("AMG8833 sensor not available")
    frame = sensor.pixels  # Already an 8×8 list of floats
    return [[float(frame[row][col]) for col in range(GRID_WIDTH)] for row in range(GRID_HEIGHT)]


def build_payload(frame):
    """Build JSON payload matching the HTTP server format."""
    return {
        "type": "thermal_data",
        "timestamp": datetime.utcnow().isoformat(),
        "thermal_data": frame,
        "grid_size": {"width": GRID_WIDTH, "height": GRID_HEIGHT},
        "sensor_info": {
            "model": "AMG8833",
            "temperature_unit": "C",
            "data_source": "sensor"
        },
        "status": "active"
    }


# Use channel 1 so Windows "Standard Serial over Bluetooth" can connect (SPP expects channel 1)
RFCOMM_CHANNEL = 1


def main():
    """Main function to run Bluetooth server and send thermal data."""
    # Create Bluetooth server socket on fixed channel 1 (Windows SPP default)
    server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
    server_sock.bind(("", RFCOMM_CHANNEL))
    server_sock.listen(1)

    port = server_sock.getsockname()[1]
    uuid = "00001101-0000-1000-8000-00805f9b34fb"  # Serial Port Profile

    # Note: advertise_service() has issues on newer Raspberry Pi OS
    # We skip it and use direct RFCOMM connection instead
    # The service can still be connected to via RFCOMM channel number
    try:
        bluetooth.advertise_service(
            server_sock,
            "AMG8833_Thermal",
            service_id=uuid,
            service_classes=[uuid, bluetooth.SERIAL_PORT_CLASS],
            profiles=[bluetooth.SERIAL_PORT_PROFILE]
        )
        logger.info("✅ Service advertised")
    except bluetooth.BluetoothError as e:
        # If advertise fails, continue anyway - direct RFCOMM connection will still work
        logger.warning(f"⚠️ Service advertising failed (this is OK): {e}")
        logger.info("📡 Using direct RFCOMM connection (no advertising)")

    logger.info(f"🔵 Bluetooth server started on RFCOMM channel {port}")
    logger.info("📡 Waiting for connection from computer...")
    logger.info("   (Make sure to pair with this device from your computer)")

    try:
        while True:
            # Wait for a connection (or reconnection)
            client_sock, address = server_sock.accept()
            logger.info(f"✅ Connected to {address}")
            logger.info("📤 Sending thermal data...")

            last_log_time = time.time()
            frame_count = 0

            try:
                while True:
                    try:
                        # Read thermal frame
                        frame = read_sensor_frame()
                        
                        # Build payload
                        payload = build_payload(frame)
                        
                        # Convert to JSON string with newline delimiter
                        message = json.dumps(payload) + "\n"
                        
                        # Send via Bluetooth
                        client_sock.send(message.encode('utf-8'))
                        
                        frame_count += 1
                        
                        # Log every 5 seconds to avoid spam
                        current_time = time.time()
                        if current_time - last_log_time >= 5.0:
                            avg_temp = sum(sum(row) for row in frame) / (GRID_WIDTH * GRID_HEIGHT)
                            logger.info(f"📤 Sent frame #{frame_count} - Avg temp: {avg_temp:.2f}°C")
                            last_log_time = current_time
                        
                        # Wait before next frame
                        time.sleep(UPDATE_INTERVAL)
                        
                    except bluetooth.BluetoothError as e:
                        logger.error(f"❌ Bluetooth error: {e}")
                        raise
                    except Exception as e:
                        logger.error(f"❌ Error: {e}")
                        time.sleep(1)
            except bluetooth.BluetoothError:
                pass  # Fall through to close client and accept again
            finally:
                try:
                    client_sock.close()
                except Exception:
                    pass
                logger.info("📡 Disconnected. Waiting for reconnection...")

    except KeyboardInterrupt:
        logger.info("\n🛑 Stopping...")
    finally:
        server_sock.close()
        logger.info("✅ Bluetooth server closed")


if __name__ == "__main__":
    main()

