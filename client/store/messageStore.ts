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
  
  // Message operations
  addMessage: (chatId: string, message: ChatMessage) => void;
  updateMessageStatus: (messageId: string, status: 'delivered' | 'read') => void;
  markMessageAsRead: (messageId: string, userId: string) => void;
  getMessagesForChat: (chatId: string) => ChatMessage[];
  setChatMessages: (chatId: string, messages: ChatMessage[]) => void;
  
  // Chat operations
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  getChat: (chatId: string) => Chat | null;
  getAllChats: () => Chat[];
  setActiveChat: (chatId: string | null) => void;
  
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
}));