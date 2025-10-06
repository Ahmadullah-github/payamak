// File: components/chat/ChatInput.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';
import AttachmentOptions from './AttachmentOptions';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachmentSelect: (type: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  onAttachmentSelect,
  onRecordingStart,
  onRecordingStop,
  placeholder = 'Type a message...',
  disabled = false,
  accessibilityLabel,
  testID,
}: ChatInputProps) {
  const { spacing } = useTheme();
  const [isAttachmentMenuVisible, setIsAttachmentMenuVisible] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handleSendPress = () => {
    if (value.trim()) {
      onSend();
    }
  };

  const handleAttachmentPress = () => {
    setIsAttachmentMenuVisible(true);
  };

  const handleAttachmentSelect = (optionId: string) => {
    onAttachmentSelect(optionId);
  };

  const handleRecordPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
    
    onRecordingStart?.();
  };

  const handleRecordPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    
    onRecordingStop?.();
  };

  return (
    <View 
      style={styles.container}
      accessibilityLabel={accessibilityLabel || "Chat input"}
      testID={testID}
    >
      {/* Attachment Options Modal */}
      <AttachmentOptions
        visible={isAttachmentMenuVisible}
        onClose={() => setIsAttachmentMenuVisible(false)}
        onOptionSelect={handleAttachmentSelect}
      />
      
      {/* Input Area */}
      <View style={styles.inputContainer}>
        <Pressable
          style={styles.attachmentButton}
          onPress={handleAttachmentPress}
          accessibilityLabel="Add attachment"
          accessibilityRole="button"
          disabled={disabled}
        >
          <Ionicons 
            name="add" 
            size={24} 
            color={disabled ? AppColors.textMuted : AppColors.textPrimary} 
          />
        </Pressable>
        
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={AppColors.textMuted}
          multiline
          maxLength={1000}
          editable={!disabled}
          accessibilityLabel="Type your message"
          accessibilityRole="text"
        />
        
        {value.trim() ? (
          <Pressable
            style={styles.sendButton}
            onPress={handleSendPress}
            accessibilityLabel="Send message"
            accessibilityRole="button"
            disabled={disabled || !value.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={AppColors.textWhite} 
            />
          </Pressable>
        ) : (
          <Animated.View
            style={[
              styles.recordButtonContainer,
              { transform: [{ scale: scaleValue }] }
            ]}
          >
            <Pressable
              style={styles.recordButton}
              onPressIn={handleRecordPressIn}
              onPressOut={handleRecordPressOut}
              accessibilityLabel="Record voice message"
              accessibilityRole="button"
              disabled={disabled}
            >
              <Ionicons 
                name="mic" 
                size={20} 
                color={AppColors.textWhite} 
              />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background,
    borderTopWidth: 1,
    borderTopColor: AppColors.divider,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  attachmentButton: {
    padding: 8,
    marginRight: 4,
    borderRadius: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: AppColors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: AppColors.textPrimary,
    maxHeight: 100,
    ...Platform.select({
      ios: {
        paddingTop: 12,
        paddingBottom: 12,
      },
      android: {
        paddingTop: 8,
        paddingBottom: 8,
      },
    }),
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  recordButtonContainer: {
    marginLeft: 8,
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});