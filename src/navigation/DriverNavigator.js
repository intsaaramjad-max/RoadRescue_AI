import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

// Dashboard & Request screens
import DriverDashboard from '../screens/driver/DriverDashboard';
import CreateRequestScreen from '../screens/driver/CreateRequestScreen';
import ServiceRequestDetailsScreen from '../screens/driver/ServiceRequestDetailsScreen';
import AIDiagnosisScreen from '../screens/driver/AIDiagnosisScreen';
import LiveTrackingScreen from '../screens/driver/LiveTrackingScreen';
import ChatScreen from '../screens/driver/ChatScreen';
import FeedbackScreen from '../screens/driver/FeedbackScreen';

// History
import ServiceHistoryScreen from '../screens/driver/ServiceHistoryScreen';

// Profile & sub-screens
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';
import PaymentScreen from '../screens/driver/PaymentScreen';
import NotificationsScreen from '../screens/driver/NotificationsScreen';
import PrivacySecurityScreen from '../screens/driver/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/driver/HelpSupportScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Home Stack (Dashboard + all screens reachable from Dashboard) ─────────────
function DriverHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard"      component={DriverDashboard} />
      <Stack.Screen name="CreateRequest"  component={CreateRequestScreen} />
      <Stack.Screen name="RequestDetails" component={ServiceRequestDetailsScreen} />
      <Stack.Screen name="AIDiagnosis"    component={AIDiagnosisScreen} />
      <Stack.Screen name="LiveTracking"   component={LiveTrackingScreen} />
      <Stack.Screen name="Chat"           component={ChatScreen} />
      <Stack.Screen name="Feedback"       component={FeedbackScreen} />
    </Stack.Navigator>
  );
}

// ── Profile Stack (Profile + all sub-pages) ──────────────────────────────────
function DriverProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome"    component={DriverProfileScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="HelpSupport"    component={HelpSupportScreen} />
      {/* History accessible from Profile too */}
      <Stack.Screen name="History"        component={ServiceHistoryScreen} />
    </Stack.Navigator>
  );
}

// ── Bottom Tabs ───────────────────────────────────────────────────────────────
export default function DriverNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeStack: focused ? 'home'   : 'home-outline',
            History:   focused ? 'time'   : 'time-outline',
            Profile:   focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor:  colors.border,
          paddingBottom:   4,
          height:          58,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="HomeStack" component={DriverHomeStack}   options={{ title: 'Home' }} />
      <Tab.Screen name="History"   component={ServiceHistoryScreen} />
      <Tab.Screen name="Profile"   component={DriverProfileStack} />
    </Tab.Navigator>
  );
}
