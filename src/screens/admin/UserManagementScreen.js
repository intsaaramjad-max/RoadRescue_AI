import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput,
  Modal,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Platform } from 'react-native';

const API_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

const ROLE_FILTERS = ['ALL', 'DRIVER', 'MECHANIC'];

const ROLE_COLORS = {
  DRIVER:  '#3B82F6',
  MECHANIC:'#F97316',
  ADMIN:   '#8B5CF6',
};

const STATUS_COLORS = {
  APPROVED: '#10B981',
  PENDING:  '#F59E0B',
  REJECTED: '#EF4444',
};

function UserCard({ user, onToggle, onDetails }) {
  const initial = (user.fullName || user.email || '?').charAt(0).toUpperCase();
  const roleColor   = ROLE_COLORS[user.role] || '#64748B';
  const statusColor = STATUS_COLORS[user.verificationStatus] || '#64748B';

  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: roleColor + '30' }]}>
        <Text style={[styles.avatarText, { color: roleColor }]}>{initial}</Text>
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name} numberOfLines={1}>{user.fullName}</Text>
        <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.badgeText, { color: roleColor }]}>{user.role}</Text>
          </View>
          {user.role === 'MECHANIC' && (
            <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{user.verificationStatus}</Text>
            </View>
          )}
          {user.isActive === false && (
            <View style={[styles.badge, { backgroundColor: '#EF444420' }]}>
              <Text style={[styles.badgeText, { color: '#EF4444' }]}>DEACTIVATED</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.detailsBtn} onPress={() => onDetails(user)}>
        <Ionicons name="eye-outline" size={18} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deactivateBtn} onPress={() => onToggle(user)}>
        <Ionicons name={user.isActive === false ? 'checkmark-circle-outline' : 'ban-outline'} size={18} color={user.isActive === false ? '#10B981' : '#EF4444'} />
      </TouchableOpacity>
    </View>
  );
}

export default function UserManagementScreen() {
  const { token } = useAuth();
  const [users, setUsers]         = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRole, setActiveRole] = useState('ALL');
  const [search, setSearch]       = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setFiltered(data.users);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch {
      Alert.alert('Network Error', 'Could not connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Filter whenever role or search changes
  useEffect(() => {
    let list = users;
    if (activeRole !== 'ALL') list = list.filter(u => u.role === activeRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
      );
    }
    setFiltered(list);
  }, [users, activeRole, search]);

  const handleToggle = (user) => {
    const nextActive = user.isActive === false;
    Alert.alert(
      nextActive ? 'Unblock User' : 'Block User',
      `${nextActive ? 'Restore access for' : 'Block'} ${user.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextActive ? 'Unblock' : 'Block', style: nextActive ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/admin/users/${user.id}/status`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isActive: nextActive }),
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Done', data.message);
                fetchUsers();
              } else {
                Alert.alert('Error', data.message);
              }
            } catch {
              Alert.alert('Network Error', 'Could not connect to server');
            }
          },
        },
      ]
    );
  };

  const openDetails = async (user) => {
    setSelectedUser(user);
    setDetailsVisible(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${user.id}/requests`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) setHistory(data.requests || []);
    } catch { setHistory([]); }
  };

  return (
    <ScreenWrapper useSafeArea>
      <Header title="User Management" />

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, email, phone…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Role filter tabs */}
      <View style={styles.tabs}>
        {ROLE_FILTERS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.tab, activeRole === r && styles.tabActive]}
            onPress={() => setActiveRole(r)}
          >
            <Text style={[styles.tabText, activeRole === r && styles.tabTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => <UserCard user={item} onToggle={handleToggle} onDetails={openDetails} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
      <Modal visible={detailsVisible} transparent animationType="slide" onRequestClose={() => setDetailsVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>{selectedUser?.fullName || 'User details'}</Text>
          <Text style={styles.modalLine}>{selectedUser?.email}</Text>
          <Text style={styles.modalLine}>{selectedUser?.phone || 'No phone provided'}</Text>
          <Text style={styles.historyTitle}>Service history</Text>
          {history.length === 0 ? <Text style={styles.modalLine}>No service requests found.</Text> : history.slice(0, 8).map((item) => <Text key={item.id} style={styles.historyLine}>{item.serviceType || 'Service'} • {item.status} • PKR {item.cost || 0}</Text>)}
          <TouchableOpacity style={styles.closeButton} onPress={() => setDetailsVisible(false)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: spacing.xl, marginTop: spacing.sm,
    borderRadius: borderRadius.lg, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, color: colors.text, fontSize: typography.sizes.md },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginVertical: spacing.md, gap: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  tabActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText:       { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list:  { paddingHorizontal: spacing.xl, paddingBottom: 48 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar:     { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  name:       { color: colors.text, fontSize: typography.sizes.md, fontWeight: '700' },
  email:      { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  phone:      { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  badgeRow:   { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:  { fontSize: 10, fontWeight: '700' },
  deactivateBtn: { padding: 8, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10 },
  detailsBtn: { padding: 8, backgroundColor: 'rgba(249,115,22,0.08)', borderRadius: 10, marginRight: 6 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.65)' },
  modal: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg },
  modalTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700', marginBottom: spacing.sm },
  modalLine: { color: colors.textMuted, fontSize: typography.sizes.sm, marginBottom: 4 },
  historyTitle: { color: colors.text, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  historyLine: { color: colors.textMuted, fontSize: typography.sizes.xs, paddingVertical: 4 },
  closeButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.sm, marginTop: spacing.md },
  closeText: { color: '#FFF', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.textMuted, marginTop: 12, fontSize: typography.sizes.md },
});
