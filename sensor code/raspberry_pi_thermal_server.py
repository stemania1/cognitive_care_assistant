#!/usr/bin/env python3
"""
Raspberry Pi Thermal Sensor Server
Serves thermal data from AMG8833 sensor via HTTP and WebSocket
"""

import json
import time
import math
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import asyncio
import websockets
from datetime import datetime

# Try to import AMG8833 libraries, fall back if not available
try:
    import board
    import busio
    import adafruit_amg88xx
    AMG8833_AVAILABLE = True
except ImportError as e:
    print(f"AMG8833 libraries not available: {e}")
    print("Will use simulation mode")
    AMG8833_AVAILABLE = False

# Ports configuration
HTTP_PORT = 8091
WEBSOCKET_PORT = 8092

# Thermal grid configuration
GRID_WIDTH = 8
GRID_HEIGHT = 8
TOTAL_PIXELS = GRID_WIDTH * GRID_HEIGHT

# Update interval
UPDATE_INTERVAL = 0.5  # Update every 500ms

# Smoothing configuration
SMOOTHING_FACTOR = 0.3  # Lower = more smoothing (0.1 = very smooth, 0.9 = less smooth)
last_thermal_data = None

# Initialize I2C and AMG8833 sensor
SENSOR_AVAILABLE = False
amg = None

if AMG8833_AVAILABLE:
    try:
        i2c = busio.I2C(board.SCL, board.SDA)
        amg = adafruit_amg88xx.AMG88XX(i2c)
        SENSOR_AVAILABLE = True
        print("AMG8833 sensor initialized successfully")
    except Exception as e:
        print(f"Warning: Could not initialize AMG8833 sensor: {e}")
        print("Server will run in simulation mode")
        SENSOR_AVAILABLE = False
else:
    print("AMG8833 libraries not available - running in simulation mode")

class ThermalDataHandler(BaseHTTPRequestHandler):
    """HTTP handler for thermal data requests"""
    
    def do_GET(self):
        if self.path == '/thermal-data':
            # Generate thermal data
            thermal_data = generate_thermal_data()
            
            # Create response
            response = {
                "thermal_data": thermal_data,
                "sensor_info": {
                    "model": "AMG8833",
                    "grid_size": f"{GRID_WIDTH}x{GRID_HEIGHT}",
                    "resolution": "64 pixels",
                    "update_rate": f"{1/UPDATE_INTERVAL:.1f} Hz",
                    "temperature_unit": "Celsius",
                    "data_source": "real_sensor" if SENSOR_AVAILABLE else "simulation"
                },
                "timestamp": datetime.now().isoformat(),
                "server_status": "active"
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            json_response = json.dumps(response, indent=2)
            self.wfile.write(json_response.encode('utf-8'))
            
        elif self.path == '/status':
            # Health check endpoint
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            status = {
                "status": "running",
                "server": "thermal_sensor",
                "timestamp": datetime.now().isoformat(),
                "endpoints": {
                    "thermal_data": "/thermal-data",
                    "status": "/status",
                    "websocket": f"ws://0.0.0.0:{WEBSOCKET_PORT}"
                }
            }
            
            self.wfile.write(json.dumps(status).encode('utf-8'))
            
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Override to reduce log noise"""
        pass

def smooth_thermal_data(new_data):
    """Apply smoothing to thermal data to reduce jumpiness"""
    global last_thermal_data
    
    if last_thermal_data is None:
        last_thermal_data = new_data
        return new_data
    
    # Apply exponential smoothing
    smoothed_data = []
    for y in range(GRID_HEIGHT):
        row = []
        for x in range(GRID_WIDTH):
            # Smooth each pixel
            old_value = last_thermal_data[y][x]
            new_value = new_data[y][x]
            smoothed_value = old_value + SMOOTHING_FACTOR * (new_value - old_value)
            row.append(round(smoothed_value, 1))
        smoothed_data.append(row)
    
    last_thermal_data = smoothed_data
    return smoothed_data

def generate_thermal_data():
    """Get actual thermal data from AMG8833 sensor or fallback to simulation"""
    if SENSOR_AVAILABLE:
        try:
            # Get actual sensor data
            pixels = amg.pixels
            
            # Convert to 8x8 grid format
            thermal_grid = []
            for y in range(GRID_HEIGHT):
                row = []
                for x in range(GRID_WIDTH):
                    # AMG8833 returns data in row-major order
                    pixel_index = y * GRID_WIDTH + x
                    temperature = pixels[pixel_index]
                    row.append(round(temperature, 1))
                thermal_grid.append(row)
            
            return smooth_thermal_data(thermal_grid)
            
        except Exception as e:
            print(f"Error reading sensor data: {e}")
            # Fallback to simulation if sensor fails
            simulation_data = generate_simulation_data()
            return smooth_thermal_data(simulation_data)
    else:
        # Use simulation if sensor not available
        simulation_data = generate_simulation_data()
        return smooth_thermal_data(simulation_data)

def generate_simulation_data():
    """Generate simulation data as fallback with smoothing"""
    current_time = time.time()
    
    # Create 8x8 thermal grid with realistic patterns
    thermal_grid = []
    
    for y in range(GRID_HEIGHT):
        row = []
        for x in range(GRID_WIDTH):
            # Create some realistic thermal patterns
            # Center area is typically warmer
            center_x, center_y = GRID_WIDTH // 2, GRID_HEIGHT // 2
            distance_from_center = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            
            # Base temperature with center bias (more gradual)
            center_bias = max(0, (3 - distance_from_center) * 1.5)
            
            # Add very subtle time-based variation (much smaller and slower)
            time_variation = math.sin(current_time * 0.1 + x * 0.2 + y * 0.15) * 0.3
            
            # Add some spatial variation for realism
            spatial_variation = math.sin(x * 0.8) * math.cos(y * 0.6) * 0.5
            
            # Calculate final temperature
            temperature = 22.0 + center_bias + time_variation + spatial_variation
            
            # Clamp to reasonable range
            temperature = max(18.0, min(28.0, temperature))
            
            row.append(round(temperature, 1))
        
        thermal_grid.append(row)
    
    return thermal_grid

async def websocket_handler(websocket, path):
    """Handle WebSocket connections for real-time thermal data"""
    print(f"WebSocket client connected: {websocket.remote_address}")
    
    try:
        while True:
            # Generate thermal data
            thermal_data = generate_thermal_data()
            
            # Create WebSocket message
            message = {
                "type": "thermal_data",
                "thermal_data": thermal_data,
                "timestamp": datetime.now().isoformat(),
                "sensor_info": {
                    "model": "AMG8833",
                    "grid_size": f"{GRID_WIDTH}x{GRID_HEIGHT}",
                    "update_rate": f"{1/UPDATE_INTERVAL:.1f} Hz",
                    "data_source": "real_sensor" if SENSOR_AVAILABLE else "simulation"
                }
            }
            
            # Send data
            await websocket.send(json.dumps(message))
            
            # Wait for next update
            await asyncio.sleep(UPDATE_INTERVAL)
            
    except websockets.exceptions.ConnectionClosed:
        print(f"WebSocket client disconnected: {websocket.remote_address}")
    except Exception as e:
        print(f"WebSocket error: {e}")

def start_websocket_server():
    """Start the WebSocket server in a separate thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    start_server = websockets.serve(websocket_handler, "0.0.0.0", WEBSOCKET_PORT)
    loop.run_until_complete(start_server)
    
    print(f"WebSocket server started on port {WEBSOCKET_PORT}")
    loop.run_forever()

def main():
    """Main function to start both HTTP and WebSocket servers"""
    print("Starting Thermal Sensor Server...")
    print(f"HTTP endpoint: http://0.0.0.0:{HTTP_PORT}/thermal-data")
    print(f"WebSocket endpoint: ws://0.0.0.0:{WEBSOCKET_PORT}")
    
    # Start HTTP server
    http_server = HTTPServer(('0.0.0.0', HTTP_PORT), ThermalDataHandler)
    print(f"Starting HTTP server on port {HTTP_PORT}...")
    
    # Start WebSocket server in a separate thread
    websocket_thread = threading.Thread(target=start_websocket_server, daemon=True)
    websocket_thread.start()
    
    try:
        # Start HTTP server (blocking)
        http_server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        http_server.shutdown()
        print("Servers stopped.")

if __name__ == "__main__":
    main()