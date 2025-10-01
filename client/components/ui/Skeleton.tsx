// File: components/ui/Skeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { AppColors } from '../../constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  animationDuration?: number;
}

export default function Skeleton({
  width = '100%',
  height = 16,
  borderRadius,
  style,
  variant = 'text',
  animationDuration = 1500,
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: animationDuration / 2,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: animationDuration / 2,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue, animationDuration]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return { borderRadius: 4, height: 16 };
      case 'rectangular':
        return { borderRadius: 0 };
      case 'circular':
        return { borderRadius: Math.max(height, typeof width === 'number' ? width : 40) / 2 };
      case 'rounded':
        return { borderRadius: 8 };
      default:
        return { borderRadius: 4 };
    }
  };

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [AppColors.inputBackground, AppColors.border],
  });

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          backgroundColor,
          borderRadius: borderRadius !== undefined ? borderRadius : variantStyles.borderRadius,
        } as ViewStyle | any,
        style,
      ]}
    />
  );
}

// Predefined skeleton components for common use cases
export const SkeletonText = ({ lines = 3, ...props }: { lines?: number } & Partial<SkeletonProps>) => (
  <View>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        width={index === lines - 1 ? '70%' : '100%'}
        height={16}
        style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
        variant="text"
        {...props}
      />
    ))}
  </View>
);

export const SkeletonAvatar = ({ size = 48, ...props }: { size?: number } & Partial<SkeletonProps>) => (
  <Skeleton
    width={size}
    height={size}
    variant="circular"
    {...props}
  />
);

export const SkeletonCard = ({ ...props }: Partial<SkeletonProps>) => (
  <View style={styles.cardContainer}>
    <View style={styles.cardHeader}>
      <SkeletonAvatar size={40} />
      <View style={styles.cardHeaderText}>
        <Skeleton width="60%" height={16} variant="text" />
        <Skeleton width="40%" height={12} variant="text" style={{ marginTop: 4 }} />
      </View>
    </View>
    <SkeletonText lines={2} style={{ marginTop: 12 }} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: AppColors.inputBackground,
  },
  cardContainer: {
    padding: 16,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
});