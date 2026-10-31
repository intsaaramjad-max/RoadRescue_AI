import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Platform } from 'react-native';

const API_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

function StatCard({ icon, iconColor, value, label, bg }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg || 'rgba(255,255,255,0.04)' }]}>
      <View style={[styles.statIconWrap, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniChart({ activeRequests = 0, completed = 0 }) {
  const bars = [34, 48, 42, 62, 54, 72, Math.max(28, Math.min(90, completed || 78))];
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <Ionicons name="bar-chart" size={22} color={colors.primary} />
          <View>
            <Text style={styles.chartTitle}>Platform Overview</Text>
            <Text style={styles.chartSubtitle}>Last 7 days performance</Text>
          </View>
        </View>
        <Text style={styles.chartRange}>Last 7 Days</Text>
      </View>
      <View style={styles.chartLegend}>
        <Text style={styles.legendCompleted}>● Completed Services</Text>
        <Text style={styles.legendRequests}>● New Requests</Text>
      </View>
      <View style={styles.chartBody}>
        <View style={styles.axis}><Text style={styles.axisText}>100</Text><Text style={styles.axisText}>50</Text><Text style={styles.axisText}>0</Text></View>
        <View style={styles.bars}>
          {bars.map((height, index) => (
            <View key={index} style={styles.barColumn}>
              <View style={[styles.bar, { height: `${height}%` }]} />
              <View style={[styles.requestBar, { height: `${Math.max(18, height - 24)}%` }]} />
              <Text style={styles.barLabel}>{index + 11} Sep</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.chartFooter}>{activeRequests} active requests currently need attention</Text>
    </View>
  );
}

function NavCard({ icon, color, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.navCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.navIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={styles.navSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function AdminDashboard({ navigation }) {
  const { token, logout } = useAuth();
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data.stats);
      else Alert.alert('Error', data.message);
    } catch (e) {
      Alert.alert('Network Error', 'Could not connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  return (
    <ScreenWrapper useSafeArea>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeLabel}>WELCOME BACK,</Text>
          <Text style={styles.greeting}>Admin 👋</Text>
          <Text style={styles.subGreeting}>Here&apos;s what&apos;s happening on RoadRescue AI today.</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Platform Stats</Text>
            <View style={styles.statsGrid}>
              <StatCard icon="car"               iconColor="#10B981" value={stats?.totalDrivers}        label="Drivers" />
              <StatCard icon="build"             iconColor="#F97316" value={stats?.totalMechanics}      label="Mechanics" />
              <StatCard icon="flash"             iconColor="#8B5CF6" value={stats?.activeRequests}      label="Active Requests" />
              <StatCard icon="checkmark-circle"  iconColor="#10B981" value={stats?.completedRequests}   label="Completed Services" />
              <StatCard icon="cash"              iconColor="#10B981" value={`PKR ${stats?.totalRevenue ?? '0'}`} label="Revenue" />
              <StatCard icon="time"              iconColor="#F59E0B" value={stats?.pendingVerification} label="Pending Verification" bg="rgba(245,158,11,0.07)" />
            </View>

            <MiniChart activeRequests={stats?.activeRequests} completed={stats?.completedRequests} />

            <Text style={styles.sectionTitle}>Management</Text>
            <View style={styles.managementGrid}>
              <NavCard icon="shield-checkmark" color="#10B981" title="Verification" subtitle={`${stats?.pendingVerification ?? 0} pending`} onPress={() => navigation.navigate('Verifications')} />
              <NavCard icon="people" color="#3B82F6" title="Users" subtitle="Manage accounts" onPress={() => navigation.navigate('Users')} />
              <NavCard icon="list" color="#8B5CF6" title="Requests" subtitle="Track service status" onPress={() => navigation.navigate('Requests')} />
              <NavCard icon="analytics" color="#F97316" title="Operations" subtitle="Payments and alerts" onPress={() => navigation.navigate('Operations')} />
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  welcomeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1, color: colors.primary },
  greeting:   { fontSize: 28, fontWeight: typography.weights.bold, color: colors.text, marginTop: 2 },
  subGreeting:{ fontSize: typography.sizes.sm, color: colors.textMuted, marginTop: 4, maxWidth: 290 },
  logoutBtn:  { padding: spacing.xs, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: borderRadius.round },
  scroll:     { padding: spacing.md, paddingBottom: 48 },
  sectionTitle: {
    color: colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12, marginTop: 8,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '47.5%', borderRadius: borderRadius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue:  { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  statLabel:  { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 2 },
  chartCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chartTitle: { color: colors.text, fontSize: typography.sizes.md, fontWeight: '700' },
  chartSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  chartRange: { color: colors.textMuted, fontSize: 10, backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 6, borderRadius: borderRadius.sm },
  chartLegend: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  legendCompleted: { color: '#34D399', fontSize: 9 },
  legendRequests: { color: colors.primary, fontSize: 9 },
  chartBody: { height: 145, flexDirection: 'row', marginTop: spacing.sm },
  axis: { width: 26, justifyContent: 'space-between', paddingBottom: 20 },
  axisText: { color: colors.textMuted, fontSize: 9 },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 1, borderColor: colors.border, paddingHorizontal: 4 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  bar: { width: 17, maxHeight: 105, minHeight: 16, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: 'rgba(16,185,129,0.75)' },
  requestBar: { width: 17, maxHeight: 72, minHeight: 9, backgroundColor: 'rgba(249,115,22,0.55)', position: 'absolute', bottom: 20, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  barLabel: { position: 'absolute', bottom: -17, color: colors.textMuted, fontSize: 8 },
  chartFooter: { color: colors.textMuted, fontSize: 10, marginTop: spacing.md },
  managementGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  navCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.lg,
    width: '48.5%', padding: spacing.sm, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  navIcon:  { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  navTitle: { color: colors.text, fontSize: 12, fontWeight: typography.weights.bold },
  navSub:   { color: colors.textMuted, fontSize: 9, marginTop: 2 },
});
