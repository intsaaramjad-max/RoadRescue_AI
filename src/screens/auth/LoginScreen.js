import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
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
      // Call authentication context (now queries backend server)
      const data = await login(email, password);
      
      // Navigate based on role returned by backend
      switch (data.user.role) {
        case 'DRIVER':
          navigation.navigate('DriverNavigator');
          break;
        case 'MECHANIC':
          navigation.navigate('MechanicNavigator');
          break;
        case 'ADMIN':
          navigation.navigate('AdminNavigator');
          break;
        default:
          showAlert('Error', 'Invalid role detected');
      }
    } catch (error) {
      showAlert('Login Failed', error.message || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = () => {
    if (!email.trim()) {
      showAlert('Error', 'Please enter your email or phone number');
      return;
    }
    navigation.navigate('ForgotPassword', { email });
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
    <SafeAreaView style={styles.safeContainer}>
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
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            {/* Role Dropdown Removed (auto-detected from login email) */}

            {/* Email/Phone Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email or Phone Number</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'email' && styles.inputContainerFocused,
                  errors.email && styles.inputContainerError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#0F4C81"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor="#CCC"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors({ ...errors, email: '' });
                  }}
                  onFocus={() => handleFieldFocus('email')}
                  onBlur={handleFieldBlur}
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'password' && styles.inputContainerFocused,
                  errors.password && styles.inputContainerError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#0F4C81"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#CCC"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrors({ ...errors, password: '' });
                  }}
                  onFocus={() => handleFieldFocus('password')}
                  onBlur={handleFieldBlur}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#0F4C81"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={loading}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                styles.signInButton,
                loading && styles.signInButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: '#0F4C81' }]}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={24} color="#0F4C81" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: '#0F4C81' }]}
                disabled={loading}
              >
                <Ionicons name="logo-apple" size={24} color="#0F4C81" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: '#0F4C81' }]}
                disabled={loading}
              >
                <Ionicons name="logo-facebook" size={24} color="#0F4C81" />
              </TouchableOpacity>
            </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F4C81',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: '85%',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 28,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F4F8',
  },

  // Form Group
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F4C81',
    marginBottom: 8,
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#F9FAFB',
  },
  inputContainerFocused: {
    borderColor: '#0F4C81',
    backgroundColor: '#F0F4F8',
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#E53935',
    backgroundColor: '#FFEBEE',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderStyle: 'none',
      },
    }),
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 4,
  },

  // Picker
  picker: {
    flex: 1,
    color: '#333',
  },
  pickerItem: {
    fontSize: 15,
    color: '#333',
  },

  // Error Text
  errorText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    marginLeft: 4,
  },

  // Forgot Password
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#FF7A00',
    fontSize: 13,
    fontWeight: '600',
  },

  // Sign In Button
  signInButton: {
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E8F0',
  },
  dividerText: {
    color: '#999',
    fontSize: 12,
    marginHorizontal: 12,
    fontWeight: '500',
  },

  // Social Buttons
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },

  // Sign Up Section
  signUpSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  signUpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF7A00',
  },
});

export default LoginScreen;
