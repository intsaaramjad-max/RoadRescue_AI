import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Tracking', 'Payments', 'Reviews', 'Reports', 'Alerts'];

const notify = (title, message) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
};

async function getJson(path, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

function InfoCard({ icon, title, subtitle, detail }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={21} color={colors.primary} />
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.cardTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        {!!detail && <Text style={styles.cardDetail}>{detail}</Text>}
      </View>
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Empty({ text }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export default function AdminOperationsScreen() {
  const { token, userRole } = useAuth();
  const [tab, setTab] = useState('Tracking');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notice, setNotice] = useState({ userId: '', title: '', body: '' });

  const fetchData = useCallback(async () => {
    if (!token || String(userRole || '').toUpperCase() !== 'ADMIN') {
      setLoadError('An authenticated Admin session is required to view operations.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const endpoints = [
      ['requests', '/admin/requests'],
      ['payments', '/admin/payments'],
      ['feedback', '/admin/feedback'],
      ['users', '/admin/users'],
      ['tickets', '/support/all'],
    ];

    const results = await Promise.all(endpoints.map(async ([key, path]) => {
      try {
        return { key, data: await getJson(path, token) };
      } catch (error) {
        return { key, error: error.message || 'Unable to load data.' };
      }
    }));

    const errors = [];
    for (const result of results) {
      if (result.error) {
        errors.push(`${result.key}: ${result.error}`);
        if (result.key === 'requests') setRequests([]);
        if (result.key === 'payments') setPayments(null);
        if (result.key === 'feedback') setFeedback([]);
        if (result.key === 'users') setUsers([]);
        if (result.key === 'tickets') setTickets([]);
        continue;
      }

      switch (result.key) {
        case 'requests':
          if (Array.isArray(result.data.requests)) setRequests(result.data.requests);
          else {
            setRequests([]);
            errors.push('requests: Invalid response from the server.');
          }
          break;
        case 'payments':
          if (result.data.summary && Array.isArray(result.data.payments)) {
            setPayments(result.data);
          } else {
            setPayments(null);
            errors.push('payments: Invalid response from the server.');
          }
          break;
        case 'feedback':
          if (Array.isArray(result.data.feedback)) setFeedback(result.data.feedback);
          else {
            setFeedback([]);
            errors.push('feedback: Invalid response from the server.');
          }
          break;
        case 'users':
          if (Array.isArray(result.data.users)) setUsers(result.data.users);
          else {
            setUsers([]);
            errors.push('users: Invalid response from the server.');
          }
          break;
        case 'tickets':
          if (Array.isArray(result.data.tickets)) setTickets(result.data.tickets);
          else {
            setTickets([]);
            errors.push('reports: Invalid response from the server.');
          }
          break;
        default:
          break;
      }
    }

    setLoadError(errors.length ? errors.join('\n') : null);
    setLoading(false);
    setRefreshing(false);
  }, [token, userRole]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const activeRequests = useMemo(
    () => requests.filter((request) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(String(request.status || '').toUpperCase())),
    [requests],
  );
  const completedRequests = useMemo(
    () => requests.filter((request) => String(request.status || '').toUpperCase() === 'COMPLETED'),
    [requests],
  );

  const sendNotification = async () => {
    if (!token || String(userRole || '').toUpperCase() !== 'ADMIN') {
      notify('Sign-in required', 'Sign in with an Admin account before sending an alert.');
      return;
    }
    if (!notice.userId || !notice.title.trim() || !notice.body.trim()) {
      notify('Missing details', 'Select a user and enter a title and message.');
      return;
    }

    setActionLoading('notification');
    try {
      const response = await fetch(`${API_URL}/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: notice.userId,
          title: notice.title.trim(),
          body: notice.body.trim(),
          type: 'admin',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Notification failed (${response.status})`);

      notify('Notification saved', data.message || 'The notification was saved for the selected user.');
      setModalVisible(false);
      setNotice({ userId: '', title: '', body: '' });
    } catch (error) {
      notify('Notification failed', error.message || 'Could not send notification.');
    } finally {
      setActionLoading(null);
    }
  };

  const updateTicket = async (ticket, status) => {
    if (!token || String(userRole || '').toUpperCase() !== 'ADMIN') {
      notify('Sign-in required', 'Sign in with an Admin account before managing reports.');
      return;
    }

    setActionLoading(ticket.id);
    try {
      const response = await fetch(`${API_URL}/support/${encodeURIComponent(ticket.id)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Report update failed (${response.status})`);

      setTickets((current) => current.map((item) => item.id === ticket.id ? data.ticket : item));
      notify('Report updated', data.message || 'The backend updated the report.');
    } catch (error) {
      notify('Report update failed', error.message || 'Could not update the report.');
    } finally {
      setActionLoading(null);
    }
  };

  const trackingContent = (
    <>
      <Text style={styles.heading}>Service Tracking</Text>
      <Text style={styles.subheading}>Request status monitoring from the backend. Live GPS and route maps are not integrated.</Text>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={44} color={colors.primary} />
        <Text style={styles.mapTitle}>Live map unavailable</Text>
        <Text style={styles.mapText}>{activeRequests.length} active requests from backend data</Text>
        <Text style={styles.mapNotice}>GPS tracking is not connected</Text>
      </View>
      {activeRequests.length ? activeRequests.map((item) => (
        <InfoCard
          key={item.id || item._id}
          icon="navigate-outline"
          title={`Request ${item.id || item._id || 'ID unavailable'}`}
          subtitle={`${item.serviceType || 'Service not specified'} • ${String(item.status || 'UNKNOWN').toUpperCase()}`}
          detail={`Driver: ${item.driverName || item.driverId || 'Not available'} • Mechanic: ${item.mechanicName || item.mechanicId || 'Not assigned'}`}
        />
      )) : <Empty text="No active service requests are available." />}
    </>
  );

  const paymentsContent = (
    <>
      <Text style={styles.heading}>Payments & Earnings</Text>
      <Text style={styles.subheading}>Completed service records and totals returned by the admin payments API. Customers pay mechanics directly.</Text>
      {payments && (
        <View style={styles.metrics}>
          <Metric label="Transactions" value={payments.summary.totalTransactions ?? 0} />
          <Metric label="Service charges (PKR)" value={Number(payments.summary.totalRevenue || 0).toLocaleString()} />
          <Metric label="Commission (PKR)" value={Number(payments.summary.platformCommission || 0).toLocaleString()} />
        </View>
      )}
      {completedRequests.length ? completedRequests.map((item) => (
        <InfoCard
          key={item.id || item._id}
          icon="card-outline"
          title={item.serviceType || 'Completed service'}
          subtitle={`PKR ${item.cost || 0} • Direct payment`}
          detail={`Request ${item.id || item._id || 'ID unavailable'} • ${formatDate(item.completedAt || item.updatedAt || item.createdAt)}`}
        />
      )) : <Empty text="No completed service transactions are available." />}
    </>
  );

  const reviewsContent = (
    <>
      <Text style={styles.heading}>Feedback & Reviews</Text>
      <Text style={styles.subheading}>Real feedback from the backend. Review moderation actions are not currently provided by an API.</Text>
      <View style={styles.metrics}>
        <Metric label="Total reviews" value={feedback.length} />
        <Metric
          label="Average rating"
          value={feedback.length
            ? (feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedback.length).toFixed(1)
            : '—'}
        />
        <Metric label="Low ratings" value={feedback.filter((item) => Number(item.rating) <= 2).length} />
      </View>
      {feedback.length ? feedback.map((item) => (
        <InfoCard
          key={item.id || item._id}
          icon="star"
          title={`${item.rating ?? '—'}/5 • ${item.serviceType || 'Service not specified'}`}
          subtitle={item.comment || 'No written comment'}
          detail={`Driver: ${item.driverId || 'Not available'} • ${formatDate(item.createdAt)}`}
        />
      )) : <Empty text="No reviews are available." />}
    </>
  );

  const reportsContent = (
    <>
      <Text style={styles.heading}>Support Reports</Text>
      <Text style={styles.subheading}>Review and update support tickets using the existing Admin support APIs.</Text>
      {tickets.length ? tickets.map((ticket) => (
        <View key={ticket.id} style={styles.ticketCard}>
          <InfoCard
            icon="document-text-outline"
            title={`${ticket.id || 'Report'} • ${String(ticket.status || 'OPEN').toUpperCase()}`}
            subtitle={`${ticket.userName || 'User'}${ticket.userEmail ? ` • ${ticket.userEmail}` : ''}`}
            detail={`${ticket.message || 'No report details'} • ${formatDate(ticket.createdAt)}`}
          />
          <View style={styles.ticketActions}>
            {['OPEN', 'IN_PROGRESS', 'RESOLVED'].filter((status) => status !== ticket.status).map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.secondaryButton}
                onPress={() => updateTicket(ticket, status)}
                disabled={actionLoading === ticket.id}
              >
                <Text style={styles.secondaryButtonText}>
                  {actionLoading === ticket.id ? 'Updating…' : `Set ${status.replace('_', ' ')}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )) : <Empty text="No support reports are available." />}
    </>
  );

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Admin Operations" />
      <View style={styles.tabs}>
        {TABS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.tab, tab === item && styles.activeTab]}
            onPress={() => setTab(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === item }}
          >
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Loading operational data…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {!!loadError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{loadError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setLoading(true);
                  fetchData();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {tab === 'Tracking' && trackingContent}
          {tab === 'Payments' && paymentsContent}
          {tab === 'Reviews' && reviewsContent}
          {tab === 'Reports' && reportsContent}
          {tab === 'Alerts' && (
            <>
              <Text style={styles.heading}>Targeted Notifications</Text>
              <Text style={styles.subheading}>Save an in-app notification for one selected registered user. Push delivery, broadcasts, weather, and emergency integrations are not available.</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setModalVisible(true)}
                accessibilityRole="button"
              >
                <Ionicons name="megaphone-outline" size={19} color="#FFF" />
                <Text style={styles.primaryButtonText}>Compose notification</Text>
              </TouchableOpacity>
              <Empty text="This screen does not provide notification history; the backend has no Admin notification-list endpoint." />
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Send notification</Text>
            <Text style={styles.fieldLabel}>Select recipient</Text>
            <ScrollView style={styles.recipientList} nestedScrollEnabled>
              {users.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.recipient, notice.userId === item.id && styles.selectedRecipient]}
                  onPress={() => setNotice((current) => ({ ...current, userId: item.id }))}
                >
                  <Text style={styles.recipientName}>{item.fullName || 'Unnamed user'}</Text>
                  <Text style={styles.recipientDetail}>{item.email || item.id} • {item.role || 'User'}</Text>
                </TouchableOpacity>
              ))}
              {!users.length && <Text style={styles.empty}>No recipients loaded. Retry the operations data first.</Text>}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={colors.textMuted}
              value={notice.title}
              onChangeText={(title) => setNotice((current) => ({ ...current, title }))}
              maxLength={120}
            />
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Message"
              placeholderTextColor={colors.textMuted}
              multiline
              value={notice.body}
              onChangeText={(body) => setNotice((current) => ({ ...current, body }))}
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.primaryButton, actionLoading === 'notification' && styles.disabledButton]}
              onPress={sendNotification}
              disabled={actionLoading === 'notification'}
            >
              {actionLoading === 'notification'
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.primaryButtonText}>Send notification</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} disabled={actionLoading === 'notification'}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    padding: spacing.xs,
    margin: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  activeTabText: { color: '#FFF' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  stateText: { color: colors.textMuted, marginTop: spacing.sm },
  container: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  heading: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: '700' },
  subheading: { color: colors.textMuted, fontSize: typography.sizes.sm, lineHeight: 20, marginTop: 4, marginBottom: spacing.md },
  mapPlaceholder: { minHeight: 190, borderRadius: borderRadius.lg, backgroundColor: '#1B3040', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', padding: spacing.md, marginBottom: spacing.md },
  mapTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700', marginTop: spacing.sm },
  mapText: { color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  mapNotice: { color: '#FDBA74', fontSize: typography.sizes.xs, fontWeight: '700', marginTop: spacing.sm },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  metric: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  metricValue: { color: colors.text, fontSize: typography.sizes.md, fontWeight: '700' },
  metricLabel: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.12)', marginRight: spacing.md },
  cardMeta: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: typography.sizes.sm },
  cardSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
  cardDetail: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  ticketCard: { marginBottom: spacing.sm },
  ticketActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  secondaryButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  secondaryButtonText: { color: colors.primary, fontSize: typography.sizes.xs, fontWeight: '700' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  primaryButtonText: { color: '#FFF', fontWeight: '700' },
  disabledButton: { opacity: 0.65 },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  errorCard: { borderWidth: 1, borderColor: colors.error, backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: typography.sizes.sm, lineHeight: 20 },
  retryButton: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, backgroundColor: colors.primary },
  retryButtonText: { color: '#FFF', fontWeight: '700', fontSize: typography.sizes.xs },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.65)' },
  modal: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, maxHeight: '90%' },
  modalTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700', marginBottom: spacing.md },
  fieldLabel: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: '700', marginBottom: spacing.xs },
  recipientList: { maxHeight: 180, marginBottom: spacing.sm },
  recipient: { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  selectedRecipient: { backgroundColor: 'rgba(249,115,22,0.12)' },
  recipientName: { color: colors.text, fontWeight: '700', fontSize: typography.sizes.sm },
  recipientDetail: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 2 },
  input: { color: colors.text, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  messageInput: { minHeight: 90, textAlignVertical: 'top' },
  cancelText: { textAlign: 'center', color: colors.textMuted, padding: spacing.sm },
});
