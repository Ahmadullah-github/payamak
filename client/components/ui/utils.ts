// File: components/ui/utils.ts
// Utility functions and helpers for UI components

import { AppColors } from '../../constants/colors';

/**
 * Get color based on status
 */
export const getStatusColor = (status: 'online' | 'offline' | 'away' | 'busy') => {
  switch (status) {
    case 'online':
      return AppColors.online;
    case 'offline':
      return AppColors.offline;
    case 'away':
      return AppColors.warning;
    case 'busy':
      return AppColors.error;
    default:
      return AppColors.offline;
  }
};

/**
 * Format timestamp for messages
 */
export const formatMessageTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (days === 1) {
    return 'دیروز';
  } else if (days < 7) {
    return `${days} روز پیش`;
  } else {
    return date.toLocaleDateString('fa-IR');
  }
};

/**
 * Format timestamp for chat list
 */
export const formatChatTime = (date?: Date) => {
  if (!date) return '';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (days === 1) {
    return 'دیروز';
  } else if (days < 7) {
    return `${days} روز پیش`;
  } else {
    return date.toLocaleDateString('fa-IR');
  }
};

/**
 * Get initials from full name
 */
export const getInitials = (fullName: string) => {
  if (!fullName?.trim()) return '?';
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Validate email format
 */
export const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string) => {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};