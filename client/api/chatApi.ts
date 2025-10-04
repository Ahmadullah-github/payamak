// File: client/api/chatApi.ts
import api from './apiClient';
import { handleApiError } from './apiClient';

// Types for better TypeScript support
export interface MediaFile {
  id: string;
  filename: string;
  originalName?: string;
  url: string;
  mimeType: string;
  size: number;
  type: 'images' | 'videos' | 'audio' | 'documents' | 'archives' | 'code';
}

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
  mediaFile?: MediaFile;
}

export interface Chat {
  id: string;
  type: 'private' | 'group';
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  lastActivity?: string;
  members?: ChatMember[];
}

export interface ChatMember {
  id: string;
  username: string;
  fullName: string;
  isOnline: boolean;
  lastSeen?: string;
  role: 'member' | 'admin';
  joinedAt: string;
}

export interface MessageResponse {
  success: boolean;
  message: ChatMessage;
  error?: string;
}

export interface MessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  error?: string;
}

export interface ChatsResponse {
  success: boolean;
  data: Chat[];
  error?: string;
}

// Chat API endpoints
export const chatApi = {
  // Get all chats for current user
  getChats: (): Promise<{ data: Chat[] }> => 
    api.get('/messages/chats'),
  
  // Get messages for a specific chat
  getChatMessages: (chatId: string, limit = 50, offset = 0): Promise<MessagesResponse> => 
    api.get(`/messages/chat/${chatId}?limit=${limit}&offset=${offset}`),
  
  // Get a specific message by ID
  getMessage: (messageId: string): Promise<MessageResponse> =>
    api.get(`/messages/${messageId}`),
  
  // Send a text message to a chat
  sendMessage: (chatId: string, content: string, type: 'text' | 'image' | 'video' | 'file' | 'audio' = 'text'): Promise<MessageResponse> => 
    api.post('/messages', { chatId, content, type }).
      then(response => response.data)
      .catch(error => {
        throw handleApiError(error);
      }),
  
  // Send a media message
  sendMediaMessage: (formData: FormData): Promise<MessageResponse> => {
    return api.post('/messages/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(response => response.data)
      .catch(error => {
        throw handleApiError(error);
      });
  },

  // Helper method for uploading media with simplified parameters
  uploadMedia: (chatId: string, file: File, content: string = ''): Promise<MessageResponse> => {
    const formData = new FormData();
    formData.append('mediaFile', file);
    formData.append('chatId', chatId);
    formData.append('content', content);
    
    return chatApi.sendMediaMessage(formData);
  },
  
  // Update message status
  updateMessageStatus: (messageId: string, status: 'delivered' | 'read'): Promise<{ data: any }> => 
    api.patch(`/messages/${messageId}/status`, { status }),
  
  // Delete a message (and associated media file if not used elsewhere)
  deleteMessage: (messageId: string): Promise<{ success: boolean; message: string }> =>
    api.delete(`/messages/${messageId}`),
  
  // Mark all messages in a chat as read
  markAllMessagesRead: (chatId: string): Promise<{ success: boolean; message: string }> =>
    api.post(`/messages/chats/${chatId}/read`),
  
  // Create a new chat (private or group)
  createChat: (type: 'private' | 'group', name?: string, memberIds: string[] = []): Promise<{ data: Chat }> => 
    api.post('/messages/chats', { type, name, memberIds }),
  
  // Add members to a group chat
  addChatMembers: (chatId: string, memberIds: string[]): Promise<{ data: { addedMembers: string[] } }> => 
    api.post(`/messages/chats/${chatId}/members`, { memberIds }),
  
  // Get chat members
  getChatMembers: (chatId: string): Promise<{ data: ChatMember[] }> => 
    api.get(`/messages/chats/${chatId}/members`),

  // Search messages in a chat (if you implement this on backend)
  searchMessages: (chatId: string, query: string, limit = 20, offset = 0): Promise<MessagesResponse> =>
    api.get(`/messages/chat/${chatId}/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`),
};

// Enhanced file type detection helper
export const FileTypeHelper = {
  // Get message type from file
  getMessageTypeFromFile: (file: File): 'image' | 'video' | 'audio' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  },

  // Get media type for URL generation
  getMediaTypeFromFile: (file: File): 'images' | 'videos' | 'audio' | 'documents' | 'archives' | 'code' => {
    const type = file.type;
    
    if (type.startsWith('image/')) return 'images';
    if (type.startsWith('video/')) return 'videos';
    if (type.startsWith('audio/')) return 'audio';
    
    // Document types
    if (type.includes('pdf') || 
        type.includes('word') || 
        type.includes('document') ||
        type.includes('excel') ||
        type.includes('spreadsheet') ||
        type.includes('powerpoint') ||
        type.includes('presentation') ||
        type.includes('text')) {
      return 'documents';
    }
    
    // Archive types
    if (type.includes('zip') || 
        type.includes('archive') || 
        type.includes('compressed') ||
        type.includes('rar') ||
        type.includes('7z') ||
        type.includes('tar')) {
      return 'archives';
    }
    
    // Code files
    if (type.includes('javascript') ||
        type.includes('typescript') ||
        type.includes('html') ||
        type.includes('css') ||
        type.includes('json') ||
        type.includes('xml') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.css') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.xml')) {
      return 'code';
    }
    
    return 'documents';
  },

  // Check if file is an image
  isImage: (file: File): boolean => file.type.startsWith('image/'),

  // Check if file is a video
  isVideo: (file: File): boolean => file.type.startsWith('video/'),

  // Check if file is an audio file
  isAudio: (file: File): boolean => file.type.startsWith('audio/'),

  // Check if file is a document (non-media)
  isDocument: (file: File): boolean => {
    return !file.type.startsWith('image/') && 
           !file.type.startsWith('video/') && 
           !file.type.startsWith('audio/');
  },

  // Get file icon based on type
  getFileIcon: (file: File): string => {
    const type = file.type;
    
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📑';
    if (type.includes('zip') || type.includes('archive')) return '📦';
    if (type.includes('text')) return '📄';
    
    if (type.includes('javascript') || type.includes('typescript')) return '💻';
    if (type.includes('html')) return '🌐';
    if (type.includes('css')) return '🎨';
    
    return '📎';
  },

  // Validate file size
  validateFileSize: (file: File, maxSizeMB: number = 50): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  // Format file size for display
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// React hook for chat operations (optional)
export const useChatOperations = () => {
  const sendMessageWithRetry = async (
    chatId: string, 
    content: string, 
    retries = 3
  ): Promise<ChatMessage> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await chatApi.sendMessage(chatId, content);
        return response.message
      } catch (error) {
        if (attempt === retries) throw error;
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Failed to send message after retries');
  };

  const uploadMediaWithProgress = async (
    chatId: string,
    file: File,
    content: string = '',
    onProgress?: (progress: number) => void
  ): Promise<ChatMessage> => {
    const formData = new FormData();
    formData.append('mediaFile', file);
    formData.append('chatId', chatId);
    formData.append('content', content);

    try {
      const response = await api.post('/messages/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(Math.round(progress));
          }
        },
      });
      
      return response.data.message;
    } catch (error) {
      console.error('Media upload failed:', error);
      throw error;
    }
  };

  const loadMessagesWithPagination = async (
    chatId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> => {
    const offset = (page - 1) * pageSize;
    const response = await chatApi.getChatMessages(chatId, pageSize, offset);
    
    const hasMore = response.messages.length === pageSize;
    return {
      messages: response.messages,
      hasMore
    };
  };

  return {
    sendMessageWithRetry,
    uploadMediaWithProgress,
    loadMessagesWithPagination,
  };
};

export default chatApi;