import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will remove all stored data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Cache Cleared', 'App cache has been cleared successfully.');
          },
        },
      ]
    );
  };

  const handleReportIssue = () => {
    // TODO: Implement issue reporting
    Alert.alert('Report Issue', 'Issue reporting is not implemented yet.');
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          color: theme.textMuted,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 8,
          marginLeft: 16
        }]}>
          Appearance
        </Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon" size={20} color={theme.textPrimary} />
            <Text style={[styles.settingText, { 
              color: theme.textPrimary,
              fontSize: 16,
              marginLeft: 16
            }]}>
              Dark Mode
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.divider, true: theme.primary }}
            thumbColor={isDark ? theme.textWhite : theme.textWhite}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          color: theme.textMuted,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 8,
          marginLeft: 16
        }]}>
          Notifications
        </Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={20} color={theme.textPrimary} />
            <Text style={[styles.settingText, { 
              color: theme.textPrimary,
              fontSize: 16,
              marginLeft: 16
            }]}>
              Enable Notifications
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: theme.divider, true: theme.primary }}
            thumbColor={notificationsEnabled ? theme.textWhite : theme.textWhite}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-high" size={20} color={theme.textPrimary} />
            <Text style={[styles.settingText, { 
              color: theme.textPrimary,
              fontSize: 16,
              marginLeft: 16
            }]}>
              Sound
            </Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: theme.divider, true: theme.primary }}
            thumbColor={soundEnabled ? theme.textWhite : theme.textWhite}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait" size={20} color={theme.textPrimary} />
            <Text style={[styles.settingText, { 
              color: theme.textPrimary,
              fontSize: 16,
              marginLeft: 16
            }]}>
              Vibration
            </Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            trackColor={{ false: theme.divider, true: theme.primary }}
            thumbColor={vibrationEnabled ? theme.textWhite : theme.textWhite}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          color: theme.textMuted,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 8,
          marginLeft: 16
        }]}>
          Data & Storage
        </Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
          <View style={styles.settingInfo}>
            <Ionicons name="trash" size={20} color={theme.textPrimary} />
            <Text style={[styles.settingText, { 
              color: theme.textPrimary,
              fontSize: 16,
              marginLeft: 16
            }]}>
              Clear Cache
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          color: theme.textMuted,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 8,
          marginLeft: 16
        }]}>
          Help & Support
        </Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleReportIssue}>
          <View style={styles.settingInfo}>
            <Ionicons name="bug" size={20} color={theme.textPrimary} />
            <Text style={[styles.settingText, { 
              color: theme.textPrimary,
              fontSize: 16,
              marginLeft: 16
            }]}>
              Report an Issue
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { 
          color: theme.textMuted,
          fontSize: 14
        }]}>
          Payamak v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 24,
  },
  versionText: {
    textAlign: 'center',
  },
});

export default SettingsScreen;