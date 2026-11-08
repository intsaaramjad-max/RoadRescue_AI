import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';

const formatAmount = (value, currency) => {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return `${currency} ${amount.toLocaleString()}`;
};

export default function PaymentMethodsScreen({ route }) {
  const currency = route?.params?.currency || 'PKR';
  const serviceCharges = formatAmount(route?.params?.serviceCharges, currency);
  const securityFee = formatAmount(route?.params?.securityFee, currency);
  const totalAmount =
    serviceCharges !== null && securityFee !== null
      ? formatAmount(
          Number(route.params.serviceCharges) + Number(route.params.securityFee),
          currency
        )
      : null;
  const pendingAmountLabel = 'To be determined';

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Cash Payment" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.methodCard}>
          <View style={styles.cashIcon}>
            <Ionicons name="cash-outline" size={26} color="#F97316" />
          </View>
          <View style={styles.methodCopy}>
            <Text style={styles.methodTitle}>Cash</Text>
            <Text style={styles.methodDescription}>Your only available payment method</Text>
          </View>
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.selectedText}>Selected</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Service Charges</Text>
        <View style={styles.feeCard}>
          <View style={styles.feeIcon}>
            <Ionicons name="construct-outline" size={20} color="#3B82F6" />
          </View>
          <View style={styles.feeCopy}>
            <Text style={styles.feeTitle}>Service Charges</Text>
            <Text style={styles.feeDescription}>Charges for the requested roadside service</Text>
          </View>
          <Text style={styles.feeAmount}>{serviceCharges || pendingAmountLabel}</Text>
        </View>

        <Text style={styles.sectionTitle}>Security Fee</Text>
        <View style={styles.feeCard}>
          <View style={[styles.feeIcon, styles.securityIcon]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#F97316" />
          </View>
          <View style={styles.feeCopy}>
            <Text style={styles.feeTitle}>Security Fee</Text>
            <Text style={styles.feeDescription}>Amount and calculation will be provided with service pricing</Text>
          </View>
          <Text style={styles.feeAmount}>{securityFee || pendingAmountLabel}</Text>
        </View>

        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Charges</Text>
            <Text style={styles.summaryValue}>{serviceCharges || pendingAmountLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Security Fee</Text>
            <Text style={styles.summaryValue}>{securityFee || pendingAmountLabel}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{totalAmount || pendingAmountLabel}</Text>
          </View>
        </View>

        <View style={styles.cashNotice}>
          <Ionicons name="information-circle-outline" size={21} color="#3B82F6" />
          <Text style={styles.cashNoticeText}>
            You will pay the total amount in cash. The final charges and security fee will be
            shown when their pricing details are available.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249,115,22,0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
    marginBottom: 24,
  },
  cashIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(249,115,22,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodCopy: { flex: 1 },
  methodTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  methodDescription: { color: '#94A3B8', fontSize: 12, marginTop: 3 },
  selectedBadge: { alignItems: 'center', marginLeft: 8 },
  selectedText: { color: '#10B981', fontSize: 10, fontWeight: '700', marginTop: 2 },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  feeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityIcon: { backgroundColor: 'rgba(249,115,22,0.12)' },
  feeCopy: { flex: 1, marginRight: 8 },
  feeTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  feeDescription: { color: '#94A3B8', fontSize: 11, lineHeight: 16, marginTop: 3 },
  feeAmount: { color: '#F8FAFC', fontSize: 13, fontWeight: '700', textAlign: 'right' },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  summaryLabel: { color: '#CBD5E1', fontSize: 14 },
  summaryValue: { color: '#F8FAFC', fontSize: 14, fontWeight: '600', textAlign: 'right' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 5 },
  totalLabel: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  totalAmount: { color: '#F97316', fontSize: 18, fontWeight: '800', textAlign: 'right' },
  cashNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)',
  },
  cashNoticeText: { color: '#CBD5E1', fontSize: 13, lineHeight: 19, flex: 1 },
});
