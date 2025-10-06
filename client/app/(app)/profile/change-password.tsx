import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { AppColors } from '../../../constants/colors';
import  userApi  from '../../../api';
import { useToast } from '../../../hooks/useToast';
import { Toast, LoadingButton, Input, Card } from '../../../components/ui';
import { useTheme } from '../../../constants/theme';

const ChangePasswordScreen = () => {
  const { user, isLoading } = useAuthStore();
  const { spacing, typography } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleChangePassword = async () => {
    if (isChanging) return;
    
    if (!currentPassword.trim()) {
      showError('Please enter your current password.');
      return;
    }
    
    if (!newPassword.trim()) {
      showError('Please enter a new password.');
      return;
    }
    
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match.');
      return;
    }
    
    setIsChanging(true);
    try {
      const response = await userApi.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim()
      });
      
      if (response.success) {
        showSuccess('Password changed successfully!');
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        showError(response.message || 'Could not change your password. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      showError(error.response?.data?.error || 'Could not change your password. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  if (isLoading || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Change Password' }} />
      
      <Card style={styles.formCard}>
        <Text style={[styles.infoText, { 
          fontSize: typography.body.fontSize,
          lineHeight: typography.body.lineHeight,
          color: AppColors.textMuted,
          marginBottom: 24
        }]}>
          Enter your current password and a new password to change your account password.
        </Text>
        
        <Input
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter your current password"
          secureTextEntry
          showPasswordToggle
          accessibilityLabel="Current password input"
        />
        
        <Input
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter your new password"
          secureTextEntry
          showPasswordToggle
          accessibilityLabel="New password input"
        />
        
        <Input
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your new password"
          secureTextEntry
          showPasswordToggle
          accessibilityLabel="Confirm new password input"
        />
      </Card>

      <View style={styles.footer}>
        <LoadingButton
          title="Change Password"
          onPress={handleChangePassword}
          loading={isChanging}
          style={styles.button}
        />
      </View>
      
      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        position="top"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  formCard: {
    margin: 16,
    padding: 16,
  },
  infoText: {
    textAlign: 'center',
  },
  footer: {
    padding: 16,
  },
  button: {
    backgroundColor: AppColors.primary,
  },
});

export default ChangePasswordScreen;