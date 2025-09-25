import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatItem, ChatItemProps } from '../../../components/ChatItem';
import { AppColors } from '../../../constants/colors';
import { router } from 'expo-router';
import { chatApi } from '../../../api';
import { useMessageStore } from '../../../store/messageStore';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import { Toast, ErrorModal } from '../../../components/ui';

export default function ChatListScreen() {
  const [searchText, setSearchText] = useState('');
  const [chats, setChats] = useState<ChatItemProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });
  
  const { user } = useAuthStore();
  const { getAllChats, addChat } = useMessageStore();
  const { toast, showError, hideToast } = useToast();

  const fetchChats = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📞 Fetching chats from API...');
      const response = await chatApi.getChats();
      console.log('✅ Chats fetched:', response.data);
      
      // Transform API response to match ChatItemProps interface
      const transformedChats: ChatItemProps[] = response.data.map((chat: any) => ({
        id: chat.id,
        name: chat.name || chat.display_name || 'Unknown Chat',
        lastMessage: chat.lastMessage || chat.last_message_content || 'No messages yet',
        timestamp: chat.timestamp || chat.last_message_time || chat.lastActivity || new Date().toISOString(),
        unreadCount: chat.unreadCount || chat.unread_count || 0,
        isOnline: chat.isOnline || chat.is_online || false,
        avatarUrl: chat.avatarUrl || `https://i.pravatar.cc/150?u=${chat.id}`,
        status: 'sent' as const // Default status
      }));
      
      setChats(transformedChats);
      
      // Also update the message store
      transformedChats.forEach(chat => {
        addChat({
          id: chat.id,
          type: 'private', // Default to private, will be updated from API
          name: chat.name,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.timestamp ? new Date(chat.timestamp) : undefined,
          unreadCount: chat.unreadCount,
          isOnline: chat.isOnline
        });
      });
      
    } catch (err: any) {
      console.error('❌ Failed to fetch chats:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch chats';
      setError(errorMessage);
      
      // Show user-friendly error
      setErrorModal({
        visible: true,
        title: 'Connection Error',
        message: 'Unable to load chats. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

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
          onChangeText={setSearchText}
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
        onRefresh={handleRefresh}
        refreshing={refreshing}
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
          // Navigate to users screen to start new chat
          router.push('/(app)/(tabs)/users');
        }}
      >
        <Ionicons name="chatbubble" size={24} color={AppColors.textWhite} />
      </Pressable>
      
      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        primaryAction={{
          text: 'Retry',
          onPress: fetchChats,
        }}
        onClose={() => setErrorModal({ visible: false, title: '', message: '' })}
        type="error"
      />
      
      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        position="top"
      />
    </View>
  );
}