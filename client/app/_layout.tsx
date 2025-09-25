// client/app/_layout.tsx

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '@/store/socketStore';
import SplashScreen from '@/components/SplashScreen';
import "../global.css"

const InitialLayout = () => {
  const token =  useAuthStore((state) => state.token)
  const isLoading =  useAuthStore((state) => state.isLoading)
  const initializeAuth =  useAuthStore((state) => state.initializeAuth)
  const { connect, disconnect } = useSocketStore();

  // Initialize authentication state on component mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Manage the socket connection based on the token
  useEffect(() => {
    if (token) {
      console.log('🔌 Auth token found, Establishing socket connection...');
      connect(token);
    }
    return () => {
      console.log('🔌 Token removed or changed, Cleaning up socket connection...');
      disconnect();
    };
  }, [token, connect, disconnect]);

  // Show a splash screen while the auth state is loading
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="(auth)/index" />
      </Stack.Protected>
    </Stack>
  );
};

export default function RootLayout() {
  return <InitialLayout />;
}