const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());
app.use(express.json());

// Next.js API endpoint (forward data here)
const NEXTJS_API_URL = process.env.NEXTJS_API_URL || 'http://localhost:3000/api/emg/ws';

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
app.post('/api/emg/ws', async (req, res) => {
  console.log('📥 Received request from MyoWare device:', JSON.stringify(req.body, null, 2));
  
  const { type, ...otherData } = req.body;
  
  console.log('📊 Parsed data - type:', type);
  
  // Forward to Next.js API route (if available)
  let nextjsResponse = null;
  try {
    // Use built-in fetch (Node.js 18+) or fallback
    const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
    const forwardResponse = await fetchFn(NEXTJS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    nextjsResponse = await forwardResponse.json();
    console.log('✅ Forwarded to Next.js API:', nextjsResponse);
  } catch (error) {
    console.log('⚠️ Could not forward to Next.js API (it may not be running):', error.message);
    console.log('   Next.js URL:', NEXTJS_API_URL);
    console.log('   This server will continue to work standalone');
    // Continue anyway - this server can work standalone
  }
  
  // Handle different message types
  if (type === 'emg_data') {
    console.log('💪 Received EMG data via HTTP:', req.body);
    // Broadcast to all connected Socket.IO clients
    io.emit('emg_data', req.body);
    res.json({ status: 'received', message: 'EMG data received', timestamp: Date.now(), forwarded: nextjsResponse !== null });
  } else if (type === 'test') {
    console.log('🧪 Received test message:', req.body);
    res.json({ status: 'test_received', message: 'Hello from EMG server!', timestamp: Date.now(), forwarded: nextjsResponse !== null });
  } else if (type === 'calibration_data') {
    console.log('🔧 Received calibration data:', req.body);
    io.emit('calibration_data', req.body);
    res.json({ status: 'calibrated', timestamp: Date.now(), calibration: req.body, forwarded: nextjsResponse !== null });
  } else if (type === 'heartbeat') {
    console.log('💓 Received heartbeat:', req.body);
    res.json({ status: 'alive', timestamp: Date.now(), forwarded: nextjsResponse !== null });
  } else {
    console.log('❓ Received unknown message type:', type, req.body);
    res.json({ status: 'received', timestamp: Date.now(), forwarded: nextjsResponse !== null });
  }
});

app.get('/api/emg/ws', (req, res) => {
  res.json({ 
    status: 'EMG WebSocket server running',
    connectedDevices: connectedDevices.size,
    timestamp: Date.now()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EMG Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP endpoint: http://localhost:${PORT}/api/emg/ws`);
  console.log(`🔄 Forwarding to Next.js: ${NEXTJS_API_URL}`);
  console.log(`\n💡 Your MyoWare device should POST to: http://YOUR_COMPUTER_IP:${PORT}/api/emg/ws`);
  console.log(`   (No Arduino code changes needed!)\n`);
});
