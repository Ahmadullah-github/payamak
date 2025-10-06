// File: components/chat/MessageContextMenu.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  disabled?: boolean;
}

interface MessageContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onAction: (actionId: string) => void;
  menuItems: MenuItem[];
  accessibilityLabel?: string;
  testID?: string;
}

export default function MessageContextMenu({
  visible,
  onClose,
  onAction,
  menuItems,
  accessibilityLabel,
  testID,
}: MessageContextMenuProps) {
  const { spacing, typography } = useTheme();

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
        accessibilityLabel={accessibilityLabel || "Message context menu"}
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
          {menuItems.map((item) => (
            <Pressable
              key={item.id}
              style={[
                styles.menuItem,
                item.destructive && styles.destructiveItem,
                item.disabled && styles.disabledItem
              ]}
              onPress={() => {
                if (!item.disabled) {
                  onAction(item.id);
                  onClose();
                }
              }}
              disabled={item.disabled}
              accessibilityLabel={item.title}
              accessibilityRole="button"
            >
              <Ionicons 
                name={item.icon} 
                size={20} 
                color={
                  item.destructive ? 
                  AppColors.error : 
                  item.disabled ? 
                  AppColors.textMuted : 
                  AppColors.textPrimary
                } 
              />
              <Text 
                style={[
                  styles.menuItemText, 
                  { 
                    fontSize: typography.body.fontSize,
                    color: item.destructive ? 
                      AppColors.error : 
                      item.disabled ? 
                      AppColors.textMuted : 
                      AppColors.textPrimary
                  }
                ]}
              >
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: AppColors.background,
    borderRadius: 16,
    padding: 8,
    margin: 16,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  destructiveItem: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  disabledItem: {
    opacity: 0.5,
  },
  menuItemText: {
    marginLeft: 12,
    fontWeight: '500',
  },
});