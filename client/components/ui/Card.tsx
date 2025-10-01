// File: components/ui/Card.tsx
import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  borderRadius?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
}

export default function Card({
  children,
  style,
  padding = 'medium',
  shadow = true,
  borderRadius = 'medium',
  backgroundColor = AppColors.background,
}: CardProps) {
  const paddingStyles = {
    none: 0,
    small: 12,
    medium: 16,
    large: 24,
  };

  const radiusStyles = {
    small: 8,
    medium: 12,
    large: 16,
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
        shadow && styles.shadow,
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