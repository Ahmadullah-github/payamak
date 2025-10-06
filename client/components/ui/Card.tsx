// File: components/ui/Card.tsx
import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  backgroundColor?: string;
  variant?: 'elevated' | 'outlined' | 'filled';
  borderColor?: string;
  borderWidth?: number;
}

export default function Card({
  children,
  style,
  padding = 'medium',
  shadow = true,
  borderRadius = 'medium',
  backgroundColor = AppColors.background,
  variant = 'elevated',
  borderColor = AppColors.border,
  borderWidth = 1,
}: CardProps) {
  const { spacing } = useTheme();

  const paddingStyles = {
    none: 0,
    small: spacing.sm,
    medium: spacing.md,
    large: spacing.lg,
  };

  const radiusStyles = {
    none: 0,
    small: 8,
    medium: 12,
    large: 16,
    full: 999,
  };

  const getBorderStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth,
          borderColor,
        };
      case 'filled':
        return {
          borderWidth: 0,
          backgroundColor,
        };
      case 'elevated':
      default:
        return {
          borderWidth: 0,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          padding: paddingStyles[padding],
          borderRadius: radiusStyles[borderRadius],
          backgroundColor,
        },
        getBorderStyle(),
        shadow && variant === 'elevated' && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.background,
  },
  shadow: {
    elevation: 4,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});