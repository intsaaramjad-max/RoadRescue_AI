import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function EarningsScreen() {
  const { userToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  const fetchData = useCallback(async () => {
    try {
      const [earnRes, walletRes] = await Promise.all([
        fetch(`${API_URL}/earnings/summary`, { headers: { Authorization: `Bearer ${userToken}` } }),
        fetch(`${API_URL}/payments/wallet`, { headers: { Authorization: `Bearer ${userToken}` } }),
      ]);

      const earnJson = await earnRes.json();
      const walletJson = await walletRes.json();

      if (earnRes.ok) setEarningsData(earnJson);
      if (walletRes.ok) setWalletData(walletJson);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

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
        <Header title="My Earnings" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const walletBalance = walletData?.walletBalance || earningsData?.totalEarnings || 0;
  const recentTx = walletData?.transactions || earningsData?.recentTransactions || [];
  const exampleTransactions = [
    {
      id: 'example-1',
      type: 'JOB_PAYMENT',
      description: 'Emergency battery repair',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      amount: 1800,
      isExample: true,
    },
    {
      id: 'example-2',
      type: 'JOB_PAYMENT',
      description: 'Flat tire service',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      amount: 1200,
      isExample: true,
    },
    {
      id: 'example-3',
      type: 'JOB_PAYMENT',
      description: 'Vehicle lockout assistance',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 1500,
      isExample: true,
    },
  ];
  const displayedTransactions = recentTx.length > 0 ? recentTx : exampleTransactions;
  const chartData = [
    { label: '6 Sep', value: 42 },
    { label: '7 Sep', value: 61 },
    { label: '8 Sep', value: 78 },
    { label: '9 Sep', value: 38 },
    { label: '10 Sep', value: 68 },
    { label: '11 Sep', value: 55 },
    { label: '12 Sep', value: 86 },
  ];

  return (
    <ScreenWrapper>
      <Header title="My Earnings" showBack />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.pageIntro}>
          <View>
            
            <Text style={styles.pageTitle}>My Earnings</Text>
            <Text style={styles.pageSubtitle}>Track your income, rides and performance</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={19} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.periodRow}>
          {['Today', '7 Days', '30 Days', 'All Time'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodChip, selectedPeriod === period && styles.periodChipActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={selectedPeriod === period ? styles.periodTextActive : styles.periodText}>{period}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.walletCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceLabelRow}>
              <View style={styles.balanceIcon}><Ionicons name="wallet-outline" size={22} color="#FFF" /></View>
              <Text style={styles.walletLabel}>Total Earnings</Text>
            </View>
            <Ionicons name="information-circle-outline" size={19} color="#A7F3D0" />
          </View>
          <Text style={styles.balanceText}>Rs. {Number(walletBalance || 2850).toLocaleString()}</Text>
          <Text style={styles.balanceDate}>Today, 12 Sep 2025</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Ionicons name="car-outline" size={20} color="#D1FAE5" />
              <Text style={styles.statValue}>{earningsData?.completedJobsCount || 5}</Text>
              <Text style={styles.statLabel}>Completed Rides</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Ionicons name="time-outline" size={20} color="#D1FAE5" />
              <Text style={styles.statValue}>4h 32m</Text>
              <Text style={styles.statLabel}>Online Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Ionicons name="layers-outline" size={20} color="#D1FAE5" />
              <Text style={styles.statValue}>Rs. 570</Text>
              <Text style={styles.statLabel}>Avg. per Ride</Text>
            </View>
          </View>

          <View style={styles.paymentNote}>
            <Text style={styles.paymentNoteTitle}>Payment is handled directly</Text>
            <Text style={styles.paymentNoteText}>
              Payment is collected directly from the driver by cash, JazzCash, EasyPaisa, or bank transfer.
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="bar-chart-outline" size={22} color={colors.text} />
              <Text style={styles.sectionTitle}>Earnings Overview</Text>
            </View>
            <Text style={styles.chartFilter}>Last 7 Days <Ionicons name="chevron-down" size={13} color={colors.textMuted} /></Text>
          </View>
          <View style={styles.chartArea}>
            <View style={styles.chartGrid}>
              {[4000, 3000, 2000, 1000, 0].map((value) => <Text key={value} style={styles.axisLabel}>{value.toLocaleString()}</Text>)}
            </View>
            <View style={styles.barsRow}>
              {chartData.map((item, index) => (
                <View key={item.label} style={styles.barColumn}>
                  {index === chartData.length - 1 && <Text style={styles.barValue}>Rs. 2,850</Text>}
                  <View style={[styles.bar, index === chartData.length - 1 && styles.barActive, { height: `${item.value}%` }]} />
                  <Text style={styles.barLabel}>{item.label.replace(' Sep', '')}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.chartTitleRow}>
            <Ionicons name="time-outline" size={22} color={colors.text} />
            <Text style={styles.sectionTitle}>Recent Earnings</Text>
          </View>
          <Text style={styles.sectionHint}>View All  ›</Text>
        </View>
        {displayedTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        ) : (
          displayedTransactions.map((tx, idx) => (
            <View key={tx.id || idx} style={styles.txCard}>
              <View style={styles.txIcon}>
                <Ionicons
                  name={tx.type === 'PAYOUT' ? 'arrow-up-outline' : 'checkmark'}
                  size={19}
                  color={tx.type === 'PAYOUT' ? '#FB7185' : '#34D399'}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle}>{tx.description || (tx.type === 'PAYOUT' ? 'Withdrawal' : 'Job Payment')}</Text>
                <Text style={styles.txDate}>
                  {tx.isExample ? '12 Sep, 08:42 PM' : new Date(tx.createdAt || tx.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, tx.type === 'PAYOUT' ? styles.txNegative : styles.txPositive]}>Rs. {tx.amount}</Text>
                <View style={styles.completedPill}><Ionicons name="checkmark-circle-outline" size={12} color="#D1FAE5" /><Text style={styles.completedText}>Completed</Text></View>
              </View>
            </View>
          ))
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
  walletCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  pageIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  pageEyebrow: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.2,
  },
  aiText: { color: colors.primary },
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
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  periodText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  periodTextActive: {
    color: '#FFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balanceIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  walletLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  balanceText: {
    color: colors.text,
    fontSize: 34,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  balanceDate: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: -2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    width: '100%',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 6,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  paymentNote: {
    width: '100%',
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
  },
  paymentNoteTitle: {
    color: '#FFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  paymentNoteText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.sizes.xs,
    lineHeight: 17,
    marginTop: 3,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  sectionHint: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: spacing.md,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  txDate: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  txRight: { alignItems: 'flex-end', marginLeft: spacing.sm },
  completedPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(16,185,129,0.18)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.round, marginTop: 5 },
  completedText: { color: '#6EE7B7', fontSize: 10, fontWeight: typography.weights.bold },
  txAmount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  txPositive: { color: '#28A745' },
  txNegative: { color: '#DC3545' },

  chartCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chartFilter: { color: colors.textMuted, fontSize: typography.sizes.xs },
  chartArea: { height: 165, flexDirection: 'row' },
  chartGrid: { width: 42, justifyContent: 'space-between', paddingBottom: 22 },
  axisLabel: { color: colors.textMuted, fontSize: 10, textAlign: 'right' },
  barsRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 1, borderColor: colors.border, paddingLeft: 5 },
  barColumn: { height: '100%', flex: 1, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  bar: { width: 25, maxHeight: 112, minHeight: 22, backgroundColor: 'rgba(249,115,22,0.55)', borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: 0.9 },
  barActive: { backgroundColor: colors.primary },
  barLabel: { color: colors.textMuted, fontSize: 10, position: 'absolute', bottom: -20 },
  barValue: { position: 'absolute', top: 5, color: '#FFF', backgroundColor: colors.primary, fontSize: 10, fontWeight: typography.weights.bold, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8, zIndex: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border || '#DDD',
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  methodChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border || '#DDD',
  },
  activeMethodChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  activeMethodText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
  },
  cancelBtn: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
  },
});
