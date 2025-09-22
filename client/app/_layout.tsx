// client/app/_layout.tsx
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Text, View, StyleSheet } from 'react-native';
import SplashScreen from '@/components/SplashScreen';


const InitialLayout = () => {
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth); // 👈 get the function

  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 _layout: Calling initializeAuth...');
    initializeAuth(); // 👈 This was missing in your version!
  }, [initializeAuth]);

  
  useEffect(() => {
    if (isLoading || segments.length === 0) {
      console.log('⏳ Still loading or segments not ready...');
      return;
    }

    const inAppGroup = segments[0] === '(app)';

    if (token && !inAppGroup) {
      console.log('✅ Authenticated → redirect to /chat');
      router.replace('/(app)/chat');
    } else if (!token && inAppGroup) {
      console.log('✅ Not authenticated → redirect to /login');
      router.replace('/(auth)/login');
    }
  }, [token, isLoading, segments]);

  if (isLoading) {
    console.log('📱 Showing SplashScreen...');
    return <SplashScreen />;
  }

  console.log('✅ Rendering Slot...');
  return <Slot />;
};
export default function RootLayout() {
  return <InitialLayout />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});