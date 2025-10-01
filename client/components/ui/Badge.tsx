// File: components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppColors } from '../../constants/colors';

interface BadgeProps {
  count?: number;
  label?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  maxCount?: number;
  showZero?: boolean;
}

export default function Badge({
  count,
  label,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  maxCount = 99,
  showZero = false,
}: BadgeProps) {
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: AppColors.primary, textColor: AppColors.textWhite };
      case 'secondary':
        return { backgroundColor: AppColors.inputBackground, textColor: AppColors.textPrimary };
      case 'success':
        return { backgroundColor: AppColors.accent, textColor: AppColors.textWhite };
      case 'warning':
        return { backgroundColor: '#FF9500', textColor: AppColors.textWhite };
      case 'error':
        return { backgroundColor: AppColors.error, textColor: AppColors.textWhite };
      case 'info':
        return { backgroundColor: AppColors.primaryLight, textColor: AppColors.textWhite };
      default:
        return { backgroundColor: AppColors.primary, textColor: AppColors.textWhite };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { minWidth: 16, height: 16, borderRadius: 8, fontSize: 10, paddingHorizontal: 4 };
      case 'medium':
        return { minWidth: 20, height: 20, borderRadius: 10, fontSize: 12, paddingHorizontal: 6 };
      case 'large':
        return { minWidth: 24, height: 24, borderRadius: 12, fontSize: 14, paddingHorizontal: 8 };
      default:
        return { minWidth: 20, height: 20, borderRadius: 10, fontSize: 12, paddingHorizontal: 6 };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  // Don't render if count is 0 and showZero is false
  if (count !== undefined && count === 0 && !showZero) {
    return null;
  }

  // Don't render if no content
  if (count === undefined && !label) {
    return null;
  }

  const displayText = label || (count !== undefined ? 
    (count > maxCount ? `${maxCount}+` : count.toString()) : 
    ''
  );

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.backgroundColor,
          minWidth: sizeStyles.minWidth,
          height: sizeStyles.height,
          borderRadius: sizeStyles.borderRadius,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.textColor,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});