// File: components/ui/ErrorModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  AccessibilityRole,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  primaryAction?: {
    text: string;
    onPress: () => void;
  };
  secondaryAction?: {
    text: string;
    onPress: () => void;
  };
  onClose: () => void;
  type?: 'error' | 'warning' | 'info';
  accessibilityLabel?: string;
  testID?: string;
}

const { width } = Dimensions.get('window');

export default function ErrorModal({
  visible,
  title,
  message,
  primaryAction,
  secondaryAction,
  onClose,
  type = 'error',
  accessibilityLabel,
  testID,
}: ErrorModalProps) {
  const { spacing, typography } = useTheme();

  const getIconName = () => {
    switch (type) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'alert-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'error':
        return AppColors.error;
      case 'warning':
        return AppColors.warning;
      case 'info':
        return AppColors.info;
      default:
        return AppColors.error;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View 
        style={styles.overlay}
        accessibilityLabel={accessibilityLabel || title}
        testID={testID}
      >
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getIconName()}
              size={48}
              color={getIconColor()}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { 
              fontSize: typography.heading3.fontSize,
              fontWeight: typography.heading3.fontWeight,
              lineHeight: typography.heading3.lineHeight
            }]}>
              {title}
            </Text>
            <Text style={[styles.message, { 
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight
            }]}>
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {secondaryAction && (
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  secondaryAction.onPress();
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={secondaryAction.text}
              >
                <Text style={[styles.secondaryButtonText, { 
                  fontSize: typography.button.fontSize,
                  fontWeight: typography.button.fontWeight,
                  lineHeight: typography.button.lineHeight
                }]}>
                  {secondaryAction.text}
                </Text>
              </Pressable>
            )}
            
            <Pressable
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: getIconColor() },
              ]}
              onPress={() => {
                if (primaryAction) {
                  primaryAction.onPress();
                }
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={primaryAction?.text || 'OK'}
            >
              <Text style={[styles.primaryButtonText, { 
                fontSize: typography.button.fontSize,
                fontWeight: typography.button.fontWeight,
                lineHeight: typography.button.lineHeight
              }]}>
                {primaryAction?.text || 'OK'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: AppColors.background,
    borderRadius: 16,
    padding: 24,
    width: width - 40,
    maxWidth: 400,
    elevation: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: AppColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: AppColors.error,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  primaryButtonText: {
    color: AppColors.textWhite,
  },
  secondaryButtonText: {
    color: AppColors.textSecondary,
  },
});