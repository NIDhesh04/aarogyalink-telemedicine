const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.io on the raw HTTP server.
 * Called once from server.js after DB/Redis are connected.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        'https://aarogyalink-telemedicine.vercel.app',
        'http://localhost:5173',
      ].filter(Boolean),
      credentials: true,
    },
  });

  // ── JWT Authentication Middleware ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ──
  io.on('connection', (socket) => {
    // Join a room named after the userId — broadcasts to all tabs
    socket.join(socket.userId);
    console.log(`🔌 Socket connected: ${socket.userId} (${socket.id})`);

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.userId}`);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
}

/**
 * Get the io instance from anywhere in the backend.
 * Safe to call — returns null if not initialized yet (e.g. during tests).
 */
function getIO() {
  if (!io) throw new Error('Socket.io not initialized — call initSocket() first');
  return io;
}

module.exports = { initSocket, getIO };
