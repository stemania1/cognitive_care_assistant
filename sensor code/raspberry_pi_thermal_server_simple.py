#!/usr/bin/env python3
"""
Raspberry Pi Thermal Sensor Server - Simple Version
Serves thermal data from AMG8833 sensor via HTTP and WebSocket
Uses basic I2C communication without CircuitPython dependencies
"""

import json
import time
import math
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import asyncio
import websockets
from datetime import datetime

# Try to import smbus for I2C communication (more compatible)
try:
    import smbus
    I2C_AVAILABLE = True
except ImportError:
    try:
        import smbus2 as smbus
        I2C_AVAILABLE = True
    except ImportError:
        print("I2C libraries not available - will use simulation mode")
        I2C_AVAILABLE = False

# Ports configuration
HTTP_PORT = 8091
WEBSOCKET_PORT = 8092

# Thermal grid configuration
GRID_WIDTH = 8
GRID_HEIGHT = 8
TOTAL_PIXELS = GRID_WIDTH * GRID_HEIGHT

# Update interval
UPDATE_INTERVAL = 0.5  # Update every 500ms

# AMG8833 I2C configuration
AMG8833_ADDR = 0x69  # Default I2C address
AMG8833_TTHL = 0x0E  # Thermistor temperature register
AMG8833_TTHH = 0x0F  # Thermistor temperature register
AMG8833_T01L = 0x80  # Temperature register start
AMG8833_T01H = 0x81  # Temperature register start

# Initialize I2C and AMG8833 sensor
SENSOR_AVAILABLE = False
bus = None

if I2C_AVAILABLE:
    try:
        # Try different I2C bus numbers
        for bus_num in [1, 0]:
            try:
                bus = smbus.SMBus(bus_num)
                # Try to read from AMG8833
                bus.read_byte_data(AMG8833_ADDR, 0x00)
                print(f"AMG8833 sensor found on I2C bus {bus_num}")
                SENSOR_AVAILABLE = True
                break
            except:
                continue
        
        if not SENSOR_AVAILABLE:
            print("AMG8833 sensor not found on any I2C bus")
            print("Server will run in simulation mode")
            
    except Exception as e:
        print(f"Error initializing I2C: {e}")
        print("Server will run in simulation mode")
        SENSOR_AVAILABLE = False
else:
    print("I2C libraries not available - running in simulation mode")

def read_amg8833_pixels():
    """Read thermal data from AMG8833 sensor"""
    if not SENSOR_AVAILABLE or bus is None:
        return None
    
    try:
        pixels = []
        
        # Read all 64 pixels (8x8 grid)
        for i in range(TOTAL_PIXELS):
            # Each pixel is 12-bit, stored in 2 bytes
            pixel_addr_low = AMG8833_T01L + (i * 2)
            pixel_addr_high = AMG8833_T01H + (i * 2)
            
            # Read low and high bytes
            low = bus.read_byte_data(AMG8833_ADDR, pixel_addr_low)
            high = bus.read_byte_data(AMG8833_ADDR, pixel_addr_high)
            
            # Combine bytes and convert to temperature
            raw_data = (high << 8) | low
            
            # Convert to signed 12-bit value
            if raw_data & 0x800:  # Check if negative
                raw_data = raw_data - 0x1000
            
            # Convert to temperature (AMG8833: 0.25°C per LSB)
            temperature = raw_data * 0.25
            pixels.append(temperature)
        
        return pixels
        
    except Exception as e:
        print(f"Error reading AMG8833: {e}")
        return None

def pixels_to_grid(pixels):
    """Convert 1D pixel array to 8x8 grid"""
    if pixels is None or len(pixels) != TOTAL_PIXELS:
        return None
    
    grid = []
    for y in range(GRID_HEIGHT):
        row = []
        for x in range(GRID_WIDTH):
            pixel_index = y * GRID_WIDTH + x
            temperature = pixels[pixel_index]
            row.append(round(temperature, 1))
        grid.append(row)
    
    return grid

def generate_thermal_data():
    """Get actual thermal data from AMG8833 sensor or fallback to simulation"""
    if SENSOR_AVAILABLE:
        pixels = read_amg8833_pixels()
        if pixels is not None:
            grid = pixels_to_grid(pixels)
            if grid is not None:
                return grid
    
    # Fallback to simulation
    return generate_simulation_data()

def generate_simulation_data():
    """Generate simulation data as fallback"""
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
            
            # Base temperature with center bias
            center_bias = max(0, (3 - distance_from_center) * 2.0)
            
            # Add some time-based variation
            time_variation = math.sin(current_time + x * 0.5 + y * 0.3) * 1.5
            
            # Calculate final temperature
            temperature = 20.0 + center_bias + time_variation
            
            # Clamp to reasonable range
            temperature = max(15.0, min(35.0, temperature))
            
            row.append(round(temperature, 1))
        
        thermal_grid.append(row)
    
    return thermal_grid

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
                "sensor_available": SENSOR_AVAILABLE,
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
    
    if SENSOR_AVAILABLE:
        print("✅ Real AMG8833 sensor detected")
    else:
        print("⚠️ Running in simulation mode")
    
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

