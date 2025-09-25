// File: app/(app)/chat/[id].tsx - Updated for new chat system
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { AppColors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/authStore';
import { useSocketStore } from '../../../store/socketStore';
import { useMessageStore, ChatMessage, Chat } from '../../../store/messageStore';
import { chatApi } from '../../../api';
import MessageBubble, { TypingIndicator } from '../../../components/chat/MessageBubble';
import { DirectChatHeader, GroupChatHeader, OnlineMembersIndicator } from '../../../components/chat/ChatHeader';

export default function ChatScreen() {
  const { id: chatId, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { user: currentUser } = useAuthStore();
  const { socket, onlineUsers } = useSocketStore();
  
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

  // Load chat data and messages
  useEffect(() => {
    const loadChatData = async () => {
      if (!chatId || !currentUser) return;
      
      setLoading(true);
      try {
        // Load chat info if not in store
        if (!chat) {
          const chatResponse = await chatApi.getChats();
          const foundChat = chatResponse.data.find((c: any) => c.id === chatId);
          if (foundChat) {
            addChat(foundChat);
          }
        }
        
        // Load messages
        const messagesResponse = await chatApi.getChatMessages(chatId);
        setChatMessages(chatId, messagesResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error loading chat data:', err);
        setError('خطا در بارگذاری چت');
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [chatId, currentUser, chat, addChat, setChatMessages]);

  // Join chat room when component mounts
  useEffect(() => {
    if (currentUser && chatId && socket) {
      socket.emit('join_chat_room', { chatId });
    }
  }, [currentUser, chatId, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for incoming messages
    const handleNewMessage = (message: ChatMessage) => {
      if (message.chatId === chatId) {
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

    // Listen for typing indicators
    const handleUserTyping = (data: { userId: string; chatId: string }) => {
      if (data.chatId === chatId && data.userId !== currentUser?.id.toString()) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      }
    };

    const handleUserStoppedTyping = (data: { userId: string; chatId: string }) => {
      if (data.chatId === chatId) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleMessageStatusUpdate);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleMessageStatusUpdate);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, chatId, addMessage, updateMessageStatus, currentUser]);

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser || !chatId) return;

    const tempMessage: ChatMessage = {
      id: Date.now().toString(),
      chatId: chatId,
      senderId: currentUser.id.toString(),
      senderName: currentUser.fullName,
      content: inputText.trim(),
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };

    // Add message to local state immediately
    addMessage(chatId, tempMessage);
    const messageContent = inputText.trim();
    setInputText('');

    // Send to server via socket
    if (socket) {
      socket.emit('send_message', {
        chatId: chatId,
        content: messageContent,
        type: 'text'
      });
    }

    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    // Send typing indicator
    if (socket && chatId && text.trim()) {
      socket.emit('typing_start', { chatId });
    } else if (socket && chatId) {
      socket.emit('typing_stop', { chatId });
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

  const renderHeader = () => {
    if (!chat) return null;
    
    return (
      <>
        {isGroupChat && chat.members && (
          <OnlineMembersIndicator members={chat.members} />
        )}
      </>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <TypingIndicator 
        senderName={isGroupChat ? `${typingUsers.length} نفر` : undefined}
        isGroupChat={isGroupChat}
      />
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: AppColors.chatBackground }}>
        <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text className="mt-4" style={{ color: AppColors.textMuted }}>در حال بارگذاری...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: AppColors.chatBackground }}>
        <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
        <Text style={{ color: AppColors.error }}>{error}</Text>
        <Pressable 
          className="mt-4 px-6 py-2 rounded-lg"
          style={{ backgroundColor: AppColors.primary }}
          onPress={() => {
            // Navigate back instead of reload
            router.back();
          }}
        >
          <Text style={{ color: 'white' }}>تلاش مجدد</Text>
        </Pressable>
      </View>
    );
  }

  if (!chat) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: AppColors.chatBackground }}>
        <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
        <Text style={{ color: AppColors.textMuted }}>چت یافت نشد</Text>
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
            header: () => (
              isGroupChat ? (
                <GroupChatHeader 
                  chat={chat} 
                  onCallPress={() => console.log('Group call')}
                  onVideoCallPress={() => console.log('Group video call')}
                />
              ) : (
                <DirectChatHeader 
                  chat={chat}
                  onCallPress={() => console.log('Direct call')}
                  onVideoCallPress={() => console.log('Direct video call')}
                />
              )
            ),
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
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderTypingIndicator}
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
                onChangeText={handleInputChange}
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