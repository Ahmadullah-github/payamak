// File: client/app/(app)/chat.tsx
import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet, Pressable } from 'react-native';
import  {useAuthStore} from '../../store/authStore';
import { Stack } from 'expo-router';
import axios from 'axios';
import { API_URL } from '@/config';

export default function ChatScreen() {
  const { logout } = useAuthStore();
  let test;
  const dataFromDB = async () => {
    await axios.get(`http://192.168.7.208:3000`).then((data) => {
      test = data.data
      console.log(test)
    }).catch(error => {
      console.log(`error: ${error}`)
    })
  }
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Chat', headerRight: () => <Button title="Logout" onPress={logout} /> }} />
      <Text style={styles.text}>Welcome to the Chat App! mr hamayoiun </Text>
      <Text>You are successfully logged in.</Text>
      <Pressable onPress={dataFromDB}><Text style={{fontSize: 200}}>btn</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, marginBottom: 20 },
});