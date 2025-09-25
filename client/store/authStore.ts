// client/store/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL } from '../config';
import { useSocketStore } from './socketStore';

interface User {
  id: number;
  username: string;
  fullName: string;
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
}

// 👇 Extracted for reuse and to avoid `get()` recursion
const clearSession = async (set: (partial: Partial<AuthState>) => void) => {
  useSocketStore.getState().disconnect();
  delete axios.defaults.headers.common['Authorization'];
  await SecureStore.deleteItemAsync('authToken');
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
      const storedToken = await SecureStore.getItemAsync('authToken');
      console.log('Initializing auth with stored token:', !!storedToken);

      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        const response = await axios.get(`${API_URL}/auth/profile`);

        set({ token: storedToken, user: response.data });
        useSocketStore.getState().connect(storedToken);
      }
    } catch (error) {
      console.warn('Auth initialization failed. Logging out.', error);
      await clearSession(set);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      const { token: newToken, user: userData } = response.data;

      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      await SecureStore.setItemAsync('authToken', newToken);

      set({ token: newToken, user: userData });
      useSocketStore.getState().connect(newToken);

      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  },

  register: async (username, password, fullName) => {
    try {
      // Optional: Handle auto-login if your API returns token+user
      const response = await axios.post(`${API_URL}/auth/register`, { username, password, fullName });
      // If you want to auto-login:
      // const { token, user } = response.data;
      // ... same as login logic

      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  },

  updateUserProfile: (newUserData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...newUserData } : null,
    }));
  },
}));

