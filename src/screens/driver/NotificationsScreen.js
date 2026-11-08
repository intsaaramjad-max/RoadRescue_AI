import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Service completed',
    body: 'Your flat tire request has been completed. Please rate your mechanic.',
    category: 'service',
    icon: 'checkmark-circle-outline',
    color: '#10B981',
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'n2',
    title: 'Mechanic on the way',
    body: 'A mechanic accepted your battery request and is heading to your location.',
    category: 'service',
    icon: 'car-outline',
    color: '#3B82F6',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'n3',
    title: 'Security reminder',
    body: 'For your safety, confirm the mechanic and vehicle details before service begins.',
    category: 'security',
    icon: 'shield-checkmark-outline',
    color: '#F59E0B',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n4',
    title: 'Welcome to RoadRescue',
    body: 'Your account is ready. Add a vehicle to make requesting help easier.',
    category: 'general',
    icon: 'information-circle-outline',
    color: '#F97316',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'service', label: 'Service Updates' },
  { id: 'security', label: 'Security Alerts' },
  { id: 'general', label: 'General' },
];

const formatDateTime = (isoDate) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function NotificationCard({ notification, onMarkRead }) {
  const { title, body, category, icon, color, isRead, createdAt } = notification;

  return (
    <View style={[styles.card, !isRead && styles.unreadCard]}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !isRead && styles.unreadTitle]}>{title}</Text>
          {!isRead ? <View style={styles.unreadDot} accessibilityLabel="Unread" /> : null}
        </View>
        <Text style={styles.description}>{body}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.categoryLabel}>
            {CATEGORIES.find((item) => item.id === category)?.label || 'General'}
          </Text>
          <Text style={styles.date}>{formatDateTime(createdAt)}</Text>
        </View>
        {!isRead ? (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => onMarkRead(notification.id)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${title} as read`}
          >
            <Ionicons name="checkmark-done-outline" size={15} color="#F97316" />
            <Text style={styles.markReadText}>Mark as read</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.readLabel}>Read</Text>
        )}
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const visibleNotifications = useMemo(
    () => notifications.filter(
      (item) => selectedCategory === 'all' || item.category === selectedCategory
    ),
    [notifications, selectedCategory]
  );

  const markRead = (id) => {
    setNotifications((current) =>
      current.map((item) => item.id === id ? { ...item, isRead: true } : item)
    );
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
  };

  const renderItem = ({ item }) => (
    <NotificationCard notification={item} onMarkRead={markRead} />
  );

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Notifications" showBack />
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.screenTitle}>Your updates</Text>
          <Text style={styles.unreadCount}>
            {unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllRead}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map((category) => {
            const selected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={visibleNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          visibleNotifications.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={30} color="#64748B" />
            </View>
            <Text style={styles.emptyTitle}>No notifications here</Text>
            <Text style={styles.emptyDescription}>
              Updates in this category will appear here.
            </Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  screenTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '800' },
  unreadCount: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.24)',
  },
  markAllText: { color: '#F97316', fontSize: 12, fontWeight: '700' },
  categoryContainer: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  categoryList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  categoryChipSelected: { backgroundColor: '#1D4ED8', borderColor: '#3B82F6' },
  categoryText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  categoryTextSelected: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 15,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  unreadCard: {
    backgroundColor: 'rgba(30,41,59,0.98)',
    borderColor: 'rgba(249,115,22,0.32)',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: '#CBD5E1', fontSize: 14, fontWeight: '600' },
  unreadTitle: { color: '#F8FAFC', fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316' },
  description: { color: '#94A3B8', fontSize: 13, lineHeight: 19, marginTop: 6 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  categoryLabel: { color: '#60A5FA', fontSize: 11, fontWeight: '600' },
  date: { color: '#64748B', fontSize: 11 },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 10,
    paddingVertical: 4,
  },
  markReadText: { color: '#F97316', fontSize: 12, fontWeight: '700' },
  readLabel: { color: '#64748B', fontSize: 11, marginTop: 10 },
  emptyList: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  emptyDescription: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
});
