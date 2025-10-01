import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StatusBar,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { chatApi } from '../../../api';
import { useMessageStore } from '../../../store/messageStore';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import {
  Toast,
  ErrorModal,
  SearchBar,
  Button,
  Card,
  SkeletonCard,
  Badge,
} from '../../../components/ui';
import { ChatItem, ChatItemProps } from '../../../components/ChatItem';
import { AppColors } from '../../../constants/colors';

const { width } = Dimensions.get('window');

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [chats, setChats] = useState<ChatItemProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
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
        id: String(chat.id),
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

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchText('');
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchText.toLowerCase()))
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryLight]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Messages</Text>
            <View style={styles.headerActions}>
              <Pressable
                style={styles.headerButton}
                onPress={toggleSearch}
              >
                <Ionicons
                  name={showSearch ? 'close' : 'search'}
                  size={24}
                  color={AppColors.textWhite}
                />
              </Pressable>
            </View>
          </View>
          
          {showSearch && (
            <Animated.View style={styles.searchContainer}>
              <SearchBar
                placeholder="Search conversations..."
                value={searchText}
                onChangeText={handleSearch}
                variant="rounded"
                style={styles.searchBar}
              />
            </Animated.View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={AppColors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>
          {searchText ? 'No conversations found' : 'No conversations yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchText
            ? 'Try searching with different keywords'
            : 'Start your first conversation by tapping the + button'}
        </Text>
        {!searchText && (
          <Button
            title="Start New Chat"
            onPress={() => router.push('/(app)/(tabs)/users')}
            variant="outline"
            icon="add"
            style={styles.emptyButton}
          />
        )}
      </View>
    </Card>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {[...Array(6)].map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );

  const renderChatItem = ({ item, index }: { item: ChatItemProps; index: number }) => (
    <Animated.View
      style={[
        styles.chatItemContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <ChatItem {...item} />
    </Animated.View>
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderLoadingState()}
      </View>
    );
  }

  if (error && !chats.length) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <Card style={styles.errorCard}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={48} color={AppColors.error} />
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Button
              title="Try Again"
              onPress={fetchChats}
              variant="outline"
              icon="refresh"
              style={styles.errorButton}
            />
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {renderHeader()}
      
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderChatItem}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          filteredChats.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
      
      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            bottom: 24 + insets.bottom,
          },
        ]}
      >
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/(app)/(tabs)/users')}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <LinearGradient
            colors={[AppColors.accent, AppColors.primaryLight]}
        style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={AppColors.textWhite} />
          </LinearGradient>
        </Pressable>
        
        {chats.filter(chat => chat.unreadCount > 0).length > 0 && (
          <Badge
            count={chats.reduce((total, chat) => total + chat.unreadCount, 0)}
            style={styles.fabBadge}
            variant="error"
          />
        )}
      </Animated.View>
      
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  headerContainer: {
    backgroundColor: AppColors.primary,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: AppColors.textWhite,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 8,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'transparent',
  },
  list: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
  },
  chatItemContainer: {
    marginBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.divider,
    marginLeft: 72,
  },
  emptyCard: {
    margin: 24,
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center' as const,
  },
  emptyIconContainer: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 50,
    backgroundColor: AppColors.inputBackground,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: AppColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 14,
    color: AppColors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 16,
  },
  loadingContainer: {
    padding: 16,
  },
  errorCard: {
    margin: 24,
    padding: 32,
  },
  errorContent: {
    alignItems: 'center' as const,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: AppColors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: AppColors.textMuted,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  errorButton: {
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute' as const,
    bottom: 24,
    right: 24,
    elevation: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden' as const,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});