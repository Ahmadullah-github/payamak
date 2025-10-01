// File: client/app/(auth)/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ErrorModal,
  Toast,
  Button,
  Input,
  Card,
  Divider,
} from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { AppColors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

interface ValidationErrors {
  username?: string;
  password?: string;
}

export default function LoginScreen() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const { login } = useAuthStore();
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Update form data helper
  const updateFormData = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
        return newErrors;
      });
    },
    []
  );

  // Validation function
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    return newErrors;
  };

  const handleLogin = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Trim and normalize just before submission
      const username = formData.username.trim().toLowerCase();
      const password = formData.password.trim();

      setLoading(true);
      const result = await login(username, password);
      setLoading(false);
    if (!result.success) {
      setErrorModal({
        visible: true,
        title: 'Login Failed',
        message: result.message || 'Invalid credentials. Please try again.',
      });
    } else {
      showSuccess('Welcome back!');
    }
    // If successful, redirect is handled by _layout.tsx
  };

  const navigateToRegister = () => {
    router.push('/register');
  };

  return (
    <>
      <StatusBar backgroundColor={AppColors.primary} barStyle="light-content" />
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryLight, AppColors.accent]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <View style={styles.iconBackground}>
                    <Ionicons
                      name="chatbubbles"
                      size={48}
                      color={AppColors.textWhite}
                    />
                  </View>
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Sign in to continue your conversations
                </Text>
              </View>

              {/* Login Form */}
              <Card style={styles.formCard} borderRadius="large">
                <View style={styles.form}>
                  <Input
                    label="Username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChangeText={(text) => updateFormData('username', text)}
                    error={errors.username}
                    leftIcon="person-outline"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                  />

                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChangeText={(text) => updateFormData('password', text)}
                    error={errors.password}
                    leftIcon="lock-closed-outline"
                    showPasswordToggle
                    autoCapitalize="none"
                    autoComplete="password"
                  />

                  <Button
                    title="Sign In"
                    onPress={handleLogin}
                    loading={loading}
                    variant="gradient"
                    size="large"
                    fullWidth
                    style={styles.loginButton}
                  />

                  <Divider label="or" style={styles.divider} />

                  <Button
                    title="Create New Account"
                    onPress={navigateToRegister}
                    variant="outline"
                    size="large"
                    fullWidth
                    icon="person-add-outline"
                    style={styles.registerButton}
                  />
                </View>
              </Card>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  By continuing, you agree to our
                </Text>
                <Text style={styles.linkText}>Terms of Service</Text>
                <Text style={styles.footerText}> and </Text>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() =>
          setErrorModal({ visible: false, title: '', message: '' })
        }
        type="error"
      />

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


const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: AppColors.textWhite,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textWhite,
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: 24,
  },
  form: {
    paddingVertical: 8,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 8,
  },
  registerButton: {
    marginTop: 8,
    borderColor: AppColors.primary,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: AppColors.textWhite,
    opacity: 0.8,
  },
  linkText: {
    fontSize: 12,
    color: AppColors.textWhite,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
