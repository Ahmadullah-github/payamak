// File: components/chat/MessageBubble.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { ChatMessage } from '../../store/messageStore';

interface MessageBubbleProps {
  message: ChatMessage;
  isMyMessage: boolean;
  showSenderName?: boolean;
  isGroupChat?: boolean;
  onLongPress?: () => void;
  onSenderPress?: (senderId: string) => void;
}

export default function MessageBubble({
  message,
  isMyMessage,
  showSenderName = false,
  isGroupChat = false,
  onLongPress,
  onSenderPress,
}: MessageBubbleProps) {
  const messageTime = new Date(message.timestamp).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getSenderDisplayName = () => {
    if (!showSenderName || isMyMessage) return null;
    return message.senderName || `User ${message.senderId}`;
  };

  const renderMessageStatus = () => {
    if (!isMyMessage) return null;

    return (
      <View className="ml-1">
        {message.status === 'read' && (
          <Ionicons name="checkmark-done" size={16} color={AppColors.accent} />
        )}
        {message.status === 'delivered' && (
          <Ionicons name="checkmark-done" size={16} color={AppColors.textMuted} />
        )}
        {message.status === 'sent' && (
          <Ionicons name="checkmark" size={16} color={AppColors.textMuted} />
        )}
      </View>
    );
  };

  return (
    <View
      className={`flex-row mb-1 px-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
      style={{ marginBottom: 4 }}
    >
      <Pressable
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isMyMessage ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={{
          backgroundColor: isMyMessage ? AppColors.messageSent : AppColors.messageReceived,
          elevation: 1,
          shadowColor: AppColors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
        onLongPress={onLongPress}
      >
        {/* Sender name for group chats */}
        {showSenderName && isGroupChat && !isMyMessage && (
          <Pressable
            onPress={() => onSenderPress?.(message.senderId)}
            className="mb-1"
          >
            <Text
              className="text-xs font-medium"
              style={{
                color: AppColors.accent,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {getSenderDisplayName()}
            </Text>
          </Pressable>
        )}

        {/* Message content */}
        <Text
          className="text-base leading-5"
          style={{
            color: AppColors.textPrimary,
            fontSize: 16,
            lineHeight: 20,
            textAlign: 'right',
          }}
        >
          {message.content}
        </Text>

        {/* Time and status */}
        <View className="flex-row items-center justify-end mt-1">
          <Text
            className="text-xs"
            style={{
              color: AppColors.textMuted,
              fontSize: 11,
              marginRight: isMyMessage ? 4 : 0,
            }}
          >
            {messageTime}
          </Text>
          {renderMessageStatus()}
        </View>
      </Pressable>
    </View>
  );
}

// Typing indicator component
export function TypingIndicator({ 
  senderName, 
  isGroupChat = false 
}: { 
  senderName?: string; 
  isGroupChat?: boolean; 
}) {
  return (
    <View className="flex-row justify-start px-2 mb-2">
      <View
        className="rounded-lg px-3 py-2 rounded-bl-sm"
        style={{
          backgroundColor: AppColors.messageReceived,
          elevation: 1,
          shadowColor: AppColors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        {isGroupChat && senderName && (
          <Text
            className="text-xs font-medium mb-1"
            style={{
              color: AppColors.accent,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {senderName}
          </Text>
        )}
        <View className="flex-row items-center">
          <Text
            className="text-sm mr-2"
            style={{
              color: AppColors.textMuted,
              fontSize: 14,
            }}
          >
            در حال نوشتن
          </Text>
          <View className="flex-row">
            <View
              className="w-1 h-1 rounded-full mx-0.5"
              style={{
                backgroundColor: AppColors.textMuted,
                // Add animation here if needed
              }}
            />
            <View
              className="w-1 h-1 rounded-full mx-0.5"
              style={{
                backgroundColor: AppColors.textMuted,
              }}
            />
            <View
              className="w-1 h-1 rounded-full mx-0.5"
              style={{
                backgroundColor: AppColors.textMuted,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}