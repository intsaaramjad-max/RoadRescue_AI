import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Card } from '../../components/Card';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

const demoStats = [
  { icon: 'cash-outline', value: 'Rs.2500', label: "Today's Earnings", color: colors.primary },
  { icon: 'checkmark-circle-outline', value: '6', label: 'Completed Services', color: colors.success },
  { icon: 'construct-outline', value: '2', label: 'Pending Requests', color: colors.secondary },
  { icon: 'star-outline', value: '4.9', label: 'Overall Rating', color: colors.warning },
];

const demoActivity = [
  { icon: 'checkmark-circle', title: 'Service marked complete', detail: 'Roadside assistance · Demo activity', time: 'Today' },
  { icon: 'star', title: 'Customer review received', detail: '5-star rating · Demo activity', time: 'Yesterday' },
  { icon: 'cash', title: 'Earnings updated', detail: 'Rs. 1,200 · Demo activity', time: 'Yesterday' },
];

export default function MechanicDashboard({ navigation }) {
  const { user, logout, isLoading } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);

  if (isLoading) {
    return (
      <ScreenWrapper useSafeArea={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (user && user.verificationStatus === 'PENDING') {
    return (
      <ScreenWrapper useSafeArea={true}>
        <View style={styles.pendingContainer}>
          <View style={styles.statusIconWrapper}>
            <Ionicons name="shield-checkmark" size={60} color={colors.success} />
          </View>
          <Text style={styles.statusTitle}>Verification Pending</Text>
          <Text style={styles.statusDescription}>
            Thank you! Your documents have been submitted and are under review.
          </Text>
          <View style={styles.statusInfoCard}>
            <Ionicons name="time" size={24} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.statusInfoText}>
              Your account is currently <Text style={styles.highlightText}>Under Review</Text>. We will verify your profile and activate your workshop services within <Text style={styles.whiteText}>24 Hours</Text>.
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtnLarge} activeOpacity={0.8}>
            <Text style={styles.logoutBtnLargeText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const quickActions = [
    { icon: 'notifications-outline', label: 'Incoming Requests', color: colors.primary, onPress: () => navigation.navigate('IncomingRequests') },
    { icon: 'construct-outline', label: 'My Services', color: colors.secondary, onPress: () => navigation.navigate('ServicesOffered') },
    { icon: 'cash-outline', label: 'Earnings', color: colors.success, onPress: () => navigation.navigate('Earnings') },
    { icon: 'star-outline', label: 'Reviews', color: colors.warning, onPress: () => navigation.navigate('Reviews') },
  ];

  return (
    <ScreenWrapper useSafeArea={true}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Welcome, {user?.fullName || 'Mechanic'}</Text>
          <Text style={styles.subGreeting}>Your mechanic dashboard</Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutBtn}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          activeOpacity={0.75}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0)?.toUpperCase() || 'M'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'Mechanic profile'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'Profile details unavailable'}</Text>
            <View style={styles.availabilityStatus}>
              <View style={[styles.statusDot, { backgroundColor: isAvailable ? colors.success : colors.textMuted }]} />
              <Text style={[styles.availabilityText, { color: isAvailable ? colors.success : colors.textMuted }]}>
                {isAvailable ? 'Online' : 'Offline'}
              </Text>
              <Text style={styles.localStatusNote}>· This device only</Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: colors.border, true: colors.success }}
            thumbColor={colors.white}
            accessibilityLabel="Toggle local availability display"
          />
        </Card>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.demoLabel}>DEMO DATA</Text>
        </View>
        <View style={styles.statsGrid}>
          {demoStats.map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        <TouchableOpacity
          style={styles.incomingCard}
          onPress={() => navigation.navigate('IncomingRequests')}
          activeOpacity={0.82}
          accessibilityRole="button"
        >
          <View style={styles.incomingIcon}>
            <Ionicons name="notifications" size={24} color={colors.white} />
          </View>
          <View style={styles.incomingText}>
            <Text style={styles.incomingTitle}>Incoming Requests</Text>
            <Text style={styles.incomingSubtitle}>View and manage service requests</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionItem}
              onPress={action.onPress}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon} size={23} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.activityHeading}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.demoLabel}>DEMO</Text>
        </View>
        <Card style={styles.activityCard}>
          {demoActivity.map((activity, index) => (
            <View key={activity.title} style={[styles.activityRow, index > 0 && styles.activityDivider]}>
              <View style={styles.activityIcon}>
                <Ionicons name={activity.icon} size={17} color={colors.primary} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDetail}>{activity.detail}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
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
  headerText: { flex: 1, marginRight: spacing.md },
  greeting: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subGreeting: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  logoutBtn: {
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.round,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  profileEmail: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  availabilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  statusDot: { width: 7, height: 7, borderRadius: borderRadius.round, marginRight: spacing.xs },
  availabilityText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  localStatusNote: { color: colors.textMuted, fontSize: 10, marginLeft: spacing.xs },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  demoLabel: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48%',
    minHeight: 130,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  incomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  incomingIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  incomingText: { flex: 1 },
  incomingTitle: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  incomingSubtitle: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    opacity: 0.9,
    marginTop: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actionItem: {
    width: '48%',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  actionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  activityHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activityDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  activityInfo: { flex: 1, minWidth: 0 },
  activityTitle: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  activityDetail: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  activityTime: {
    color: colors.textMuted,
    fontSize: 10,
    marginLeft: spacing.xs,
  },
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.md,
  },
  statusIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  statusDescription: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  statusInfoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    width: '100%',
  },
  infoIcon: { marginRight: spacing.sm, marginTop: 2 },
  statusInfoText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    flex: 1,
  },
  highlightText: { fontWeight: typography.weights.bold, color: colors.primary },
  whiteText: { fontWeight: typography.weights.bold, color: colors.text },
  logoutBtnLarge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  logoutBtnLargeText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
