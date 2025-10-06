// File: components/ui/LoadingButton.tsx
import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityState,
} from 'react-native';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface LoadingButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export default function LoadingButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: LoadingButtonProps) {
  const { spacing, typography } = useTheme();
  const isDisabled = disabled || loading;

  const accessibilityState: AccessibilityState = {
    disabled: isDisabled,
    busy: loading,
  };

  return (
    <Pressable
      style={[
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        isDisabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? AppColors.textWhite : AppColors.primary} 
        />
      ) : (
        <Text 
          style={[
            styles.buttonText,
            { 
              fontSize: typography.button.fontSize,
              fontWeight: typography.button.fontWeight,
              lineHeight: typography.button.lineHeight
            },
            variant === 'primary' ? styles.primaryText : styles.secondaryText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: AppColors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    textAlign: 'center',
  },
  primaryText: {
    color: AppColors.textWhite,
  },
  secondaryText: {
    color: AppColors.primary,
  },
});