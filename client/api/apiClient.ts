// File: client/api/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_URL } from '../config';
import { tokenStorage } from '../utils/tokenStorage';

// Create a single axios instance for all API calls
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

  // Add auth token to requests
  client.interceptors.request.use(
    async (config) => {
      try {
        const token = await tokenStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle response errors globally
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      
      // Handle unauthorized access
      if (error.response?.status === 401) {
        tokenStorage.clearToken();
        // Optionally redirect to login page
        // window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Create and export the single API client instance
const apiClient = createApiClient();

// Helper function for handling API errors consistently
export const handleApiError = (error: any): { success: false; error: string } => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.error || error.response.data?.message || 'Server error occurred';
    return { success: false, error: message };
  } else if (error.request) {
    // Request was made but no response received
    return { success: false, error: 'Network error - please check your connection' };
  } else {
    // Something else happened
    return { success: false, error: error.message || 'An unknown error occurred' };
  }
};

export default apiClient;