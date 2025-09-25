// app/_error.tsx
import { Text, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function ErrorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops! Page Not Found 😕</Text>
      <Text style={styles.subtitle}>
        The page you're looking for doesn't exist.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  link: {
    fontSize: 18,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});