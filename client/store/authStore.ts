// client/store/authStore.ts
import { create } from 'zustand';
import { tokenStorage } from '../utils/tokenStorage';
import api, { authApi } from '../api';
import { useSocketStore } from './socketStore';

interface User {
  id: number;
  username: string;
  fullName: string;
  status?: string;
  createdAt?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, password: string, fullName: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateUserProfile: (newUserData: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

// 👇 Extracted for reuse and to avoid `get()` recursion
const clearSession = async (set: (partial: Partial<AuthState>) => void) => {
  useSocketStore.getState().disconnect();
  await tokenStorage.clearToken();
  set({ token: null, user: null });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  logout: async () => {
    console.log('Logging out...');
    await clearSession(set);
  },

  initializeAuth: async () => {
    try {
      const storedToken = await tokenStorage.getToken();
      console.log('🔐 Initializing auth with stored token:', !!storedToken);

      if (storedToken) {
        const response = await authApi.getProfile();
        
        // Handle the enhanced response structure
        const userData = response.data.success ? response.data.user : response.data;
        
        set({ token: storedToken, user: userData });
        useSocketStore.getState().connect(storedToken);
        console.log('✅ Auth initialized successfully');
      }
    } catch (error: any) {
      console.warn('⚠️ Auth initialization failed. Logging out.', error.response?.data || error.message);
      await clearSession(set);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    try {
      const response = await authApi.login(username, password);
      
      // Handle the enhanced response structure
      const responseData = response.data;
      const newToken = responseData.token;
      const userData = responseData.user;

      await tokenStorage.setToken(newToken);

      set({ token: newToken, user: userData });
      useSocketStore.getState().connect(newToken);
      
      console.log('✅ Login successful');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      console.error('❌ Login failed:', message);
      return { success: false, message };
    }
  },

  register: async (username, password, fullName) => {
    try {
      const response = await authApi.register(username, password, fullName);
      console.log('✅ Registration successful');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
      console.error('❌ Registration failed:', message);
      return { success: false, message };
    }
  },

  updateUserProfile: (newUserData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...newUserData } : null,
    }));
  },

  refreshProfile: async () => {
    try {
      const response = await authApi.getProfile();
      const userData = response.data.success ? response.data.user : response.data;
      
      set((state) => ({
        user: userData,
      }));
    } catch (error: any) {
      console.error('Failed to refresh profile:', error.response?.data || error.message);
    }
  },
}));

