import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../theme/theme';

import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import IncomingRequestsScreen from '../screens/mechanic/IncomingRequestsScreen';
import RequestDetailsScreen from '../screens/mechanic/RequestDetailsScreen';
import MechanicTrackingScreen from '../screens/mechanic/MechanicTrackingScreen';
import MechanicVerificationScreen from '../screens/mechanic/MechanicVerificationScreen';
import EarningsScreen from '../screens/mechanic/EarningsScreen';
import MechanicProfileScreen from '../screens/mechanic/MechanicProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MechanicHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={MechanicDashboard} />
      <Stack.Screen name="IncomingRequests" component={IncomingRequestsScreen} />
      <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
      <Stack.Screen name="Tracking" component={MechanicTrackingScreen} />
      <Stack.Screen name="Verification" component={MechanicVerificationScreen} />
    </Stack.Navigator>
  );
}

export default function MechanicNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeStack') {
            iconName = focused ? 'build' : 'build-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen name="HomeStack" component={MechanicHomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={MechanicProfileScreen} />
    </Tab.Navigator>
  );
}
