// file: app/(app)/(tabs)/groups.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../../constants/colors';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useMessageStore, Chat } from '../../../store/messageStore';
import { chatApi } from '../../../api';
import { GroupChatItem } from '../../../components/chat/ChatItem';

export default function GroupsScreen() {
  const { user } = useAuthStore();
  const { getAllChats, addChat } = useMessageStore();
  const [searchText, setSearchText] = useState('');
  const [groupChats, setGroupChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupChats = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const response = await chatApi.getChats();
        const chats = response.data;
        
        // Filter only group chats
        const groups = chats.filter(chat => chat.type === 'group');
        setGroupChats(groups);
        
        // Add to store
        groups.forEach(chat => addChat(chat));
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch group chats:', err);
        setError('خطا در بارگذاری گروه‌ها');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupChats();
  }, [user, addChat]);

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleCreateGroup = () => {
    // Navigate to create group screen (for now just log)
    console.log('Create new group');
    // TODO: Create a proper create group screen
  };

  const handleGroupPress = (chatId: string) => {
    router.push({
      pathname: "/(app)/chat/[id]",
      params: { id: chatId, type: 'group' }
    });
  };

  const filteredGroups = groupChats.filter(chat => 
    chat.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchText.toLowerCase()))
  );

  const renderHeader = () => (
    <View style={{ backgroundColor: AppColors.background }}>
      {/* Search Bar */}
      <View 
        className="mx-4 mb-2 mt-2 px-4 py-3 rounded-lg flex-row items-center"
        style={{ backgroundColor: AppColors.inputBackground }}
      >
        <Ionicons name="search" size={20} color={AppColors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 text-base"
          placeholder="جستجو در گروه‌ها..."
          placeholderTextColor={AppColors.textMuted}
          value={searchText}
          onChangeText={handleSearch}
          style={{
            color: AppColors.textPrimary,
            fontSize: 16,
            textAlign: 'right',
          }}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: AppColors.error }}>{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: AppColors.background }}>
      <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
      
      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupChatItem 
            chat={item} 
            onPress={handleGroupPress}
          />
        )}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: AppColors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
      />
      
      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full shadow-lg justify-center items-center"
        style={{
          backgroundColor: AppColors.accent,
          elevation: 8,
          shadowColor: AppColors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
        onPress={handleCreateGroup}
      >
        <Ionicons name="people" size={24} color={AppColors.textWhite} />
      </Pressable>
    </View>
  );
}

