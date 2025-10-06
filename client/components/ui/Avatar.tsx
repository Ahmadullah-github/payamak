// File: components/ui/Avatar.tsx
import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle, StyleProp, AccessibilityRole } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { getInitials } from './utils';
import { useTheme } from '../../constants/theme';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
  borderColor?: string;
  borderWidth?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export default function Avatar({
  uri,
  name = '',
  size = 'medium',
  showOnlineIndicator = false,
  isOnline = false,
  style,
  borderColor,
  borderWidth = 2,
  accessibilityLabel,
  testID,
}: AvatarProps) {
  const { spacing } = useTheme();

  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 80,
  };

  const indicatorSizeMap = {
    small: 10,
    medium: 14,
    large: 18,
    xlarge: 22,
  };

  const fontSizeMap = {
    small: 12,
    medium: 18,
    large: 24,
    xlarge: 30,
  };

  const avatarSize = sizeMap[size];
  const indicatorSize = indicatorSizeMap[size];
  const fontSize = fontSizeMap[size];

  const isValidUri = uri && uri.trim().length > 0;

  return (
    <View 
      style={styles.container}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || `${name || 'User'} avatar`}
      testID={testID}
    >
      {isValidUri ? (
        <Image
          source={{ uri }}
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              borderColor: borderColor || AppColors.border,
              borderWidth,
            },
            style,
          ] as StyleProp<ImageStyle>}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View 
          style={[
            styles.avatar,
            styles.placeholderAvatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              borderColor: borderColor || AppColors.border,
              borderWidth,
            },
            style,
          ]}
        >
          {name ? (
            <Text 
              style={[
                styles.initials, 
                { 
                  fontSize,
                  color: AppColors.textWhite,
                }
              ]}
            >
              {getInitials(name)}
            </Text>
          ) : (
            <Ionicons
              name="person"
              size={fontSize * 0.8}
              color={AppColors.textWhite}
            />
          )}
        </View>
      )}

      {showOnlineIndicator && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              bottom: Math.max(2, avatarSize * 0.05),
              right: Math.max(2, avatarSize * 0.05),
              backgroundColor: isOnline ? AppColors.online : AppColors.offline,
              borderColor: AppColors.background,
              borderWidth: 2,
            },
          ]}
          accessibilityLabel={isOnline ? "Online" : "Offline"}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  avatar: {
    backgroundColor: AppColors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderAvatar: {
    backgroundColor: AppColors.primary,
  },
  initials: {
    fontWeight: '600',
    includeFontPadding: false,
  },
  onlineIndicator: {
    position: 'absolute',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});