import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

let inMemoryToken: string | null = null;

export const tokenStorage = {
  getToken: async (): Promise<string | null> => {
    // SecureStore is only available on native. On web, fall back to in-memory.
    if (Platform.OS === 'web') {
      return inMemoryToken;
    }
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch {
      return inMemoryToken;
    }
  },
  setToken: async (token: string): Promise<void> => {
    inMemoryToken = token;
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.setItemAsync('authToken', token);
    } catch {
      // noop: keep in memory
    }
  },
  clearToken: async (): Promise<void> => {
    inMemoryToken = null;
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch {
      // noop
    }
  },
};


