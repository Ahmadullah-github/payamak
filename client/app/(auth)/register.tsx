// File: client/app/(auth)/register.tsx
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Text, View, StyleSheet, TextInput, Pressable, Alert } from 'react-native';

const Register = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState(''); 
  const [fullName, setFullName] = React.useState(''); 

  const { register } = useAuthStore(); 
  const router = useRouter();

  const handleRegister = async () => {
    const result = await register(username, password, fullName);
    if (result.success) {
      Alert.alert('Registration Successful', 'You can now log in.');
      router.replace('/login');
    } else {
      Alert.alert('Registration Failed', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder='Full name'
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Username (must be unique)</Text>
        <TextInput
          style={styles.input}
          placeholder='username'
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder='password'
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />

        <Pressable style={styles.submitButton} onPress={handleRegister}>
          <Text style={styles.submitText}>Register</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD', padding: 20 , marginTop: 50},
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  label: { marginTop: 10, fontWeight: '600', color: '#075E54' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginTop: 6 },
  submitButton: { marginTop: 20, backgroundColor: '#25D366', padding: 14, borderRadius: 24 },
  submitText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
