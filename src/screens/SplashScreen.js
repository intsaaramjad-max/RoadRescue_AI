import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/theme';

export default function SplashScreen({ navigation }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Auth');
    }, 1000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo1.png')} 
        style={styles.logoImage} 
        resizeMode="contain" 
      />
      <Text style={styles.subText}>AI-Powered Roadside Assistance</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 280,
    height: 280,
    marginBottom: spacing.md,
  },
  subText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
