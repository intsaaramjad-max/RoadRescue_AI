import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';

const initialServices = [
  { id: 'tow', icon: 'car-sport-outline', title: 'Tow Truck', detail: 'Vehicle towing and recovery', rate: 'From PKR 2,500', enabled: true },
  { id: 'battery', icon: 'battery-charging-outline', title: 'Battery Assistance', detail: 'Jumpstart and battery replacement', rate: 'From PKR 1,200', enabled: true },
  { id: 'tire', icon: 'construct-outline', title: 'Flat Tire Repair', detail: 'Tire change and puncture repair', rate: 'From PKR 800', enabled: true },
  { id: 'fuel', icon: 'water-outline', title: 'Fuel Delivery', detail: 'Emergency fuel delivery', rate: 'From PKR 1,000', enabled: false },
];

export default function ServicesOfferedScreen({ route }) {
  const [services, setServices] = useState(initialServices);

  const toggleService = (id) => {
    setServices((current) => current.map((service) => (
      service.id === id ? { ...service, enabled: !service.enabled } : service
    )));
  };

  return (
    <ScreenWrapper>
      <Header title="Services Offered" showBack fallbackRoute="Dashboard" backTab={route?.params?.backTab} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Your service skills</Text>
        <Text style={styles.subheading}>Turn services on or off based on the work you can accept.</Text>
        {services.map((service) => (
          <View key={service.id} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={service.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.meta}>
              <Text style={styles.title}>{service.title}</Text>
              <Text style={styles.detail}>{service.detail}</Text>
              <Text style={styles.rate}>{service.rate}</Text>
            </View>
            <Switch
              value={service.enabled}
              onValueChange={() => toggleService(service.id)}
              trackColor={{ false: colors.border, true: 'rgba(249,115,22,0.45)' }}
              thumbColor={service.enabled ? colors.primary : colors.textMuted}
            />
          </View>
        ))}
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={19} color={colors.primary} />
          <Text style={styles.noteText}>Rates are shared with the driver before service confirmation.</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  heading: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  subheading: { color: colors.textMuted, fontSize: typography.sizes.sm, lineHeight: 20, marginTop: 5, marginBottom: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  meta: { flex: 1 },
  title: { color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  detail: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
  rate: { color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, marginTop: 6 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: 'rgba(249,115,22,0.08)' },
  noteText: { flex: 1, color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 18 },
});
