import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, typography, spacing } from '../theme/theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Button } from '../components/Button';

export default function OnboardingScreen({ navigation }) {
  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to</Text>
        <Image 
          source={require('../../assets/logo1.png')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
        <Text style={styles.description}>
          Get verified mechanics at your location instantly. AI-powered diagnostics to get you back on the road faster.
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Button 
          title="Get Started" 
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })} 
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginBottom: spacing.md,
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: spacing.xl,
  },
});
