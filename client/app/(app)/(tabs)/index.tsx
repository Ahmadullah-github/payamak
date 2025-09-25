import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatItem, ChatItemProps } from '../../../components/ChatItem';
import { AppColors } from '../../../constants/colors';
import { router } from 'expo-router';
import { getChats } from '../../../api';

export default function ChatListScreen() {
  const [searchText, setSearchText] = useState('');
  const [chats, setChats] = useState<ChatItemProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const response = await getChats();
        setChats(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const filteredChats = chats.filter(chat => 
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
          placeholder="جستجو در مکالمات..."
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
    <View className="flex-1 px-2" style={{ backgroundColor: AppColors.background }}>
      <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatItem {...item} />}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: AppColors.background}}
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
        onPress={() => {
          // Navigate to new chat screen
          console.log('New chat');
        }}
      >
        <Ionicons name="chatbubble" size={24} color={AppColors.textWhite} />
      </Pressable>
    </View>
  );
}
