import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';
import { AppColors } from '../../constants/colors';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = () => {
  const { theme, typography } = useTheme();

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'About' }} />
      
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubbles" size={48} color={AppColors.primary} />
        </View>
        <Text style={[styles.appName, { 
          fontSize: typography.heading1.fontSize,
          fontWeight: typography.heading1.fontWeight,
          lineHeight: typography.heading1.lineHeight,
          color: theme.textPrimary
        }]}>
          Payamak
        </Text>
        <Text style={[styles.version, { 
          fontSize: typography.body.fontSize,
          lineHeight: typography.body.lineHeight,
          color: theme.textMuted
        }]}>
          Version 1.0.0
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.description, { 
          fontSize: typography.body.fontSize,
          lineHeight: typography.body.lineHeight,
          color: theme.textPrimary,
          marginBottom: 24
        }]}>
          Payamak is a modern messaging application built with React Native and Expo. 
          It provides a seamless chatting experience with real-time messaging, 
          media sharing, and group conversations.
        </Text>
        
        <View style={styles.features}>
          <Text style={[styles.sectionTitle, { 
            fontSize: typography.heading3.fontSize,
            fontWeight: typography.heading3.fontWeight,
            lineHeight: typography.heading3.lineHeight,
            color: theme.textPrimary,
            marginBottom: 16
          }]}>
            Key Features
          </Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={AppColors.success} />
            <Text style={[styles.featureText, { 
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight,
              color: theme.textPrimary,
              marginLeft: 12
            }]}>
              Real-time messaging
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={AppColors.success} />
            <Text style={[styles.featureText, { 
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight,
              color: theme.textPrimary,
              marginLeft: 12
            }]}>
              Media sharing (images, videos, documents)
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={AppColors.success} />
            <Text style={[styles.featureText, { 
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight,
              color: theme.textPrimary,
              marginLeft: 12
            }]}>
              Group conversations
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={AppColors.success} />
            <Text style={[styles.featureText, { 
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight,
              color: theme.textPrimary,
              marginLeft: 12
            }]}>
              Online status indicators
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={AppColors.success} />
            <Text style={[styles.featureText, { 
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight,
              color: theme.textPrimary,
              marginLeft: 12
            }]}>
              Message reactions
            </Text>
          </View>
        </View>
        
        <View style={styles.links}>
          <Text style={[styles.sectionTitle, { 
            fontSize: typography.heading3.fontSize,
            fontWeight: typography.heading3.fontWeight,
            lineHeight: typography.heading3.lineHeight,
            color: theme.textPrimary,
            marginBottom: 16,
            marginTop: 24
          }]}>
            Links
          </Text>
          
          <View style={styles.linkItem}>
            <Ionicons name="globe" size={20} color={AppColors.primary} />
            <Text 
              style={[styles.linkText, { 
                fontSize: typography.body.fontSize,
                lineHeight: typography.body.lineHeight,
                color: AppColors.primary,
                marginLeft: 12
              }]}
              onPress={() => handleLinkPress('https://github.com')}
            >
              Website
            </Text>
          </View>
          
          <View style={styles.linkItem}>
            <Ionicons name="logo-github" size={20} color={AppColors.textPrimary} />
            <Text 
              style={[styles.linkText, { 
                fontSize: typography.body.fontSize,
                lineHeight: typography.body.lineHeight,
                color: AppColors.primary,
                marginLeft: 12
              }]}
              onPress={() => handleLinkPress('https://github.com')}
            >
              GitHub Repository
            </Text>
          </View>
          
          <View style={styles.linkItem}>
            <Ionicons name="mail" size={20} color={AppColors.textPrimary} />
            <Text 
              style={[styles.linkText, { 
                fontSize: typography.body.fontSize,
                lineHeight: typography.body.lineHeight,
                color: AppColors.primary,
                marginLeft: 12
              }]}
              onPress={() => handleLinkPress('mailto:support@payamak.com')}
            >
              Contact Support
            </Text>
          </View>
        </View>
        
        <Text style={[styles.copyright, { 
          fontSize: typography.caption.fontSize,
          lineHeight: typography.caption.lineHeight,
          color: theme.textMuted,
          textAlign: 'center',
          marginTop: 32,
          marginBottom: 16
        }]}>
          © 2023 Payamak. All rights reserved.
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
  header: {
    alignItems: 'center',
    padding: 40,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    marginBottom: 8,
  },
  version: {
    opacity: 0.8,
  },
  content: {
    padding: 20,
  },
  description: {
    textAlign: 'center',
  },
  features: {
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
  },
  links: {
    marginTop: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    flex: 1,
    textDecorationLine: 'underline',
  },
  copyright: {
    opacity: 0.6,
  },
});

export default AboutScreen;