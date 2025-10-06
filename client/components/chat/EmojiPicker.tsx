// File: components/chat/EmojiPicker.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  accessibilityLabel?: string;
  testID?: string;
}

const commonEmojis = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '👏',
  '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿',
  '❤️‍🔥', '💯', '✅', '❌', '🤔', '😍', '🥰', '🤩',
  '🥳', '😭', '😤', '🤯', '🥶', '😱', '🤗', '🤭',
  '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮‍💨', '😰', '😨', '😱', ' Cbd', '😳',
  '🤪', '😵', '🥴', '😠', '😡', '🤬', '😷', '🤒',
  '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵‍💫'
];

export default function EmojiPicker({
  visible,
  onClose,
  onEmojiSelect,
  accessibilityLabel,
  testID,
}: EmojiPickerProps) {
  const { spacing } = useTheme();
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  const handleEmojiPress = (emoji: string) => {
    // Add to recent emojis (limit to 8)
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 8);
    });
    
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable 
        style={styles.overlay} 
        onPress={onClose}
        accessibilityLabel={accessibilityLabel || "Emoji picker"}
        testID={testID}
      >
        <Pressable 
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Reactions</Text>
            <Pressable 
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close emoji picker"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={AppColors.textPrimary} />
            </Pressable>
          </View>
          
          {recentEmojis.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <View style={styles.emojiRow}>
                {recentEmojis.map((emoji, index) => (
                  <Pressable
                    key={index}
                    style={styles.emojiButton}
                    onPress={() => handleEmojiPress(emoji)}
                    accessibilityLabel={`Select ${emoji}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          
          <ScrollView 
            style={styles.emojisContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Emojis</Text>
              <View style={styles.emojiGrid}>
                {commonEmojis.map((emoji, index) => (
                  <Pressable
                    key={index}
                    style={styles.emojiButton}
                    onPress={() => handleEmojiPress(emoji)}
                    accessibilityLabel={`Select ${emoji}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: AppColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textMuted,
    marginBottom: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojisContainer: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 12,
  },
  emoji: {
    fontSize: 24,
  },
});