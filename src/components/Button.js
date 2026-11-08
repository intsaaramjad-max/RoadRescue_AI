import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  disabled = false,
  style,
  textStyle,
  icon
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.card;
      case 'outline': return 'transparent';
      case 'text': return 'transparent';
      case 'danger': return colors.error;
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary': return colors.white;
      case 'secondary': return colors.text;
      case 'outline': return colors.primary;
      case 'text': return colors.primary;
      case 'danger': return colors.white;
      default: return colors.white;
    }
  };

  const getBorder = () => {
    if (variant === 'outline') {
      return { borderWidth: 1, borderColor: disabled ? colors.border : colors.primary };
    }
    return {};
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { minHeight: 44, paddingVertical: spacing.xs, paddingHorizontal: spacing.md };
      case 'md': return { minHeight: 48, paddingVertical: spacing.sm + spacing.xs, paddingHorizontal: spacing.lg };
      case 'lg': return { minHeight: 56, paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
      default: return { minHeight: 48, paddingVertical: spacing.sm + spacing.xs, paddingHorizontal: spacing.lg };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor(), ...getBorder(), ...getPadding() },
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={typeof title === 'string' ? title : undefined}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      hitSlop={4}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && <React.Fragment>{icon}</React.Fragment>}
          <Text style={[
            styles.text,
            { color: getTextColor(), marginLeft: icon ? spacing.sm : 0 },
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});
