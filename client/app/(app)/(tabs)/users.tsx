import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Pressable, 
  TextInput, 
  StatusBar, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../../constants/colors';
import { router } from 'expo-router';
import { userApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { useSocketStore } from '../../../store/socketStore';
import { useToast } from '../../../hooks/useToast';
import { Toast, ErrorModal } from '../../../components/ui';

const { width } = Dimensions.get('window');

interface User {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: string;
}

export default function UsersScreen() {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });
  
  const { user: currentUser } = useAuthStore();
  const { onlineUsers, socket } = useSocketStore();
  const { toast, showError, showSuccess, hideToast } = useToast();

  // Fetch all users
  const fetchUsers = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📞 Fetching users from API...');
      const response = await userApi.getUsers();
      console.log('✅ Users fetched:', response.data);
      
      // Transform API response to User interface
      const transformedUsers: User[] = response.data.map((user: any) => ({
        id: user.id.toString(),
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        isOnline: onlineUsers.has(user.id.toString()), // Check if user is online from socket
        lastSeen: user.lastSeen,
        status: user.status,
      }));
      
      // Sort users: online first, then by name
      transformedUsers.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return a.fullName.localeCompare(b.fullName);
      });
      
      setUsers(transformedUsers);
      
    } catch (err: any) {
      console.error('❌ Failed to fetch users:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      
      setErrorModal({
        visible: true,
        title: 'Connection Error',
        message: 'Unable to load users. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update online status when socket onlineUsers changes
  useEffect(() => {
    setUsers(prevUsers => 
      prevUsers.map(user => ({
        ...user,
        isOnline: onlineUsers.has(user.id)
      })).sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return a.fullName.localeCompare(b.fullName);
      })
    );
  }, [onlineUsers]);

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUserPress = (userId: string) => {
    // Navigate to chat with this user
    router.push({
      pathname: "/(app)/chat/[id]",
      params: { id: userId, type: 'private' }
    });
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
    user.username.toLowerCase().includes(searchText.toLowerCase())
  );

  const onlineUsersCount = users.filter(user => user.isOnline).length;

  const renderUser = ({ item: user, index }: { item: User; index: number }) => (
    <Pressable
      onPress={() => handleUserPress(user.id)}
      style={({ pressed }) => ([
        {
          backgroundColor: pressed ? 'rgba(37, 211, 102, 0.1)' : 'transparent',
          marginHorizontal: 16,
          marginVertical: 4,
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: user.isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 163, 175, 0.1)',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.05,
          shadowRadius: 3.84,
          elevation: 2,
        }
      ])}
    >
      {/* Avatar with enhanced design */}
      <View style={{ position: 'relative' }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            padding: 3,
            backgroundColor: user.isOnline 
              ? 'rgba(16, 185, 129, 0.15)' 
              : 'rgba(156, 163, 175, 0.1)',
          }}
        >
          <Image
            source={{ 
              uri: user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`
            }}
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: AppColors.inputBackground,
            }}
          />
        </View>
        
        {/* Enhanced online indicator */}
        {user.isOnline && (
          <View
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#10b981',
              borderWidth: 3,
              borderColor: '#ffffff',
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#ffffff',
                alignSelf: 'center',
                marginTop: 3,
              }}
            />
          </View>
        )}
      </View>
      
      {/* User info with enhanced layout */}
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: AppColors.textPrimary,
            marginBottom: 4,
          }}
        >
          {user.fullName}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 14,
              color: user.isOnline ? '#10b981' : AppColors.textMuted,
              fontWeight: user.isOnline ? '500' : '400',
            }}
          >
            {user.isOnline ? '🟢 Online' : `@${user.username}`}
          </Text>
        </View>
        
        {user.status && (
          <Text
            style={{
              fontSize: 13,
              color: AppColors.textMuted,
              fontStyle: 'italic',
              marginTop: 4,
            }}
          >
            "{user.status}"
          </Text>
        )}
      </View>
      
      {/* Action button */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: user.isOnline 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(59, 130, 246, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons 
          name="chatbubble" 
          size={20} 
          color={user.isOnline ? '#10b981' : '#3b82f6'} 
        />
      </View>
    </Pressable>
  );

  const renderHeader = () => (
    <View>
      {/* Header with gradient background */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        {/* Stats section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              {onlineUsersCount}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Online Now</Text>
          </View>
          
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 }} />
          
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              {users.length}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Total Users</Text>
          </View>
          
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 }} />
          
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              {filteredUsers.length}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Available</Text>
          </View>
        </View>
        
        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 16,
              color: 'white',
            }}
            placeholder="Search for people..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>
      </LinearGradient>
      
      {/* Section header */}
      {filteredUsers.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: AppColors.textPrimary }}>
            {searchText ? `Search Results (${filteredUsers.length})` : 'People You Can Message'}
          </Text>
          <Text style={{ fontSize: 13, color: AppColors.textMuted, marginTop: 2 }}>
            Tap on anyone to start a conversation
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && users.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 40,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={{ color: 'white', marginTop: 16, fontSize: 16, fontWeight: '500' }}>
            Finding people for you...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar backgroundColor="#3b82f6" barStyle="light-content" />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor={"#3b82f6"}
            progressBackgroundColor="white"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingTop: 60,
            paddingHorizontal: 32 
          }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <Ionicons name="people-outline" size={48} color="#3b82f6" />
            </View>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '600',
              color: AppColors.textPrimary, 
              marginBottom: 8,
              textAlign: 'center' 
            }}>
              {searchText ? 'No Results Found' : 'No Users Available'}
            </Text>
            <Text style={{ 
              fontSize: 14,
              color: AppColors.textMuted, 
              textAlign: 'center',
              lineHeight: 20 
            }}>
              {searchText 
                ? `We couldn't find anyone matching "${searchText}". Try a different search term.`
                : 'There are no users to display right now. Pull down to refresh and try again.'
              }
            </Text>
            {!searchText && (
              <Pressable 
                onPress={handleRefresh}
                style={{
                  marginTop: 20,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: '#3b82f6',
                  borderRadius: 24,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Refresh</Text>
              </Pressable>
            )}
          </View>
        )}
      />
      
      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        primaryAction={{
          text: 'Retry',
          onPress: fetchUsers,
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