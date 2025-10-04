// File: client/api/userApi.ts
import api from './apiClient';
import { handleApiError } from './apiClient';

export interface User {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: string;
  hasCustomAvatar?: boolean;
  hasExistingChat?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  avatarUrl?: string;
  statistics?: {
    totalChats: number;
    totalMessages: number;
  };
}

export interface UsersResponse {
  success: boolean;
  users: User[];
  total?: number;
}

export interface UserResponse {
  success: boolean;
  user: User | UserProfile;
}

export interface ProfileUpdateData {
  fullName?: string;
  status?: string;
  username?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface OnlineStatusData {
  isOnline: boolean;
}

// User API endpoints
export const userApi = {
  // Get all users with optional search and filters
  getUsers: (params?: {
    search?: string;
    limit?: number;
    offset?: number;
    excludeChat?: string;
  }): Promise<UsersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.excludeChat) queryParams.append('excludeChat', params.excludeChat);
    
    const queryString = queryParams.toString();
    return api.get(`/users${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get specific user info
  getUser: (userId: string): Promise<UserResponse> => 
    api.get(`/users/${userId}`),
  
  // Update user profile
  updateProfile: (data: ProfileUpdateData): Promise<UserResponse> => 
    api.put('/users/profile', data),
  
  // Change password
  changePassword: (data: PasswordChangeData): Promise<{ success: boolean; message: string }> =>
    api.put('/users/password', data),
  
  // Get current user's full profile
  getCurrentProfile: (): Promise<UserResponse> => 
    api.get('/users/me/profile'),
  
  // Upload profile picture
  uploadProfilePicture: (imageData: FormData): Promise<{
    success: boolean;
    message: string;
    avatarUrl: string;
    fileInfo?: {
      id: string;
      filename: string;
      size: number;
      mimeType: string;
    };
  }> => {
    return api.post('/users/profile-picture', imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete profile picture
  deleteProfilePicture: (): Promise<{ success: boolean; message: string }> =>
    api.delete('/users/profile-picture'),

  // Update online status
  updateOnlineStatus: (data: OnlineStatusData): Promise<{ success: boolean; message: string }> =>
    api.post('/users/online-status', data),

  // Search users by name or username
  searchUsers: (query: string, limit: number = 20): Promise<UsersResponse> =>
    userApi.getUsers({ search: query, limit }),

  // Get users for new chat (exclude existing chat members)
  getUsersForNewChat: (excludeChatId: string): Promise<UsersResponse> =>
    userApi.getUsers({ excludeChat: excludeChatId }),
};

// Helper functions for user management
export const UserHelper = {
  // Format user display name
  getDisplayName: (user: User): string => {
    return user.fullName || user.username || 'Unknown User';
  },

  // Check if user is currently online
  isUserOnline: (user: User): boolean => {
    return user.isOnline === true;
  },

  // Format last seen time
  formatLastSeen: (lastSeen: string): string => {
    if (!lastSeen) return 'Never';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  },

  // Get default avatar URL
  getDefaultAvatar: (userId: string): string => {
    return `/api/avatars/${userId}`;
  },

  // Validate username
  validateUsername: (username: string): { valid: boolean; error?: string } => {
    if (!username || username.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters long' };
    }
    if (username.length > 20) {
      return { valid: false, error: 'Username must be less than 20 characters' };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, and ._-' };
    }
    return { valid: true };
  },

  // Validate full name
  validateFullName: (fullName: string): { valid: boolean; error?: string } => {
    if (!fullName || fullName.trim().length === 0) {
      return { valid: false, error: 'Full name is required' };
    }
    if (fullName.length > 50) {
      return { valid: false, error: 'Full name must be less than 50 characters' };
    }
    return { valid: true };
  },

  // Validate password
  validatePassword: (password: string): { valid: boolean; error?: string } => {
    if (!password || password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long' };
    }
    if (password.length > 100) {
      return { valid: false, error: 'Password is too long' };
    }
    return { valid: true };
  },
};

// React hook for user operations
export const useUserOperations = () => {
  const uploadProfilePictureWithProgress = async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await api.post('/users/profile-picture', formData, {
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
      
      return response.data.avatarUrl;
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      throw error;
    }
  };

  const searchUsersDebounced = async (
    query: string,
    delay: number = 300
  ): Promise<User[]> => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        if (query.trim().length === 0) {
          resolve([]);
          return;
        }

        try {
          const response = await userApi.searchUsers(query);
          resolve(response.users || []);
        } catch (error) {
          console.error('User search failed:', error);
          resolve([]);
        }
      }, delay);

      return () => clearTimeout(timeoutId);
    });
  };

  return {
    uploadProfilePictureWithProgress,
    searchUsersDebounced,
  };
};

export default userApi;