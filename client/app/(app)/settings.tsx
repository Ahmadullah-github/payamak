import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Text style={styles.text}>Settings Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
});

export default SettingsScreen;
