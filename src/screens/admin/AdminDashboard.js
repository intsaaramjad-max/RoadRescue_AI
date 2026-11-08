import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const requestStatus = {
  pending: 'PENDING',
  active: ['ACCEPTED', 'IN_PROGRESS'],
  completed: 'COMPLETED',
};

function StatCard({ icon, color, label, value, emphasized = false }) {
  return (
    <View style={[styles.statCard, emphasized && styles.statCardEmphasized]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <Text style={styles.statValue}>{value === undefined || value === null ? '—' : Number(value).toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, color, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75} accessibilityRole="button">
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function AdminDashboard({ navigation }) {
  const { token, user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setStats(null);
      setRequests([]);
      setError('Sign in with an administrator account to load dashboard data.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsResponse, requestsResponse] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/requests`, { headers }),
      ]);
      const [statsData, requestsData] = await Promise.all([
        statsResponse.json(),
        requestsResponse.json(),
      ]);

      if (!statsResponse.ok) {
        throw new Error(statsData.message || `Dashboard statistics failed (${statsResponse.status})`);
      }
      if (!requestsResponse.ok) {
        throw new Error(requestsData.message || `Service requests failed (${requestsResponse.status})`);
      }

      setStats(statsData.stats || null);
      setRequests(Array.isArray(requestsData.requests) ? requestsData.requests : []);
      setError(null);
    } catch (requestError) {
      setStats(null);
      setRequests([]);
      setError(requestError.message || 'Unable to load administrator dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const requestCounts = useMemo(() => requests.reduce((counts, request) => {
    const status = String(request.status || '').toUpperCase();
    if (status === requestStatus.pending) counts.pending += 1;
    else if (requestStatus.active.includes(status)) counts.active += 1;
    else if (status === requestStatus.completed) counts.completed += 1;
    return counts;
  }, { pending: 0, active: 0, completed: 0 }), [requests]);

  const quickActions = [
    { icon: 'people-outline', color: colors.secondary, title: 'User Management', subtitle: 'Manage driver and mechanic accounts', route: 'Users' },
    { icon: 'shield-checkmark-outline', color: colors.warning, title: 'Verification Management', subtitle: `${stats?.pendingVerification ?? '—'} mechanic approvals pending`, route: 'Verifications' },
    { icon: 'list-outline', color: '#A78BFA', title: 'Request Monitoring', subtitle: 'Review service request statuses', route: 'Requests' },
    { icon: 'analytics-outline', color: colors.primary, title: 'Admin Operations', subtitle: 'Payments, feedback, and alerts', route: 'Operations' },
    { icon: 'person-circle-outline', color: colors.success, title: 'Admin Profile', subtitle: 'Account settings and security', route: 'Profile' },
  ];

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to log out?')) logout();
      return;
    }
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const retry = () => {
    setLoading(true);
    fetchDashboardData();
  };

  return (
    <ScreenWrapper useSafeArea>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.welcome}>ADMIN DASHBOARD</Text>
          <Text style={styles.greeting}>Welcome, {user?.fullName || 'Admin'}</Text>
          <Text style={styles.subtitle}>Platform operations at a glance.</Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Ionicons name="log-out-outline" size={21} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Loading live platform data...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={34} color={colors.warning} />
            <Text style={styles.stateTitle}>Dashboard data unavailable</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retry} accessibilityRole="button">
              <Ionicons name="refresh-outline" size={17} color={colors.white} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Platform Statistics</Text>
                <Text style={styles.sectionSubtitle}>Current totals from the admin API</Text>
              </View>
              <TouchableOpacity onPress={retry} accessibilityRole="button" accessibilityLabel="Refresh dashboard">
                <Ionicons name="refresh-outline" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.statsGrid}>
              <StatCard icon="people-outline" color={colors.secondary} label="Total Users" value={stats?.totalUsers} />
              <StatCard icon="car-outline" color={colors.success} label="Total Drivers" value={stats?.totalDrivers} />
              <StatCard icon="build-outline" color={colors.primary} label="Total Mechanics" value={stats?.totalMechanics} />
              <StatCard icon="time-outline" color={colors.warning} label="Pending Verifications" value={stats?.pendingVerification} emphasized />
              <StatCard icon="documents-outline" color="#A78BFA" label="Total Requests" value={stats?.totalRequests} />
              <StatCard icon="checkmark-circle-outline" color={colors.success} label="Completed Requests" value={stats?.completedRequests} />
            </View>

            <View style={styles.verificationCard}>
              <View style={styles.verificationIcon}>
                <Ionicons name="shield-checkmark-outline" size={23} color={colors.warning} />
              </View>
              <View style={styles.verificationCopy}>
                <Text style={styles.verificationTitle}>Mechanic Verifications</Text>
                <Text style={styles.verificationSubtitle}>
                  {stats?.pendingVerification ?? '—'} pending approval{stats?.pendingVerification === 1 ? '' : 's'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('Verifications')}
                accessibilityRole="button"
              >
                <Text style={styles.viewButtonText}>Review</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Service Requests</Text>
                <Text style={styles.sectionSubtitle}>Current request counts by status</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Requests')} accessibilityRole="button">
                <Text style={styles.linkText}>Monitor</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.requestOverview}>
              <RequestCount icon="hourglass-outline" label="Pending" value={requestCounts.pending} color={colors.warning} />
              <RequestCount icon="navigate-outline" label="Active" value={requestCounts.active} color={colors.secondary} />
              <RequestCount icon="checkmark-done-outline" label="Completed" value={requestCounts.completed} color={colors.success} />
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <Text style={styles.sectionSubtitle}>Open an admin workspace</Text>
              </View>
            </View>
            {quickActions.map((action) => (
              <QuickAction
                key={action.route}
                {...action}
                onPress={() => navigation.navigate(action.route)}
              />
            ))}

            <View style={[styles.sectionHeader, styles.activityHeader]}>
              <View>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Text style={styles.sectionSubtitle}>System activity feed</Text>
              </View>
            </View>
            <View style={styles.emptyActivity}>
              <View style={styles.emptyActivityIcon}>
                <Ionicons name="time-outline" size={24} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyActivityTitle}>No activity feed available</Text>
              <Text style={styles.stateText}>
                The current backend does not provide a recent system activity endpoint.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function RequestCount({ icon, label, value, color }) {
  return (
    <View style={styles.requestCount}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={styles.requestValue}>{value}</Text>
      <Text style={styles.requestLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCopy: { flex: 1, paddingRight: spacing.sm },
  welcome: { fontSize: 10, fontWeight: typography.weights.bold, letterSpacing: 1.1, color: colors.primary },
  greeting: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text, marginTop: 3 },
  subtitle: { fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 4 },
  logoutButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.1)' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  sectionSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
  statCard: { flexBasis: '48%', flexGrow: 1, minHeight: 116, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  statCardEmphasized: { borderColor: 'rgba(245,158,11,0.55)', backgroundColor: 'rgba(245,158,11,0.08)' },
  statIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  statValue: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  statLabel: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
  verificationCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginTop: spacing.md, marginBottom: spacing.md, borderRadius: borderRadius.lg, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)' },
  verificationIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.16)' },
  verificationCopy: { flex: 1 },
  verificationTitle: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  verificationSubtitle: { color: colors.warning, fontSize: typography.sizes.xs, marginTop: 3 },
  viewButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.primary },
  viewButtonText: { color: colors.white, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  linkText: { color: colors.secondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  requestOverview: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, marginBottom: spacing.sm },
  requestCount: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs, borderRightWidth: 1, borderRightColor: colors.border },
  requestValue: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, marginTop: spacing.xs },
  requestLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  actionIcon: { width: 42, height: 42, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  actionCopy: { flex: 1 },
  actionTitle: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  actionSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
  activityHeader: { marginTop: spacing.lg },
  emptyActivity: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg },
  emptyActivityIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyActivityTitle: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, marginTop: spacing.sm },
  stateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  stateCard: { alignItems: 'center', padding: spacing.xl, marginTop: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  stateTitle: { color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, marginTop: spacing.sm },
  stateText: { color: colors.textMuted, fontSize: typography.sizes.sm, lineHeight: 20, textAlign: 'center', marginTop: spacing.xs },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.primary },
  retryText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
});
