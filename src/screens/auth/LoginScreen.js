import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Image,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme/theme';
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const LoginScreen = ({ navigation }) => {
  // State Management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { login } = useAuth();

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email or phone number is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,}$/;
      if (!emailRegex.test(email) && !phoneRegex.test(email.replace(/\D/g, ''))) {
        newErrors.email = 'Please enter a valid email or phone number';
      }
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Login
  const handleLogin = async () => {
    if (!validateForm()) {
      showAlert('Validation Error', 'Please fill in all fields correctly');
      return;
    }

    setLoading(true);

    try {
      // Call authentication context which sets userRole and triggers RootNavigator
      await login(email, password);
    } catch (error) {
      showAlert('Login Failed', error.message || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  // Handle field focus animation
  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
    Animated.spring(fadeAnim, {
      toValue: 0.95,
      useNativeDriver: false,
    }).start();
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  return (
    <ScreenWrapper
      useSafeArea={false}
      style={styles.screen}
      statusBarStyle="dark-content"
      statusBarColor="#FFFFFF"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/logo1.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Heading */}
            <Text style={styles.heading}>Welcome Back</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Sign in to access roadside assistance services
            </Text>
          </View>

          {/* Login Card */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Card padded={false} style={styles.card}>
            {/* Role Dropdown Removed (auto-detected from login email) */}

            {/* Email/Phone Input */}
            <Input
              label="Email or Phone Number"
              placeholder="example@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: '' });
              }}
              onFocus={() => handleFieldFocus('email')}
              onBlur={handleFieldBlur}
              keyboardType="email-address"
              editable={!loading}
              error={errors.email}
              icon={<Ionicons name="mail-outline" size={20} color={colors.secondary} />}
              labelStyle={styles.inputLabel}
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
            />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: '' });
              }}
              onFocus={() => handleFieldFocus('password')}
              onBlur={handleFieldBlur}
              secureTextEntry={!showPassword}
              editable={!loading}
              error={errors.password}
              icon={<Ionicons name="lock-closed-outline" size={20} color={colors.secondary} />}
              labelStyle={styles.inputLabel}
              inputContainerStyle={styles.inputContainer}
              rightIcon={(
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.secondary}
                  />
                </TouchableOpacity>
              )}
              inputStyle={styles.input}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={loading}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              isLoading={loading}
              disabled={loading}
              style={styles.signInButton}
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                <Ionicons name="logo-google" size={24} color={colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continue with Apple"
              >
                <Ionicons name="logo-apple" size={24} color={colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continue with Facebook"
              >
                <Ionicons name="logo-facebook" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            </Card>
          </Animated.View>

          {/* Sign Up Section */}
          <View style={styles.signUpSection}>
            <Text style={styles.signUpText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              disabled={loading}
            >
              <Text style={styles.signUpLink}>Sign Up Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  logoContainer: {
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
  },
  heading: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: '#0F4C81',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 320,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F0F4F8',
    ...shadows.md,
  },
  inputLabel: {
    color: '#0F4C81',
  },
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E0E8F0',
    borderRadius: 12,
    minHeight: 52,
  },
  input: {
    color: '#333333',
    fontWeight: typography.weights.medium,
  },
  passwordToggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  signInButton: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E8F0',
  },
  dividerText: {
    color: '#999999',
    fontSize: typography.sizes.xs,
    marginHorizontal: spacing.md,
    fontWeight: typography.weights.medium,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E0E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  signUpSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  signUpText: {
    fontSize: typography.sizes.sm,
    color: '#666666',
    marginBottom: spacing.xs,
  },
  signUpLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
});

export default LoginScreen;
