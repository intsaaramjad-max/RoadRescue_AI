import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Header } from '../../components/Header';
import { colors, typography, spacing } from '../../theme/theme';
import { normalizePhoneNumber } from '../../utils/phoneNumber';

export default function ForgotPasswordScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const requestRecovery = () => {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      setError('Enter a valid phone number. Pakistani mobile numbers can use +92 or start with 03.');
      return;
    }
    // Set to true to allow demo on all platforms. Original code preserved.
    const DEMO_MODE = true;
    if (!DEMO_MODE && Platform.OS !== 'web') {
      setError('Phone-based recovery is currently available on Web only.');
      return;
    }
    setError('');
    navigation.navigate('OtpVerification', {
      mode: 'recovery',
      phone: normalizedPhone,
    });
  };

  return (
    <ScreenWrapper>
      <Header title="Forgot Password" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="phone-portrait-outline" size={34} color={colors.primary} />
            </View>
            <Text style={styles.title}>Reset with your phone</Text>
            <Text style={styles.subtitle}>
              Verify the phone number associated with your account using Firebase SMS verification.
            </Text>
            <Input
              label="Registered Phone Number"
              placeholder="+923001234567"
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setError('');
              }}
              icon={<Ionicons name="call-outline" size={19} color={colors.secondary} />}
            />
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Button
              title="Continue to Phone Verification"
              onPress={requestRecovery}
              style={styles.button}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  card: { width: '100%' },
  iconWrap: { alignItems: 'center', marginBottom: spacing.md },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 21,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  error: { color: colors.error, marginTop: spacing.sm },
  button: { marginTop: spacing.md },
});
