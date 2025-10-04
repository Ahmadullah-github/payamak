// File: client/api/index.ts
import api from './apiClient';
import { handleApiError } from './apiClient';

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

export default api;
