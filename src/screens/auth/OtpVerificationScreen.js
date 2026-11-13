import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { assertSecureWebApi } from '../../utils/secureApi';
import { useAuth } from '../../context/AuthContext';
import {
  createPhoneRecaptcha,
  getFirebasePhoneErrorMessage,
  getVerifiedPhoneIdToken,
  requestPhoneCode,
} from '../../services/firebasePhoneAuth';

const RESEND_SECONDS = 30;

// Set DEMO_MODE to true to bypass Firebase SMS for demo testing.
// Set to false to re-enable real live Firebase Phone SMS verification.
const DEMO_MODE = true;
const DEMO_OTP = '123456';

export default function OtpVerificationScreen({ route, navigation }) {
  const mode = route?.params?.mode === 'recovery' ? 'recovery' : 'signup';
  const { pendingSignup, completePhoneSignup } = useAuth();
  const phone = route?.params?.phone || pendingSignup?.phone || '';
  const verifierRef = useRef(null);
  const confirmationRef = useRef(null);
  const submittingRef = useRef(false);
  const sendingRef = useRef(false);
  const cooldownRef = useRef(0);
  const [code, setCode] = useState(DEMO_MODE ? DEMO_OTP : '');
  const [idToken, setIdToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [recaptchaReady, setRecaptchaReady] = useState(DEMO_MODE ? true : false);
  const [codeSent, setCodeSent] = useState(DEMO_MODE ? true : false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(
    DEMO_MODE ? `Demo Mode Active: Enter OTP ${DEMO_OTP} to verify (Firebase SMS bypassed).` : ''
  );

  const sendCode = useCallback(async (verifier = verifierRef.current) => {
    if (sendingRef.current || cooldownRef.current > 0) return;
    if (!phone) {
      setError('Phone number is unavailable. Return to the form and try again.');
      return;
    }

    setSending(true);
    sendingRef.current = true;
    setError('');
    setMessage('');

    if (DEMO_MODE) {
      setTimeout(() => {
        setCodeSent(true);
        setCode(DEMO_OTP);
        cooldownRef.current = RESEND_SECONDS;
        setCooldown(RESEND_SECONDS);
        setMessage(`Demo Mode: Code is ${DEMO_OTP} (Firebase SMS bypassed).`);
        sendingRef.current = false;
        setSending(false);
      }, 400);
      return;
    }

    /* ── Original Firebase Phone Auth (Preserved) ── */
    try {
      confirmationRef.current = await requestPhoneCode(phone, verifier);
      setCodeSent(true);
      cooldownRef.current = RESEND_SECONDS;
      setCooldown(RESEND_SECONDS);
      setMessage(`A verification code was sent to ${phone}.`);
    } catch (requestError) {
      setError(getFirebasePhoneErrorMessage(requestError));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
    /* ── End Original Firebase Code ── */
  }, [phone]);

  useEffect(() => {
    if (DEMO_MODE) {
      setCodeSent(true);
      setCode(DEMO_OTP);
      setRecaptchaReady(true);
      setMessage(`Demo Mode Active: Enter OTP ${DEMO_OTP} to verify (Firebase SMS bypassed).`);
      return undefined;
    }

    /* ── Original Firebase reCAPTCHA initialization (Preserved) ── */
    if (Platform.OS !== 'web') {
      setError('Firebase phone signup is currently available on Web only.');
      return undefined;
    }
    if (mode === 'signup' && !pendingSignup) {
      setError('Signup details are missing. Return to signup and try again.');
      return undefined;
    }

    let active = true;
    try {
      const verifier = createPhoneRecaptcha('firebase-phone-recaptcha', () => {
        if (active) {
          setError('The reCAPTCHA check expired. Complete the check again before requesting a code.');
        }
      });
      verifierRef.current = verifier;
      verifier.render()
        .then(() => {
          if (active) setRecaptchaReady(true);
        })
        .catch((captchaError) => {
          if (active) setError(getFirebasePhoneErrorMessage(captchaError));
        });
    } catch (captchaError) {
      setError(getFirebasePhoneErrorMessage(captchaError));
    }

    return () => {
      active = false;
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    };
    /* ── End Original Firebase reCAPTCHA ── */
  }, [mode, pendingSignup, sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((value) => {
        const next = Math.max(0, value - 1);
        cooldownRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const verifyCode = async () => {
    if (submittingRef.current || verifying) return;
    submittingRef.current = true;
    setVerifying(true);
    setError('');
    setMessage('');
    try {
      if (DEMO_MODE) {
        // Demo Verification: Accept 123456 or any 6-digit OTP
        if (code.length !== 6) {
          throw new Error('Please enter a 6-digit code (e.g. 123456).');
        }
        const demoIdToken = 'demo-firebase-id-token';
        if (mode === 'signup') {
          const result = await completePhoneSignup(demoIdToken);
          if (result?.user?.role === 'MECHANIC') {
            navigation.navigate('SignUp', { step: 3 });
          }
          return;
        }
        setIdToken(demoIdToken);
        setMessage('Phone verified (Demo Mode). Enter a new password to continue.');
        return;
      }

      /* ── Original Firebase Verification (Preserved) ── */
      if (!confirmationRef.current) throw new Error('Request a verification code first.');
      const verifiedIdToken = await getVerifiedPhoneIdToken(confirmationRef.current, code);
      if (mode === 'signup') {
        const result = await completePhoneSignup(verifiedIdToken);
        if (result.user.role === 'MECHANIC') {
          navigation.navigate('SignUp', { step: 3 });
        }
        return;
      }
      setIdToken(verifiedIdToken);
      setMessage('Phone verified. Enter a new password to continue.');
      /* ── End Original Firebase Code ── */
    } catch (verifyError) {
      setError(getFirebasePhoneErrorMessage(verifyError));
    } finally {
      submittingRef.current = false;
      setVerifying(false);
    }
  };

  const resetPassword = async () => {
    if (!idToken) {
      setError('Verify your phone number before resetting the password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Use a password with at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setResetting(true);
    setError('');
    try {
      if (DEMO_MODE) {
        setMessage('Password updated successfully (Demo Mode)! Redirecting to login...');
        setTimeout(() => navigation.navigate('Login'), 1500);
        return;
      }

      /* ── Original API Reset Password (Preserved) ── */
      assertSecureWebApi();
      const response = await fetch(`${API_URL}/auth/firebase-recover-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Password reset failed (${response.status}).`);
      setMessage(data.message || 'If this verified phone is associated with an account, its password has been updated.');
      setTimeout(() => navigation.navigate('Login'), 1800);
      /* ── End Original API Reset Password ── */
    } catch (resetError) {
      setError(resetError.message || 'Unable to reset the password. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title={mode === 'recovery' ? 'Phone Verification' : 'Verify Phone'} showBack />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text style={styles.title}>
            {idToken ? 'Create a new password' : 'Enter your verification code'}
          </Text>
          {DEMO_MODE && !idToken && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>⚡ DEMO MODE: Firebase SMS Bypassed (Code: 123456)</Text>
            </View>
          )}
          <Text style={styles.subtitle}>
            {idToken
              ? 'Your phone was verified. Choose a new password for your RoadRescue account.'
              : DEMO_MODE
              ? `Demo mode is enabled for ${phone || 'your phone'}. Enter code 123456 to continue.`
              : `We will send a six-digit Firebase SMS code to ${phone || 'your phone number'}.`}
          </Text>

          {!idToken ? (
            <>
              {!DEMO_MODE && <View nativeID="firebase-phone-recaptcha" style={styles.recaptcha} />}
              {!codeSent ? (
                <Button
                  title={sending ? 'Requesting SMS…' : 'Send Verification Code'}
                  onPress={() => sendCode()}
                  isLoading={sending}
                  disabled={sending || !recaptchaReady}
                  style={styles.action}
                />
              ) : (
                <>
                  <TextInput
                    accessibilityLabel="Six-digit verification code"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    placeholderTextColor={colors.textMuted}
                    style={styles.codeInput}
                  />
                  <Button
                    title={verifying ? 'Verifying…' : 'Verify Code'}
                    onPress={verifyCode}
                    isLoading={verifying}
                    disabled={verifying || sending || code.length !== 6}
                    style={styles.action}
                  />
                  <TouchableOpacity
                    onPress={() => sendCode()}
                    disabled={sending || cooldown > 0}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: sending || cooldown > 0 }}
                  >
                    <Text style={[styles.resend, (sending || cooldown > 0) && styles.resendDisabled]}>
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {sending ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Requesting SMS code…</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <TextInput
                accessibilityLabel="New password"
                autoCapitalize="none"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password (at least 6 characters)"
                placeholderTextColor={colors.textMuted}
                style={styles.passwordInput}
              />
              <TextInput
                accessibilityLabel="Confirm new password"
                autoCapitalize="none"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textMuted}
                style={styles.passwordInput}
              />
              <Button
                title={resetting ? 'Updating…' : 'Reset Password'}
                onPress={resetPassword}
                isLoading={resetting}
                disabled={resetting}
                style={styles.action}
              />
            </>
          )}

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {message ? <Text accessibilityRole="status" style={styles.message}>{message}</Text> : null}
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  card: { width: '100%' },
  demoBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  demoBadgeText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  codeInput: {
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    fontSize: typography.sizes.xl,
    letterSpacing: 8,
    textAlign: 'center',
  },
  recaptcha: { alignSelf: 'center', marginTop: spacing.md, minHeight: 78 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { color: colors.textMuted, fontSize: typography.sizes.sm },
  action: { marginTop: spacing.md },
  resend: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  resendDisabled: { color: colors.textMuted },
  passwordInput: {
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  error: { color: colors.error, marginTop: spacing.md, lineHeight: 20 },
  message: { color: colors.success, marginTop: spacing.md, lineHeight: 20 },
});
