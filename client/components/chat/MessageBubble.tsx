// File: components/chat/MessageBubble.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '../../constants/colors';
import { ChatMessage } from '../../store/messageStore';
import { Avatar } from '../ui';
import { formatMessageTime } from '../ui/utils';
import { useTheme } from '../../constants/theme';
import MessageStatusIndicator from './MessageStatusIndicator';
import FileAttachment from './FileAttachment';
import MediaPreview from './MediaPreview';

interface MessageBubbleProps {
  message: ChatMessage;
  isMyMessage: boolean;
  showSenderName?: boolean;
  isGroupChat?: boolean;
  onLongPress?: () => void;
  onSenderPress?: (senderId: string) => void;
  onMessagePress?: () => void;
  showTimestamp?: boolean;
  isConsecutive?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export default function MessageBubble({
  message,
  isMyMessage,
  showSenderName = false,
  isGroupChat = false,
  onLongPress,
  onSenderPress,
  onMessagePress,
  showTimestamp = true,
  isConsecutive = false,
  accessibilityLabel,
  testID,
}: MessageBubbleProps) {
  const { typography } = useTheme();
  const [scaleValue] = useState(new Animated.Value(1));
  const [showTime, setShowTime] = useState(false);

  const messageTime = formatMessageTime(new Date(message.timestamp));

  const messageDate = new Date(message.timestamp).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const getSenderDisplayName = () => {
    if (!showSenderName || isMyMessage) return null;
    return message.senderName || `User ${message.senderId}`;
  };

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    setShowTime(!showTime);
    onMessagePress?.();
  };

  const handleLinkPress = (url: string) => {
    Alert.alert(
      'Open Link',
      `Do you want to open ${url}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => Linking.openURL(url) },
      ]
    );
  };

  const renderMessageContent = () => {
    if (message.type === 'text') {
      // Simple URL detection (you can enhance this with a proper URL parser)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = message.content.split(urlRegex);
      
      return (
        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText, { 
          fontSize: typography.body.fontSize,
          lineHeight: typography.body.lineHeight
        }]}>
          {parts.map((part, index) => {
            if (urlRegex.test(part)) {
              return (
                <Text
                  key={index}
                  style={styles.linkText}
                  onPress={() => handleLinkPress(part)}
                >
                  {part}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      );
    }

    if (message.type === 'image' || message.type === 'video' || message.type === 'audio') {
      return (
        <MediaPreview
          uri={message.mediaFile?.url || ''}
          type={message.type}
          caption={message.content}
        />
      );
    }

    // Handle file attachments
    if (message.mediaFile) {
      return (
        <FileAttachment
          fileName={message.mediaFile.filename}
          fileSize={message.mediaFile.size}
          fileType={message.mediaFile.mimeType}
          onDownload={() => console.log('Download file:', message.mediaFile?.id)}
        />
      );
    }

    // Handle other message types
    return (
      <View style={styles.mediaContainer}>
        <Ionicons
          name="document-outline"
          size={24}
          color={isMyMessage ? AppColors.textWhite : AppColors.textPrimary}
        />
        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText, { 
          fontSize: typography.body.fontSize,
          lineHeight: typography.body.lineHeight
        }]}>
          {message.mediaFile?.filename || 'File'}
        </Text>
      </View>
    );
  };

  const getBubbleStyle = () => {
    const baseStyle = [
      styles.messageBubble,
      isMyMessage ? styles.myMessage : styles.otherMessage,
      isConsecutive && (isMyMessage ? styles.consecutiveMyMessage : styles.consecutiveOtherMessage),
    ];
    return baseStyle;
  };

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        { transform: [{ scale: scaleValue }] },
      ]}
      accessibilityLabel={accessibilityLabel || `Message from ${message.senderName}, ${message.content}`}
      testID={testID}
    >
      {/* Avatar for group chats (other users only) */}
      {isGroupChat && !isMyMessage && !isConsecutive && (
        <Pressable
          onPress={() => onSenderPress?.(message.senderId)}
          style={styles.avatarContainer}
          accessibilityLabel={`View profile of ${message.senderName}`}
          accessibilityRole="button"
        >
          <Avatar
            name={message.senderName}
            size="small"
            showOnlineIndicator={false}
          />
        </Pressable>
      )}
      
      {/* Spacer for consecutive messages without avatar */}
      {isGroupChat && !isMyMessage && isConsecutive && (
        <View style={styles.avatarSpacer} />
      )}

      <View style={styles.bubbleContainer}>
        {/* Sender name for group chats */}
        {getSenderDisplayName() && (
          <Pressable 
            onPress={() => onSenderPress?.(message.senderId)}
            accessibilityLabel={`View profile of ${message.senderName}`}
            accessibilityRole="button"
          >
            <Text style={[styles.senderName, { 
              fontSize: typography.caption.fontSize,
              lineHeight: typography.caption.lineHeight,
              color: AppColors.textMuted
            }]}>
              {getSenderDisplayName()}
            </Text>
          </Pressable>
        )}

        {/* Message bubble */}
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={onLongPress}
          delayLongPress={300}
          accessibilityLabel={`Message from ${message.senderName}, ${message.content}`}
          accessibilityRole="text"
        >
          {isMyMessage ? (
            <LinearGradient
              colors={[AppColors.accent, AppColors.primaryLight]}
              style={getBubbleStyle()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {renderMessageContent()}
              <View style={styles.messageFooter}>
                <Text style={[styles.messageTime, { 
                  fontSize: typography.caption.fontSize,
                  lineHeight: typography.caption.lineHeight,
                  color: 'rgba(255,255,255,0.8)'
                }]}>
                  {messageTime}
                </Text>
                <MessageStatusIndicator 
                  status={message.status} 
                  isOwnMessage={isMyMessage} 
                />
              </View>
            </LinearGradient>
          ) : (
            <View style={getBubbleStyle()}>
              {renderMessageContent()}
              <View style={styles.messageFooter}>
                <Text style={[styles.messageTime, styles.otherMessageTime, { 
                  fontSize: typography.caption.fontSize,
                  lineHeight: typography.caption.lineHeight
                }]}>
                  {messageTime}
                </Text>
              </View>
            </View>
          )}
        </Pressable>

        {/* Extended timestamp (shown on tap) */}
        {showTime && showTimestamp && (
          <Animated.View style={styles.timestampContainer}>
            <Text style={[styles.timestampText, { 
              fontSize: typography.caption.fontSize,
              lineHeight: typography.caption.lineHeight,
              color: AppColors.textMuted,
              backgroundColor: AppColors.inputBackground
            }]}>
              {messageDate} at {messageTime}
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
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
  const { typography } = useTheme();
  const dotAnim1 = new Animated.Value(0);
  const dotAnim2 = new Animated.Value(0);
  const dotAnim3 = new Animated.Value(0);

  React.useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(dotAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim1, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim2, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim3, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <View style={[styles.messageContainer, styles.otherMessageContainer]}>
      {isGroupChat && (
        <View style={styles.avatarContainer}>
          <Avatar name={senderName} size="small" showOnlineIndicator={false} />
        </View>
      )}
      
      <View style={styles.bubbleContainer}>
        {isGroupChat && senderName && (
          <Text style={[styles.senderName, { 
            fontSize: typography.caption.fontSize,
            lineHeight: typography.caption.lineHeight,
            color: AppColors.textMuted
          }]}>
            {senderName}
          </Text>
        )}
        
        <View style={[styles.messageBubble, styles.otherMessage, styles.typingBubble]}>
          <View style={styles.typingContainer}>
            <Text style={[styles.typingText, { 
              fontSize: typography.bodySmall.fontSize,
              lineHeight: typography.bodySmall.lineHeight,
              color: AppColors.textMuted
            }]}>
              typing
            </Text>
            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
              <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
              <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  avatarSpacer: {
    width: 40,
    marginRight: 8,
  },
  bubbleContainer: {
    maxWidth: '75%',
    minWidth: '20%',
  },
  senderName: {
    marginBottom: 4,
    fontWeight: '500',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    elevation: 1,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myMessage: {
    backgroundColor: AppColors.messageSent,
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    backgroundColor: AppColors.messageReceived,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  consecutiveMyMessage: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 18,
  },
  consecutiveOtherMessage: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 18,
  },
  messageText: {
    fontWeight: '400',
  },
  myMessageText: {
    color: AppColors.textWhite,
  },
  otherMessageText: {
    color: AppColors.textPrimary,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  mediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontWeight: '500',
  },
  otherMessageTime: {
    color: AppColors.textMuted,
  },
  timestampContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  timestampText: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typingBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginRight: 8,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.textMuted,
    marginHorizontal: 1,
  },
});