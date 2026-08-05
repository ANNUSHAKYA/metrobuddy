const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'metrobuddy_secret_dev';

let io = null;

/**
 * Initialize Socket.IO server attached to Express HTTP server.
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Middleware: Authenticate socket connection with JWT
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers['x-auth-token'];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.user.id;
      next();
    } catch (err) {
      next(new Error('Authentication failed: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌 [Socket.IO] User connected: ${userId} (Socket ID: ${socket.id})`);

    // Auto-join personal room: user_<userId>
    socket.join(`user_${userId}`);

    // Join match chat room
    socket.on('chat:join', ({ matchId }) => {
      if (matchId) {
        socket.join(`match_${matchId}`);
        console.log(`💬 [Socket.IO] User ${userId} joined room: match_${matchId}`);
      }
    });

    // Leave match chat room
    socket.on('chat:leave', ({ matchId }) => {
      if (matchId) {
        socket.leave(`match_${matchId}`);
        console.log(`💬 [Socket.IO] User ${userId} left room: match_${matchId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.IO] User disconnected: ${userId} (${reason})`);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
function getIo() {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
}

/**
 * Helper: Emit match:found to both matched users in real time
 */
function notifyMatchFound(user1Id, user2Id, matchData) {
  if (!io) return;
  console.log(`⚡ [Socket.IO] Emitting match:found to user_${user1Id} and user_${user2Id}`);
  io.to(`user_${user1Id}`).emit('match:found', { match: matchData });
  io.to(`user_${user2Id}`).emit('match:found', { match: matchData });
}

/**
 * Helper: Broadcast real-time message to match chat room & personal user rooms
 */
function notifyChatMessage(matchId, message) {
  if (!io) return;
  console.log(`💬 [Socket.IO] Emitting chat:message for match ${matchId}`);
  io.to(`match_${matchId}`).emit('chat:message', message);
}

/**
 * Helper: Broadcast view-once opened event to match chat room
 */
function notifyViewOnceOpened(matchId, messageId) {
  if (!io) return;
  io.to(`match_${matchId}`).emit('chat:view_once_opened', { messageId });
}

/**
 * Helper: Broadcast journey ended / dissolved event
 */
function notifyJourneyEnded(matchId, user1Id, user2Id) {
  if (!io) return;
  console.log(`🚫 [Socket.IO] Emitting journey:ended for match ${matchId}`);
  io.to(`match_${matchId}`).emit('journey:ended', { matchId });
  if (user1Id) io.to(`user_${user1Id}`).emit('journey:ended', { matchId });
  if (user2Id) io.to(`user_${user2Id}`).emit('journey:ended', { matchId });
}

module.exports = {
  initSocket,
  getIo,
  notifyMatchFound,
  notifyChatMessage,
  notifyViewOnceOpened,
  notifyJourneyEnded,
};
