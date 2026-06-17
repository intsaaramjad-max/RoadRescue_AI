import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Header } from '../../components/Header';
import { colors, typography, spacing } from '../../theme/theme';

export default function ForgotPasswordScreen({ navigation }) {
  return (
    <ScreenWrapper>
      <Header title="Forgot Password" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}>
          <Image source={require('../../../assets/logo1.png')} style={styles.logo} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive instructions.</Text>
        </View>

        <Card style={styles.formCard}>
          <Input 
            label="Email Address" 
            placeholder="Enter your registered email" 
            keyboardType="email-address" 
          />
          <Button 
            title="Send Instructions" 
            onPress={() => navigation.navigate('OtpVerification')} 
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
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
  },
  formCard: {
    marginBottom: spacing.xl,
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
});
