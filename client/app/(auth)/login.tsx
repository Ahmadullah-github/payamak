// File: client/app/(auth)/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    const result = await login(username, password);
    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
    // If successful, redirect is handled by _layout.tsx
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} />
      </View>

      <Pressable onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.footerText}>
          Don’t have an account? Register here.
        </Text>
      </Pressable>
    </View>
  );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: 24,
        backgroundColor: '#f7f8fa',
    },
    title: {
        color: '#eee',
        fontSize: 20,
    },
    input: {
        height: 48,
        borderColor: '#d0d7de',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginVertical: 8,
        backgroundColor: '#ffffff',
        fontSize: 16,
    },
    buttonContainer: {
        width: '100%',
        marginVertical: 6,
        borderRadius: 8,
        overflow: 'hidden',
    },
    footerText: {
        textAlign: 'center',
        color: '#6c757d',
        marginTop: 16,
        fontSize: 13,
    }
})