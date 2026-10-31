import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';

const CARDS = [
  { id: 'c1', type: 'visa',       last4: '4242', expiry: '08/26', isDefault: true  },
  { id: 'c2', type: 'mastercard', last4: '8881', expiry: '12/25', isDefault: false },
];

const TRANSACTIONS = [
  { id: 't1', desc: 'Flat Tire Service',     amount: '-PKR 2,500', date: '01 Jun 2024', icon: 'car-sport',       color: '#EF4444' },
  { id: 't2', desc: 'Battery Jump Start',    amount: '-PKR 1,500', date: '28 May 2024', icon: 'battery-charging', color: '#F59E0B' },
  { id: 't3', desc: 'Fuel Delivery',         amount: '-PKR 3,000', date: '20 May 2024', icon: 'water',            color: '#3B82F6' },
  { id: 't4', desc: 'Wallet Top-Up',         amount: '+PKR 5,000', date: '15 May 2024', icon: 'add-circle',       color: '#10B981' },
];

function CardBrandIcon({ type }) {
  return (
    <View style={cardStyles.brandIcon}>
      <Ionicons
        name={type === 'visa' ? 'card' : 'card-outline'}
        size={22}
        color={type === 'visa' ? '#1A56DB' : '#F97316'}
      />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  brandIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center', alignItems: 'center',
  },
});

export default function PaymentMethodsScreen({ navigation }) {
  const [cards, setCards] = useState(CARDS);
  const [walletBalance] = useState('PKR 2,500');
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);

  const setDefault = (id) => {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
  };

  const removeCard = (id) => {
    Alert.alert('Remove Card', 'Remove this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setCards(prev => prev.filter(c => c.id !== id)) },
    ]);
  };

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Payment Methods" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Wallet Balance Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletRow}>
            <View style={styles.walletIconWrap}>
              <Ionicons name="wallet" size={26} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.walletLabel}>RoadRescue Wallet</Text>
              <Text style={styles.walletBalance}>{walletBalance}</Text>
            </View>
            <TouchableOpacity style={styles.topUpBtn} activeOpacity={0.8}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.topUpTxt}>Top Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Cards */}
        <Text style={styles.sectionTitle}>Saved Cards</Text>
        {cards.map(card => (
          <View key={card.id} style={styles.cardRow}>
            <CardBrandIcon type={card.type} />
            <View style={styles.cardMeta}>
              <Text style={styles.cardName}>
                {card.type === 'visa' ? 'Visa' : 'Mastercard'} •••• {card.last4}
              </Text>
              <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
            </View>
            <View style={styles.cardActions}>
              {card.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeTxt}>Default</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.setDefaultBtn}
                  onPress={() => setDefault(card.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.setDefaultTxt}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => removeCard(card.id)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={17} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add Card */}
        <TouchableOpacity
          style={styles.addCardBtn}
          onPress={() => Alert.alert('Coming Soon', 'Card adding feature coming soon!')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color="#F97316" style={{ marginRight: 8 }} />
          <Text style={styles.addCardTxt}>Add New Card</Text>
        </TouchableOpacity>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="repeat-outline" size={20} color="#10B981" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.settingTitle}>Auto-Pay</Text>
              <Text style={styles.settingSub}>Automatically charge for services</Text>
            </View>
          </View>
          <Switch
            value={autoPayEnabled}
            onValueChange={setAutoPayEnabled}
            trackColor={{ false: '#334155', true: 'rgba(249,115,22,0.4)' }}
            thumbColor={autoPayEnabled ? '#F97316' : '#64748B'}
          />
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {TRANSACTIONS.map(t => (
          <View key={t.id} style={styles.txRow}>
            <View style={[styles.txIcon, { backgroundColor: t.color + '18' }]}>
              <Ionicons name={t.icon} size={18} color={t.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDesc}>{t.desc}</Text>
              <Text style={styles.txDate}>{t.date}</Text>
            </View>
            <Text style={[styles.txAmount, { color: t.amount.startsWith('+') ? '#10B981' : '#F8FAFC' }]}>
              {t.amount}
            </Text>
          </View>
        ))}

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },

  walletCard: {
    backgroundColor: 'rgba(249,115,22,0.08)', borderRadius: 18,
    padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)',
  },
  walletRow: { flexDirection: 'row', alignItems: 'center' },
  walletIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(249,115,22,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  walletLabel: { color: '#94A3B8', fontSize: 13, marginBottom: 4 },
  walletBalance: { color: '#F8FAFC', fontSize: 22, fontWeight: '800' },
  topUpBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F97316', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  topUpTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  sectionTitle: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12, marginTop: 8 },

  cardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardMeta: { flex: 1, marginLeft: 12 },
  cardName: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  cardExpiry: { color: '#64748B', fontSize: 12, marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defaultBadge: { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  defaultBadgeTxt: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  setDefaultBtn: { backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  setDefaultTxt: { color: '#F97316', fontSize: 11, fontWeight: '600' },
  removeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.08)', justifyContent: 'center', alignItems: 'center' },

  addCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(249,115,22,0.3)', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, marginBottom: 24, backgroundColor: 'rgba(249,115,22,0.04)' },
  addCardTxt: { color: '#F97316', fontSize: 14, fontWeight: '700' },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  settingSub: { color: '#64748B', fontSize: 12, marginTop: 2 },

  txRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txDesc: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  txDate: { color: '#64748B', fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
});
