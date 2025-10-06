// File: components/chat/TypingIndicator.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';
import { Avatar } from '../ui';

interface TypingIndicatorProps {
  userId?: string;
  userName?: string;
  isGroupChat?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export default function TypingIndicator({
  userId,
  userName,
  isGroupChat = false,
  accessibilityLabel,
  testID,
}: TypingIndicatorProps) {
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

  return (
    <View 
      style={[styles.container, isGroupChat && styles.groupContainer]}
      accessibilityLabel={accessibilityLabel || `${userName || 'Someone'} is typing`}
      testID={testID}
    >
      {isGroupChat && userId && (
        <View style={styles.avatarContainer}>
          <Avatar 
            name={userName} 
            size="small" 
            showOnlineIndicator={false}
          />
        </View>
      )}
      
      <View style={styles.bubble}>
        {isGroupChat && userName && (
          <Text 
            style={[styles.senderName, { 
              fontSize: typography.caption.fontSize,
              lineHeight: typography.caption.lineHeight
            }]}
          >
            {userName}
          </Text>
        )}
        
        <View style={styles.typingContainer}>
          <Text 
            style={[styles.typingText, { 
              fontSize: typography.bodySmall.fontSize,
              lineHeight: typography.bodySmall.lineHeight
            }]}
          >
            typing
          </Text>
          <View style={styles.dotsContainer}>
            <Animated.View 
              style={[
                styles.dot, 
                { 
                  opacity: dotAnim1,
                  backgroundColor: isGroupChat ? 
                    AppColors.textMuted : 
                    AppColors.textWhite
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot, 
                { 
                  opacity: dotAnim2,
                  backgroundColor: isGroupChat ? 
                    AppColors.textMuted : 
                    AppColors.textWhite
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot, 
                { 
                  opacity: dotAnim3,
                  backgroundColor: isGroupChat ? 
                    AppColors.textMuted : 
                    AppColors.textWhite
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
  groupContainer: {
    alignItems: 'flex-end',
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
  senderName: {
    color: AppColors.textMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: AppColors.textMuted,
    marginRight: 8,
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