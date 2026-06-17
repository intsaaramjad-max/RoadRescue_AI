import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../theme/theme';

export const Card = ({ children, style, padded = true }) => {
  return (
    <View style={[
      styles.card,
      padded && styles.padded,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.md,
  }
});
