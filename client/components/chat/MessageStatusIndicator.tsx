// File: components/chat/MessageStatusIndicator.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';

interface MessageStatusIndicatorProps {
  status: 'sent' | 'delivered' | 'read';
  isOwnMessage: boolean;
  size?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export default function MessageStatusIndicator({
  status,
  isOwnMessage,
  size = 16,
  accessibilityLabel,
  testID,
}: MessageStatusIndicatorProps) {
  if (!isOwnMessage) return null;

  let iconName: keyof typeof Ionicons.glyphMap;
  let iconColor: string;

  switch (status) {
    case 'sent':
      iconName = 'checkmark';
      iconColor = AppColors.textMuted;
      break;
    case 'delivered':
      iconName = 'checkmark-done';
      iconColor = AppColors.textMuted;
      break;
    case 'read':
      iconName = 'checkmark-done';
      iconColor = AppColors.accent;
      break;
    default:
      iconName = 'time';
      iconColor = AppColors.textMuted;
  }

  return (
    <View 
      style={styles.container}
      accessibilityLabel={accessibilityLabel || `Message status: ${status}`}
      testID={testID}
    >
      <Ionicons 
        name={iconName} 
        size={size} 
        color={iconColor} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
});