import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Card } from '../../components/Card';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

export default function MechanicDashboard({ navigation }) {
  const { user, logout } = useAuth();

  if (user && user.verificationStatus === 'PENDING') {
    return (
      <ScreenWrapper useSafeArea={true}>
        <View style={styles.pendingContainer}>
          <View style={styles.statusIconWrapper}>
            <Ionicons name="shield-checkmark" size={60} color="#10B981" />
          </View>
          <Text style={styles.statusTitle}>Verification Pending</Text>
          <Text style={styles.statusDescription}>
            Thank you! Your documents have been submitted and are under review.
          </Text>
          <View style={styles.statusInfoCard}>
            <Ionicons name="time" size={24} color="#FF7A00" style={{ marginRight: 12, marginTop: 2 }} />
            <Text style={styles.statusInfoText}>
              Your account is currently <Text style={{ fontWeight: 'bold', color: '#FF7A00' }}>Under Review</Text>. We will verify your profile and activate your workshop services within <Text style={{ fontWeight: 'bold', color: '#FFF' }}>24 Hours</Text>.
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtnLarge}>
            <Text style={styles.logoutBtnLargeText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper useSafeArea={true}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.fullName || 'Mechanic'} 🔧</Text>
          <Text style={styles.subGreeting}>You are currently ONLINE</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Stats Section */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="cash" size={24} color={colors.primary} />
            <Text style={styles.statValue}>$450</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.statValue}>6</Text>
            <Text style={styles.statLabel}>Jobs Completed</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Incoming Requests</Text>
        
        {/* Incoming Request Card */}
        <Card style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <View style={styles.requestTypeBadge}>
              <Text style={styles.requestTypeText}>Flat Tire</Text>
            </View>
            <Text style={styles.requestTime}>2 mins ago</Text>
          </View>
          
          <View style={styles.clientInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>J</Text>
            </View>
            <View>
              <Text style={styles.clientName}>John Doe</Text>
              <Text style={styles.clientDistance}>3.2 miles away • 12 mins</Text>
            </View>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.declineBtn]}
              activeOpacity={0.8}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Tracking')}
            >
              <Text style={styles.acceptText}>Accept Job</Text>
            </TouchableOpacity>
          </View>
        </Card>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subGreeting: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  logoutBtn: {
    padding: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: borderRadius.round,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  statCard: {
    width: '48%',
    alignItems: 'flex-start',
    padding: spacing.lg,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  requestCard: {
    marginBottom: spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requestTypeBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)', // Primary with opacity
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  requestTypeText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  requestTime: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  clientName: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  clientDistance: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '48%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  declineText: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
  },
  acceptText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#0F172A',
  },
  statusIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusDescription: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  statusInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    width: '100%',
  },
  statusInfoText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  logoutBtnLarge: {
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutBtnLargeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
