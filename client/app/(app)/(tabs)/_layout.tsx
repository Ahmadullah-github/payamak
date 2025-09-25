// File: app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { View, Pressable, Modal, Animated, BackHandler } from 'react-native';
import { AppColors } from '../../../constants/colors';
import AppDrawer from '../../../components/AppDrawer';

export default function TabsLayout() {
     const [isDrawerOpen, setIsDrawerOpen] = useState(false);
      const slideAnim = useRef(new Animated.Value(0)).current;
      const fadeAnim = useRef(new Animated.Value(0)).current;
    
      const openDrawer = () => {
        setIsDrawerOpen(true);
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      };
    
      const closeDrawer = () => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsDrawerOpen(false);
        });
      };
    
      // Handle Android back button
      useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          if (isDrawerOpen) {
            closeDrawer();
            return true;
          }
          return false;
        });
    
        return () => backHandler.remove();
      }, [isDrawerOpen]);
    
  return (
    <>
     <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.tabActive,
        tabBarInactiveTintColor: AppColors.tabInactive,
        tabBarStyle: {
          backgroundColor: AppColors.tabBar,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 8,
        },
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: AppColors.primary,
        },
        headerTintColor: AppColors.textWhite,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 20,
        },
        headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18 }}>
              <Pressable
                onPress={openDrawer}
                style={({ pressed }) => ({
                  padding: 8,
                  marginRight: 8,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Octicons name="three-bars" size={22} color={AppColors.textWhite} />
              </Pressable>
            </View>
          ),
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'چت‌ها',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }} 
      />
      
      <Tabs.Screen 
        name="users" 
        options={{
          title: 'کاربران',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'person-circle' : 'person-circle-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }} 
      />
      
      <Tabs.Screen 
        name="groups" 
        options={{
          title: 'گروپ‌ها',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }} 
      />
    </Tabs>
    <Modal
        visible={isDrawerOpen}
        transparent
        animationType="none"
        onRequestClose={closeDrawer}
        statusBarTranslucent
      >
        <Animated.View
          style={{
            flex: 1,
            flexDirection: 'row',
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: fadeAnim,
          }}
        >
          {/* Backdrop */}
          <Pressable
            style={{ flex: 1, marginRight: 14, marginVertical: 14 }}
            onPress={closeDrawer}
          />
          
          {/* Drawer */}
          <Animated.View
            style={{
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0], // Slide from right
                }),
              }],
              
            }}
          >
            <AppDrawer onClose={closeDrawer} />
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
  
     
      
}