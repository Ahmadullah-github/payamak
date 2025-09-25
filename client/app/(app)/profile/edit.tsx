import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { AppColors } from '../../../constants/colors';
import axios from 'axios';
import { API_URL } from '../../../config';

const EditProfileScreen = () => {
  const { user, isLoading, updateUserProfile } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const response = await axios.put(`${API_URL}/users`, { fullName });
      updateUserProfile(response.data);
      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Could not save your changes. Please try again.');
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

      <TouchableOpacity style={styles.button} onPress={handleSaveChanges} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator color={AppColors.textWhite} />
        ) : (
          <Text style={styles.buttonText}>ذخیره تغییرات</Text>
        )}
      </TouchableOpacity>
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
