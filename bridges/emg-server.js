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

// Track forwarding statistics
let forwardStats = {
  success: 0,
  failures: 0,
  lastError: null,
  lastSuccess: null
};

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
  const requestTime = Date.now();
  console.log(`📥 [${new Date(requestTime).toISOString()}] Received request from MyoWare device`);
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  const { type, ...otherData } = req.body;
  
  if (!type) {
    console.error('❌ ERROR: Request missing "type" field!');
    console.error('   Full request body:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({ error: 'Missing "type" field in request' });
  }
  
  console.log('📊 Parsed data - type:', type);
  
  // Track when we last received data
  if (type === 'emg_data') {
    const lastDataTime = Date.now();
    console.log('✅ EMG data received at:', new Date(lastDataTime).toISOString());
  }
  
  // Forward to Next.js API route (if available)
  let nextjsResponse = null;
  try {
    // Use built-in fetch (Node.js 18+) or fallback
    const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
    
    // Always log forwarding attempts for emg_data to diagnose issues
    if (type === 'emg_data') {
      console.log('🔄 Forwarding EMG data to Next.js API:', NEXTJS_API_URL);
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('⏱️ Forwarding timeout after 5 seconds');
      controller.abort();
    }, 5000); // 5 second timeout
    
    const forwardStartTime = Date.now();
    let forwardResponse;
    try {
      forwardResponse = await fetchFn(NEXTJS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
        signal: controller.signal
      });
      
      const forwardDuration = Date.now() - forwardStartTime;
      clearTimeout(timeoutId);
      
      console.log(`📡 Forward response received (${forwardDuration}ms):`, {
        status: forwardResponse.status,
        statusText: forwardResponse.statusText,
        ok: forwardResponse.ok
      });
      
      if (!forwardResponse.ok) {
        forwardStats.failures++;
        forwardStats.lastError = {
          status: forwardResponse.status,
          statusText: forwardResponse.statusText,
          timestamp: new Date().toISOString()
        };
        console.error('❌ Next.js API returned error:', forwardResponse.status, forwardResponse.statusText);
        const errorText = await forwardResponse.text();
        console.error('   Error body:', errorText);
      } else {
        forwardStats.success++;
        forwardStats.lastSuccess = new Date().toISOString();
        
        // Try to parse JSON response, but handle errors gracefully
        try {
          nextjsResponse = await forwardResponse.json();
          
          // Log response details for emg_data to diagnose storage issues
          if (type === 'emg_data') {
            console.log('✅ Forwarded to Next.js API - Response:', {
              status: forwardResponse.status,
              dataCount: nextjsResponse?.dataCount || 'N/A',
              isConnected: nextjsResponse?.isConnected || 'N/A',
              timestamp: nextjsResponse?.timestamp || 'N/A',
              note: nextjsResponse?.dataCount === 0 ? '⚠️ WARNING: Next.js reports dataCount=0 - data may not be storing!' : '✅ Data count > 0'
            });
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse Next.js response as JSON:', parseError.message);
          const textResponse = await forwardResponse.text();
          console.log('   Raw response:', textResponse.substring(0, 200));
        }
        
        // Log success for every 10th message to reduce spam but still show progress
        if (type === 'emg_data' && forwardStats.success % 10 === 0) {
          console.log('✅ Forwarded to Next.js API successfully (every 10th):', {
            status: forwardResponse.status,
            successCount: forwardStats.success,
            failureCount: forwardStats.failures,
            duration: forwardDuration + 'ms'
          });
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const forwardDuration = Date.now() - forwardStartTime;
      console.error(`❌ Fetch error after ${forwardDuration}ms:`, fetchError.message);
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    forwardStats.failures++;
    forwardStats.lastError = {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    };
    
    // Always log errors
    console.error('❌ ERROR forwarding to Next.js API:', error.message);
    console.error('   Next.js URL:', NEXTJS_API_URL);
    console.error('   Error code:', error.code);
    console.error('   Stats: Success:', forwardStats.success, 'Failures:', forwardStats.failures);
    
    // If we have many failures, warn the user
    if (forwardStats.failures > 10 && forwardStats.failures % 10 === 0) {
      console.error('⚠️ WARNING: Next.js API appears to be unreachable!');
      console.error('   Make sure Next.js is running on port 3000');
      console.error('   Run: npm run dev');
    }
    // Continue anyway - this server can work standalone
  }
  
  // Handle different message types
  if (type === 'emg_data') {
    const dataSummary = {
      timestamp: req.body.timestamp,
      muscleActivity: req.body.muscleActivity,
      voltage: req.body.voltage,
      hasData: !!(req.body.muscleActivity || req.body.voltage)
    };
    console.log('💪 Received EMG data via HTTP:', dataSummary);
    
    // Validate data
    if (!req.body.muscleActivity && !req.body.voltage) {
      console.warn('⚠️ WARNING: EMG data missing both muscleActivity and voltage!');
    }
    
    // Broadcast to all connected Socket.IO clients
    io.emit('emg_data', req.body);
    res.json({ 
      status: 'received', 
      message: 'EMG data received', 
      timestamp: Date.now(), 
      forwarded: nextjsResponse !== null,
      dataReceived: dataSummary
    });
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

// Diagnostic endpoint to check server status
app.get('/api/emg/diagnostics', (req, res) => {
  const now = Date.now();
  res.json({
    status: 'EMG WebSocket server running',
    timestamp: new Date(now).toISOString(),
    uptime: process.uptime(),
    connectedDevices: connectedDevices.size,
    forwardingStats: {
      ...forwardStats,
      lastSuccessAge: forwardStats.lastSuccess ? ((now - new Date(forwardStats.lastSuccess).getTime()) / 1000).toFixed(1) + 's' : 'never',
      lastErrorAge: forwardStats.lastError?.timestamp ? ((now - new Date(forwardStats.lastError.timestamp).getTime()) / 1000).toFixed(1) + 's' : 'never'
    },
    nextjsUrl: NEXTJS_API_URL,
    health: {
      receivingData: forwardStats.lastSuccess ? (now - new Date(forwardStats.lastSuccess).getTime()) < 10000 : false, // Data in last 10 seconds
      forwardingToNextjs: forwardStats.success > 0,
      hasRecentErrors: forwardStats.lastError && (now - new Date(forwardStats.lastError.timestamp).getTime()) < 60000 // Error in last minute
    }
  });
});

app.get('/api/emg/ws', (req, res) => {
  res.json({ 
    status: 'EMG WebSocket server running',
    connectedDevices: connectedDevices.size,
    timestamp: Date.now(),
    forwardingStats: {
      success: forwardStats.success,
      failures: forwardStats.failures,
      lastError: forwardStats.lastError,
      lastSuccess: forwardStats.lastSuccess,
      nextjsUrl: NEXTJS_API_URL
    }
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
