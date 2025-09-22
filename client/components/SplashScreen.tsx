// File: client/components/SplashScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // optional: nice icons

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="chatbubbles" size={72} color="#fff" />
      <Text style={styles.title}>Payamak</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#075E54', // WhatsApp dark green
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 20,
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
