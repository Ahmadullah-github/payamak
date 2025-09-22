// File: client/store/socketStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

// Define the shape of the state and actions
interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  // --- STATE ---
  socket: null,
  isConnected: false,

  // --- ACTIONS ---
  connect: (token) => {
    // Prevent multiple connections
    if (get().socket) {
      return;
    }

    // Create a new socket instance with the auth token
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'], // More reliable on mobile
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected!', newSocket.id);
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected!');
      set({ isConnected: false });
    });
    
    // We will add listeners for 'new_message', 'user_status', etc. here later

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));