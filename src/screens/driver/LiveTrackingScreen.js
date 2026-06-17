import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function LiveTrackingScreen({ navigation }) {
  return (
    <ScreenWrapper useSafeArea={false}>
      <View style={styles.mapContainer}>
        {/* Placeholder for react-native-maps */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={64} color={colors.textMuted} />
          <Text style={styles.mapText}>Live Map Tracking View</Text>
        </View>
        
        {/* Back Button Overlay */}
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Arriving in 12 mins</Text>
          <Text style={styles.distanceText}>3.2 miles away</Text>
        </View>

        <View style={styles.mechanicInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </View>
          <View style={styles.mechanicDetails}>
            <Text style={styles.mechanicName}>Mike's Auto Repair</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>4.9 (120 reviews)</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.circleBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Chat')}
            >
              <Ionicons name="chatbubble" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.success }]}>
              <Ionicons name="call" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleTitle}>Vehicle</Text>
          <Text style={styles.vehicleDesc}>White Ford F-150 • ABC-1234</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  mapText: {
    color: colors.textMuted,
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: borderRadius.round,
    ...shadows.sm,
  },
  bottomSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingTop: spacing.md,
    ...shadows.md,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  statusRow: {
    marginBottom: spacing.lg,
  },
  statusText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  distanceText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    marginTop: 2,
  },
  mechanicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  mechanicDetails: {
    flex: 1,
  },
  mechanicName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  vehicleInfo: {
    marginBottom: spacing.sm,
  },
  vehicleTitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginBottom: 4,
  },
  vehicleDesc: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
});
