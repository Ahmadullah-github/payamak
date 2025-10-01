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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '../../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
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
}: ButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    medium: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16 },
    large: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 },
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
      default:
        return [...baseStyle, { backgroundColor: AppColors.primary }];
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = [
      styles.text,
      { fontSize: sizeStyles[size].fontSize },
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
            variant === 'primary' || variant === 'gradient'
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
                variant === 'primary' || variant === 'gradient'
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
                variant === 'primary' || variant === 'gradient'
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
          color: variant === 'primary' || variant === 'gradient' 
            ? 'rgba(255,255,255,0.2)' 
            : 'rgba(0,0,0,0.1)',
        }}
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
    minHeight: 48,
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