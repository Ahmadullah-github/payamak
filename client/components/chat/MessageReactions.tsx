// File: components/chat/MessageReactions.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface Reaction {
  emoji: string;
  count: number;
  isOwn?: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onReactionPress?: (emoji: string) => void;
  onAddReaction?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export default function MessageReactions({
  reactions,
  onReactionPress,
  onAddReaction,
  accessibilityLabel,
  testID,
}: MessageReactionsProps) {
  const { spacing, typography } = useTheme();

  if (reactions.length === 0) return null;

  return (
    <View 
      style={styles.container}
      accessibilityLabel={accessibilityLabel || "Message reactions"}
      testID={testID}
    >
      <View style={styles.reactionsContainer}>
        {reactions.map((reaction, index) => (
          <Pressable
            key={index}
            style={[
              styles.reactionButton,
              reaction.isOwn && styles.ownReaction
            ]}
            onPress={() => onReactionPress?.(reaction.emoji)}
            accessibilityLabel={`React with ${reaction.emoji}, ${reaction.count} people reacted`}
            accessibilityRole="button"
          >
            <Text style={styles.emoji}>{reaction.emoji}</Text>
            {reaction.count > 1 && (
              <Text 
                style={[
                  styles.count, 
                  { 
                    fontSize: typography.caption.fontSize,
                    color: reaction.isOwn ? AppColors.textWhite : AppColors.textMuted
                  }
                ]}
              >
                {reaction.count}
              </Text>
            )}
          </Pressable>
        ))}
        
        <Pressable
          style={styles.addButton}
          onPress={onAddReaction}
          accessibilityLabel="Add reaction"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={16} color={AppColors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  ownReaction: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  emoji: {
    fontSize: 16,
    marginRight: 4,
  },
  count: {
    fontWeight: '500',
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
});