import { Platform } from 'react-native';

export const API_URL = Platform.select({
  android: 'http://192.168.10.6:5000/api',  // LAN IP for physical Android device
  ios: 'http://localhost:5000/api',
  default: 'http://192.168.10.6:5000/api'   // LAN IP for web/default
});
