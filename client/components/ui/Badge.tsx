// File: components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface BadgeProps {
  count?: number;
  label?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  maxCount?: number;
  showZero?: boolean;
  accessibilityLabel?: string;
  testID?: string;
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
  accessibilityLabel,
  testID,
}: BadgeProps) {
  const { spacing, typography } = useTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: AppColors.primary, textColor: AppColors.textWhite };
      case 'secondary':
        return { backgroundColor: AppColors.inputBackground, textColor: AppColors.textPrimary };
      case 'success':
        return { backgroundColor: AppColors.success, textColor: AppColors.textWhite };
      case 'warning':
        return { backgroundColor: AppColors.warning, textColor: AppColors.textWhite };
      case 'error':
        return { backgroundColor: AppColors.error, textColor: AppColors.textWhite };
      case 'info':
        return { backgroundColor: AppColors.info, textColor: AppColors.textWhite };
      case 'outline':
        return { backgroundColor: 'transparent', textColor: AppColors.primary, borderColor: AppColors.primary };
      default:
        return { backgroundColor: AppColors.primary, textColor: AppColors.textWhite };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { 
          minWidth: 16, 
          height: 16, 
          borderRadius: 8, 
          fontSize: typography.caption.fontSize, 
          paddingHorizontal: spacing.xs 
        };
      case 'medium':
        return { 
          minWidth: 20, 
          height: 20, 
          borderRadius: 10, 
          fontSize: typography.bodySmall.fontSize, 
          paddingHorizontal: spacing.sm 
        };
      case 'large':
        return { 
          minWidth: 24, 
          height: 24, 
          borderRadius: 12, 
          fontSize: typography.body.fontSize, 
          paddingHorizontal: spacing.md 
        };
      default:
        return { 
          minWidth: 20, 
          height: 20, 
          borderRadius: 10, 
          fontSize: typography.bodySmall.fontSize, 
          paddingHorizontal: spacing.sm 
        };
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

  const accessibilityValue = accessibilityLabel || 
    (count !== undefined ? `${count} unread items` : label || '');

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
          borderColor: colors.borderColor,
          borderWidth: colors.borderColor ? 1 : 0,
        },
        style,
      ]}
      accessibilityLabel={accessibilityValue}
      accessibilityRole="text"
      testID={testID}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.textColor,
            fontSize: sizeStyles.fontSize,
            fontWeight: '600',
          },
          textStyle,
        ]}
        numberOfLines={1}
        accessibilityLabel={accessibilityValue}
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
    textAlign: 'center',
  },
});