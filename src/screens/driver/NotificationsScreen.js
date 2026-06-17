import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Platform, RefreshControl,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

const API_URL = Platform.select({
  ios: 'https://road-rescue-ai-poc2.vercel.app/api',
  android: 'https://road-rescue-ai-poc2.vercel.app/api',
  default: 'https://road-rescue-ai-poc2.vercel.app/api',
});

const DEMO_NOTIFICATIONS = [
  { id: 'n1', title: '✅ Service Completed', body: 'Your Flat Tire request has been completed. Please rate the mechanic.', type: 'success', isRead: false, createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 'n2', title: '🔧 Mechanic On The Way!', body: 'A mechanic has accepted your Battery request and is on the way.', type: 'success', isRead: false, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'n3', title: '⭐ Rate Your Service', body: 'How was your experience with Mike\'s Auto Repair?', type: 'info', isRead: true, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'n4', title: '🎉 Welcome to RoadRescue!', body: 'Your account is active. Add your vehicle to get started.', type: 'info', isRead: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const typeColor = { success: '#10B981', warning: '#F59E0B', info: '#3B82F6', error: '#EF4444' };

export default function NotificationsScreen({ navigation }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications?.length > 0) setNotifications(data.notifications);
      }
    } catch (_) {}
    finally { setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
      onPress={() => markRead(item.id)}
      activeOpacity={0.75}
    >
      <View style={[styles.notifDot, { backgroundColor: typeColor[item.type] || '#64748B' }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleBold]}>{item.title}</Text>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadBadge} />}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Notifications" showBack />

      {/* Header row */}
      <View style={styles.topRow}>
        <Text style={styles.topCount}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllTxt}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor="#F97316" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#334155" />
            <Text style={styles.emptyTxt}>No notifications yet</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  topCount: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  markAllTxt: { color: '#F97316', fontSize: 13, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 48 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12 },
  notifCardUnread: { backgroundColor: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.15)' },
  notifDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  notifTitle: { color: '#94A3B8', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  notifTitleBold: { color: '#F8FAFC', fontWeight: '700' },
  notifBody: { color: '#64748B', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notifTime: { color: '#475569', fontSize: 11 },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316', marginTop: 5 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTxt: { color: '#475569', fontSize: 15, marginTop: 12, fontWeight: '500' },
});
