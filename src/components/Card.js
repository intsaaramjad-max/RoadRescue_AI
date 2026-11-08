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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    ...shadows.sm,
    overflow: 'visible',
  },
  padded: {
    padding: spacing.md,
  }
});
