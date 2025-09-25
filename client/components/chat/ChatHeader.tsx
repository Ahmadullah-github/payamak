// File: components/chat/ChatHeader.tsx
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { Chat, ChatMember } from '../../store/messageStore';
import { RelativePathString, router } from 'expo-router';

interface ChatHeaderProps {
  chat: Chat;
  onBackPress?: () => void;
  onCallPress?: () => void;
  onVideoCallPress?: () => void;
  onInfoPress?: () => void;
}

// Direct chat header
export function DirectChatHeader({ 
  chat, 
  onBackPress, 
  onCallPress, 
  onVideoCallPress, 
  onInfoPress 
}: ChatHeaderProps) {
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
    <View className="flex-row items-center px-4 py-2" style={{ backgroundColor: AppColors.primary }}>
      {/* Back Button */}
      <Pressable 
        onPress={handleBackPress}
        className="mr-3 p-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </Pressable>

      {/* User Info */}
      <Pressable 
        className="flex-row items-center flex-1"
        onPress={handleInfoPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <Image
          source={{ uri: `https://i.pravatar.cc/150?u=${chat.id}` }}
          className="w-10 h-10 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="text-lg font-semibold text-white">{chat.name}</Text>
          <Text className="text-xs text-blue-100">
            {chat.isOnline ? 'آنلاین' : 'آفلاین'}
          </Text>
        </View>
      </Pressable>

      {/* Action Buttons */}
      <View className="flex-row items-center">
        <Pressable 
          className="p-2 mr-2"
          onPress={onVideoCallPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="videocam" size={24} color="white" />
        </Pressable>
        <Pressable 
          className="p-2 mr-2"
          onPress={onCallPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="call" size={24} color="white" />
        </Pressable>
        <Pressable 
          className="p-2"
          onPress={handleInfoPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
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
  onInfoPress 
}: ChatHeaderProps) {
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
      router.push({
        pathname: "/(app)/group-info/[id]" as RelativePathString,
        params: { id: chat.id }
      });
    }
  };

  const getStatusText = () => {
    if (onlineCount > 0) {
      return `${memberCount} عضو، ${onlineCount} آنلاین`;
    }
    return `${memberCount} عضو`;
  };

  return (
    <View className="flex-row items-center px-4 py-2\" style={{ backgroundColor: AppColors.primary }}>
      {/* Back Button */}
      <Pressable 
        onPress={handleBackPress}
        className="mr-3 p-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </Pressable>

      {/* Group Info */}
      <Pressable 
        className="flex-row items-center flex-1"
        onPress={handleInfoPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View className="relative mr-3">
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=group${chat.id}` }}
            className="w-10 h-10 rounded-full"
          />
          {/* Group indicator */}
          <View 
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full justify-center items-center"
            style={{
              backgroundColor: AppColors.primary,
              borderWidth: 1,
              borderColor: 'white',
            }}
          >
            <Ionicons name="people" size={8} color="white" />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-white" numberOfLines={1}>
            {chat.name}
          </Text>
          <Text className="text-xs text-blue-100">
            {getStatusText()}
          </Text>
        </View>
      </Pressable>

      {/* Action Buttons */}
      <View className="flex-row items-center">
        <Pressable 
          className="p-2 mr-2"
          onPress={onVideoCallPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="videocam" size={24} color="white" />
        </Pressable>
        <Pressable 
          className="p-2 mr-2"
          onPress={onCallPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="call" size={24} color="white" />
        </Pressable>
        <Pressable 
          className="p-2"
          onPress={handleInfoPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
}

// Online members indicator for group chats
export function OnlineMembersIndicator({ members }: { members: ChatMember[] }) {
  const onlineMembers = members.filter(member => member.isOnline);
  
  if (onlineMembers.length === 0) return null;

  return (
    <View 
      className="mx-4 mb-2 px-3 py-2 rounded-lg"
      style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }}
    >
      <View className="flex-row items-center">
        <Ionicons name="radio-button-on" size={12} color={AppColors.online} />
        <Text 
          className="mr-2 text-sm"
          style={{ color: AppColors.online }}
        >
          آنلاین: 
        </Text>
        <Text 
          className="flex-1 text-sm"
          style={{ color: AppColors.textPrimary }}
          numberOfLines={1}
        >
          {onlineMembers.map(member => member.fullName).join('، ')}
        </Text>
      </View>
    </View>
  );
}