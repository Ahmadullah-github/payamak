// File: components/chat/ChatHeader.tsx
import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { Chat, ChatMember } from '../../store/messageStore';
import { router } from 'expo-router';
import { useTheme } from '../../constants/theme';
import OnlineStatusIndicator from './OnlineStatusIndicator';

interface ChatHeaderProps {
  chat: Chat;
  onBackPress?: () => void;
  onCallPress?: () => void;
  onVideoCallPress?: () => void;
  onInfoPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

// Direct chat header
export function DirectChatHeader({ 
  chat, 
  onBackPress, 
  onCallPress, 
  onVideoCallPress, 
  onInfoPress,
  accessibilityLabel,
  testID,
}: ChatHeaderProps) {
  const { typography } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleInfoPress = () => {
    if (onInfoPress) {
      onInfoPress();
    } else {
      // Navigate to user profile
      console.log('Navigate to user profile:', chat.id);
    }
  };

  return (
    <View 
      style={[styles.header, { backgroundColor: AppColors.primary }]}
      accessibilityLabel={accessibilityLabel || `Chat with ${chat.name}`}
      testID={testID}
    >
      {/* Back Button */}
      <Pressable 
        onPress={handleBackPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </Pressable>

      {/* User Info */}
      <Pressable 
        style={styles.userInfo}
        onPress={handleInfoPress}
        accessibilityLabel={`View profile of ${chat.name}`}
        accessibilityRole="button"
      >
        <Image
          source={{ uri: `https://i.pravatar.cc/150?u=${chat.id}` }}
          style={styles.avatar}
        />
        <View style={styles.userDetails}>
          <Text 
            style={[styles.userName, { 
              fontSize: typography.body.fontSize,
              fontWeight: typography.body.fontWeight,
              lineHeight: typography.body.lineHeight,
              color: AppColors.textWhite
            }]}
            numberOfLines={1}
          >
            {chat.name}
          </Text>
          <View style={styles.statusContainer}>
            <OnlineStatusIndicator 
              isOnline={!!chat.isOnline} 
              showText 
              size="small"
            />
          </View>
        </View>
      </Pressable>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable 
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={onVideoCallPress}
          accessibilityLabel="Video call"
          accessibilityRole="button"
        >
          <Ionicons name="videocam" size={24} color="white" />
        </Pressable>
        <Pressable 
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={onCallPress}
          accessibilityLabel="Voice call"
          accessibilityRole="button"
        >
          <Ionicons name="call" size={24} color="white" />
        </Pressable>
        <Pressable 
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={handleInfoPress}
          accessibilityLabel="More options"
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
}

// Group chat header
export function GroupChatHeader({ 
  chat, 
  onBackPress, 
  onCallPress, 
  onVideoCallPress, 
  onInfoPress,
  accessibilityLabel,
  testID,
}: ChatHeaderProps) {
  const { typography } = useTheme();
  const memberCount = chat.members?.length || 0;
  const onlineCount = chat.members?.filter(member => member.isOnline).length || 0;

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleInfoPress = () => {
    if (onInfoPress) {
      onInfoPress();
    } else {
      // Navigate to group info
      console.log('Navigate to group info:', chat.id);
    }
  };

  const getStatusText = () => {
    if (onlineCount > 0) {
      return `${memberCount} members, ${onlineCount} online`;
    }
    return `${memberCount} members`;
  };

  return (
    <View 
      style={[styles.header, { backgroundColor: AppColors.primary }]}
      accessibilityLabel={accessibilityLabel || `Group chat ${chat.name}`}
      testID={testID}
    >
      {/* Back Button */}
      <Pressable 
        onPress={handleBackPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </Pressable>

      {/* Group Info */}
      <Pressable 
        style={styles.userInfo}
        onPress={handleInfoPress}
        accessibilityLabel={`View group info for ${chat.name}`}
        accessibilityRole="button"
      >
        <View style={styles.groupAvatarContainer}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=group${chat.id}` }}
            style={styles.avatar}
          />
          {/* Group indicator */}
          <View style={styles.groupIndicator}>
            <Ionicons name="people" size={8} color="white" />
          </View>
        </View>
        <View style={styles.userDetails}>
          <Text 
            style={[styles.userName, { 
              fontSize: typography.body.fontSize,
              fontWeight: typography.body.fontWeight,
              lineHeight: typography.body.lineHeight,
              color: AppColors.textWhite
            }]}
            numberOfLines={1}
          >
            {chat.name}
          </Text>
          <Text 
            style={[styles.groupStatus, { 
              fontSize: typography.caption.fontSize,
              lineHeight: typography.caption.lineHeight,
              color: 'rgba(255, 255, 255, 0.8)'
            }]}
          >
            {getStatusText()}
          </Text>
        </View>
      </Pressable>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable 
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={onVideoCallPress}
          accessibilityLabel="Video call"
          accessibilityRole="button"
        >
          <Ionicons name="videocam" size={24} color="white" />
        </Pressable>
        <Pressable 
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={onCallPress}
          accessibilityLabel="Voice call"
          accessibilityRole="button"
        >
          <Ionicons name="call" size={24} color="white" />
        </Pressable>
        <Pressable 
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={handleInfoPress}
          accessibilityLabel="More options"
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
}

// Online members indicator for group chats
export function OnlineMembersIndicator({ members }: { members: ChatMember[] }) {
  const { typography } = useTheme();
  const onlineMembers = members.filter(member => member.isOnline);
  
  if (onlineMembers.length === 0) return null;

  return (
    <View 
      style={styles.onlineMembersContainer}
    >
      <View style={styles.onlineMembersContent}>
        <Ionicons name="radio-button-on" size={12} color={AppColors.online} />
        <Text 
          style={[styles.onlineMembersLabel, { 
            fontSize: typography.bodySmall.fontSize,
            lineHeight: typography.bodySmall.lineHeight,
            color: AppColors.online,
            marginRight: 4
          }]}
        >
          Online:
        </Text>
        <Text 
          style={[styles.onlineMembersList, { 
            fontSize: typography.bodySmall.fontSize,
            lineHeight: typography.bodySmall.lineHeight,
            color: AppColors.textPrimary
          }]}
          numberOfLines={1}
        >
          {onlineMembers.map(member => member.fullName).join(', ')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  groupAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  groupIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    borderWidth: 1,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupStatus: {
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineMembersContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  onlineMembersContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineMembersLabel: {
    fontWeight: '500',
  },
  onlineMembersList: {
    flex: 1,
  },
});