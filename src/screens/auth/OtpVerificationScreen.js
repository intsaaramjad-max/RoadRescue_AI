import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Modal, ActivityIndicator, TouchableOpacity, Platform
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';

export default function OtpVerificationScreen({ route, navigation }) {
  const email = route?.params?.email || '';
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isStatusError, setIsStatusError] = useState(false);

  // New Password modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [isModalError, setIsModalError] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const showAlert = (title, message) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      setIsStatusError(true);
      setStatusMessage('Please enter complete 4-digit code');
      showAlert('Validation Error', 'Please enter complete 4-digit code');
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), otp: fullOtp }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsStatusError(false);
        setStatusMessage('✅ OTP verified successfully!');
        setModalVisible(true);
      } else {
        setIsStatusError(true);
        setStatusMessage(data.message || 'Invalid or expired OTP code');
        showAlert('Verification Failed', data.message || 'Invalid or expired OTP code');
      }
    } catch (err) {
      console.error(err);
      setIsStatusError(true);
      setStatusMessage('Network error. Check server status.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setIsModalError(true);
      setModalMessage('Password must be at least 6 characters');
      showAlert('Validation Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setIsModalError(true);
      setModalMessage('Passwords do not match');
      showAlert('Validation Error', 'Passwords do not match');
      return;
    }

    setResetting(true);
    setModalMessage(null);
    try {
      const fullOtp = otp.join('');
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), otp: fullOtp, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsModalError(false);
        setModalMessage('✅ Password reset successfully! Redirecting to login...');
        showAlert('Success! 🎉', 'Password reset successfully! Redirecting to login...');

        setTimeout(() => {
          setModalVisible(false);
          navigation.navigate('Login');
        }, 1200);
      } else {
        setIsModalError(true);
        setModalMessage(data.message || 'Password reset failed');
        showAlert('Error', data.message || 'Password reset failed');
      }
    } catch (err) {
      console.error(err);
      setIsModalError(true);
      setModalMessage('Network error resetting password.');
    } finally {
      setResetting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setIsStatusError(true);
      setStatusMessage('Email address missing');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsStatusError(false);
        setStatusMessage(`✅ OTP Code: ${data.otpCode || ''} (Resent to ${email})`);
        showAlert('OTP Resent', data.message || 'A new code has been sent.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Verification" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>We sent a 4-digit code to {email || 'your email'}.</Text>
        </View>

        <View style={styles.otpContainer}>
          {[0, 1, 2, 3].map((index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={otp[index]}
              onChangeText={(text) => handleOtpChange(text, index)}
            />
          ))}
        </View>

        {statusMessage && (
          <View style={[styles.msgContainer, isStatusError ? styles.errorBg : styles.successBg]}>
            <Text style={[styles.msgText, isStatusError ? styles.errorTxt : styles.successTxt]}>
              {statusMessage}
            </Text>
          </View>
        )}

        <Button 
          title={loading ? "Verifying..." : "Verify Code"} 
          onPress={handleVerifyOtp} 
          isLoading={loading}
          disabled={loading}
          style={styles.verifyBtn}
        />

        <Text style={styles.resendText}>
          Didn't receive code?{' '}
          <Text style={styles.resendLink} onPress={handleResend}>Resend Code</Text>
        </Text>
      </ScrollView>

      {/* Reset Password Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Password</Text>
            <Text style={styles.modalSub}>Enter your new password below to complete account recovery.</Text>

            <Input
              label="New Password"
              placeholder="Minimum 6 characters"
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => setNewPassword(text)}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter new password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => setConfirmPassword(text)}
            />

            {modalMessage && (
              <View style={[styles.msgContainer, isModalError ? styles.errorBg : styles.successBg]}>
                <Text style={[styles.msgText, isModalError ? styles.errorTxt : styles.successTxt]}>
                  {modalMessage}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetPassword}
              disabled={resetting}
            >
              {resetting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.resetBtnText}>Set New Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
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
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    textAlign: 'center',
    fontSize: typography.sizes.xxl,
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  verifyBtn: {
    marginBottom: spacing.xl,
  },
  resendText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  resetBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resetBtnText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
  closeBtn: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  closeBtnText: {
    color: colors.textSecondary,
  },
  msgContainer: {
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.xs,
  },
  errorBg: {
    backgroundColor: '#F8D7DA',
  },
  successBg: {
    backgroundColor: '#D4EDDA',
  },
  msgText: {
    fontSize: typography.sizes.xs,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorTxt: {
    color: '#721C24',
  },
  successTxt: {
    color: '#155724',
  },
});
