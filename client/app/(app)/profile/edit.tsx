import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { AppColors } from '../../../constants/colors';
import { userApi }  from '../../../api/userApi';
import { useToast } from '../../../hooks/useToast';
import { Toast, LoadingButton, Input, Card, Avatar } from '../../../components/ui';
import { useTheme } from '../../../constants/theme';

const EditProfileScreen = () => {
  const { user, isLoading, updateUserProfile } = useAuthStore();
  const { spacing, typography } = useTheme();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [status, setStatus] = useState(user?.status || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleSaveChanges = async () => {
    if (isSaving) return;
    
    if (!fullName.trim()) {
      showError('Please enter a valid name.');
      return;
    }
    
    if (!username.trim()) {
      showError('Please enter a valid username.');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await userApi.updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
        status: status.trim()
      });
      
      if (response.success) {
        updateUserProfile(response.user);
        showSuccess('Profile updated successfully!');
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        showError(response.error || 'Could not save your changes. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showError(error.response?.data?.error || 'Could not save your changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    router.push({pathname: '/(app)/profile/change-password'});
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Please type "DELETE" to confirm account deletion:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: async () => {
                    // TODO: Implement account deletion
                    showError('Account deletion is not implemented yet.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      
      <View style={styles.avatarSection}>
        <Avatar 
          name={fullName || user.fullName} 
          size="xlarge" 
        />
        <TouchableOpacity style={styles.changeAvatarButton}>
          <Text style={[styles.changeAvatarText, { 
            fontSize: typography.bodySmall.fontSize,
            lineHeight: typography.bodySmall.lineHeight
          }]}>
            Change Profile Photo
          </Text>
        </TouchableOpacity>
      </View>
      
      <Card style={styles.formCard}>
        <Input
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          accessibilityLabel="Full name input"
        />
        
        <Input
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Enter your username"
          accessibilityLabel="Username input"
        />
        
        <Input
          label="Status"
          value={status}
          onChangeText={setStatus}
          placeholder="What's your status?"
          accessibilityLabel="Status input"
        />
      </Card>
      
      <Card style={styles.actionsCard}>
        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={handleChangePassword}
        >
          <Text style={[styles.actionText, { 
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight
          }]}>
            Change Password
          </Text>
          <Text style={[styles.actionSubtitle, { 
            fontSize: typography.caption.fontSize,
            lineHeight: typography.caption.lineHeight
          }]}>
            Update your password
          </Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={handleDeleteAccount}
        >
          <Text style={[styles.actionText, styles.dangerText, { 
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight
          }]}>
            Delete Account
          </Text>
          <Text style={[styles.actionSubtitle, { 
            fontSize: typography.caption.fontSize,
            lineHeight: typography.caption.lineHeight
          }]}>
            Permanently delete your account
          </Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.footer}>
        <LoadingButton
          title="Save Changes"
          onPress={handleSaveChanges}
          loading={isSaving}
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
  avatarSection: {
    alignItems: 'center',
    padding: 32,
  },
  changeAvatarButton: {
    marginTop: 16,
  },
  changeAvatarText: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  formCard: {
    margin: 16,
    padding: 16,
  },
  actionsCard: {
    margin: 16,
    padding: 16,
  },
  actionItem: {
    paddingVertical: 12,
  },
  actionText: {
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  dangerText: {
    color: AppColors.error,
  },
  actionSubtitle: {
    color: AppColors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.divider,
    marginVertical: 8,
  },
  footer: {
    padding: 16,
  },
  button: {
    backgroundColor: AppColors.primary,
  },
});

export default EditProfileScreen;