// File: client/api/notificationApi.ts
import api from './apiClient';
import { handleApiError } from './apiClient';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  priority?: 'low' | 'normal' | 'medium' | 'high';
}

export type NotificationType = 
  | 'message' 
  | 'group_invite' 
  | 'friend_request' 
  | 'system' 
  | 'mention' 
  | 'reaction' 
  | 'file_shared' 
  | 'chat_created' 
  | 'message_read';

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    message: number;
    group_invite: number;
    friend_request: number;
    system: number;
    mention: number;
  };
  recent: number;
}

export interface NotificationCount {
  totalCount: number;
  unreadCount: number;
}

export interface NotificationFilters {
  type?: string;
  read?: boolean;
  priority?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Notification API endpoints
export const notificationApi = {
  // Get unread notifications with filters
  getUnreadNotifications: (filters: { 
    limit?: number; 
    offset?: number; 
    type?: string;
  } = {}): Promise<NotificationsResponse> => {
    const { limit = 20, offset = 0, type } = filters;
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (type) params.append('type', type);
    
    return api.get(`/notifications/unread?${params}`);
  },
  
  // Get all notifications with advanced filtering
  getNotifications: (filters: NotificationFilters = {}): Promise<NotificationsResponse> => {
    const { 
      limit = 50, 
      offset = 0, 
      type, 
      read, 
      priority,
      startDate,
      endDate 
    } = filters;
    
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (type) params.append('type', type);
    if (read !== undefined) params.append('read', read.toString());
    if (priority) params.append('priority', priority);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return api.get(`/notifications?${params}`);
  },

  // Create a notification (for admin/system use)
  createNotification: (data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: string;
  }): Promise<{ success: boolean; notification: Notification; message: string }> =>
    api.post('/notifications', data),
  
  // Mark notification as read
  markAsRead: (notificationId: string): Promise<{ success: boolean; message: string; notification?: any }> => 
    api.patch(`/notifications/${notificationId}/read`),
  
  // Mark multiple notifications as read
  markMultipleAsRead: (notificationIds: string[]): Promise<{ success: boolean; message: string; updatedCount: number }> =>
    api.patch('/notifications/read-multiple', { notificationIds }),
  
  // Mark all notifications as read with optional filters
  markAllAsRead: (filters?: { type?: string; olderThan?: string }): Promise<{ success: boolean; message: string }> =>
    api.patch('/notifications/read-all', filters || {}),
  
  // Delete notification
  deleteNotification: (notificationId: string): Promise<{ success: boolean; message: string }> => 
    api.delete(`/notifications/${notificationId}`),
  
  // Delete multiple notifications
  deleteMultipleNotifications: (notificationIds: string[]): Promise<{ success: boolean; message: string }> =>
    api.delete('/notifications', { data: { notificationIds } }),
  
  // Delete all read notifications with optional filters
  deleteReadNotifications: (filters?: { olderThan?: string; type?: string }): Promise<{ success: boolean; message: string }> =>
    api.delete('/notifications/read', { data: filters || {} }),
  
  // Get notification statistics
  getStats: (days?: number): Promise<{ success: boolean; stats: NotificationStats }> => {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    return api.get(`/notifications/stats?${params}`);
  },
  
  // Get notification count with optional type filter
  getNotificationCount: (type?: string): Promise<{ success: boolean; totalCount: number; unreadCount: number }> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    return api.get(`/notifications/count?${params}`);
  },
};

// Notification types constant
export const NOTIFICATION_TYPES: Record<string, NotificationType> = {
  MESSAGE: 'message',
  GROUP_INVITE: 'group_invite',
  FRIEND_REQUEST: 'friend_request',
  SYSTEM: 'system',
  MENTION: 'mention',
  REACTION: 'reaction',
  FILE_SHARED: 'file_shared',
  CHAT_CREATED: 'chat_created',
  MESSAGE_READ: 'message_read'
} as const;

// Helper functions for notifications
export const NotificationHelper = {
  // Check if notification is unread
  isUnread: (notification: Notification): boolean => !notification.isRead,

  // Format notification time
  formatTime: (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  },

  // Get notification icon based on type
  getIcon: (type: string): string => {
    const icons = {
      [NOTIFICATION_TYPES.MESSAGE]: '💬',
      [NOTIFICATION_TYPES.GROUP_INVITE]: '👥',
      [NOTIFICATION_TYPES.FRIEND_REQUEST]: '👤',
      [NOTIFICATION_TYPES.SYSTEM]: '🔔',
      [NOTIFICATION_TYPES.MENTION]: '📢',
      [NOTIFICATION_TYPES.REACTION]: '👍',
      [NOTIFICATION_TYPES.FILE_SHARED]: '📁',
      [NOTIFICATION_TYPES.CHAT_CREATED]: '💭',
      [NOTIFICATION_TYPES.MESSAGE_READ]: '👁️'
    };
    return icons[type] || '🔔';
  },

  // Get notification color based on type
  getColor: (type: string): string => {
    const colors = {
      [NOTIFICATION_TYPES.MESSAGE]: 'blue',
      [NOTIFICATION_TYPES.GROUP_INVITE]: 'green',
      [NOTIFICATION_TYPES.FRIEND_REQUEST]: 'purple',
      [NOTIFICATION_TYPES.SYSTEM]: 'orange',
      [NOTIFICATION_TYPES.MENTION]: 'red',
      [NOTIFICATION_TYPES.REACTION]: 'teal',
      [NOTIFICATION_TYPES.FILE_SHARED]: 'cyan',
      [NOTIFICATION_TYPES.CHAT_CREATED]: 'pink',
      [NOTIFICATION_TYPES.MESSAGE_READ]: 'gray'
    };
    return colors[type] || 'gray';
  },

  // Check if notification should show alert
  shouldAlert: (notification: Notification): boolean => {
    return !notification.isRead && 
           (notification.priority === 'high' || 
            notification.priority === 'medium' ||
            notification.type === NOTIFICATION_TYPES.MENTION);
  },

  // Extract action from notification data
  getAction: (notification: Notification): { type: string; payload: any } | null => {
    if (!notification.data) return null;

    const { action } = notification.data;
    if (action) {
      return {
        type: action.type,
        payload: action.payload
      };
    }

    // Default actions based on notification type
    switch (notification.type) {
      case NOTIFICATION_TYPES.MESSAGE:
        return { type: 'navigate_to_chat', payload: { chatId: notification.data.chatId } };
      case NOTIFICATION_TYPES.GROUP_INVITE:
        return { type: 'view_invite', payload: { inviteId: notification.data.inviteId } };
      case NOTIFICATION_TYPES.FRIEND_REQUEST:
        return { type: 'view_friend_request', payload: { requestId: notification.data.requestId } };
      default:
        return null;
    }
  }
};

// React hook for notification operations
export const useNotificationOperations = () => {
  const markAsReadWithOptimistic = async (notificationId: string): Promise<void> => {
    try {
      // Optimistically update local state first
      // This would be integrated with your state management (Zustand, Redux, etc.)
      
      await notificationApi.markAsRead(notificationId);
    } catch (error) {
      // Revert optimistic update on error
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  const batchMarkAsRead = async (notificationIds: string[]): Promise<void> => {
    if (notificationIds.length === 0) return;
    
    if (notificationIds.length === 1) {
      await markAsReadWithOptimistic(notificationIds[0]);
    } else {
      await notificationApi.markMultipleAsRead(notificationIds);
    }
  };

  const subscribeToNotifications = (userId: string, callbacks: {
    onNewNotification?: (notification: Notification) => void;
    onNotificationRead?: (data: { id: string }) => void;
    onNotificationDeleted?: (data: { id: string }) => void;
    onCountUpdate?: (data: { unreadCount: number }) => void;
  }) => {
    // This would integrate with your WebSocket/Socket.IO client
    // Example implementation:
    /*
    const socket = getSocket(); // Your socket instance
    
    socket.on('notification', callbacks.onNewNotification);
    socket.on('notification_read', callbacks.onNotificationRead);
    socket.on('notification_deleted', callbacks.onNotificationDeleted);
    socket.on('notification_count_update', callbacks.onCountUpdate);

    return () => {
      socket.off('notification', callbacks.onNewNotification);
      socket.off('notification_read', callbacks.onNotificationRead);
      socket.off('notification_deleted', callbacks.onNotificationDeleted);
      socket.off('notification_count_update', callbacks.onCountUpdate);
    };
    */
  };

  return {
    markAsReadWithOptimistic,
    batchMarkAsRead,
    subscribeToNotifications
  };
};

export default notificationApi;