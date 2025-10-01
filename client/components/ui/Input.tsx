// File: components/ui/Input.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  showPasswordToggle?: boolean;
  required?: boolean;
}

export default function Input({
  label,
  error,
  variant = 'filled',
  size = 'medium',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  showPasswordToggle = false,
  required = false,
  secureTextEntry,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));

  const sizeStyles = {
    small: { height: 40, fontSize: 14, paddingHorizontal: 12 },
    medium: { height: 48, fontSize: 16, paddingHorizontal: 16 },
    large: { height: 56, fontSize: 18, paddingHorizontal: 20 },
  };

  const actualSecureTextEntry = showPasswordToggle ? !showPassword : secureTextEntry;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleValue, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const getInputStyle = () => {
    const baseStyle = [
      styles.input,
      sizeStyles[size],
      variant === 'outlined' ? styles.outlined : styles.filled,
      leftIcon && { paddingLeft: 48 },
      (rightIcon || showPasswordToggle) && { paddingRight: 48 },
      isFocused && styles.focused,
      error && styles.error,
      inputStyle,
    ];
    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? AppColors.primary : AppColors.textMuted}
            />
          </View>
        )}
        
        <TextInput
          style={getInputStyle()}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={actualSecureTextEntry}
          placeholderTextColor={AppColors.textMuted}
          {...textInputProps}
        />
        
        {(rightIcon || showPasswordToggle) && (
          <Pressable
            style={styles.rightIconContainer}
            onPress={showPasswordToggle ? togglePassword : onRightIconPress}
          >
            <Ionicons
              name={
                showPasswordToggle
                  ? showPassword
                    ? 'eye-off'
                    : 'eye'
                  : rightIcon!
              }
              size={20}
              color={isFocused ? AppColors.primary : AppColors.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: AppColors.error,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderRadius: 12,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  filled: {
    backgroundColor: AppColors.inputBackground,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  focused: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
  },
  error: {
    borderColor: AppColors.error,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
    fontWeight: '500',
  },
});