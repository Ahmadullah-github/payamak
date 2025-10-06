// File: components/ui/Divider.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface DividerProps {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  // NOTE: variant is kept for API compatibility, but only 'solid' is supported reliably
  variant?: 'solid' | 'dashed' | 'dotted';
  thickness?: number;
  color?: string;
  style?: ViewStyle;
  spacing?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export default function Divider({
  label,
  orientation = 'horizontal',
  variant = 'solid', // Only 'solid' is reliably supported
  thickness = 1,
  color = AppColors.divider,
  style,
  spacing = 16,
  accessibilityLabel,
  testID,
}: DividerProps) {
  const { typography } = useTheme();
  const isHorizontal = orientation === 'horizontal';

  // Warn in development if non-solid variant is used
  if (__DEV__ && variant !== 'solid') {
    console.warn('Divider: "dashed" and "dotted" variants are not reliably supported in React Native. Falling back to "solid".');
  }

  if (label && isHorizontal) {
    return (
      <View 
        style={[styles.labelContainer, { marginVertical: spacing / 2 }, style]}
        accessibilityLabel={accessibilityLabel || "Divider with label"}
        testID={testID}
      >
        <View style={[styles.line, { backgroundColor: color, height: thickness }]} />
        <Text style={[styles.label, { 
          color: AppColors.textMuted,
          fontSize: typography.bodySmall.fontSize,
          fontWeight: typography.bodySmall.fontWeight
        }]}>
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: color, height: thickness }]} />
      </View>
    );
  }

  if (isHorizontal) {
    return (
      <View
        style={[
          {
            height: thickness,
            backgroundColor: color,
            marginVertical: spacing / 2,
          },
          style,
        ]}
        accessibilityLabel={accessibilityLabel || "Divider"}
        testID={testID}
      />
    );
  } else {
    // Vertical divider
    return (
      <View
        style={[
          {
            width: thickness,
            backgroundColor: color,
            marginHorizontal: spacing / 2,
            alignSelf: 'stretch', // ensures it takes full height of parent
          },
          style,
        ]}
        accessibilityLabel={accessibilityLabel || "Vertical divider"}
        testID={testID}
      />
    );
  }
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
  },
  label: {
    paddingHorizontal: 16,
    fontWeight: '500',
  },
});