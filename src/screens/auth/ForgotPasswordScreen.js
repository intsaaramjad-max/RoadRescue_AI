import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Header } from '../../components/Header';
import { colors, typography, spacing } from '../../theme/theme';
import { API_URL } from '../../config/api.config';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
    }
  };

  const handleSendOtp = async () => {
    const targetEmail = email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setIsError(true);
      setStatusMessage('Please enter a valid email address');
      showAlert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.toLowerCase() }),
      });
      const data = await response.json();

      if (response.ok) {
        const msg = data.message || 'OTP code generated!';
        setStatusMessage(`✅ ${msg}`);
        setIsError(false);
        showAlert('OTP Sent 📬', msg);

        setTimeout(() => {
          navigation.navigate('OtpVerification', { email: targetEmail.toLowerCase() });
        }, 1200);
      } else {
        setIsError(true);
        setStatusMessage(data.message || 'Email not found');
        showAlert('Error', data.message || 'Email not found');
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      setStatusMessage('Network error. Check backend connection.');
      showAlert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Forgot Password" showBack />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={styles.logoWrap}>
            <Image source={require('../../../assets/logo1.png')} style={styles.logo} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your registered email to receive an OTP code.</Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Email Address"
              placeholder="Enter your registered email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => setEmail(text)}
              icon={<Ionicons name="mail-outline" size={19} color={colors.secondary} />}
            />

            {statusMessage && (
              <View style={[styles.msgContainer, isError ? styles.errorBg : styles.successBg]}>
                <Text style={[styles.msgText, isError ? styles.errorTxt : styles.successTxt]}>
                  {statusMessage}
                </Text>
              </View>
            )}

            <Button
              title={loading ? 'Sending OTP...' : 'Send Verification Code'}
              onPress={handleSendOtp}
              isLoading={loading}
              disabled={loading}
              style={styles.submitBtn}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 360,
  },
  formCard: {
    marginBottom: spacing.xl,
    width: '100%',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  msgContainer: {
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.xs,
  },
  errorBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  successBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  msgText: {
    fontSize: typography.sizes.xs,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorTxt: {
    color: colors.error,
  },
  successTxt: {
    color: colors.success,
  },
});
