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
  AccessibilityState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
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
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export default function Input({
  label,
  error,
  helperText,
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
  accessibilityLabel,
  accessibilityHint,
  testID,
  secureTextEntry,
  ...textInputProps
}: InputProps) {
  const { spacing, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));

  const sizeStyles = {
    small: { height: 40, fontSize: typography.bodySmall.fontSize, paddingHorizontal: spacing.sm },
    medium: { height: 48, fontSize: typography.body.fontSize, paddingHorizontal: spacing.md },
    large: { height: 56, fontSize: typography.bodyLarge.fontSize, paddingHorizontal: spacing.lg },
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
      leftIcon && { paddingLeft: spacing.xl + spacing.sm },
      (rightIcon || showPasswordToggle) && { paddingRight: spacing.xl + spacing.sm },
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
          <View style={[styles.iconContainer, { left: spacing.md }]}>
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
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          testID={testID}
          {...textInputProps}
        />
        
        {(rightIcon || showPasswordToggle) && (
          <Pressable
            style={[styles.iconContainer, { right: spacing.md }]}
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
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error ? styles.errorText : styles.helperTextStyle]}>
          {error || helperText}
        </Text>
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
  iconContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  errorText: {
    color: AppColors.error,
  },
  helperTextStyle: {
    color: AppColors.textMuted,
  },
});