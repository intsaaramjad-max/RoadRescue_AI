import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { colors } from '../theme/theme';

export const ScreenWrapper = ({ children, style, useSafeArea = true }) => {
  const Container = useSafeArea ? SafeAreaView : View;
  
  return (
    <View style={styles.outerContainer}>
      <Container style={[styles.container, style]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        {children}
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#090d16', // Dark outer space for desktop view
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    // Capping maximum width for tablet/desktop monitors to keep layout elegant
    maxWidth: Platform.OS === 'web' ? 520 : '100%',
    alignSelf: 'center',
    // Border/shadow for desktop view to make it look premium
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    // Add extra padding for Android if SafeAreaView is not sufficient
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
