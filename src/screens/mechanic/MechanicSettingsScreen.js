import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';

export default function MechanicSettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [location, setLocation] = useState(true);

  const settings = [
    { icon: 'notifications-outline', title: 'Job notifications', subtitle: 'Get alerts for nearby requests', value: notifications, onChange: setNotifications },
    { icon: 'volume-high-outline', title: 'Request sound', subtitle: 'Play sound for new job alerts', value: sound, onChange: setSound },
    { icon: 'location-outline', title: 'Location sharing', subtitle: 'Share your location while online', value: location, onChange: setLocation },
  ];

  return (
    <ScreenWrapper>
      <Header title="Settings" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {settings.map((setting) => (
          <View key={setting.title} style={styles.row}>
            <View style={styles.iconWrap}><Ionicons name={setting.icon} size={21} color={colors.primary} /></View>
            <View style={styles.meta}><Text style={styles.title}>{setting.title}</Text><Text style={styles.subtitle}>{setting.subtitle}</Text></View>
            <Switch value={setting.value} onValueChange={setting.onChange} trackColor={{ false: colors.border, true: 'rgba(249,115,22,0.45)' }} thumbColor={setting.value ? colors.primary : colors.textMuted} />
          </View>
        ))}
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.row} onPress={() => Alert.alert('App version', 'RoadRescue AI v1.0.0')}>
          <View style={styles.iconWrap}><Ionicons name="information-circle-outline" size={21} color={colors.primary} /></View>
          <View style={styles.meta}><Text style={styles.title}>About RoadRescue AI</Text><Text style={styles.subtitle}>App information and version</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  sectionTitle: { color: colors.textMuted, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, marginBottom: spacing.sm, marginTop: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.7 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.12)', marginRight: spacing.md },
  meta: { flex: 1 },
  title: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  subtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
});
