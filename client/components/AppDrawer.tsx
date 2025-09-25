// components/AppDrawer.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '../constants/colors';
import { useAuthStore } from '../store/authStore';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.85; // 85% of screen width

interface DrawerItemProps {
  icon: keyof typeof Octicons.glyphMap;
  title: string;
  onPress: () => void;
  color?: string;
}

function DrawerItem({ icon, title, onPress, color = AppColors.textPrimary }: DrawerItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: pressed ? 'rgba(0,0,0,0.05)' : 'transparent',
      })}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      <Octicons
        name={icon}
        size={22}
        color={color}
        style={{ marginRight: 16, width: 24 }}
      />
      <Text
        style={{
          fontSize: 16,
          fontWeight: '500',
          color: color,
          flex: 1,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

interface AppDrawerProps {
  onClose: () => void;
}

export default function AppDrawer({ onClose }: AppDrawerProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleNavigation = (path: string) => {
    router.push({ pathname: `${path}` } );
    onClose();
  };

  const handleProfile = () => {
    handleNavigation('/profile');
  };

  const handleSettings = () => {
    handleNavigation('/settings');
  };

  const handleAbout = () => {
    handleNavigation('/about');
  };

  return (
    <View
      style={{
        width: DRAWER_WIDTH,
        height: '100%',
        backgroundColor: AppColors.background,
        elevation: 16,
        shadowColor: AppColors.shadow,
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }}
    >
      <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
      
      {/* Header Section with Gradient Background */}
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryLight]}
        style={{
          paddingTop: StatusBar.currentHeight  || 0,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <SafeAreaView edges={['top']}>
          {/* Close Button */}
          <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                padding: 8,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="close" size={24} color={AppColors.textWhite} />
            </Pressable>
          </View>

          {/* Profile Section */}
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: AppColors.background,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
                elevation: 4,
                shadowColor: AppColors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            >
              {user?.fullName ? (
                <View
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    backgroundColor: AppColors.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: '600',
                      color: AppColors.textWhite,
                    }}
                  >
                    {user.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <Octicons
                  name="person"
                  size={36}
                  color={AppColors.primary}
                />
              )}
            </View>
            
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: AppColors.textWhite,
                marginBottom: 4,
                textAlign: 'center',
              }}
            >
              {user?.fullName || 'کاربر مهمان'}
            </Text>
            
            <Text
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              آماده برای گفتگو و ارتباط
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content Section */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Items */}
        <View style={{ 
            flex: 1,
            paddingTop: 16,
            flexDirection: 'column',
         }}>
          <DrawerItem
            icon="person"
            title="پروفایل"
            onPress={handleProfile}
          />
          
          <DrawerItem
            icon="gear"
            title="تنظیمات"
            onPress={handleSettings}
          />
          
          <DrawerItem
            icon="info"
            title="درباره برنامه"
            onPress={handleAbout}
          />
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: AppColors.divider,
            marginVertical: 16,
            marginHorizontal: 20,
          }}
        />

        {/* App Info */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          <Text
            style={{
              fontSize: 14,
              color: AppColors.textMuted,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            پیامک - برنامه چت محلی
            {'\n'}
            نسخه ۱.۰.۰
          </Text>
        </View>
      </ScrollView>

      {/* Footer Section */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: AppColors.divider,
          paddingBottom: 20,
        }}
      >
        <SafeAreaView edges={['bottom']}>
          <DrawerItem
            icon="sign-out"
            title="خروج از حساب"
            onPress={handleLogout}
            color={AppColors.accent}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}