import { io } from 'socket.io-client';
import { getBaseHost } from './client';
import { useAuthStore } from '../store/useAuthStore';

let socket = null;

export function getSocket() {
  const token = useAuthStore.getState().token;
  if (!token) return null;

  if (!socket || !socket.connected) {
    const host = getBaseHost();
    console.log(`🔌 [SocketClient] Connecting to ${host}...`);

    socket = io(host, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log(`⚡ [SocketClient] Connected to WebSocket server! Socket ID: ${socket.id}`);
    });

    socket.on('connect_error', (err) => {
      console.warn(`⚠️ [SocketClient] Connection error:`, err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [SocketClient] Disconnected:`, reason);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
