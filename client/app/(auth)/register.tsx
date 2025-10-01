// File: client/app/(auth)/register.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
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
  fullName?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const { register } = useAuthStore();
  const router = useRouter();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Update form data helper
  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    const fullName = formData.fullName.trim();
    if (!fullName) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    const username = formData.username.trim();
    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username =
        'Username can only contain letters, numbers, and underscores';
    }

    // Password: do NOT trim
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleRegister = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const result = await register(
      formData.username.trim().toLowerCase(),
      formData.password,
      formData.fullName.trim()
    );
    setLoading(false);

    if (result.success) {
      showSuccess('Registration successful! You can now log in.');
      setTimeout(() => router.replace('/'), 1500);
    } else {
      setErrorModal({
        visible: true,
        title: 'Registration Failed',
        message: result.message || 'An error occurred during registration.',
      });
    }
  };

  const navigateToLogin = () => {
    router.replace('/');
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
                      name="person-add"
                      size={48}
                      color={AppColors.textWhite}
                    />
                  </View>
                </View>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Join the conversation and connect with others
                </Text>
              </View>

              {/* Register Form */}
              <Card style={styles.formCard} borderRadius="large">
                <View style={styles.form}>
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChangeText={(text) => updateFormData('fullName', text)}
                    error={errors.fullName}
                    leftIcon="person-outline"
                    autoCapitalize="words"
                    autoComplete="name"
                    required
                  />

                  <Input
                    label="Username"
                    placeholder="Choose a unique username"
                    value={formData.username}
                    onChangeText={(text) => updateFormData('username', text)}
                    error={errors.username}
                    leftIcon="at-outline"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    required
                  />

                  <Input
                    label="Password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChangeText={(text) => updateFormData('password', text)}
                    error={errors.password}
                    leftIcon="lock-closed-outline"
                    showPasswordToggle
                    autoCapitalize="none"
                    autoComplete="new-password"
                    required
                  />

                  <Input
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChangeText={(text) =>
                      updateFormData('confirmPassword', text)
                    }
                    error={errors.confirmPassword}
                    leftIcon="lock-closed-outline"
                    showPasswordToggle
                    autoCapitalize="none"
                    autoComplete="new-password"
                    required
                  />

                  <Button
                    title="Create Account"
                    onPress={handleRegister}
                    loading={loading}
                    variant="gradient"
                    size="large"
                    fullWidth
                    style={styles.registerButton}
                  />

                  <Divider label="or" style={styles.divider} />

                  <Button
                    title="Already have an account? Sign In"
                    onPress={navigateToLogin}
                    variant="outline"
                    size="large"
                    fullWidth
                    icon="log-in-outline"
                    style={styles.loginButton}
                  />
                </View>
              </Card>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  By creating an account, you agree to our
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
};

export default Register;


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
    marginBottom: 32,
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
    paddingHorizontal: 16,
  },
  formCard: {
    marginBottom: 24,
  },
  form: {
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 8,
  },
  loginButton: {
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
    textAlign: 'center',
  },
  linkText: {
    fontSize: 12,
    color: AppColors.textWhite,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
