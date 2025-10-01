// File: app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { View, Pressable, Modal, Animated, BackHandler, useWindowDimensions, I18nManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../../constants/colors';
import AppDrawer from '../../../components/AppDrawer';

export default function TabsLayout() {
     const insets = useSafeAreaInsets();
     const { width } = useWindowDimensions();
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
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 8,
          borderTopWidth: 0,
          // Android shadow
          elevation: 8,
          // iOS shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
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
              width: Math.min(360, width * 0.85),
              alignSelf: I18nManager.isRTL ? 'flex-start' : 'flex-end',
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: I18nManager.isRTL ? [-Math.min(360, width * 0.85), 0] : [Math.min(360, width * 0.85), 0],
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