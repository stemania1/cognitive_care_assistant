#!/usr/bin/env python3
"""
AMG8833 Thermal Sensor Server for Raspberry Pi
Serves thermal data via WebSocket and HTTP on port 8090
"""

import asyncio
import json
import logging
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from websockets.server import serve, WebSocketServerProtocol
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Ports configuration
HTTP_PORT = 8091
WEBSOCKET_PORT = 8092

# Check if smbus is available
try:
    import smbus
    SMBUS_AVAILABLE = True
    logger.info("smbus library available - using real sensor")
except ImportError:
    SMBUS_AVAILABLE = False
    logger.warning("smbus library not available - using mock data for testing")

class AMG8833:
    """AMG8833 Thermal Sensor Interface"""
    
    # I2C address
    AMG8833_ADDR = 0x69
    
    # Register addresses
    PCLT = 0x00
    PCHT = 0x01
    TTHL = 0x0E
    TTHH = 0x0F
    INT0 = 0x10
    INT1 = 0x11
    INT2 = 0x12
    INT3 = 0x13
    INT4 = 0x14
    INT5 = 0x15
    INT6 = 0x16
    INT7 = 0x17
    INT8 = 0x18
    INT9 = 0x19
    INTA = 0x1A
    INTB = 0x1B
    INTC = 0x1D
    INTD = 0x1E
    INTE = 0x1F
    INTF = 0x20
    INTG = 0x21
    INTH = 0x22
    INTI = 0x23
    INTJ = 0x24
    INTK = 0x25
    INTL = 0x26
    INTM = 0x27
    INTN = 0x28
    INTO = 0x29
    INTP = 0x2A
    INTQ = 0x2B
    INTR = 0x2C
    INTS = 0x2D
    INTT = 0x2E
    INTU = 0x2F
    INTV = 0x30
    INTW = 0x31
    INTX = 0x32
    INTY = 0x33
    INTZ = 0x34
    INT10 = 0x35
    INT11 = 0x36
    INT12 = 0x37
    INT13 = 0x38
    INT14 = 0x39
    INT15 = 0x3A
    INT16 = 0x3B
    INT17 = 0x3C
    INT18 = 0x3D
    INT19 = 0x3E
    INT1A = 0x3F
    INT1B = 0x40
    INT1C = 0x41
    INT1D = 0x42
    INT1E = 0x43
    INT1F = 0x44
    INT20 = 0x45
    INT21 = 0x46
    INT22 = 0x47
    INT23 = 0x48
    INT24 = 0x49
    INT25 = 0x4A
    INT26 = 0x4B
    INT27 = 0x4C
    INT28 = 0x4D
    INT29 = 0x4E
    INT2A = 0x4F
    INT2B = 0x50
    INT2C = 0x51
    INT2D = 0x52
    INT2E = 0x53
    INT2F = 0x54
    INT30 = 0x55
    INT31 = 0x56
    INT32 = 0x57
    INT33 = 0x58
    INT34 = 0x59
    INT35 = 0x5A
    INT36 = 0x5B
    INT37 = 0x5C
    INT38 = 0x5D
    INT39 = 0x5E
    INT3A = 0x5F
    INT3B = 0x60
    INT3C = 0x61
    INT3D = 0x62
    INT3E = 0x63
    INT3F = 0x64
    
    def __init__(self, bus_number=1):
        """Initialize AMG8833 sensor"""
        self.bus_number = bus_number
        self.bus = None
        self.smbus_available = SMBUS_AVAILABLE
        
        if self.smbus_available:
            try:
                self.bus = smbus.SMBus(bus_number)
                logger.info(f"Connected to I2C bus {bus_number}")
                self._initialize_sensor()
            except Exception as e:
                logger.error(f"Failed to initialize I2C bus: {e}")
                self.smbus_available = False
        
        if not self.smbus_available:
            logger.info("Using mock sensor data")
    
    def _initialize_sensor(self):
        """Initialize sensor settings"""
        try:
            # Set normal mode (0x00)
            self.bus.write_byte_data(self.AMG8833_ADDR, 0x00, 0x00)
            time.sleep(0.1)
            
            # Set frame rate to 10 FPS (0x02)
            self.bus.write_byte_data(self.AMG8833_ADDR, 0x02, 0x00)
            time.sleep(0.1)
            
            logger.info("AMG8833 sensor initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize sensor: {e}")
    
    def _read_byte_data(self, register):
        """Read byte from register"""
        try:
            return self.bus.read_byte_data(self.AMG8833_ADDR, register)
        except Exception as e:
            logger.error(f"Failed to read register 0x{register:02X}: {e}")
            return 0
    
    def _read_word_data(self, register):
        """Read word (16-bit) from register"""
        try:
            return self.bus.read_word_data(self.AMG8833_ADDR, register)
        except Exception as e:
            logger.error(f"Failed to read word from register 0x{register:02X}: {e}")
            return 0
    
    def _convert_to_temperature(self, raw_value):
        """Convert raw sensor value to temperature in Celsius"""
        # AMG8833 raw values are 12-bit signed integers
        # Convert to temperature using the sensor's conversion formula
        if raw_value & 0x800:  # Check if negative (12-bit signed)
            raw_value = raw_value - 0x1000
        
        # Convert to temperature (formula from AMG8833 datasheet)
        temperature = raw_value * 0.0625
        return temperature
    
    def read_thermal_data(self):
        """Read 8x8 thermal data from sensor"""
        if not self.smbus_available or self.bus is None:
            return self._generate_mock_data()
        
        try:
            thermal_data = []
            
            # Read all 64 pixels (8x8 grid)
            for i in range(64):
                register = 0x80 + i  # Starting from 0x80 for pixel data
                raw_value = self._read_word_data(register)
                temperature = self._convert_to_temperature(raw_value)
                thermal_data.append(temperature)
            
            # Reshape to 8x8 grid
            thermal_grid = np.array(thermal_data).reshape(8, 8)
            
            return thermal_grid.tolist()
            
        except Exception as e:
            logger.error(f"Failed to read thermal data: {e}")
            return self._generate_mock_data()
    
    def _generate_mock_data(self):
        """Generate realistic mock thermal data for testing"""
        # Create a realistic thermal pattern (warm center, cooler edges)
        base_temp = 25.0  # Base temperature in Celsius
        
        # Create 8x8 grid with warm center
        mock_data = []
        for y in range(8):
            row = []
            for x in range(8):
                # Calculate distance from center
                center_x, center_y = 3.5, 3.5
                distance = np.sqrt((x - center_x)**2 + (y - center_y)**2)
                
                # Temperature decreases with distance from center
                temp_variation = max(0, 15 - distance * 2)  # 15°C variation
                noise = np.random.normal(0, 0.5)  # Add some noise
                
                temperature = base_temp + temp_variation + noise
                row.append(round(temperature, 1))
            
            mock_data.append(row)
        
        return mock_data
    
    def get_sensor_info(self):
        """Get sensor information"""
        if self.smbus_available and self.bus is not None:
            try:
                # Read device ID
                device_id = self._read_byte_data(0x33)
                return {
                    "type": "AMG8833",
                    "device_id": f"0x{device_id:02X}",
                    "status": "connected",
                    "bus": self.bus_number
                }
            except:
                pass
        
        return {
            "type": "AMG8833",
            "device_id": "mock",
            "status": "mock_data",
            "bus": "none"
        }

class ThermalDataHandler(BaseHTTPRequestHandler):
    """HTTP handler for thermal data requests"""
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/thermal-data':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # Get thermal data
            thermal_data = sensor.read_thermal_data()
            sensor_info = sensor.get_sensor_info()
            
            response_data = {
                "timestamp": time.time(),
                "thermal_data": thermal_data,
                "sensor_info": sensor_info,
                "grid_size": {"width": 8, "height": 8}
            }
            
            self.wfile.write(json.dumps(response_data).encode())
            
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html_content = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>AMG8833 Thermal Sensor Server</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
                    .connected { background-color: #d4edda; color: #155724; }
                    .mock { background-color: #fff3cd; color: #856404; }
                </style>
            </head>
            <body>
                <h1>AMG8833 Thermal Sensor Server</h1>
                <div class="status connected">
                    <strong>Status:</strong> HTTP server is running on port %HTTP_PORT%
                </div>
                <h2>Endpoints:</h2>
                <ul>
                    <li><strong>GET /thermal-data</strong> - Get current thermal data (JSON)</li>
                    <li><strong>WebSocket ws://localhost:%WEBSOCKET_PORT%</strong> - Real-time thermal data stream</li>
                </ul>
                <h2>Usage:</h2>
                <p>Connect your thermal sensor monitor to this server to receive real-time thermal data.</p>
            </body>
            </html>
            """
            html_content = html_content.replace('%HTTP_PORT%', str(HTTP_PORT)).replace('%WEBSOCKET_PORT%', str(WEBSOCKET_PORT))
            self.wfile.write(html_content.encode())
            
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Override logging to reduce noise"""
        logger.info(f"HTTP: {format % args}")

async def websocket_handler(websocket: WebSocketServerProtocol):
    """Handle WebSocket connections"""
    client_address = websocket.remote_address
    logger.info(f"WebSocket client connected: {client_address}")
    
    try:
        # Send initial sensor info
        sensor_info = sensor.get_sensor_info()
        await websocket.send(json.dumps({
            "type": "connection",
            "message": "Connected to AMG8833 Thermal Sensor Server",
            "sensor_info": sensor_info
        }))
        
        # Send thermal data every 500ms
        while True:
            thermal_data = sensor.read_thermal_data()
            sensor_info = sensor.get_sensor_info()
            
            data_packet = {
                "type": "thermal_data",
                "timestamp": time.time(),
                "thermal_data": thermal_data,
                "sensor_info": sensor_info,
                "grid_size": {"width": 8, "height": 8}
            }
            
            await websocket.send(json.dumps(data_packet))
            await asyncio.sleep(0.5)  # 2 FPS update rate
            
    except Exception as e:
        logger.error(f"WebSocket error with {client_address}: {e}")
    finally:
        logger.info(f"WebSocket client disconnected: {client_address}")

async def main():
    """Main server function"""
    global sensor
    
    # Initialize sensor
    sensor = AMG8833(bus_number=1)
    
    # Start HTTP server
    http_server = HTTPServer(('0.0.0.0', HTTP_PORT), ThermalDataHandler)
    logger.info(f"Starting HTTP server on port {HTTP_PORT}...")

    # Start WebSocket server
    logger.info(f"Starting WebSocket server on port {WEBSOCKET_PORT}...")

    # Run both servers concurrently (on different ports)
    await asyncio.gather(
        asyncio.get_event_loop().run_in_executor(None, http_server.serve_forever),
        serve(websocket_handler, "0.0.0.0", WEBSOCKET_PORT)
    )

if __name__ == "__main__":
    try:
        logger.info("Starting AMG8833 Thermal Sensor Server...")
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
