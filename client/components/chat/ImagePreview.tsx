// File: components/chat/ImagePreview.tsx
import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface ImagePreviewProps {
  uri: string;
  onClose: () => void;
  onSend: () => void;
  caption?: string;
  onCaptionChange?: (caption: string) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export default function ImagePreview({
  uri,
  onClose,
  onSend,
  caption,
  onCaptionChange,
  accessibilityLabel,
  testID,
}: ImagePreviewProps) {
  const { spacing } = useTheme();

  return (
    <View 
      style={styles.container}
      accessibilityLabel={accessibilityLabel || "Image preview"}
      testID={testID}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
        />
        
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close preview"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={AppColors.textWhite} />
        </Pressable>
      </View>
      
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.sendButton}
          onPress={onSend}
          accessibilityLabel="Send image"
          accessibilityRole="button"
        >
          <Ionicons name="send" size={24} color={AppColors.textWhite} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sendButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
  },
});