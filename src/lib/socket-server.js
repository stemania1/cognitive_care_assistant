const { Server } = require('socket.io');
const http = require('http');

let io = null;

const initializeSocketServer = (httpServer) => {
  if (!io) {
    io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? "https://cognitive-care-assistant.vercel.app"
          : [`http://localhost:${process.env.PORT || 3002}`, `http://192.168.254.204:${process.env.PORT || 3002}`],
        methods: ["GET", "POST"]
      }
    });

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
  }

  return io;
};

const getSocketServer = () => io;

module.exports = { initializeSocketServer, getSocketServer };
