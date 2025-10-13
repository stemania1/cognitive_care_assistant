#!/usr/bin/env python3
"""
Raspberry Pi Thermal Sensor Server
Provides HTTP and WebSocket endpoints for thermal data from AMG8833 sensor
"""

import asyncio
import json
import logging
import random
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread

try:
    import websockets
    from websockets.server import serve
except ImportError:
    print("Installing websockets...")
    import subprocess
    subprocess.check_call(["pip3", "install", "websockets"])
    import websockets
    from websockets.server import serve

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Ports configuration
HTTP_PORT = 8091
WEBSOCKET_PORT = 8092

# Simulated thermal sensor data (8x8 grid)
def generate_thermal_data():
    """Generate realistic thermal data (8x8 grid)"""
    # Base temperature around 22°C (room temperature)
    base_temp = 22.0
    
    # Generate 8x8 thermal grid
    thermal_grid = []
    for row in range(8):
        grid_row = []
        for col in range(8):
            # Add some variation and "hot spots"
            variation = random.uniform(-2.0, 2.0)
            
            # Simulate a person (warmer area in center)
            center_distance = ((row - 3.5) ** 2 + (col - 3.5) ** 2) ** 0.5
            if center_distance < 2:
                variation += random.uniform(2.0, 8.0)  # Person is 2-8°C warmer
            
            temp = base_temp + variation
            grid_row.append(round(temp, 1))
        thermal_grid.append(grid_row)
    
    return thermal_grid

class ThermalDataHandler(BaseHTTPRequestHandler):
    """HTTP handler for thermal data requests"""
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/thermal-data':
            try:
                # Generate thermal data
                thermal_data = generate_thermal_data()
                
                # Create response
                response = {
                    "timestamp": int(time.time() * 1000),
                    "thermal_data": thermal_data,
                    "grid_size": {"width": 8, "height": 8},
                    "sensor_info": {
                        "model": "AMG8833",
                        "resolution": "8x8",
                        "temperature_unit": "C"
                    },
                    "status": "active"
                }
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                
                logger.info(f"HTTP: Sent thermal data to {self.client_address[0]}")
                
            except Exception as e:
                logger.error(f"HTTP error: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b'{"error": "Internal server error"}')
        
        elif self.path == '/':
            # Serve a simple status page
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Thermal Sensor Server</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
                    .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .status { color: #28a745; font-weight: bold; }
                    .endpoint { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }
                    code { background: #e9ecef; padding: 2px 5px; border-radius: 3px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🌡️ Thermal Sensor Server</h1>
                    <p class="status">✅ Server is running</p>
                    <p><strong>Status:</strong> HTTP server is running on port %HTTP_PORT%</p>
                    
                    <h2>Available Endpoints:</h2>
                    <div class="endpoint">
                        <strong>GET</strong> <code>http://localhost:%HTTP_PORT%/thermal-data</code><br>
                        Returns current thermal sensor data as JSON
                    </div>
                    
                    <h2>WebSocket:</h2>
                    <div class="endpoint">
                        <strong>WebSocket</strong> <code>ws://localhost:%WEBSOCKET_PORT%</code><br>
                        Real-time thermal data stream
                    </div>
                    
                    <h2>Sample Response:</h2>
                    <pre>{
  "timestamp": 1234567890123,
  "thermal_data": [[22.1, 22.3, ...], [22.0, 22.2, ...], ...],
  "grid_size": {"width": 8, "height": 8},
  "sensor_info": {"model": "AMG8833", "resolution": "8x8"},
  "status": "active"
}</pre>
                </div>
            </body>
            </html>
            """
            html_content = html_content.replace('%HTTP_PORT%', str(HTTP_PORT)).replace('%WEBSOCKET_PORT%', str(WEBSOCKET_PORT))
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(html_content.encode())
        
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'{"error": "Not found"}')
    
    def log_message(self, format, *args):
        """Override to use our logger"""
        logger.info(f"HTTP: {format % args}")

async def websocket_handler(websocket, path):
    """Handle WebSocket connections for real-time thermal data"""
    client_address = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
    logger.info(f"WebSocket client connected: {client_address}")
    
    try:
        while True:
            # Generate thermal data
            thermal_data = generate_thermal_data()
            
            # Create message
            message = {
                "type": "thermal_data",
                "timestamp": int(time.time() * 1000),
                "thermal_data": thermal_data,
                "grid_size": {"width": 8, "height": 8},
                "sensor_info": {
                    "model": "AMG8833",
                    "resolution": "8x8",
                    "temperature_unit": "C"
                }
            }
            
            # Send data
            await websocket.send(json.dumps(message))
            
            # Wait before sending next update (send every 500ms)
            await asyncio.sleep(0.5)
            
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"WebSocket client disconnected: {client_address}")
    except Exception as e:
        logger.error(f"WebSocket error with {client_address}: {e}")
    finally:
        logger.info(f"WebSocket client disconnected: {client_address}")

async def main():
    """Main server function"""
    
    # Start HTTP server in a separate thread
    http_server = HTTPServer(('0.0.0.0', HTTP_PORT), ThermalDataHandler)
    logger.info(f"Starting HTTP server on port {HTTP_PORT}...")
    
    # Start WebSocket server
    logger.info(f"Starting WebSocket server on port {WEBSOCKET_PORT}...")
    
    # Run both servers concurrently
    await asyncio.gather(
        asyncio.get_event_loop().run_in_executor(None, http_server.serve_forever),
        serve(websocket_handler, "0.0.0.0", WEBSOCKET_PORT)
    )

if __name__ == "__main__":
    try:
        logger.info("Starting Thermal Sensor Server...")
        logger.info(f"HTTP endpoint: http://0.0.0.0:{HTTP_PORT}/thermal-data")
        logger.info(f"WebSocket endpoint: ws://0.0.0.0:{WEBSOCKET_PORT}")
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
