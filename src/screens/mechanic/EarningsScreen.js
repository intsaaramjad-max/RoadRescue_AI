import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const DEMO_SUMMARY = {
  totalEarnings: 4500,
  todayEarnings: 1800,
  weekEarnings: 3000,
  monthEarnings: 4500,
  totalJobs: 3,
};

const DEMO_WEEKLY_CHART = [
  { label: 'Mon', earnings: 500 },
  { label: 'Tue', earnings: 0 },
  { label: 'Wed', earnings: 900 },
  { label: 'Thu', earnings: 350 },
  { label: 'Fri', earnings: 0 },
  { label: 'Sat', earnings: 1250 },
  { label: 'Sun', earnings: 0 },
];

const DEMO_MONTHLY_CHART = [
  { label: 'W1', earnings: 900 },
  { label: 'W2', earnings: 1200 },
  { label: 'W3', earnings: 950 },
  { label: 'W4', earnings: 1450 },
];

const formatMoney = (value) => {
  const amount = Number(value);
  return `Rs. ${Number.isFinite(amount) ? amount.toLocaleString() : '0'}`;
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not available' : date.toLocaleString();
};

const getMonthlyChartData = (jobs) => {
  const values = [0, 0, 0, 0, 0];
  const now = new Date();
  jobs.forEach((job) => {
    const date = new Date(job.completedAt);
    if (Number.isNaN(date.getTime()) || date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return;
    values[Math.min(Math.floor((date.getDate() - 1) / 7), 4)] += Number(job.cost) || 0;
  });
  return values.map((earnings, index) => ({ label: `W${index + 1}`, earnings }));
};

const filterJobsByPeriod = (jobs, period) => {
  if (period === 'All') return jobs;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === 'This Week') {
    start.setDate(start.getDate() - 6);
  } else if (period === 'This Month') {
    start.setDate(1);
  }

  return jobs.filter((job) => {
    const date = new Date(job.completedAt);
    return !Number.isNaN(date.getTime()) && date >= start && date <= now;
  });
};

export default function EarningsScreen() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [earningsError, setEarningsError] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  const [chartPeriod, setChartPeriod] = useState('Weekly');

  const fetchData = useCallback(async () => {
    const fetchJson = async (url) => {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
      return data;
    };

    if (!token || !user?.id) {
      setEarningsData(null);
      setWalletData(null);
      setEarningsError('Sign in to load earnings data.');
      setWalletError('Sign in to load wallet balance.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const [earningsResult, walletResult] = await Promise.allSettled([
      fetchJson(`${API_URL}/earnings/${encodeURIComponent(user.id)}`),
      fetchJson(`${API_URL}/payments/wallet`),
    ]);
    if (earningsResult.status === 'fulfilled') {
      setEarningsData(earningsResult.value);
      setEarningsError(null);
    } else {
      setEarningsData(null);
      setEarningsError(earningsResult.reason?.message || 'Unable to load earnings data.');
    }

    if (walletResult.status === 'fulfilled') {
      setWalletData(walletResult.value);
      setWalletError(null);
    } else {
      setWalletData(null);
      setWalletError(walletResult.reason?.message || 'Unable to load wallet balance.');
    }

    setLoading(false);
    setRefreshing(false);
  }, [token, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <Header title="My Earnings" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const isDemoData = !earningsData && Boolean(earningsError);
  const summary = earningsData?.summary || (isDemoData ? DEMO_SUMMARY : null);
  const recentJobs = Array.isArray(earningsData?.recentJobs) ? earningsData.recentJobs : [];
  const displayedJobs = filterJobsByPeriod(recentJobs, selectedPeriod);
  const chartData = isDemoData
    ? chartPeriod === 'Weekly' ? DEMO_WEEKLY_CHART : DEMO_MONTHLY_CHART
    : chartPeriod === 'Weekly'
      ? (earningsData?.dailyBreakdown || []).map((item) => ({
        label: item.label,
        earnings: Number(item.earnings) || 0,
      }))
      : getMonthlyChartData(recentJobs);
  const chartMax = Math.max(...chartData.map((item) => item.earnings), 1);
  const summaryCards = [
    { label: 'Total Earnings', value: summary?.totalEarnings },
    { label: "Today's Earnings", value: summary?.todayEarnings },
    { label: "This Week's Earnings", value: summary?.weekEarnings },
    { label: "This Month's Earnings", value: summary?.monthEarnings },
  ];

  return (
    <ScreenWrapper>
      <Header title="My Earnings" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.pageIntro}>
          <View style={styles.pageIntroText}>
            <Text style={styles.pageTitle}>My Earnings</Text>
            <Text style={styles.pageSubtitle}>Completed service earnings and wallet balance</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel="Refresh earnings"
          >
            <Ionicons name="refresh-outline" size={19} color={colors.text} />
          </TouchableOpacity>
        </View>

        {earningsError && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Earnings could not be loaded</Text>
              <Text style={styles.errorText}>{earningsError}</Text>
            </View>
            <TouchableOpacity
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel="Retry loading earnings"
            >
              <Ionicons name="refresh-outline" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {isDemoData && (
          <View style={styles.demoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.demoBannerText}>
              DEMO SUMMARY AND CHART — illustrative values only; not actual earnings.
            </Text>
          </View>
        )}

        <View style={styles.overviewGrid}>
          {summaryCards.map((card) => (
            <View key={card.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{card.label}</Text>
              <Text style={styles.metricValue}>
                {card.value === undefined ? '—' : formatMoney(card.value)}
              </Text>
              {isDemoData && <Text style={styles.demoTag}>DEMO</Text>}
            </View>
          ))}
        </View>

        <View style={styles.walletBalanceCard}>
          <View style={styles.walletBalanceIcon}>
            <Ionicons name="wallet-outline" size={20} color={colors.secondary} />
          </View>
          <View style={styles.walletBalanceInfo}>
            <Text style={styles.walletBalanceLabel}>Wallet Balance</Text>
            <Text style={styles.walletBalanceValue}>
              {walletData ? formatMoney(walletData.walletBalance) : 'Unavailable'}
            </Text>
            {walletError && <Text style={styles.walletError}>{walletError}</Text>}
          </View>
          {walletError && (
            <TouchableOpacity
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel="Retry loading wallet balance"
            >
              <Ionicons name="refresh-outline" size={19} color={colors.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.paymentNote}>
          <Text style={styles.paymentNoteTitle}>Earnings and fee breakdown</Text>
          <Text style={styles.paymentNoteText}>
            The earnings API sums request costs but does not explain whether a security fee is included. These are API-reported amounts, not a verified fee split; no separate security fee is added.
          </Text>
          {summary && (
            <Text style={styles.paymentNoteText}>
              Completed services reported: {summary.totalJobs ?? '—'}
            </Text>
          )}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="bar-chart-outline" size={22} color={colors.text} />
              <Text style={styles.sectionTitle}>Earnings Overview</Text>
            </View>
          </View>
          <View style={styles.chartPeriodRow}>
            {['Weekly', 'Monthly'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.chartPeriodChip, chartPeriod === period && styles.chartPeriodChipActive]}
                onPress={() => setChartPeriod(period)}
              >
                <Text style={chartPeriod === period ? styles.chartPeriodTextActive : styles.chartPeriodText}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {isDemoData && <Text style={styles.chartDataHint}>DEMO chart data</Text>}
          {!isDemoData && chartPeriod === 'Monthly' && recentJobs.length > 0 && (
            <Text style={styles.chartDataHint}>Monthly view uses the latest 10 jobs returned by the API.</Text>
          )}
          {chartData.length === 0 || (!isDemoData && chartData.every((item) => !item.earnings)) ? (
            <View style={styles.chartEmpty}>
              <Text style={styles.emptyText}>No earnings breakdown is available for this period.</Text>
            </View>
          ) : (
            <View style={styles.barsRow}>
              {chartData.map((item, index) => (
                <View key={`${item.label}-${index}`} style={styles.barColumn}>
                  <Text style={styles.chartAmount}>{item.earnings ? formatMoney(item.earnings) : ''}</Text>
                  <View
                    style={[
                      styles.bar,
                      styles.chartBar,
                      item.earnings > 0 && styles.barActive,
                      { height: `${Math.max((item.earnings / chartMax) * 100, item.earnings ? 8 : 2)}%` },
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.chartTitleRow}>
            <Ionicons name="time-outline" size={22} color={colors.text} />
            <Text style={styles.sectionTitle}>Service Earnings</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['All', 'Today', 'This Week', 'This Month'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodChip, selectedPeriod === period && styles.periodChipActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={selectedPeriod === period ? styles.periodTextActive : styles.periodText}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {earningsData && displayedJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={30} color={colors.textMuted} />
            <Text style={styles.emptyText}>No completed service records for this filter.</Text>
          </View>
        ) : !earningsData ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={30} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              No transaction records are shown while earnings are unavailable. Demo transactions are not fabricated.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.transactionHint}>
              Showing up to 10 completed services returned by the earnings API.
            </Text>
            {displayedJobs.map((job, index) => (
              <View key={job.id || `${job.completedAt}-${index}`} style={styles.txCard}>
                <View style={styles.txIcon}>
                  <Ionicons name="construct-outline" size={19} color={colors.primary} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{job.serviceType || 'Service type not provided'}</Text>
                  <Text style={styles.txDate}>Request: {job.id || 'ID not provided'}</Text>
                  <Text style={styles.txDate}>{formatDate(job.completedAt)}</Text>
                  <Text style={styles.txDate}>Customer: Not provided by earnings API</Text>
                  <Text style={styles.txDate}>Service charges: Included in request cost; not itemized</Text>
                  <Text style={styles.txDate}>Security fee: Not itemized by API</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, styles.txPositive]}>{formatMoney(job.cost)}</Text>
                  <View style={styles.completedPill}>
                    <Ionicons name="checkmark-circle-outline" size={12} color="#D1FAE5" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  pageIntroText: { flex: 1, paddingRight: spacing.sm },
  pageTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: typography.weights.bold,
    marginTop: 3,
  },
  pageSubtitle: { color: colors.textMuted, fontSize: typography.sizes.sm, marginTop: 2 },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorTextContainer: { flex: 1 },
  errorTitle: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  errorText: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 2 },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.35)',
    backgroundColor: 'rgba(249,115,22,0.12)',
  },
  demoBannerText: { flex: 1, color: colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 100,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: { color: colors.textMuted, fontSize: typography.sizes.xs },
  metricValue: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, marginTop: spacing.sm },
  demoTag: { color: colors.primary, fontSize: 10, fontWeight: typography.weights.bold, marginTop: spacing.xs },
  walletBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  walletBalanceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  walletBalanceInfo: { flex: 1 },
  walletBalanceLabel: { color: colors.textMuted, fontSize: typography.sizes.xs },
  walletBalanceValue: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, marginTop: 2 },
  walletError: { color: colors.warning, fontSize: typography.sizes.xs, marginTop: 2 },
  paymentNote: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
  },
  paymentNoteTitle: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  paymentNoteText: { color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 18, marginTop: spacing.xs },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  chartPeriodRow: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.background, borderRadius: borderRadius.md, padding: 3, marginBottom: spacing.sm },
  chartPeriodChip: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm },
  chartPeriodChipActive: { backgroundColor: colors.secondary },
  chartPeriodText: { color: colors.textMuted, fontSize: typography.sizes.xs },
  chartPeriodTextActive: { color: colors.white, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  chartDataHint: { color: colors.textMuted, fontSize: typography.sizes.xs, marginBottom: spacing.xs },
  barsRow: {
    height: 165,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  barColumn: { height: '100%', flex: 1, alignItems: 'center', justifyContent: 'flex-end', position: 'relative', marginHorizontal: 2 },
  chartAmount: { position: 'absolute', top: 0, color: colors.textMuted, fontSize: 9, textAlign: 'center' },
  chartBar: { width: '55%', minWidth: 8, maxWidth: 30, marginBottom: 21 },
  bar: { backgroundColor: 'rgba(249,115,22,0.55)', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barActive: { backgroundColor: colors.primary },
  barLabel: { color: colors.textMuted, fontSize: 10, position: 'absolute', bottom: 3, textAlign: 'center' },
  chartEmpty: { minHeight: 120, justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  sectionHeader: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  filterRow: { flexDirection: 'row', gap: spacing.xs, paddingBottom: spacing.sm },
  periodChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  periodChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { color: colors.textMuted, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  periodTextActive: { color: colors.white, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  transactionHint: { color: colors.textMuted, fontSize: typography.sizes.xs, marginBottom: spacing.sm },
  emptyContainer: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: typography.sizes.sm, textAlign: 'center' },
  txCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249,115,22,0.18)',
    marginRight: spacing.sm,
  },
  txInfo: { flex: 1, minWidth: 0 },
  txTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text, marginBottom: 2 },
  txDate: { fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 2 },
  txRight: { alignItems: 'flex-end', marginLeft: spacing.xs },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16,185,129,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    marginTop: 5,
  },
  completedText: { color: '#6EE7B7', fontSize: 10, fontWeight: typography.weights.bold },
  txAmount: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  txPositive: { color: '#28A745' },
});
