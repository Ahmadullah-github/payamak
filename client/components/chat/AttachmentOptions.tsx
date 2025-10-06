// File: components/chat/AttachmentOptions.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface AttachmentOption {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface AttachmentOptionsProps {
  visible: boolean;
  onClose: () => void;
  onOptionSelect: (optionId: string) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export default function AttachmentOptions({
  visible,
  onClose,
  onOptionSelect,
  accessibilityLabel,
  testID,
}: AttachmentOptionsProps) {
  const { spacing, typography } = useTheme();

  const attachmentOptions: AttachmentOption[] = [
    { id: 'camera', title: 'Camera', icon: 'camera', color: AppColors.primary },
    { id: 'photo', title: 'Photo & Video', icon: 'image', color: AppColors.green },
    { id: 'document', title: 'Document', icon: 'document', color: AppColors.blue },
    { id: 'audio', title: 'Audio', icon: 'musical-note', color: AppColors.purple },
    { id: 'location', title: 'Location', icon: 'location', color: AppColors.red },
    { id: 'contact', title: 'Contact', icon: 'person', color: AppColors.yellow },
  ];

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
        accessibilityLabel={accessibilityLabel || "Attachment options"}
        testID={testID}
      >
        <View 
          style={styles.container}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            // Prevent touch propagation to underlying components
            e.stopPropagation();
          }}
        >
          <View style={styles.optionsContainer}>
            {attachmentOptions.map((option) => (
              <Pressable
                key={option.id}
                style={styles.optionButton}
                onPress={() => {
                  onOptionSelect(option.id);
                  onClose();
                }}
                accessibilityLabel={option.title}
                accessibilityRole="button"
              >
                <View 
                  style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={option.color} 
                  />
                </View>
                <Text 
                  style={[styles.optionText, { 
                    fontSize: typography.caption.fontSize,
                    lineHeight: typography.caption.lineHeight,
                    color: AppColors.textPrimary
                  }]}
                >
                  {option.title}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <Pressable
            style={styles.cancelButton}
            onPress={onClose}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Text 
              style={[styles.cancelText, { 
                fontSize: typography.body.fontSize,
                fontWeight: typography.body.fontWeight,
                lineHeight: typography.body.lineHeight,
                color: AppColors.textPrimary
              }]}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 20,
  },
  optionButton: {
    alignItems: 'center',
    margin: 8,
    width: 80,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.divider,
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '600',
  },
});