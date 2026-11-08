import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

const MapView = Platform.OS === 'web' ? null : require('react-native-maps').default;
const Marker = Platform.OS === 'web' ? null : require('react-native-maps').Marker;

const initialMapRegion = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function CreateRequestScreen({ route, navigation }) {
  const defaultService = route.params?.serviceType || 'General Request';
  const [selectedService, setSelectedService] = useState(defaultService);
  const [locationAddress, setLocationAddress] = useState('');
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [notes, setNotes] = useState('');

  const services = ['Tow Truck', 'Flat Tire', 'Battery', 'Lockout', 'Fuel Delivery'];

  const handleMapPress = ({ nativeEvent }) => {
    setSelectedCoordinate(nativeEvent.coordinate);
    setLocationError('');
  };

  const handleContinue = () => {
    if (!locationAddress.trim() && !selectedCoordinate) {
      setLocationError('Enter an address or tap the map to place a pin.');
      return;
    }

    navigation.navigate('LiveTracking');
  };

  return (
    <ScreenWrapper>
      <Header title="Request Assistance" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
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
            label="Pickup Location"
            placeholder="Enter an address or choose a point on the map"
            value={locationAddress}
            onChangeText={(value) => {
              setLocationAddress(value);
              if (value.trim() || selectedCoordinate) setLocationError('');
            }}
            error={locationError}
            accessibilityHint="GPS is not enabled. Enter an address or select a point on the map."
            icon={<Ionicons name="location" size={20} color={colors.primary} />}
          />

          <View style={styles.mapSection}>
            <Text style={styles.fieldLabel}>Or choose on map</Text>
            <View style={styles.mapPreview}>
              {Platform.OS === 'web' ? (
                <View style={styles.mapFallback}>
                  <Ionicons name="map-outline" size={36} color={colors.secondary} />
                  <Text style={styles.mapFallbackText}>
                    Interactive map selection is available in the mobile app. Enter the pickup address above.
                  </Text>
                </View>
              ) : (
                <MapView
                  style={styles.map}
                  initialRegion={initialMapRegion}
                  onPress={handleMapPress}
                  accessibilityLabel="Map for choosing pickup location"
                >
                  {selectedCoordinate && (
                    <Marker coordinate={selectedCoordinate} pinColor={colors.primary} />
                  )}
                </MapView>
              )}
            </View>
            <Text style={styles.mapHint}>
              GPS is not enabled. Tap the map to place a pickup pin.
            </Text>
            {selectedCoordinate && (
              <Text style={styles.coordinateText}>
                Pin selected: {selectedCoordinate.latitude.toFixed(5)}, {selectedCoordinate.longitude.toFixed(5)}
              </Text>
            )}
          </View>

          <View style={styles.vehicleSection}>
            <View style={styles.vehicleHeading}>
              <Text style={styles.fieldLabel}>Saved Vehicle</Text>
              <Text style={styles.optionalLabel}>Optional</Text>
            </View>
            <View style={styles.vehicleEmptyState}>
              <View style={styles.vehicleIcon}>
                <Ionicons name="car-outline" size={22} color={colors.secondary} />
              </View>
              <View style={styles.vehicleEmptyText}>
                <Text style={styles.vehicleEmptyTitle}>No saved vehicles available</Text>
                <Text style={styles.vehicleEmptyHint}>
                  Vehicle selection will be available when saved vehicles are connected.
                </Text>
              </View>
            </View>
          </View>

          <Input
            label="Notes"
            placeholder="Add any details that may help the mechanic (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
            inputStyle={styles.notesInput}
          />
        </View>

        <View style={styles.footer}>
          <Button
            title="Find Mechanics Nearby"
            onPress={handleContinue}
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
  fieldLabel: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  mapSection: {
    marginBottom: spacing.md,
  },
  mapPreview: {
    height: 190,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card,
  },
  mapFallbackText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  mapHint: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  coordinateText: {
    color: colors.secondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  vehicleSection: {
    marginBottom: spacing.md,
  },
  vehicleHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  optionalLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  vehicleEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary + '18',
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
  },
  vehicleEmptyText: {
    flex: 1,
  },
  vehicleEmptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  vehicleEmptyHint: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  notesInput: {
    minHeight: 96,
    paddingTop: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
