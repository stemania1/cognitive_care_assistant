const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());
app.use(express.json());

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected devices
const connectedDevices = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle MyoWare data
  socket.on('myoware_data', (data) => {
    console.log('Received MyoWare data:', data);
    // Broadcast to all connected clients
    socket.broadcast.emit('emg_data', data);
  });

  // Handle calibration data
  socket.on('myoware_calibration', (data) => {
    console.log('Received calibration data:', data);
    socket.broadcast.emit('calibration_data', data);
  });

  // Handle heartbeat
  socket.on('myoware_heartbeat', (data) => {
    console.log('Received heartbeat:', data);
    socket.emit('heartbeat_ack', { timestamp: Date.now() });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// HTTP endpoints for ESP32
app.post('/api/emg/ws', (req, res) => {
  const { type, data } = req.body;
  
  console.log('Received EMG data via HTTP:', { type, data });
  
  // Broadcast to all connected Socket.IO clients
  io.emit('emg_data', { type, data, timestamp: Date.now() });
  
  res.json({ status: 'received', timestamp: Date.now() });
});

app.get('/api/emg/ws', (req, res) => {
  res.json({ 
    status: 'EMG WebSocket server running',
    connectedDevices: connectedDevices.size,
    timestamp: Date.now()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`EMG Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`HTTP endpoint: http://localhost:${PORT}/api/emg/ws`);
});
