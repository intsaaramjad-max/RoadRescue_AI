import { Platform } from 'react-native';

export const API_URL = Platform.select({
  android: 'http://192.168.10.6:5000/api',
  ios: 'http://localhost:5000/api',
  default: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.10.6:5000/api',
});
