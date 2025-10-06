// File: components/chat/MessageGroup.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';
import MessageBubble from './MessageBubble';
import { ChatMessage } from '../../store/messageStore';

interface MessageGroupProps {
  messages: ChatMessage[];
  isMyGroup: boolean;
  isGroupChat: boolean;
  onMessageLongPress: (messageId: string) => void;
  onSenderPress: (senderId: string) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export default function MessageGroup({
  messages,
  isMyGroup,
  isGroupChat,
  onMessageLongPress,
  onSenderPress,
  accessibilityLabel,
  testID,
}: MessageGroupProps) {
  const { typography } = useTheme();

  if (messages.length === 0) return null;

  // Get the sender info for the group (first message sender)
  const sender = messages[0];
  
  return (
    <View 
      style={[styles.container, isMyGroup ? styles.myGroup : styles.otherGroup]}
      accessibilityLabel={accessibilityLabel || `Message group from ${sender.senderName}`}
      testID={testID}
    >
      {/* Sender name for group chats (only for other users) */}
      {isGroupChat && !isMyGroup && (
        <Text 
          style={[styles.senderName, { 
            fontSize: typography.caption.fontSize,
            lineHeight: typography.caption.lineHeight,
            color: AppColors.textMuted,
            marginBottom: 4,
            marginLeft: 56
          }]}
        >
          {sender.senderName}
        </Text>
      )}
      
      {/* Messages in the group */}
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isMyMessage={isMyGroup}
          showSenderName={false} // Already shown above for group
          isGroupChat={isGroupChat}
          onLongPress={() => onMessageLongPress(message.id)}
          onSenderPress={onSenderPress}
          isConsecutive={index > 0}
          accessibilityLabel={`Message from ${message.senderName}, ${message.content}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  myGroup: {
    alignItems: 'flex-end',
  },
  otherGroup: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontWeight: '500',
  },
});