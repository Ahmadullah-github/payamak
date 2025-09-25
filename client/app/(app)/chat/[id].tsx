// File: app/(app)/chat/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack } from 'expo-router';
import { AppColors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/authStore';
import { useSocketStore } from '../../../store/socketStore';
import { useMessageStore, ChatMessage, Chat } from '../../../store/messageStore';
import { chatApi } from '../../../api';
import MessageBubble, { TypingIndicator } from '../../../components/chat/MessageBubble';
import { DirectChatHeader, GroupChatHeader, OnlineMembersIndicator } from '../../../components/chat/ChatHeader';

interface ChatScreenProps {
  // The component will receive chatId and type from params
}

export default function ChatScreen() {
  const { id: chatId, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { user: currentUser } = useAuthStore();
  const { socket, onlineUsers, sendMessage: socketSendMessage, joinChatRoom } = useSocketStore();
  
  const { 
    getMessagesForChat, 
    addMessage, 
    updateMessageStatus, 
    setChatMessages,
    getChat,
    addChat,
    setActiveChat
  } = useMessageStore();
  
  const messages = chatId ? getMessagesForChat(chatId) : [];
  const chat = chatId ? getChat(chatId) : null;
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const isGroupChat = chat?.type === 'group' || type === 'group';

  // Set active chat
  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId);
    }
    return () => setActiveChat(null);
  }, [chatId, setActiveChat]);

  // Join chat room when component mounts
  useEffect(() => {
    if (currentUser && chatUserId && socket) {
      joinChatRoom(currentUser.id.toString(), chatUserId);
    }
  }, [currentUser, chatUserId, socket, joinChatRoom]);

  // Mock chat user data (in real app, fetch from API)
  useEffect(() => {
    // This should be fetched from your API based on chatUserId
    const mockChatUser: ChatUser = {
      id: chatUserId || '1',
      name: chatUserId === '1' ? 'احمد ولی' : 'فاطمه رضایی',
      avatarUrl: `https://i.pravatar.cc/150?u=${chatUserId}`,
      isOnline: onlineUsers.has(chatUserId || ''),
    };
    setChatUser(mockChatUser);
  }, [chatUserId, onlineUsers]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for incoming messages
    const handleNewMessage = (message: MessageType) => {
      // Only add message if it's for this chat
      const messageChatId = generateChatId(message.senderId, message.receiverId);
      if (messageChatId === chatId) {
        addMessage(chatId, message);
        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    // Listen for message status updates
    const handleMessageStatusUpdate = (data: { messageId: string; status: 'delivered' | 'read' }) => {
      updateMessageStatus(data.messageId, data.status);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleMessageStatusUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleMessageStatusUpdate);
    };
  }, [socket, chatId, addMessage, updateMessageStatus]);

  // Load chat history (mock data for now)
  useEffect(() => {
    if (!chatId) return;
    
    // In real app, fetch from API
    const mockMessages: MessageType[] = [
      {
        id: '1',
        senderId: chatUserId || '1',
        receiverId: currentUser?.id.toString() || '2',
        content: 'سلام، چطوری؟',
        timestamp: new Date(Date.now() - 3600000),
        status: 'read',
        type: 'text',
      },
      {
        id: '2',
        senderId: currentUser?.id.toString() || '2',
        receiverId: chatUserId || '1',
        content: 'سلام، ممنون. تو چطوری؟',
        timestamp: new Date(Date.now() - 3000000),
        status: 'delivered',
        type: 'text',
      },
      {
        id: '3',
        senderId: chatUserId || '1',
        receiverId: currentUser?.id.toString() || '2',
        content: 'عالی! فردا جلسه داریم، ساعت چند مناسبه؟',
        timestamp: new Date(Date.now() - 1800000),
        status: 'read',
        type: 'text',
      },
    ];
    setChatMessages(chatId, mockMessages);
  }, [chatId, chatUserId, currentUser, setChatMessages]);

  const sendMessage = () => {
    if (!inputText.trim() || !currentUser || !chatUser || !chatId) return;

    const newMessage: MessageType = {
      id: Date.now().toString(),
      senderId: currentUser.id.toString(),
      receiverId: chatUser.id,
      content: inputText.trim(),
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };

    // Add message to local state immediately
    addMessage(chatId, newMessage);
    setInputText('');

    // Send to server via socket
    socketSendMessage(chatUser.id, newMessage.content, 'text');

    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item: message }: { item: MessageType }) => {
    const isMyMessage = message.senderId === currentUser?.id.toString();
    const messageTime = new Date(message.timestamp).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        className={`flex-row mb-1 px-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}
        style={{ marginBottom: 4 }}
      >
        <View
          className={`max-w-[80%] rounded-lg px-3 py-2 ${
            isMyMessage
              ? 'rounded-br-sm'
              : 'rounded-bl-sm'
          }`}
          style={{
            backgroundColor: isMyMessage ? AppColors.messageSent : AppColors.messageReceived,
            elevation: 1,
            shadowColor: AppColors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}
        >
          <Text
            className="text-base leading-5"
            style={{
              color: AppColors.textPrimary,
              fontSize: 16,
              lineHeight: 20,
              textAlign: 'right',
            }}
          >
            {message.content}
          </Text>
          <View className={`flex-row items-center justify-end mt-1`}>
            <Text
              className="text-xs"
              style={{
                color: AppColors.textMuted,
                fontSize: 11,
                marginRight: isMyMessage ? 4 : 0,
              }}
            >
              {messageTime}
            </Text>
            {isMyMessage && (
              <View>
                {message.status === 'read' && (
                  <Ionicons name="checkmark-done" size={16} color={AppColors.accent} />
                )}
                {message.status === 'delivered' && (
                  <Ionicons name="checkmark-done" size={16} color={AppColors.textMuted} />
                )}
                {message.status === 'sent' && (
                  <Ionicons name="checkmark" size={16} color={AppColors.textMuted} />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!chatUser) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: AppColors.chatBackground }}>
        <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
        <Text style={{ color: AppColors.textMuted }}>Loading...</Text>
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
                  // Navigate to user profile
                }}
              >
                <Image
                  source={{ uri: chatUser.avatarUrl }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-white">{chatUser.name}</Text>
                  <Text className="text-xs text-blue-100">
                    {chatUser.isOnline ? 'آنلاین' : 'آفلاین'}
                  </Text>
                </View>
              </Pressable>
            ),
            headerLeft: () => (
              <Pressable 
                onPress={() => router.back()}
                className="flex-row items-center mr-2"
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
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            className="flex-1"
            style={{ backgroundColor: AppColors.chatBackground }}
            contentContainerStyle={{ 
              paddingVertical: 8,
              paddingHorizontal: 4,
            }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
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
                className="flex-1 text-base py-2 max-h-24"
                placeholder="پیام خود را بنویسید..."
                placeholderTextColor={AppColors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                textAlign="right"
                style={{
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  minHeight: 20,
                  textAlignVertical: 'center',
                  paddingVertical: Platform.OS === 'ios' ? 8 : 4,
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
        </KeyboardAvoidingView>
      </View>
    </>
  );
}