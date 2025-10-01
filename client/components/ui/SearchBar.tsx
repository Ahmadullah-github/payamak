// File: components/ui/SearchBar.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: ViewStyle;
  autoFocus?: boolean;
  variant?: 'default' | 'rounded';
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
  style,
  autoFocus = false,
  variant = 'default',
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleValue, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const containerStyle = [
    styles.container,
    variant === 'rounded' ? styles.rounded : styles.default,
    isFocused && styles.focused,
    style,
  ];

  return (
    <Animated.View
      style={[
        containerStyle,
        { transform: [{ scale: scaleValue }] },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? AppColors.primary : AppColors.textMuted}
        />
      </View>
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={AppColors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      
      {value.length > 0 && (
        <Pressable
          style={styles.clearButton}
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={AppColors.textMuted}
          />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.inputBackground,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  default: {
    borderRadius: 8,
  },
  rounded: {
    borderRadius: 25,
  },
  focused: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textPrimary,
    minHeight: 40,
    paddingVertical: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
});