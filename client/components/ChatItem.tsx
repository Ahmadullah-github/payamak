// file: components/ChatItem.tsx
import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppColors } from '../constants/colors';

// Define the props the component will accept
export type ChatItemProps = {
  id: string;
  avatarUrl: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  status: 'sent' | 'delivered' | 'read';
};

export function ChatItem({
  id,
  name,
  avatarUrl,
  isOnline,
  lastMessage,
  timestamp,
  unreadCount,
  status,
}: ChatItemProps) {
  const hasUnread = unreadCount > 0;

  // Choose the status icon based on message status
  const StatusIcon = () => {
    if (status === 'read') {
      return <Ionicons name="checkmark-done" size={16} color={AppColors.accent} />;
    }
    if (status === 'delivered') {
      return <Ionicons name="checkmark-done" size={16} color={AppColors.textMuted} />;
    }
    // 'sent' status
    return <Ionicons name="checkmark" size={16} color={AppColors.textMuted} />;
  };

  const handlePress = () => {
    router.push({
      pathname: "/(app)/chat/[id]",
      params: { id: id }
    });
  };

  return (
    <Pressable 
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#F5F5F5' : AppColors.background,
        paddingHorizontal: 16,
        paddingVertical: 12,
      })}
      onPress={handlePress}
      android_ripple={{ color: '#F5F5F5' }}
    >
      <View className="flex-row items-center">
        {/* Avatar with Online Status */}
        <View className="relative mr-3">
          <Image
            source={{ uri: avatarUrl }}
            className="w-14 h-14 rounded-full"
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
            }}
          />
          {isOnline && (
            <View
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
              style={{
                backgroundColor: AppColors.onlineStatus,
                borderColor: AppColors.background,
                width: 16,
                height: 16,
                borderRadius: 8,
              }}
            />
          )}
        </View>

        {/* Chat Content */}
        <View className="flex-1">
          {/* Header Row */}
          <View className="flex-row justify-between items-center mb-1">
            <Text 
              className="text-base font-medium flex-1 mr-2" 
              numberOfLines={1}
              style={{ 
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: '500',
              }}
            >
              {name}
            </Text>
            <Text 
              className="text-xs"
              style={{ 
                color: hasUnread ? AppColors.unreadBadge : AppColors.textMuted,
                fontSize: 12,
                fontWeight: hasUnread ? '500' : '400',
              }}
            >
              {timestamp}
            </Text>
          </View>
          
          {/* Message Row */}
          <View className="flex-row justify-between items-center">
            <View className="flex-1 flex-row items-center mr-2">
              {!hasUnread && (
                <View className="mr-1">
                  <StatusIcon />
                </View>
              )}
              <Text 
                className="flex-1" 
                numberOfLines={1}
                style={{ 
                  color: AppColors.textMuted,
                  fontSize: 14,
                }}
              >
                {lastMessage}
              </Text>
            </View>
            
            {/* Unread Badge */}
            {hasUnread && (
              <View 
                className="rounded-full justify-center items-center min-w-[20px] h-5 px-1.5"
                style={{
                  backgroundColor: AppColors.unreadBadge,
                  minWidth: 20,
                  height: 20,
                }}
              >
                <Text 
                  className="text-white font-medium text-xs"
                  style={{
                    color: AppColors.textWhite,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          
          {/* Divider */}
          <View 
            className="mt-3 h-px"
            style={{
              backgroundColor: AppColors.divider,
              marginLeft: -16,
              marginRight: -16,
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}