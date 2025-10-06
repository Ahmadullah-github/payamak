// File: components/chat/MediaPreview.tsx
import React from 'react';
import { View, Image, Pressable, StyleSheet,Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface MediaPreviewProps {
  uri: string;
  type: 'image' | 'video' | 'audio';
  caption?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export default function MediaPreview({
  uri,
  type,
  caption,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: MediaPreviewProps) {
  const { spacing } = useTheme();

  const renderMediaContent = () => {
    switch (type) {
      case 'image':
        return (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        );
      case 'video':
        return (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.playButton}>
              <Ionicons name="play" size={24} color={AppColors.textWhite} />
            </View>
          </View>
        );
      case 'audio':
        return (
          <View style={styles.mediaContainer}>
            <View style={styles.audioIconContainer}>
              <Ionicons name="musical-note" size={32} color={AppColors.primary} />
            </View>
            {caption && (
              <View style={styles.audioInfo}>
                <Ionicons name="musical-notes" size={16} color={AppColors.textMuted} />
              </View>
            )}
          </View>
        );
      default:
        return (
          <View style={styles.mediaContainer}>
            <Ionicons name="document" size={32} color={AppColors.textMuted} />
          </View>
        );
    }
  };

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={accessibilityLabel || `Media ${type}`}
      accessibilityRole={type === 'image' ? 'image' : 'button'}
      testID={testID}
    >
      {renderMediaContent()}
      {caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{caption}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: AppColors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  playButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioIconContainer: {
    padding: 16,
    borderRadius: 30,
    backgroundColor: AppColors.surface,
  },
  audioInfo: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  captionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: AppColors.messageReceived,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  caption: {
    color: AppColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
});