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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';

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
}: ErrorModalProps) {
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
        return '#FF9500';
      case 'info':
        return AppColors.primary;
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
      <View style={styles.overlay}>
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
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
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
              >
                <Text style={styles.secondaryButtonText}>
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
            >
              <Text style={styles.primaryButtonText}>
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
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textWhite,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
});