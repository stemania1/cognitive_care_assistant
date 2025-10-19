import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const initializeSocketServer = (httpServer: NetServer) => {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? "https://cognitive-care-assistant.vercel.app"
          : `http://localhost:${process.env.PORT || 3002}`,
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

export const getSocketServer = () => io;
