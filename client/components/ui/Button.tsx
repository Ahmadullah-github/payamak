// File: components/ui/Button.tsx
import React, { useRef, useEffect } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  View,
  AccessibilityState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  gradientColors = [AppColors.primary, AppColors.primaryLight],
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { spacing, typography } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;

  const sizeStyles = {
    small: { 
      paddingVertical: spacing.sm, 
      paddingHorizontal: spacing.md, 
      fontSize: typography.bodySmall.fontSize,
      height: 36
    },
    medium: { 
      paddingVertical: spacing.md, 
      paddingHorizontal: spacing.lg, 
      fontSize: typography.body.fontSize,
      height: 44
    },
    large: { 
      paddingVertical: spacing.lg, 
      paddingHorizontal: spacing.xl, 
      fontSize: typography.bodyLarge.fontSize,
      height: 52
    },
  };

  const handlePressIn = () => {
    if (isDisabled) return;
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.96,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      {
        paddingVertical: sizeStyles[size].paddingVertical,
        paddingHorizontal: sizeStyles[size].paddingHorizontal,
        minHeight: sizeStyles[size].height,
      },
      fullWidth && styles.fullWidth,
      isDisabled && styles.disabled,
      style,
    ];

    switch (variant) {
      case 'primary':
        return [...baseStyle, { backgroundColor: AppColors.primary }];
      case 'secondary':
        return [...baseStyle, { backgroundColor: AppColors.inputBackground }];
      case 'outline':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: AppColors.primary,
          },
        ];
      case 'ghost':
        return [...baseStyle, { backgroundColor: 'transparent' }];
      case 'gradient':
        return baseStyle;
      case 'danger':
        return [...baseStyle, { backgroundColor: AppColors.error }];
      default:
        return [...baseStyle, { backgroundColor: AppColors.primary }];
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = [
      styles.text,
      { 
        fontSize: sizeStyles[size].fontSize,
        lineHeight: sizeStyles[size].fontSize * 1.5
      },
      textStyle,
    ];

    switch (variant) {
      case 'primary':
      case 'gradient':
        return [...baseTextStyle, { color: AppColors.textWhite }];
      case 'secondary':
        return [...baseTextStyle, { color: AppColors.textPrimary }];
      case 'outline':
      case 'ghost':
        return [...baseTextStyle, { color: AppColors.primary }];
      case 'danger':
        return [...baseTextStyle, { color: AppColors.textWhite }];
      default:
        return [...baseTextStyle, { color: AppColors.textWhite }];
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'gradient' || variant === 'danger'
              ? AppColors.textWhite
              : AppColors.primary
          }
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizeStyles[size].fontSize}
              color={
                variant === 'primary' || variant === 'gradient' || variant === 'danger'
                  ? AppColors.textWhite
                  : AppColors.primary
              }
              style={styles.leftIcon}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizeStyles[size].fontSize}
              color={
                variant === 'primary' || variant === 'gradient' || variant === 'danger'
                  ? AppColors.textWhite
                  : AppColors.primary
              }
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </View>
  );

  const accessibilityState: AccessibilityState = {
    disabled: isDisabled,
    busy: loading,
  };

  const ButtonComponent = (
    <Animated.View
      style={{
        transform: [{ scale: scaleValue }],
        opacity: opacityValue,
      }}
    >
      <Pressable
        style={variant !== 'gradient' ? getButtonStyle() : undefined}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        android_ripple={{
          color: variant === 'primary' || variant === 'gradient' || variant === 'danger'
            ? 'rgba(255,255,255,0.2)' 
            : 'rgba(0,0,0,0.1)',
        }}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState}
        testID={testID}
      >
        {variant === 'gradient' ? (
          <LinearGradient
            colors={[gradientColors[0], gradientColors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={getButtonStyle()}
          >
            {renderContent()}
          </LinearGradient>
        ) : (
          renderContent()
        )}
      </Pressable>
    </Animated.View>
  );

  return ButtonComponent;
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});