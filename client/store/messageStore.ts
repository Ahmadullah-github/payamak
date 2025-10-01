// File: client/store/messageStore.ts
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderOnline?: boolean;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'video' | 'file' | 'audio';
  isRead?: boolean;
  mediaFile?: {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  };
}

export interface Chat {
  id: string;
  type: 'private' | 'group';
  name: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline?: boolean;
  lastActivity?: Date;
  members?: ChatMember[];
}

export interface ChatMember {
  id: string;
  username: string;
  fullName: string;
  isOnline: boolean;
  lastSeen?: Date;
  role: 'member' | 'admin';
  joinedAt: Date;
}

// Legacy interface for backward compatibility
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file';
}

interface MessageState {
  // Chat messages organized by chatId
  messages: Record<string, ChatMessage[]>;
  // Chat list with metadata
  chats: Record<string, Chat>;
  // Currently active chat
  activeChat: string | null;
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Message operations
  addMessage: (chatId: string, message: ChatMessage) => void;
  updateMessageStatus: (messageId: string, status: 'delivered' | 'read') => void;
  markMessageAsRead: (messageId: string, userId: string) => void;
  markAllMessagesReadInChat: (chatId: string) => void;
  getMessagesForChat: (chatId: string) => ChatMessage[];
  setChatMessages: (chatId: string, messages: ChatMessage[]) => void;
  loadChatMessages: (chatId: string, limit?: number, offset?: number) => Promise<void>;
  
  // Chat operations
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  clearChatUnread: (chatId: string) => void;
  getChat: (chatId: string) => Chat | null;
  getAllChats: () => Chat[];
  setActiveChat: (chatId: string | null) => void;
  loadChats: () => Promise<void>;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Legacy support
  setChatMessages_Legacy: (chatId: string, messages: Message[]) => void;
  addMessage_Legacy: (chatId: string, message: Message) => void;
}

// Helper function to generate chat ID from two user IDs
export const generateChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('-');
};

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  chats: {},
  activeChat: null,
  loading: false,
  error: null,

  // Message operations
  addMessage: (chatId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    }));
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => {
      const updatedMessages = { ...state.messages };
      
      // Find and update the message across all chats
      Object.keys(updatedMessages).forEach((chatId) => {
        updatedMessages[chatId] = updatedMessages[chatId].map((msg) =>
          msg.id === messageId ? { ...msg, status } : msg
        );
      });
      
      return { messages: updatedMessages };
    });
  },

  markMessageAsRead: (messageId, userId) => {
    set((state) => {
      const updatedMessages = { ...state.messages };
      
      Object.keys(updatedMessages).forEach((chatId) => {
        updatedMessages[chatId] = updatedMessages[chatId].map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true, status: 'read' } : msg
        );
      });
      
      return { messages: updatedMessages };
    });
  },

  markAllMessagesReadInChat: (chatId) => {
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      const updatedChatMessages = chatMessages.map((msg) => ({ ...msg, isRead: true, status: 'read' }));
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedChatMessages,
        },
      };
    });
  },

  getMessagesForChat: (chatId) => {
    return get().messages[chatId] || [];
  },

  setChatMessages: (chatId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages,
      },
    }));
  },

  // Chat operations
  addChat: (chat) => {
    set((state) => ({
      chats: {
        ...state.chats,
        [chat.id]: chat,
      },
    }));
  },

  updateChat: (chatId, updates) => {
    set((state) => ({
      chats: {
        ...state.chats,
        [chatId]: { ...state.chats[chatId], ...updates },
      },
    }));
  },

  clearChatUnread: (chatId) => {
    set((state) => ({
      chats: {
        ...state.chats,
        [chatId]: { ...state.chats[chatId], unreadCount: 0 },
      },
    }));
  },

  getChat: (chatId) => {
    return get().chats[chatId] || null;
  },

  getAllChats: () => {
    return Object.values(get().chats);
  },

  setActiveChat: (chatId) => {
    set({ activeChat: chatId });
  },

  // Legacy support for backward compatibility
  setChatMessages_Legacy: (chatId, legacyMessages) => {
    const chatMessages: ChatMessage[] = legacyMessages.map(msg => ({
      id: msg.id,
      chatId: chatId,
      senderId: msg.senderId,
      senderName: '', // Will be populated from API
      content: msg.content,
      timestamp: msg.timestamp,
      status: msg.status,
      type: msg.type,
    }));
    
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: chatMessages,
      },
    }));
  },

  addMessage_Legacy: (chatId, legacyMessage) => {
    const chatMessage: ChatMessage = {
      id: legacyMessage.id,
      chatId: chatId,
      senderId: legacyMessage.senderId,
      senderName: '', // Will be populated from API
      content: legacyMessage.content,
      timestamp: legacyMessage.timestamp,
      status: legacyMessage.status,
      type: legacyMessage.type,
    };
    
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), chatMessage],
      },
    }));
  },

  // API integration methods
  loadChatMessages: async (chatId, limit = 50, offset = 0) => {
    const { setLoading, setError, setChatMessages } = get();
    try {
      setLoading(true);
      setError(null);
      
      // Import the chatApi dynamically to avoid circular imports
      const { chatApi } = await import('../api');
      const response = await chatApi.getChatMessages(chatId, limit, offset);
      const messagesData = response.data;
      
      // Transform API response to ChatMessage format
      const transformedMessages: ChatMessage[] = messagesData.map((msg: any) => ({
        id: msg.id.toString(),
        chatId: chatId,
        senderId: msg.senderId.toString(),
        senderName: msg.senderName || msg.sender?.fullName || 'Unknown',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        status: msg.status || 'sent',
        type: msg.type || 'text',
        mediaFile: msg.media ? {
          id: msg.media.id,
          filename: msg.media.filename,
          url: msg.media.url,
          mimeType: msg.media.mimeType,
          size: msg.media.size,
        } : undefined,
      }));

      setChatMessages(chatId, transformedMessages);
      console.log(`✅ Loaded ${transformedMessages.length} messages for chat ${chatId}`);
    } catch (error: any) {
      console.error('Error loading chat messages:', error);
      if (error.response?.status !== 404) {
        setError(error.response?.data?.error || 'Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  },

  loadChats: async () => {
    const { setLoading, setError, addChat } = get();
    try {
      setLoading(true);
      setError(null);
      
      // Import the chatApi dynamically to avoid circular imports
      const { chatApi } = await import('../api');
      const response = await chatApi.getChats();
      const chatsData = response.data;
      
      // Add each chat to the store
      chatsData.forEach((chat: any) => {
        const transformedChat: Chat = {
          id: chat.id.toString(),
          type: chat.type,
          name: chat.name,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime ? new Date(chat.lastMessageTime) : undefined,
          unreadCount: chat.unreadCount || 0,
          isOnline: chat.isOnline,
          lastActivity: chat.lastActivity ? new Date(chat.lastActivity) : undefined,
          members: chat.members?.map((member: any) => ({
            id: member.id.toString(),
            username: member.username,
            fullName: member.fullName,
            isOnline: member.isOnline || false,
            lastSeen: member.lastSeen ? new Date(member.lastSeen) : undefined,
            role: member.role || 'member',
            joinedAt: new Date(member.joinedAt),
          })),
        };
        addChat(transformedChat);
      });
      
      console.log(`✅ Loaded ${chatsData.length} chats`);
    } catch (error: any) {
      console.error('Error loading chats:', error);
      setError(error.response?.data?.error || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  },

  // State management
  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
  },
}));