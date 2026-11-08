import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';

export const Input = ({
  label,
  labelStyle,
  error,
  icon,
  rightIcon,
  style,
  inputContainerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        inputContainerStyle,
        focused && !error ? styles.inputFocused : null,
        error ? styles.inputError : null
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            rightIcon && styles.inputWithRightIcon,
            inputStyle
          ]}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={props.accessibilityLabel || label}
          accessibilityHint={props.accessibilityHint || error}
          accessibilityLiveRegion={error ? 'polite' : undefined}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background, // Or a slightly lighter card color
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: colors.secondary,
  },
  inputError: {
    borderColor: colors.error,
  },
  iconContainer: {
    paddingLeft: spacing.md,
    justifyContent: 'center',
  },
  rightIconContainer: {
    paddingRight: spacing.md,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    includeFontPadding: false,
  },
  inputWithIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});
