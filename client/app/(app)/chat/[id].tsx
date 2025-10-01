import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { AppColors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/authStore';
import { useSocketStore } from '../../../store/socketStore';
import { useMessageStore, ChatMessage, Chat } from '../../../store/messageStore';
import { chatApi, userApi } from '../../../api';
import MessageBubble from '../../../components/chat/MessageBubble';
import { useToast } from '../../../hooks/useToast';
import { Toast } from '../../../components/ui';

export default function ChatScreen() {
  const { id: chatId, type: chatType } = useLocalSearchParams<{ id: string; type?: string }>();
  const { user: currentUser } = useAuthStore();
  const { socket, onlineUsers, joinChatRoom, leaveChatRoom } = useSocketStore();
  
  const { 
    getMessagesForChat, 
    addMessage, 
    updateMessageStatus, 
    setChatMessages,
    getChat,
    addChat,
    setActiveChat,
    clearChatUnread,
    markAllMessagesReadInChat,
  } = useMessageStore();
  
  // Local state
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatData, setChatData] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const initialUnreadRef = useRef<number>(0);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const { toast, showError, hideToast } = useToast();

  const messages = chatId ? getMessagesForChat(chatId) : [];
  const isGroupChat = chatType === 'group' || chatData?.type === 'group';

  // Set active chat
  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId);
    }
    return () => {
      setActiveChat(null);
      if (socket && chatData?.id && !chatData.id.startsWith('new-')) {
        leaveChatRoom(chatData.id);
        console.log('📬 Left chat room:', chatData.id);
      }
    };
  }, [chatId, setActiveChat, socket, chatData?.id, leaveChatRoom]);

  // Capture initial unread count and clear after chat data loads
  useEffect(() => {
    if (chatData?.id && chatId === chatData.id) {
      if (!initialUnreadRef.current) {
        initialUnreadRef.current = chatData.unreadCount || 0;
      }
      clearChatUnread(chatData.id);
      markAllMessagesReadInChat(chatData.id);
    }
  }, [chatData?.id]);

  // Load chat data and messages
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const loadChatData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if chat exists in store first
        let chat = getChat(chatId);
        
        if (!chat) {
          // If it's a direct user chat (numeric ID), we need to create/find the chat
          if (!isNaN(Number(chatId))) {
            try {
              // Get the other user's info first
              console.log('👥 Getting user info for:', chatId);
              const userResponse = await userApi.getUser(chatId);
              const userData = userResponse.data;
              setOtherUser(userData);
              console.log('✅ User data loaded:', userData.fullName);

              // Try to find existing chat first
              console.log('🔍 Searching for existing chat...');
              const chatsResponse = await chatApi.getChats();
              const existingChat = chatsResponse.data.find((c: any) => {
                // For private chats, check if the other user is a member
                if (c.type === 'private') {
                  return c.members?.some((m: any) => m.id.toString() === chatId) || 
                         c.participants?.some((p: any) => p.id.toString() === chatId) ||
                         c.otherUserId?.toString() === chatId;
                }
                return false;
              });

              if (existingChat) {
                console.log('✅ Found existing chat:', existingChat.id);
                chat = existingChat;
                addChat(existingChat);
                // Load messages for existing chat
                await loadMessages(existingChat.id);
              } else {
                console.log('🆕 No existing chat found. Will create when sending first message.');
                // Create a temporary chat object for UI purposes
                chat = {
                  id: `new-${chatId}`,
                  type: 'private' as const,
                  name: userData.fullName,
                  lastMessage: '',
                  lastMessageTime: undefined,
                  unreadCount: 0,
                  isOnline: onlineUsers.has(chatId)
                };
                console.log('✅ Created temporary chat object');
              }
            } catch (err: any) {
              console.error('❌ Error handling user chat:', err);
              // Even if we can't get user info, allow the chat interface
              setOtherUser({ id: chatId, fullName: 'User', username: 'user' });
              chat = {
                id: `new-${chatId}`,
                type: 'private' as const,
                name: 'User',
                lastMessage: '',
                lastMessageTime: undefined,
                unreadCount: 0,
                isOnline: false
              };
              console.log('⚠️ Using fallback chat object');
            }
          } else {
            // It's a group chat or existing chat ID
            try {
              const chatsResponse = await chatApi.getChats();
              chat = chatsResponse.data.find((c: any) => c.id === chatId);
              if (chat) {
                addChat(chat);
                await loadMessages(chat.id);
              } else {
                setError('Chat not found');
                return;
              }
            } catch (err: any) {
              console.error('Error loading chat:', err);
              setError('Failed to load chat');
              return;
            }
          }
        } else {
          // Chat exists in store, load messages
          if (!chat.id.startsWith('new-')) {
            await loadMessages(chat.id);
          }
        }

        // Check if we successfully got chat data
        if (!chat) {
          setError('Unable to load or create chat');
          return;
        }

        setChatData(chat);
        console.log('✅ Chat data set:', chat.name);
        
        // Join the chat room for real-time messaging
        if (socket && chat.id && !chat.id.startsWith('new-')) {
          joinChatRoom(chat.id);
          console.log('📬 Joined chat room:', chat.id);
        }

      } catch (err: any) {
        console.error('Error in loadChatData:', err);
        setError(err.response?.data?.error || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [chatId, currentUser]);

  // Load messages function
  const loadMessages = async (realChatId: string) => {
    try {
      setLoadingMessages(true);
      console.log('📬 Loading messages for chat:', realChatId);
      
      const response = await chatApi.getChatMessages(realChatId);
      // Handle API response format: { success: true, messages: [...] }
      const messagesData = response.data?.messages || response.data || [];
      console.log(`✅ Loaded ${messagesData.length} messages`);
      
      // Ensure messagesData is an array
      if (!Array.isArray(messagesData)) {
        console.warn('⚠️ Messages data is not an array:', messagesData);
        setChatMessages(realChatId, []);
        return;
      }
      
      // Transform API response to ChatMessage format
      const transformedMessages: ChatMessage[] = messagesData.map((msg: any) => ({
        id: msg.id.toString(),
        chatId: realChatId,
        senderId: msg.senderId.toString(),
        senderName: msg.senderName || msg.sender?.fullName || 'Unknown',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        status: msg.status || 'sent',
        type: msg.type || 'text',
        mediaFile: msg.media ? {
          id: msg.media.id,
          filename: msg.media.filename,
          url: msg.media.url,
          mimeType: msg.media.mimeType,
          size: msg.media.size,
        } : undefined,
      }));

      setChatMessages(realChatId, transformedMessages);
    } catch (err: any) {
      console.error('❌ Error loading messages:', err);
      // For new chats or empty chats, 404 is expected
      if (err.response?.status === 404) {
        console.log('📬 No messages found - this is a new chat');
        setChatMessages(realChatId, []); // Set empty messages array
      } else {
        console.error('Unexpected error loading messages:', err.response?.data || err.message);
        // Always set empty array on any error to prevent crashes
        setChatMessages(realChatId, []);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // Enhanced list with date separators and unread divider
  type EnhancedItem = { kind: 'message'; message: ChatMessage } | { kind: 'date'; label: string } | { kind: 'unread' };

  const firstUnreadIndex = useMemo(() => {
    const count = initialUnreadRef.current || 0;
    if (!messages || messages.length === 0 || count <= 0 || count > messages.length) return -1;
    return messages.length - count;
  }, [messages]);

  const enhancedData: EnhancedItem[] = useMemo(() => {
    const items: EnhancedItem[] = [];
    let prevDayKey: string | null = null;
    messages.forEach((msg, index) => {
      const d = new Date(msg.timestamp);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dayKey !== prevDayKey) {
        const label = d.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
        items.push({ kind: 'date', label });
        prevDayKey = dayKey;
      }
      if (firstUnreadIndex === index) {
        items.push({ kind: 'unread' });
      }
      items.push({ kind: 'message', message: msg });
    });
    return items;
  }, [messages, firstUnreadIndex]);

  const renderEnhancedItem = ({ item, index }: { item: EnhancedItem; index: number }) => {
    if (item.kind === 'date') {
      return (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <Text style={{ fontSize: 12, color: AppColors.textMuted, backgroundColor: AppColors.inputBackground, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
            {item.label}
          </Text>
        </View>
      );
    }
    if (item.kind === 'unread') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, paddingHorizontal: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: AppColors.divider }} />
          <Text style={{ marginHorizontal: 8, fontSize: 12, color: AppColors.unreadBadge, fontWeight: '600' }}>پیام‌های خوانده‌نشده</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: AppColors.divider }} />
        </View>
      );
    }
    const message = item.message;
    const isMyMessage = message.senderId === currentUser?.id.toString();
    // Determine consecutive
    let isConsecutive = false;
    for (let j = index - 1; j >= 0; j--) {
      const prev = enhancedData[j];
      if (prev.kind !== 'message') continue;
      const sameSender = prev.message.senderId === message.senderId;
      const sameDay = new Date(prev.message.timestamp).toDateString() === new Date(message.timestamp).toDateString();
      isConsecutive = sameSender && sameDay;
      break;
    }
    return (
      <MessageBubble
        message={message}
        isMyMessage={isMyMessage}
        showSenderName={isGroupChat && !isMyMessage && !isConsecutive}
        isGroupChat={isGroupChat}
        onLongPress={() => {
          console.log('Message options for:', message.id);
        }}
        onSenderPress={(senderId) => {
          console.log('View profile of:', senderId);
        }}
        showTimestamp={!isConsecutive}
        isConsecutive={isConsecutive}
      />
    );
  };

  // Socket event listeners for real-time messages
  useEffect(() => {
    if (!socket || !chatData) return;

    const handleNewMessage = (messageData: any) => {
      // Check if message belongs to current chat
      if (messageData.chatId === chatData.id || messageData.chatId === chatId) {
        const newMessage: ChatMessage = {
          id: messageData.id.toString(),
          chatId: chatData.id,
          senderId: messageData.senderId.toString(),
          senderName: messageData.senderName || 'Unknown',
          content: messageData.content,
          timestamp: new Date(messageData.timestamp),
          status: 'delivered',
          type: messageData.type || 'text',
        };

        addMessage(chatData.id, newMessage);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    const handleMessageStatusUpdate = (data: { messageId: string; status: 'delivered' | 'read' }) => {
      updateMessageStatus(data.messageId, data.status);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleMessageStatusUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleMessageStatusUpdate);
    };
  }, [socket, chatData, chatId, addMessage, updateMessageStatus]);

  // Send message function
  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;

    const messageContent = inputText.trim();
    setInputText('');

    try {
      let actualChatId = chatData?.id;
      
      // If it's a new chat (starts with 'new-'), create the real chat first
      if (chatData?.id.startsWith('new-')) {
        console.log('⚡ Creating real chat for new conversation...');
        try {
          const newChatResponse = await chatApi.createChat('private', undefined, [chatId]);
          const realChat = newChatResponse.data;
          if (realChat) {
            actualChatId = realChat.id;
            // Update the chat data
            setChatData(realChat);
            addChat(realChat);
            console.log('✅ Real chat created:', realChat.id);
          }
        } catch (createError: any) {
          console.error('❌ Failed to create chat:', createError);
          // Try to send message anyway - backend might handle chat creation
          console.log('🔄 Attempting to send message without explicit chat creation...');
        }
      }
      
      // Use original chatId if we couldn't create a proper chat
      if (!actualChatId || actualChatId.startsWith('new-')) {
        console.log('📬 Sending message directly to user:', chatId);
        // For direct user messaging, we can try using the user ID
        actualChatId = chatId;
      }

      console.log('📬 Sending message to chat/user:', actualChatId);
      
      // Send via API
      const response = await chatApi.sendMessage(actualChatId, messageContent, 'text');
      // Handle API response format: { success: true, message: {...} }
      const messageData = response.data?.message || response.data;
      console.log('✅ Message sent successfully:', messageData?.id || 'no id');

      // Create local message
      const newMessage: ChatMessage = {
        id: messageData?.id?.toString() || Date.now().toString(),
        chatId: actualChatId,
        senderId: currentUser.id.toString(),
        senderName: currentUser.fullName,
        content: messageContent,
        timestamp: new Date(),
        status: 'sent',
        type: 'text',
      };

      // Add to local state
      addMessage(actualChatId, newMessage);

      // Send via socket for real-time delivery
      if (socket) {
        socket.emit('send_message', {
          chatId: actualChatId,
          content: messageContent,
          type: 'text',
          receiverId: otherUser?.id || chatId, // Include receiver for direct messaging
        });
        console.log('📡 Message emitted to socket for real-time delivery');
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (err: any) {
      console.error('❌ Error sending message:', err);
      showError('Failed to send message. Please try again.');
      // Restore input text on error
      setInputText(messageContent);
    }
  };

  const renderMessage = ({ item: message }: { item: ChatMessage }) => {
    const isMyMessage = message.senderId === currentUser?.id.toString();
    
    return (
      <MessageBubble
        message={message}
        isMyMessage={isMyMessage}
        showSenderName={isGroupChat && !isMyMessage}
        isGroupChat={isGroupChat}
        onLongPress={() => {
          // Handle message options
          console.log('Message options for:', message.id);
        }}
        onSenderPress={(senderId) => {
          // Navigate to sender profile
          console.log('View profile of:', senderId);
        }}
      />
    );
  };

  // Chat header component
  const getChatTitle = () => {
    if (isGroupChat) {
      return chatData?.name || 'Group Chat';
    }
    return otherUser?.fullName || chatData?.name || 'Chat';
  };

  const getChatSubtitle = () => {
    if (isGroupChat) {
      const memberCount = chatData?.members?.length || 0;
      return `${memberCount} عضو`;
    }
    const isOnline = otherUser?.id ? onlineUsers.has(otherUser.id.toString()) : false;
    return isOnline ? 'آنلاین' : 'آفلاین';
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: AppColors.chatBackground }}>
        <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={{ color: AppColors.textMuted, marginTop: 8 }}>Loading chat...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: AppColors.chatBackground }}>
        <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
        <Text style={{ color: AppColors.error, marginBottom: 16 }}>{error}</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: AppColors.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: AppColors.textWhite }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
      <View className="flex-1" style={{ backgroundColor: AppColors.chatBackground }}>
        {/* Custom Header */}
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: () => (
              <Pressable 
                className="flex-row items-center flex-1"
                onPress={() => {
                  // Navigate to user/group profile
                  console.log('Navigate to profile');
                }}
              >
                <Image
                  source={{ 
                    uri: isGroupChat 
                      ? `https://i.pravatar.cc/150?u=group${chatData?.id}` 
                      : `https://i.pravatar.cc/150?u=${otherUser?.id || chatId}`
                  }}
                  className="w-10 h-10 rounded-full mr-3"
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-white">{getChatTitle()}</Text>
                  <Text className="text-xs text-blue-100">{getChatSubtitle()}</Text>
                </View>
              </Pressable>
            ),
            headerLeft: () => (
              <Pressable 
                onPress={() => router.back()}
                className="flex-row items-center mr-2"
                style={{ marginRight: 8, padding: 8 }}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </Pressable>
            ),
            headerRight: () => (
              <View className="flex-row items-center">
                <Pressable className="p-2 mr-2">
                  <Ionicons name="videocam" size={24} color="white" />
                </Pressable>
                <Pressable className="p-2 mr-2">
                  <Ionicons name="call" size={24} color="white" />
                </Pressable>
                <Pressable className="p-2">
                  <Ionicons name="ellipsis-vertical" size={24} color="white" />
                </Pressable>
              </View>
            ),
            headerStyle: { backgroundColor: AppColors.primary },
            headerTintColor: 'white',
          }}
        />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={enhancedData}
            keyExtractor={(_, i) => `itm-${i}`}
            renderItem={renderEnhancedItem}
            className="flex-1"
            style={{ backgroundColor: AppColors.chatBackground }}
            contentContainerStyle={{ 
              paddingVertical: 8,
              paddingHorizontal: 4,
            }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              setShowScrollBottom(y > 150);
            }}
            scrollEventThrottle={16}
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center" style={{ paddingTop: 100 }}>
                {loadingMessages ? (
                  <>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                    <Text style={{ color: AppColors.textMuted, marginTop: 8 }}>Loading messages...</Text>
                  </>
                ) : (
                  <>
                    <View style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: 'rgba(37, 211, 102, 0.1)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 20,
                    }}>
                      <Ionicons name="chatbubbles" size={48} color="#25D366" />
                    </View>
                    <Text style={{ 
                      color: AppColors.textPrimary, 
                      fontSize: 18,
                      fontWeight: '600',
                      marginBottom: 8,
                      textAlign: 'center' 
                    }}>
                      Start Your Conversation
                    </Text>
                    <Text style={{ 
                      color: AppColors.textMuted, 
                      fontSize: 14,
                      textAlign: 'center',
                      paddingHorizontal: 40,
                      lineHeight: 20
                    }}>
                      {isGroupChat 
                        ? 'Send your first message to this group!'
                        : `Send your first message to ${getChatTitle()}. Even if they're offline, they'll get it when they come back online.`
                      }
                    </Text>
                  </>
                )}
              </View>
            )}
          />

          {/* Message Input */}
          <View 
            className="flex-row items-end px-2 py-2"
            style={{ 
              backgroundColor: AppColors.background,
              borderTopWidth: 1,
              borderTopColor: AppColors.divider,
            }}
          >
            <View 
              className="flex-1 flex-row items-end rounded-3xl mx-1 px-3 py-2 min-h-[44px]"
              style={{
                backgroundColor: AppColors.inputBackground,
                borderWidth: 1,
                borderColor: AppColors.border,
              }}
            >
              <Pressable 
                className="mr-2 mb-1 p-1"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="add" size={24} color={AppColors.textMuted} />
              </Pressable>
          <TextInput
            className="flex-1 text-base py-2 max-h-32"
                placeholder="پیام خود را بنویسید..."
                placeholderTextColor={AppColors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
            maxLength={2000}
                textAlign="right"
                style={{
                  color: AppColors.textPrimary,
                  fontSize: 16,
              minHeight: 20,
              textAlignVertical: 'top',
              paddingVertical: Platform.OS === 'ios' ? 10 : 6,
                }}
              />
              <Pressable 
                className="ml-2 mb-1 p-1"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="camera" size={24} color={AppColors.textMuted} />
              </Pressable>
            </View>
            <Pressable
              onPress={sendMessage}
              className="w-11 h-11 rounded-full justify-center items-center ml-1"
              style={{
                backgroundColor: inputText.trim() ? AppColors.accent : AppColors.textMuted,
                elevation: 2,
                shadowColor: AppColors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={18}
                color={AppColors.textWhite}
              />
            </Pressable>
          </View>
          {/* Scroll to bottom button */}
          {showScrollBottom && (
            <Pressable
              onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
              style={{
                position: 'absolute',
                right: 16,
                bottom: 90,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: AppColors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 3,
                shadowColor: AppColors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            >
              <Ionicons name="chevron-down" size={22} color={AppColors.textWhite} />
            </Pressable>
          )}
        </KeyboardAvoidingView>
      </View>
      
      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        position="top"
      />
    </>
  );
}