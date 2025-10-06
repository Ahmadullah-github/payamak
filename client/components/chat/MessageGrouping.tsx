// File: components/chat/MessageGrouping.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';
import { ChatMessage } from '../../store/messageStore';
import MessageGroup from './MessageGroup';

interface MessageGroupingProps {
  messages: ChatMessage[];
  currentUserId: string;
  isGroupChat: boolean;
  onMessageLongPress: (messageId: string) => void;
  onSenderPress: (senderId: string) => void;
  accessibilityLabel?: string;
  testID?: string;
}

// Function to group consecutive messages from the same sender
const groupMessages = (messages: ChatMessage[], currentUserId: string) => {
  const groups: ChatMessage[][] = [];
  let currentGroup: ChatMessage[] = [];
  
  messages.forEach((message, index) => {
    // Check if we should start a new group
    const shouldStartNewGroup = 
      currentGroup.length === 0 || // First message
      currentGroup[0].senderId !== message.senderId || // Different sender
      (message.timestamp.getTime() - currentGroup[currentGroup.length - 1].timestamp.getTime()) > 5 * 60 * 1000; // More than 5 minutes since last message
    
    if (shouldStartNewGroup) {
      // Save the previous group if it exists
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
      }
      // Start a new group
      currentGroup = [message];
    } else {
      // Add to current group
      currentGroup.push(message);
    }
  });
  
  // Don't forget the last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
};

export default function MessageGrouping({
  messages,
  currentUserId,
  isGroupChat,
  onMessageLongPress,
  onSenderPress,
  accessibilityLabel,
  testID,
}: MessageGroupingProps) {
  const { typography } = useTheme();
  
  // Group the messages
  const messageGroups = groupMessages(messages, currentUserId);
  
  return (
    <View 
      style={styles.container}
      accessibilityLabel={accessibilityLabel || "Message groups"}
      testID={testID}
    >
      {messageGroups.map((group, groupIndex) => {
        const isMyGroup = group[0].senderId === currentUserId;
        
        return (
          <MessageGroup
            key={`group-${groupIndex}`}
            messages={group}
            isMyGroup={isMyGroup}
            isGroupChat={isGroupChat}
            onMessageLongPress={onMessageLongPress}
            onSenderPress={onSenderPress}
            accessibilityLabel={`Message group ${groupIndex + 1} from ${group[0].senderName}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});