import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { AppColors } from '../../../constants/colors';
import { Octicons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../constants/theme';
import { Avatar } from '../../../components/ui';
import  OnlineStatusIndicator  from '../../../components/chat/OnlineStatusIndicator';

const ProfileScreen = () => {
  const { user, logout, isLoading } = useAuthStore();
  const { spacing, typography } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              // After logout, the auth state will change, and the user will be redirected
              // automatically by the logic in the root layout `app/(app)/_layout.tsx`.
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push({pathname: '/(app)/profile/edit'});
  };

  const handleSettings = () => {
    router.push({pathname: '/(app)/settings'});
  };

  const handleAbout = () => {
    router.push({pathname: '/(app)/about'});
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
      <Stack.Screen options={{ title: 'Profile' }} />
      
      <View style={styles.profileHeader}>
        <Avatar 
          name={user.fullName} 
          size="xlarge" 
          showOnlineIndicator 
          isOnline 
        />
        <Text style={[styles.fullName, { 
          fontSize: typography.heading2.fontSize,
          fontWeight: typography.heading2.fontWeight,
          lineHeight: typography.heading2.lineHeight
        }]}>
          {user.fullName}
        </Text>
        <View style={styles.usernameContainer}>
          <Text style={[styles.username, { 
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight
          }]}>
            @{user.username}
          </Text>
          <OnlineStatusIndicator isOnline showText size="small" />
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <View style={styles.menuItemIcon}>
            <Octicons name="pencil" size={20} color={AppColors.textPrimary} />
          </View>
          <Text style={[styles.menuItemText, { 
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight
          }]}>
            Edit Profile
          </Text>
          <Ionicons name="chevron-forward" size={20} color={AppColors.textMuted} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
          <View style={styles.menuItemIcon}>
            <Ionicons name="settings" size={20} color={AppColors.textPrimary} />
          </View>
          <Text style={[styles.menuItemText, { 
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight
          }]}>
            Settings
          </Text>
          <Ionicons name="chevron-forward" size={20} color={AppColors.textMuted} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
          <View style={styles.menuItemIcon}>
            <Ionicons name="information-circle" size={20} color={AppColors.textPrimary} />
          </View>
          <Text style={[styles.menuItemText, { 
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight
          }]}>
            About
          </Text>
          <Ionicons name="chevron-forward" size={20} color={AppColors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={AppColors.textWhite} />
          ) : (
            <>
              <Octicons name="sign-out" size={20} color={AppColors.textWhite} />
              <Text style={[styles.buttonText, { 
                fontSize: typography.button.fontSize,
                fontWeight: typography.button.fontWeight,
                lineHeight: typography.button.lineHeight,
                marginLeft: 8
              }]}>
                Logout
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  profileHeader: {
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  fullName: {
    color: AppColors.textPrimary,
    marginTop: 16,
  },
  username: {
    color: AppColors.textMuted,
    marginRight: 8,
  },
  menu: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  menuItemIcon: {
    width: 30,
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    color: AppColors.textPrimary,
  },
  footer: {
    padding: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: AppColors.error,
  },
  buttonText: {
    color: AppColors.textWhite,
  },
});

export default ProfileScreen;