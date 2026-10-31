import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function CreateRequestScreen({ route, navigation }) {
  const defaultService = route.params?.serviceType || 'General Request';
  const [selectedService, setSelectedService] = useState(defaultService);

  const services = ['Tow Truck', 'Flat Tire', 'Battery', 'Lockout', 'Fuel Delivery'];

  return (
    <ScreenWrapper>
      <Header title="Request Assistance" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.sectionTitle}>Select Service Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceScroll}>
          {services.map(service => (
            <TouchableOpacity 
              key={service}
              style={[
                styles.serviceChip,
                selectedService === service && styles.serviceChipSelected
              ]}
              onPress={() => setSelectedService(service)}
            >
              <Text style={[
                styles.serviceChipText,
                selectedService === service && styles.serviceChipTextSelected
              ]}>{service}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.formSection}>
          <Input 
            label="Current Location" 
            placeholder="Fetching location..." 
            value="123 Main St, New York, NY"
            icon={<Ionicons name="location" size={20} color={colors.primary} />}
          />
          
          <Input 
            label="Vehicle Details" 
            placeholder="Make, Model, Year, Color" 
            value="Toyota Camry 2020 Silver"
          />

          <View style={styles.mapPreview}>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={48} color={colors.textMuted} />
              <Text style={styles.mapText}>Map Preview</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Find Mechanics Nearby" 
            onPress={() => navigation.navigate('LiveTracking')} 
          />
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  serviceScroll: {
    marginBottom: spacing.xl,
  },
  serviceChip: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceChipText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  serviceChipTextSelected: {
    color: colors.white,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  mapPreview: {
    height: 150,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  mapText: {
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.lg,
  }
});
