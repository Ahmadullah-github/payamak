import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/colors';

interface UserItemProps {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  isOnline: boolean;
  status?: string;
  lastSeen?: string;
  onPress: (userId: string) => void;
}

export const UserItem: React.FC<UserItemProps> = ({
  id,
  fullName,
  username,
  avatarUrl,
  isOnline,
  status,
  lastSeen,
  onPress,
}) => {
  return (
    <Pressable
      onPress={() => onPress(id)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? AppColors.inputBackground : AppColors.background,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: AppColors.divider,
      })}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{ 
            uri: avatarUrl || `https://i.pravatar.cc/150?u=${id}`
          }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: AppColors.inputBackground,
          }}
        />
        {/* Online indicator */}
        {isOnline && (
          <View
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: '#10b981',
              borderWidth: 2,
              borderColor: AppColors.background,
            }}
          />
        )}
      </View>
      
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: AppColors.textPrimary,
            marginBottom: 2,
          }}
        >
          {fullName}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: AppColors.textMuted,
          }}
        >
          {isOnline ? 'Online' : `@${username}`}
        </Text>
        {status && (
          <Text
            style={{
              fontSize: 12,
              color: AppColors.textMuted,
              fontStyle: 'italic',
              marginTop: 2,
            }}
          >
            {status}
          </Text>
        )}
      </View>
      
      <Ionicons 
        name="chatbubble-outline" 
        size={20} 
        color={AppColors.textMuted} 
      />
    </Pressable>
  );
};

export default UserItem;