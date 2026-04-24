import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket'],
      query: userId ? { userId } : {}
    });
  }

  if (userId && socket.io.opts.query?.userId !== userId) {
    const wasConnected = socket.connected;
    if (wasConnected) {
      socket.disconnect();
    }
    socket.io.opts.query = { userId };
    if (wasConnected) {
      socket.connect();
    }
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};