// File: components/chat/FileAttachment.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { formatFileSize } from '../ui/utils';
import { useTheme } from '../../constants/theme';

interface FileAttachmentProps {
  fileName: string;
  fileSize: number;
  fileType: string;
  onDownload?: () => void;
  onPreview?: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
  accessibilityLabel?: string;
  testID?: string;
}

export default function FileAttachment({
  fileName,
  fileSize,
  fileType,
  onDownload,
  onPreview,
  isDownloading = false,
  downloadProgress = 0,
  accessibilityLabel,
  testID,
}: FileAttachmentProps) {
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
    <Pressable
      style={styles.container}
      onPress={onPreview || onDownload}
      accessibilityLabel={accessibilityLabel || `File attachment: ${fileName}`}
      accessibilityRole="button"
      testID={testID}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getFileIcon() as any} 
          size={24} 
          color={getIconColor()} 
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.fileName, { 
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight
          }]} 
          numberOfLines={1}
        >
          {fileName}
        </Text>
        <Text 
          style={[styles.fileInfo, { 
            fontSize: typography.caption.fontSize,
            lineHeight: typography.caption.lineHeight
          }]}
        >
          {formatFileSize(fileSize)} • {fileType}
        </Text>
      </View>
      
      <Pressable
        style={styles.actionButton}
        onPress={onDownload}
        accessibilityLabel="Download file"
        accessibilityRole="button"
        disabled={isDownloading}
      >
        {isDownloading ? (
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${downloadProgress}%` }
              ]} 
            />
          </View>
        ) : (
          <Ionicons name="download" size={20} color={AppColors.primary} />
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  iconContainer: {
    marginRight: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: AppColors.inputBackground,
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    color: AppColors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileInfo: {
    color: AppColors.textMuted,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  progressContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: AppColors.primary,
  },
});