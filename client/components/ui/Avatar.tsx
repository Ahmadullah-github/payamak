// File: components/ui/Avatar.tsx
import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
  borderColor?: string;
  borderWidth?: number;
}

export default function Avatar({
  uri,
  name = '',
  size = 'medium',
  showOnlineIndicator = false,
  isOnline = false,
  style,
  borderColor,
  borderWidth = 0,
}: AvatarProps) {
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

  const getInitials = (fullName: string) => {
    if (!fullName?.trim()) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const avatarStyle = [
    styles.avatar,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      borderColor: borderColor || AppColors.border,
      borderWidth,
    },
    style,
  ];

  // Only render Image if uri is a valid non-empty string
  const isValidUri = uri && uri.trim().length > 0;

  return (
    <View style={styles.container}>
      {isValidUri ? (
        <Image
          source={{ uri }}
          style={avatarStyle as StyleProp<ImageStyle>}
          resizeMode="cover"
        />
      ) : (
        <View style={[avatarStyle, styles.placeholderAvatar]}>
          {name ? (
            <Text style={[styles.initials, { fontSize }]}>
              {getInitials(name)}
            </Text>
          ) : (
            <Ionicons
              name="person"
              size={fontSize * 0.8} // Slightly smaller than text for balance
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
              // Position inside the avatar to avoid clipping (especially on Android)
              bottom: Math.max(2, avatarSize * 0.05), // e.g., 2-4px from bottom-right
              right: Math.max(2, avatarSize * 0.05),
              backgroundColor: isOnline ? AppColors.onlineStatus : AppColors.offlineStatus,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    // Ensure container doesn't clip the indicator (helps on iOS; Android limitation remains)
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
    color: AppColors.textWhite,
    fontWeight: '600',
    includeFontPadding: false,
  },
  onlineIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: AppColors.background,
  },
});