// File: components/chat/ChatItem.tsx
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { Chat } from '../../store/messageStore';
import { router } from 'expo-router';

interface BaseChatItemProps {
  chat: Chat;
  onPress?: (chatId: string) => void;
}

// Base chat item component with common functionality
function BaseChatItem({ chat, onPress, children }: BaseChatItemProps & { children: React.ReactNode }) {
  const hasUnread = chat.unreadCount > 0;
  
  const handlePress = () => {
    if (onPress) {
      onPress(chat.id);
    } else {
      // Default navigation
      router.push({
        pathname: "/(app)/chat/[id]",
        params: { id: chat.id, type: chat.type }
      });
    }
  };

  const formatTimestamp = (date?: Date) => {
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

  return (
    <Pressable 
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#F5F5F5' : AppColors.background,
        paddingHorizontal: 16,
        paddingVertical: 16,
      })}
      onPress={handlePress}
      android_ripple={{ color: '#F5F5F5' }}
    >
      <View className="flex-row items-center">
        {children}
        
        {/* Chat Content */}
        <View className="flex-1 ml-3">
          {/* Header Row */}
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-2">
              <Text 
                className="text-base font-medium" 
                numberOfLines={1}
                style={{ 
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: '500',
                }}
              >
                {chat.name}
              </Text>
            </View>
            <Text 
              className="text-xs"
              style={{ 
                color: hasUnread ? AppColors.unreadBadge : AppColors.textMuted,
                fontSize: 12,
                fontWeight: hasUnread ? '500' : '400',
              }}
            >
              {formatTimestamp(chat.lastMessageTime)}
            </Text>
          </View>
          
          {/* Message Row */}
          <View className="flex-row justify-between items-center">
            <Text 
              className="flex-1 mr-2 mt-2" 
              numberOfLines={1}
              style={{ 
                color: AppColors.textMuted,
                fontSize: 14,
              }}
            >
              {chat.lastMessage || 'هیچ پیامی'}
            </Text>
            
            {/* Unread badge */}
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
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// Direct chat item component
export function DirectChatItem({ chat, onPress }: BaseChatItemProps) {
  return (
    <BaseChatItem chat={chat} onPress={onPress}>
      {/* User Avatar */}
      <View className="relative">
        <Image
          source={{ uri: `https://i.pravatar.cc/150?u=${chat.id}` }}
          className="w-14 h-14 rounded-full"
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
          }}
        />
        {/* Online status indicator */}
        {chat.isOnline && (
          <View 
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
            style={{
              backgroundColor: AppColors.online,
              borderColor: AppColors.background,
              width: 16,
              height: 16,
              borderRadius: 8,
            }}
          />
        )}
      </View>
    </BaseChatItem>
  );
}

// Group chat item component
export function GroupChatItem({ chat, onPress }: BaseChatItemProps) {
  const memberCount = chat.members?.length || 0;
  
  return (
    <BaseChatItem chat={chat} onPress={onPress}>
      {/* Group Avatar */}
      <View className="relative">
        <View 
          className="w-14 h-14 rounded-full justify-center items-center"
          style={{
            backgroundColor: '#E9EDEF',
            width: 56,
            height: 56,
            borderRadius: 28,
          }}
        >
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=group${chat.id}` }}
            className="w-14 h-14 rounded-full"
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
            }}
          />
          {/* Group indicator */}
          <View 
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full justify-center items-center"
            style={{
              backgroundColor: AppColors.background,
              borderWidth: 1,
              borderColor: AppColors.divider,
              width: 16,
              height: 16,
              borderRadius: 8,
            }}
          >
            <Ionicons name="people" size={8} color={AppColors.textMuted} />
          </View>
        </View>
      </View>
    </BaseChatItem>
  );
}