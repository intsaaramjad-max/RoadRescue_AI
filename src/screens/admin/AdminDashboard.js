import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography } from '../../theme/theme';

export default function AdminDashboard() {
  return (
    <ScreenWrapper>
      <Header title="Admin Dashboard" showBack />
      <View style={styles.container}>
        <Text style={styles.text}>AdminDashboard Content</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  text: {
    color: colors.text,
    fontSize: typography.sizes.lg,
  }
});
