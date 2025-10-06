// File: components/chat/AdvancedTypingIndicator.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';
import { Avatar } from '../ui';

interface TypingUser {
  id: string;
  name: string;
}

interface AdvancedTypingIndicatorProps {
  typingUsers: TypingUser[];
  isGroupChat?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export default function AdvancedTypingIndicator({
  typingUsers,
  isGroupChat = false,
  accessibilityLabel,
  testID,
}: AdvancedTypingIndicatorProps) {
  const { spacing, typography } = useTheme();
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(dotAnim1, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.timing(dotAnim2, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.timing(dotAnim3, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.timing(dotAnim1, { 
          toValue: 0, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.timing(dotAnim2, { 
          toValue: 0, 
          duration: 300, 
          useNativeDriver: true 
        }),
        Animated.timing(dotAnim3, { 
          toValue: 0, 
          duration: 300, 
          useNativeDriver: true 
        }),
      ]).start(() => animate());
    };
    animate();
    
    return () => {
      dotAnim1.stopAnimation();
      dotAnim2.stopAnimation();
      dotAnim3.stopAnimation();
    };
  }, []);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  return (
    <View 
      style={styles.container}
      accessibilityLabel={accessibilityLabel || getTypingText()}
      testID={testID}
    >
      {isGroupChat && typingUsers.length === 1 && (
        <View style={styles.avatarContainer}>
          <Avatar 
            name={typingUsers[0].name} 
            size="small" 
            showOnlineIndicator={false}
          />
        </View>
      )}
      
      <View style={styles.bubble}>
        {isGroupChat && typingUsers.length > 1 && (
          <Text 
            style={[styles.names, { 
              fontSize: typography.caption.fontSize,
              lineHeight: typography.caption.lineHeight,
              color: AppColors.textMuted,
              marginBottom: 4
            }]}
          >
            {typingUsers.map(u => u.name).join(', ')}
          </Text>
        )}
        
        <View style={styles.typingContainer}>
          <Text 
            style={[styles.typingText, { 
              fontSize: typography.bodySmall.fontSize,
              lineHeight: typography.bodySmall.lineHeight,
              color: AppColors.textMuted,
              marginRight: 8
            }]}
          >
            {getTypingText()}
          </Text>
          <View style={styles.dotsContainer}>
            <Animated.View 
              style={[
                styles.dot, 
                { 
                  opacity: dotAnim1,
                  backgroundColor: AppColors.textMuted
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot, 
                { 
                  opacity: dotAnim2,
                  backgroundColor: AppColors.textMuted
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot, 
                { 
                  opacity: dotAnim3,
                  backgroundColor: AppColors.textMuted
                }
              ]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  bubble: {
    maxWidth: '75%',
    minWidth: '20%',
    backgroundColor: AppColors.messageReceived,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.divider,
    elevation: 1,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  names: {
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});