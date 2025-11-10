#!/usr/bin/env python3
"""
AMG8833 Thermal Sensor Server
---------------------------------
- Streams raw 8x8 frames from the AMG8833 over HTTP and WebSocket.
- Leaves all filtering, calibration, and visualization to the client.
- Falls back to a lightweight simulation when the sensor is unavailable.
"""

import asyncio
import json
import logging
import math
import random
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer

try:
    import websockets
    from websockets.server import serve
except ImportError:  # pragma: no cover
    import subprocess

    subprocess.check_call(["pip3", "install", "websockets"])
    import websockets
    from websockets.server import serve

try:
    import board
    import busio
    import adafruit_amg88xx

    HAVE_AMG8833 = True
except ImportError as exc:
    print(f"AMG8833 dependencies missing ({exc}); running in simulation mode.")
    HAVE_AMG8833 = False

# Server configuration
HTTP_PORT = 8091
WEBSOCKET_PORT = 8092

# Sensor configuration
GRID_WIDTH = 8
GRID_HEIGHT = 8

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("amg8833-server")

sensor = None
if HAVE_AMG8833:
    try:
        i2c = busio.I2C(board.SCL, board.SDA)
        sensor = adafruit_amg88xx.AMG88XX(i2c)
        logger.info("✅ AMG8833 sensor initialized.")
    except Exception as exc:  # pragma: no cover
        logger.error(f"Failed to initialize AMG8833 sensor: {exc}")
        sensor = None
        HAVE_AMG8833 = False


def read_sensor_frame():
    """Return an 8×8 grid of raw temperature readings from the AMG8833."""
    if sensor is None:
        raise RuntimeError("AMG8833 sensor not available")
    frame = sensor.pixels  # Already an 8×8 list of floats
    # Copy to ensure the consumer cannot mutate the underlying buffer
    return [[float(frame[row][col]) for col in range(GRID_WIDTH)] for row in range(GRID_HEIGHT)]


def generate_simulation_frame():
    """Return a synthetic frame when the sensor is unavailable."""
    now = time.time()
    grid = []
    for y in range(GRID_HEIGHT):
        row = []
        for x in range(GRID_WIDTH):
            cx, cy = GRID_WIDTH / 2, GRID_HEIGHT / 2
            dist = math.hypot(x - cx, y - cy)
            center_bias = max(0, (2.5 - dist) * 2.5)
            wobble = math.sin(now * 0.6 + x * 0.4 + y * 0.2) * 0.8
            noise = random.uniform(-0.35, 0.35)
            row.append(22.0 + center_bias + wobble + noise)
        grid.append(row)
    return grid


def get_frame():
    if HAVE_AMG8833 and sensor is not None:
        try:
            return read_sensor_frame()
        except Exception as exc:  # pragma: no cover
            logger.error(f"Error reading AMG8833 frame: {exc}")
    return generate_simulation_frame()


def build_payload(frame):
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "thermal_data": frame,
        "grid_size": {"width": GRID_WIDTH, "height": GRID_HEIGHT},
        "sensor_info": {
            "model": "AMG8833",
            "temperature_unit": "C",
            "data_source": "sensor" if HAVE_AMG8833 and sensor else "simulation",
        },
        "status": "active",
    }


class ThermalDataHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/thermal-data":
            payload = build_payload(get_frame())
            body = json.dumps(payload).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body)
            logger.info("HTTP: served thermal frame")
            return

        if self.path == "/":
            html = f"""
<!DOCTYPE html>
<html>
  <head>
    <title>AMG8833 Thermal Sensor Server</title>
    <style>
      body {{ background: #0b1120; color: #f5f7ff; font-family: system-ui, sans-serif; margin: 40px; }}
      .card {{ max-width: 640px; margin: auto; background: #111c3a; padding: 28px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }}
      code {{ background: rgba(15,23,42,0.6); padding: 3px 8px; border-radius: 6px; }}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>AMG8833 Thermal Sensor Server</h1>
      <p>Status: <strong>{'Sensor' if sensor else 'Simulation'}</strong></p>
      <p>HTTP endpoint: <code>http://&lt;pi-ip&gt;:{HTTP_PORT}/thermal-data</code></p>
      <p>WebSocket endpoint: <code>ws://&lt;pi-ip&gt;:{WEBSOCKET_PORT}</code></p>
      <p>Data source: <strong>{'Sensor' if sensor else 'Simulation'}</strong></p>
    </div>
  </body>
</html>
"""
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(html.encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):  # pragma: no cover
        logger.debug("HTTP: " + format % args)


async def websocket_handler(websocket):
    peer = websocket.remote_address
    logger.info(f"WebSocket client connected: {peer}")
    try:
        while True:
            payload = build_payload(get_frame())
            await websocket.send(json.dumps(payload))
            await asyncio.sleep(0.5)
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"WebSocket client disconnected: {peer}")
    except Exception as exc:  # pragma: no cover
        logger.error(f"WebSocket error: {exc}")


async def main():
    loop = asyncio.get_running_loop()

    def start_http():
        server = HTTPServer(("0.0.0.0", HTTP_PORT), ThermalDataHandler)
        logger.info(f"HTTP server listening on 0.0.0.0:{HTTP_PORT}")
        server.serve_forever()

    http_task = loop.run_in_executor(None, start_http)
    ws_server = await serve(websocket_handler, "0.0.0.0", WEBSOCKET_PORT)
    logger.info(f"WebSocket server listening on 0.0.0.0:{WEBSOCKET_PORT}")

    await asyncio.gather(http_task, ws_server.wait_closed())


if __name__ == "__main__":
    try:
        logger.info("Starting AMG8833 thermal sensor server…")
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down.")

