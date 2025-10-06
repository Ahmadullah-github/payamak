// File: components/chat/ChatItem.tsx
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppColors } from '../../constants/colors';
import { formatChatTime, getInitials } from '../ui/utils';
import { useTheme } from '../../constants/theme';
import { Chat } from '../../store/messageStore';

interface BaseChatItemProps {
  chat: Chat;
  onPress?: (chatId: string) => void;
}

// Base chat item component with common functionality
function BaseChatItem({ chat, onPress, children }: BaseChatItemProps & { children: React.ReactNode }) {
  const { typography } = useTheme();
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

  return (
    <Pressable 
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#F5F5F5' : AppColors.background,
        paddingHorizontal: 16,
        paddingVertical: 16,
      })}
      onPress={handlePress}
      android_ripple={{ color: '#F5F5F5' }}
      accessibilityLabel={`Chat with ${chat.name}, ${hasUnread ? `${chat.unreadCount} unread messages` : 'no unread messages'}`}
      accessibilityRole="button"
    >
      <View style={styles.chatRow}>
        {children}
        
        {/* Chat Content */}
        <View style={styles.chatContent}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.nameContainer}>
              <Text 
                style={[styles.chatName, { 
                  fontSize: typography.body.fontSize,
                  fontWeight: typography.body.fontWeight,
                  lineHeight: typography.body.lineHeight
                }]}
                numberOfLines={1}
              >
                {chat.name}
              </Text>
            </View>
            <Text 
              style={[styles.timestamp, { 
                fontSize: typography.caption.fontSize,
                lineHeight: typography.caption.lineHeight,
                color: hasUnread ? AppColors.unreadBadge : AppColors.textMuted,
                fontWeight: hasUnread ? typography.caption.fontWeight : '400'
              }]}
            >
              {formatChatTime(chat.lastMessageTime)}
            </Text>
          </View>
          
          {/* Message Row */}
          <View style={styles.messageRow}>
            <Text 
              style={[styles.lastMessage, { 
                fontSize: typography.bodySmall.fontSize,
                lineHeight: typography.bodySmall.lineHeight,
                color: AppColors.textMuted
              }]}
              numberOfLines={1}
            >
              {chat.lastMessage || 'No messages yet'}
            </Text>
            
            {/* Unread badge */}
            {hasUnread && (
              <View 
                style={styles.unreadBadge}
              >
                <Text 
                  style={[styles.unreadCount, { 
                    fontSize: typography.caption.fontSize,
                    fontWeight: '600',
                    color: AppColors.textWhite
                  }]}
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
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          {chat.members && chat.members.length > 0 ? (
            <Image
              source={{ uri: `https://i.pravatar.cc/150?u=${chat.members[0].id}` }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {chat.name ? getInitials(chat.name) : '?'}
              </Text>
            </View>
          )}
        </View>
        {/* Online status indicator */}
        {chat.isOnline && (
          <View style={styles.onlineIndicator} />
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
      <View style={styles.avatarContainer}>
        <View style={styles.groupAvatar}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=group${chat.id}` }}
            style={styles.avatarImage}
          />
          {/* Group indicator */}
          <View style={styles.groupIndicator}>
            <Ionicons name="people" size={8} color={AppColors.textMuted} />
          </View>
        </View>
      </View>
    </BaseChatItem>
  );
}

const styles = StyleSheet.create({
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E9EDEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: AppColors.textWhite,
    fontSize: 20,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.online,
    borderColor: AppColors.background,
    borderWidth: 2,
  },
  groupIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    color: AppColors.textPrimary,
  },
  timestamp: {
    minWidth: 40,
    textAlign: 'right',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: AppColors.unreadBadge,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    includeFontPadding: false,
  },
});