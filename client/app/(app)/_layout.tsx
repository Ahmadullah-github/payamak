// File: client/app/(app)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router'; // Change from Tabs to Stack
import { Ionicons, Octicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';


export default function AppLayout() {
 
  return (
      <>
        <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: `${AppColors.primary}`,
          },
          headerTintColor: AppColors.textWhite,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 20,
          },
        }}
      >
        {/* Tabs as main screen */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false, // Tabs handle their own header
          }} 
        />
        
        {/* Chat screens */}
        <Stack.Screen 
          name="chat/[id]" 
          options={{
            title: 'چت',
            headerShown: true,
          }} 
        />

        
        {/* Other screens accessible via drawer */}
        <Stack.Screen 
          name="profile/index" 
          options={{
            title: 'پروفایل',
          }} 
        />
        <Stack.Screen 
          name="profile/edit" 
          options={{
            title: 'ویرایش پروفایل',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{
            title: 'تنظیمات',
          }} 
        />
        <Stack.Screen 
          name="about" 
          options={{
            title: 'درباره',
          }} 
        />
      </Stack>
    </>
  );
}