// File: components/chat/OnlineStatusIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  lastSeen?: Date;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  accessibilityLabel?: string;
  testID?: string;
}

export default function OnlineStatusIndicator({
  isOnline,
  lastSeen,
  showText = false,
  size = 'medium',
  accessibilityLabel,
  testID,
}: OnlineStatusIndicatorProps) {
  const { spacing, typography } = useTheme();

  const sizeMap = {
    small: 8,
    medium: 12,
    large: 16,
  };

  const indicatorSize = sizeMap[size];

  const formatLastSeen = (date?: Date) => {
    if (!date) return 'Recently';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <View 
      style={styles.container}
      accessibilityLabel={accessibilityLabel || (isOnline ? "Online" : `Offline, last seen ${formatLastSeen(lastSeen)}`)}
      testID={testID}
    >
      <View 
        style={[
          styles.indicator,
          {
            width: indicatorSize,
            height: indicatorSize,
            borderRadius: indicatorSize / 2,
            backgroundColor: isOnline ? AppColors.online : AppColors.offline,
          }
        ]}
      />
      {showText && (
        <Text 
          style={[
            styles.statusText,
            { 
              fontSize: typography.caption.fontSize,
              lineHeight: typography.caption.lineHeight,
              color: isOnline ? AppColors.online : AppColors.offline
            }
          ]}
        >
          {isOnline ? 'Online' : `Seen ${formatLastSeen(lastSeen)}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    borderWidth: 2,
    borderColor: AppColors.background,
  },
  statusText: {
    marginLeft: 4,
    fontWeight: '500',
  },
});