import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import React from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { AppColors } from '../../../constants/colors';
import { Octicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    // After logout, the auth state will change, and the user will be redirected
    // automatically by the logic in the root layout `app/(app)/_layout.tsx`.
  };

  const handleEditProfile = () => {
    // Navigate to an edit profile screen (to be created)
    router.push({pathname: '/(app)/profile/edit'});
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
      <Stack.Screen options={{ title: 'پروفایل' }} />
      
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.fullName}>{user.fullName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <Octicons name="pencil" size={20} color={AppColors.textPrimary} />
          <Text style={styles.menuItemText}>ویرایش پروفایل</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Octicons name="sign-out" size={20} color={AppColors.textWhite} />
          <Text style={styles.buttonText}>خروج از حساب</Text>
        </TouchableOpacity>
      </View>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: AppColors.textWhite,
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  username: {
    fontSize: 16,
    color: AppColors.textMuted,
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    color: AppColors.textPrimary,
  },
  footer: {
    paddingBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: AppColors.accent,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textWhite,
    marginLeft: 8,
  },
});

export default ProfileScreen;
