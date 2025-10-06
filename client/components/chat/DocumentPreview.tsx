// File: components/chat/DocumentPreview.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { formatFileSize } from '../ui/utils';
import { useTheme } from '../../constants/theme';

interface DocumentPreviewProps {
  fileName: string;
  fileSize: number;
  fileType: string;
  onClose: () => void;
  onSend: () => void;
  caption?: string;
  onCaptionChange?: (caption: string) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export default function DocumentPreview({
  fileName,
  fileSize,
  fileType,
  onClose,
  onSend,
  caption,
  onCaptionChange,
  accessibilityLabel,
  testID,
}: DocumentPreviewProps) {
  const { spacing, typography } = useTheme();

  const getFileIcon = () => {
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('video')) return 'videocam';
    if (fileType.includes('audio')) return 'musical-note';
    if (fileType.includes('pdf')) return 'document-text';
    if (fileType.includes('zip') || fileType.includes('archive')) return 'archive';
    return 'document';
  };

  const getIconColor = () => {
    if (fileType.includes('image')) return AppColors.green;
    if (fileType.includes('video')) return AppColors.blue;
    if (fileType.includes('audio')) return AppColors.purple;
    if (fileType.includes('pdf')) return AppColors.red;
    return AppColors.textMuted;
  };

  return (
    <View 
      style={styles.container}
      accessibilityLabel={accessibilityLabel || "Document preview"}
      testID={testID}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close preview"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={AppColors.textPrimary} />
        </Pressable>
        <Text 
          style={[styles.title, { 
            fontSize: typography.heading3.fontSize,
            fontWeight: typography.heading3.fontWeight,
            lineHeight: typography.heading3.lineHeight,
            color: AppColors.textPrimary
          }]}
        >
          Send Document
        </Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.fileContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}20` }]}>
            <Ionicons 
              name={getFileIcon() as any} 
              size={48} 
              color={getIconColor()} 
            />
          </View>
          
          <Text 
            style={[styles.fileName, { 
              fontSize: typography.body.fontSize,
              fontWeight: typography.body.fontWeight,
              lineHeight: typography.body.lineHeight,
              color: AppColors.textPrimary
            }]}
            numberOfLines={1}
          >
            {fileName}
          </Text>
          
          <Text 
            style={[styles.fileInfo, { 
              fontSize: typography.bodySmall.fontSize,
              lineHeight: typography.bodySmall.lineHeight,
              color: AppColors.textMuted
            }]}
          >
            {formatFileSize(fileSize)} • {fileType}
          </Text>
        </View>
      </View>
      
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.sendButton}
          onPress={onSend}
          accessibilityLabel="Send document"
          accessibilityRole="button"
        >
          <Ionicons name="send" size={24} color={AppColors.textWhite} />
          <Text 
            style={[styles.sendButtonText, { 
              fontSize: typography.button.fontSize,
              fontWeight: typography.button.fontWeight,
              lineHeight: typography.button.lineHeight,
              color: AppColors.textWhite,
              marginLeft: 8
            }]}
          >
            Send
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  closeButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fileContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  fileName: {
    marginBottom: 8,
    textAlign: 'center',
  },
  fileInfo: {
    textAlign: 'center',
  },
  bottomBar: {
    padding: 20,
    alignItems: 'flex-end',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
  },
  sendButtonText: {
    textAlign: 'center',
  },
});