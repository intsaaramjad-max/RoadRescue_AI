import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Tracking', 'Payments', 'Reviews', 'Alerts'];

export default function AdminOperationsScreen() {
  const { token } = useAuth();
  const [tab, setTab] = useState('Tracking');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [notice, setNotice] = useState({ userId: '', title: '', body: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [requestsRes, paymentsRes, feedbackRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/admin/requests`, { headers }),
        fetch(`${API_URL}/admin/payments`, { headers }),
        fetch(`${API_URL}/admin/feedback`, { headers }),
        fetch(`${API_URL}/admin/users`, { headers }),
      ]);
      const [requestsJson, paymentsJson, feedbackJson, usersJson] = await Promise.all([
        requestsRes.json(), paymentsRes.json(), feedbackRes.json(), usersRes.json(),
      ]);
      if (requestsRes.ok) setRequests(requestsJson.requests || []);
      if (paymentsRes.ok) setPayments(paymentsJson.summary);
      if (feedbackRes.ok) setFeedback(feedbackJson.feedback || []);
      if (usersRes.ok) setUsers(usersJson.users || []);
    } catch (error) {
      Alert.alert('Network Error', 'Could not load admin operations.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sendNotification = async () => {
    if (!notice.userId || !notice.title.trim() || !notice.body.trim()) {
      Alert.alert('Missing details', 'Select a user and enter a title and message.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...notice, type: 'admin' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      Alert.alert('Sent', 'Notification sent successfully.');
      setModalVisible(false);
      setNotice({ userId: '', title: '', body: '' });
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not send notification.');
    }
  };

  const activeRequests = requests.filter((item) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(item.status));
  const completed = requests.filter((item) => item.status === 'COMPLETED');
  const totalRevenue = payments?.totalRevenue || completed.reduce((sum, item) => sum + Number(item.cost || 0), 0);

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Admin Operations" showBack />
      <View style={styles.tabs}>
        {TABS.map((item) => (
          <TouchableOpacity key={item} style={[styles.tab, tab === item && styles.activeTab]} onPress={() => setTab(item)}>
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={styles.loader} /> : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {tab === 'Tracking' && <>
            <Text style={styles.heading}>Live Tracking & Map</Text>
            <Text style={styles.subheading}>Monitor active roadside assistance requests and route status.</Text>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={44} color={colors.primary} />
              <Text style={styles.mapTitle}>Active service routes</Text>
              <Text style={styles.mapText}>{activeRequests.length} active requests need monitoring</Text>
              <View style={styles.routeLegend}><Text style={styles.legendText}>● Driver location</Text><Text style={styles.legendText}>● Mechanic location</Text></View>
            </View>
            {activeRequests.map((item) => <InfoCard key={item.id} icon="navigate-outline" title={`Request ${item.id}`} subtitle={`${item.serviceType || 'Roadside assistance'} • ${item.status}`} detail={`Driver: ${item.driverId || 'Unknown'}   Mechanic: ${item.mechanicName || 'Unassigned'}`} />)}
          </>}
          {tab === 'Payments' && <>
            <Text style={styles.heading}>Payments & Earnings</Text>
            <Text style={styles.subheading}>Financial records from completed service requests.</Text>
            <View style={styles.metrics}><Metric label="Transactions" value={payments?.totalTransactions || completed.length} /><Metric label="Service charges" value={`PKR ${Number(totalRevenue).toLocaleString()}`} /><Metric label="Commission" value={`PKR ${Number(payments?.platformCommission || 0).toLocaleString()}`} /></View>
            {completed.map((item) => <InfoCard key={item.id} icon="card-outline" title={item.serviceType || 'Completed service'} subtitle={`PKR ${item.cost || 0} • Paid directly`} detail={`Request ${item.id} • ${new Date(item.completedAt || item.updatedAt || item.createdAt).toLocaleDateString()}`} />)}
          </>}
          {tab === 'Reviews' && <>
            <Text style={styles.heading}>Feedback & Reviews</Text>
            <Text style={styles.subheading}>Driver ratings, comments, and moderation queue.</Text>
            <View style={styles.metrics}><Metric label="Total reviews" value={feedback.length} /><Metric label="Average rating" value={feedback.length ? (feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedback.length).toFixed(1) : '0.0'} /><Metric label="Complaints" value={feedback.filter((item) => Number(item.rating) <= 2).length} /></View>
            {feedback.map((item) => <InfoCard key={item.id} icon="star" title={`${item.rating}/5 • ${item.serviceType || 'Service'}`} subtitle={item.comment || 'No written comment'} detail={`Driver: ${item.driverId || 'Unknown'} • ${new Date(item.createdAt).toLocaleDateString()}`} />)}
            {feedback.length === 0 && <Empty text="No reviews found yet." />}
          </>}
          {tab === 'Alerts' && <>
            <Text style={styles.heading}>Notifications & Alerts</Text>
            <Text style={styles.subheading}>Send emergency alerts, announcements, and service updates.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}><Ionicons name="megaphone-outline" size={19} color="#FFF" /><Text style={styles.primaryButtonText}>Send notification</Text></TouchableOpacity>
            <InfoCard icon="warning-outline" title="Emergency alerts" subtitle="Notify selected drivers or mechanics" detail="Use for urgent service and safety announcements." />
            <InfoCard icon="cloud-outline" title="Weather alerts" subtitle="Share weather-related service warnings" detail="Keep roadside teams informed about conditions." />
            <InfoCard icon="notifications-outline" title="System announcements" subtitle="Broadcast important platform updates" detail={`${users.length} users available as recipients.`} />
          </>}
        </ScrollView>
      )}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Send notification</Text>
          <TextInput style={styles.input} placeholder="Recipient user ID" placeholderTextColor={colors.textMuted} value={notice.userId} onChangeText={(value) => setNotice({ ...notice, userId: value })} />
          <TextInput style={styles.input} placeholder="Title" placeholderTextColor={colors.textMuted} value={notice.title} onChangeText={(value) => setNotice({ ...notice, title: value })} />
          <TextInput style={[styles.input, styles.messageInput]} placeholder="Message" placeholderTextColor={colors.textMuted} multiline value={notice.body} onChangeText={(value) => setNotice({ ...notice, body: value })} />
          <TouchableOpacity style={styles.primaryButton} onPress={sendNotification}><Text style={styles.primaryButtonText}>Send alert</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </ScreenWrapper>
  );
}

function InfoCard({ icon, title, subtitle, detail }) {
  return <View style={styles.card}><View style={styles.iconWrap}><Ionicons name={icon} size={21} color={colors.primary} /></View><View style={styles.cardMeta}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardSubtitle}>{subtitle}</Text><Text style={styles.cardDetail}>{detail}</Text></View></View>;
}
function Metric({ label, value }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Empty({ text }) { return <Text style={styles.empty}>{text}</Text>; }

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: spacing.xs, margin: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  activeTabText: { color: '#FFF' },
  loader: { marginTop: 70 },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  heading: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: '700' },
  subheading: { color: colors.textMuted, fontSize: typography.sizes.sm, lineHeight: 20, marginTop: 4, marginBottom: spacing.md },
  mapPlaceholder: { height: 210, borderRadius: borderRadius.lg, backgroundColor: '#1B3040', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  mapTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700', marginTop: spacing.sm },
  mapText: { color: colors.textMuted, marginTop: 4 },
  routeLegend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  legendText: { color: colors.textMuted, fontSize: 11 },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  metric: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  metricValue: { color: colors.text, fontSize: typography.sizes.md, fontWeight: '700' },
  metricLabel: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.12)', marginRight: spacing.md },
  cardMeta: { flex: 1 }, cardTitle: { color: colors.text, fontWeight: '700', fontSize: typography.sizes.sm }, cardSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 }, cardDetail: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md }, primaryButtonText: { color: '#FFF', fontWeight: '700' }, empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.65)' }, modal: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg }, modalTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700', marginBottom: spacing.md }, input: { color: colors.text, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm }, messageInput: { minHeight: 90, textAlignVertical: 'top' }, cancelText: { textAlign: 'center', color: colors.textMuted, padding: spacing.sm },
});
