import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';

const AboutScreen = () => {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'About' }} />
      <Text style={styles.text}>About Screen</Text>
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

export default AboutScreen;
