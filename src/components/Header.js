import React from 'react';
import { useCallback } from 'react';
import { BackHandler, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../theme/theme';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

export const Header = ({ title, showBack = false, rightComponent, fallbackRoute, backTab }) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (backTab) {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.navigate(backTab);
        return;
      }
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (fallbackRoute) navigation.navigate(fallbackRoute);
  };

  useFocusEffect(useCallback(() => {
    const handleHardwareBack = () => {
      if (!showBack) return false;

      if (backTab) {
        const parentNavigation = navigation.getParent();
        if (parentNavigation) {
          parentNavigation.navigate(backTab);
          return true;
        }
      }

      if (!navigation.canGoBack() && fallbackRoute) {
        navigation.navigate(fallbackRoute);
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => subscription.remove();
  }, [backTab, fallbackRoute, navigation, showBack]));

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={4}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>

      <View style={styles.rightContainer}>
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftContainer: {
    width: 44,
    minHeight: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  rightContainer: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
});
