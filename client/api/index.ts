import axios from 'axios';
import { API_URL } from '../config';
import { ChatMessage, Chat, ChatMember } from '../store/messageStore';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // or from your auth store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Chat API endpoints
export const chatApi = {
  // Get all chats for current user
  getChats: () => api.get<Chat[]>('/messages/chats'),
  
  // Get messages for a specific chat
  getChatMessages: (chatId: string, limit = 50, offset = 0) => 
    api.get<ChatMessage[]>(`/messages/chat/${chatId}?limit=${limit}&offset=${offset}`),
  
  // Send a message to a chat
  sendMessage: (chatId: string, content: string, type: 'text' | 'image' | 'video' | 'file' | 'audio' = 'text') => 
    api.post<ChatMessage>('/messages', { chatId, content, type }),
  
  // Update message status
  updateMessageStatus: (messageId: string, status: 'delivered' | 'read') => 
    api.patch(`/messages/${messageId}/status`, { status }),
  
  // Create a new chat (private or group)
  createChat: (type: 'private' | 'group', name?: string, memberIds: string[] = []) => 
    api.post<Chat>('/messages/chats', { type, name, memberIds }),
  
  // Add members to a group chat
  addChatMembers: (chatId: string, memberIds: string[]) => 
    api.post(`/messages/chats/${chatId}/members`, { memberIds }),
  
  // Get chat members
  getChatMembers: (chatId: string) => 
    api.get<ChatMember[]>(`/messages/chats/${chatId}/members`),
};

// User API endpoints
export const userApi = {
  // Get all users (for creating chats)
  getUsers: () => api.get('/users'),
  
  // Get specific user info
  getUser: (userId: string) => api.get(`/users/${userId}`),
  
  // Update user profile
  updateProfile: (fullName: string) => api.put('/users', { fullName }),
};

// Auth API endpoints
export const authApi = {
  login: (username: string, password: string) => 
    api.post('/auth/login', { username, password }),
  
  register: (username: string, password: string, fullName: string) => 
    api.post('/auth/register', { username, password, fullName }),
  
  getProfile: () => api.get('/auth/profile'),
};

// Legacy exports for backward compatibility
export const getChats = () => chatApi.getChats();
export const getGroups = () => api.get('/messages/groups'); // This endpoint might need updating on server

export default api;
