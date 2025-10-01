// File: client/store/socketStore.ts - Updated for new chat system
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL_DEVICE }  from '../config';

interface SocketState {
  socket: Socket | null;
  onlineUsers: Set<string>;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  // Updated methods for new chat system
  sendMessage: (chatId: string, content: string, type?: string) => void;
  joinChatRoom: (chatId: string) => void;
  leaveChatRoom: (chatId: string) => void;
  markMessageAsRead: (messageId: string, chatId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  // Legacy method for backward compatibility
  sendMessage_Legacy: (receiverId: string, content: string, type?: string) => void;
  joinChatRoom_Legacy: (userId1: string, userId2: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  // --- STATE ---
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),

  // --- ACTIONS ---
  connect: (token) => {
    const existing = get().socket;
    const shouldReconnect = !existing || !existing.connected || (existing as any).auth?.token !== token;
    if (!shouldReconnect) return;

    if (existing) {
      try { existing.disconnect(); } catch {}
    }

    console.log('🔌 Connecting to socket:', SOCKET_URL_DEVICE);
    const newSocket = io(SOCKET_URL_DEVICE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected!', newSocket.id);
      set({ isConnected: true });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected!', reason);
      set({ isConnected: false, onlineUsers: new Set() });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      set({ isConnected: false });
    });

    // --- SERVER EVENTS ---
    // 1. Get initial list of online users
    newSocket.on('current_online_users', (users: string[]) => {
      console.log('📃 Current users:', users);
      set({ onlineUsers: new Set(users) });
    });

    // 2. A new user came online
    newSocket.on('user_online', ({ userId }: { userId: string }) => {
      console.log('👤 User online:', userId);
      set((state) => {
        const updated = new Set(state.onlineUsers);
        updated.add(userId);
        return { onlineUsers: updated };
      });
    });

    // (Optional) You can also listen for "user_offline" if server emits it
    newSocket.on('user_offline', ({ userId }: { userId: string }) => {
      console.log('👋 User offline:', userId);
      set((state) => {
        const updated = new Set(state.onlineUsers);
        updated.delete(userId);
        return { onlineUsers: updated };
      });
    });

    // Listen for chat-related events
    newSocket.on('new_message', (messageData: any) => {
      console.log('📨 New message received:', messageData);
      // This will be handled by the chat screen component
    });

    newSocket.on('message_status_update', (data: any) => {
      console.log('✅ Message status update:', data);
      // This will be handled by the chat screen component
    });

    newSocket.on('message_read_update', (data: any) => {
      console.log('👁️ Message read update:', data);
      // This will be handled by the chat screen component
    });

    // Typing indicators
    newSocket.on('user_typing', (data: any) => {
      console.log('⌨️ User typing:', data);
      // This will be handled by the chat screen component
    });

    newSocket.on('user_stopped_typing', (data: any) => {
      console.log('⌨️ User stopped typing:', data);
      // This will be handled by the chat screen component
    });

    // Chat room events
    newSocket.on('user_joined_chat', (data: any) => {
      console.log('🚪 User joined chat:', data);
    });

    newSocket.on('user_left_chat', (data: any) => {
      console.log('🚪 User left chat:', data);
    });

    // Error handling
    newSocket.on('message_error', (error: any) => {
      console.error('❌ Message error:', error);
    });

    newSocket.on('chat_error', (error: any) => {
      console.error('❌ Chat error:', error);
    });

    set({ socket: newSocket });
  },

  // Updated methods for new chat system
  sendMessage: (chatId, content, type = 'text') => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('send_message', {
        chatId,
        content,
        type,
      });
    }
  },

  joinChatRoom: (chatId) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('join_chat_room', { chatId });
    }
  },

  leaveChatRoom: (chatId) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('leave_chat_room', { chatId });
    }
  },

  markMessageAsRead: (messageId, chatId) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('mark_message_read', { messageId, chatId });
    }
  },

  startTyping: (chatId) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('typing_start', { chatId });
    }
  },

  stopTyping: (chatId) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('typing_stop', { chatId });
    }
  },

  // Legacy methods for backward compatibility
  sendMessage_Legacy: (receiverId, content, type = 'text') => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('send_message', {
        receiverId,
        content,
        type,
      });
    }
  },

  joinChatRoom_Legacy: (userId1, userId2) => {
    const { socket } = get();
    if (socket && socket.connected) {
      const roomId = [userId1, userId2].sort().join('-');
      socket.emit('join_chat_room', { roomId });
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: new Set() });
    }
  },
}));
