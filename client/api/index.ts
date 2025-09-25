import axios from 'axios';
import { API_URL } from '../config';
import { ChatMessage, Chat, ChatMember } from '../store/messageStore';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      SecureStore.deleteItemAsync('authToken');
    }
    return Promise.reject(error);
  }
);

// Chat API endpoints
export const chatApi = {
  // Get all chats for current user
  getChats: () => api.get('/messages/chats'),
  
  // Get messages for a specific chat
  getChatMessages: (chatId: string, limit = 50, offset = 0) => 
    api.get(`/messages/chat/${chatId}?limit=${limit}&offset=${offset}`),
  
  // Send a text message to a chat
  sendMessage: (chatId: string, content: string, type: 'text' | 'image' | 'video' | 'file' | 'audio' = 'text') => 
    api.post('/messages', { chatId, content, type }),
  
  // Send a media message
  sendMediaMessage: (chatId: string, fileData: FormData) => {
    return api.post('/messages/media', fileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Update message status
  updateMessageStatus: (messageId: string, status: 'delivered' | 'read') => 
    api.patch(`/messages/${messageId}/status`, { status }),
  
  // Create a new chat (private or group)
  createChat: (type: 'private' | 'group', name?: string, memberIds: string[] = []) => 
    api.post('/messages/chats', { type, name, memberIds }),
  
  // Add members to a group chat
  addChatMembers: (chatId: string, memberIds: string[]) => 
    api.post(`/messages/chats/${chatId}/members`, { memberIds }),
  
  // Get chat members
  getChatMembers: (chatId: string) => 
    api.get(`/messages/chats/${chatId}/members`),
};

// User API endpoints
export const userApi = {
  // Get all users (for creating chats)
  getUsers: () => api.get('/users'),
  
  // Get specific user info
  getUser: (userId: string) => api.get(`/users/${userId}`),
  
  // Update user profile
  updateProfile: (fullName: string) => api.put('/users', { fullName }),
  
  // Get current user's full profile
  getCurrentProfile: () => api.get('/users/me/profile'),
  
  // Upload profile picture
  uploadProfilePicture: (imageData: FormData) => {
    return api.post('/users/profile-picture', imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// File API endpoints
export const fileApi = {
  // Get file info
  getFileInfo: (fileId: string) => api.get(`/files/info/${fileId}`),
  
  // Delete file
  deleteFile: (fileId: string) => api.delete(`/files/${fileId}`),
  
  // Get file URL for serving
  getProfilePictureUrl: (filename: string) => `${API_URL.replace('/api', '')}/api/files/profiles/${filename}`,
  getMediaFileUrl: (type: string, filename: string) => `${API_URL.replace('/api', '')}/api/files/media/${type}/${filename}`,
};

// Notification API endpoints
export const notificationApi = {
  // Get unread notifications
  getUnreadNotifications: (limit = 20, offset = 0) => 
    api.get(`/notifications/unread?limit=${limit}&offset=${offset}`),
  
  // Get all notifications
  getNotifications: (limit = 50, offset = 0) => 
    api.get(`/notifications?limit=${limit}&offset=${offset}`),
  
  // Mark notification as read
  markAsRead: (notificationId: string) => 
    api.patch(`/notifications/${notificationId}/read`),
  
  // Mark all notifications as read
  markAllAsRead: () => api.patch('/notifications/read-all'),
  
  // Delete notification
  deleteNotification: (notificationId: string) => 
    api.delete(`/notifications/${notificationId}`),
  
  // Get notification count
  getNotificationCount: () => api.get('/notifications/count'),
};

// Auth API endpoints
export const authApi = {
  login: (username: string, password: string) => 
    api.post('/auth/login', { username, password }),
  
  register: (username: string, password: string, fullName: string) => 
    api.post('/auth/register', { username, password, fullName }),
  
  getProfile: () => api.get('/auth/profile'),
};

// Health check
export const healthApi = {
  check: () => api.get('/health'),
};

// Legacy exports for backward compatibility
export const getChats = () => chatApi.getChats();
export const getGroups = () => api.get('/messages/groups'); // This endpoint might need updating on server

export default api;
