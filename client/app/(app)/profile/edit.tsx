import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { AppColors } from '../../../constants/colors';
import axios from 'axios';
import { API_URL } from '../../../config';
import { useToast } from '../../../hooks/useToast';
import { Toast, LoadingButton } from '../../../components/ui';

const EditProfileScreen = () => {
  const { user, isLoading, updateUserProfile } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleSaveChanges = async () => {
    if (isSaving) return;
    
    if (!fullName.trim()) {
      showError('Please enter a valid name.');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await axios.put(`${API_URL}/users`, { fullName });
      updateUserProfile(response.data);
      showSuccess('Profile updated successfully!');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Failed to update profile:', error);
      showError('Could not save your changes. Please try again.');
    } finally {
      setIsSaving(false);
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
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'ویرایش پروفایل' }} />
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>نام کامل</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="نام کامل خود را وارد کنید"
        />
      </View>

      <LoadingButton
        title="ذخیره تغییرات"
        onPress={handleSaveChanges}
        loading={isSaving}
        style={styles.button}
        textStyle={styles.buttonText}
      />
      
      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        position="top"
      />
    </View>
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
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textWhite,
  },
});

export default EditProfileScreen;
