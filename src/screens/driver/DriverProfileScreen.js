import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const API_URL = Platform.select({
  ios: 'https://road-rescue-ai-poc2.vercel.app/api',
  android: 'https://road-rescue-ai-poc2.vercel.app/api',
  default: 'https://road-rescue-ai-poc2.vercel.app/api',
});

const VEHICLE_TYPES = ['Car', 'Bike', 'Truck', 'Van', 'SUV'];
const CAR_COLORS = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Green', 'Grey', 'Other'];

// ─── Star Row ─────────────────────────────────────────────────────────────────
function StarRow({ rating }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Ionicons
          key={s}
          name={s <= Math.round(rating) ? 'star' : 'star-outline'}
          size={13}
          color="#F59E0B"
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, onSetPrimary, onDelete, onEdit }) {
  return (
    <View style={vStyles.card}>
      <View style={vStyles.iconWrap}>
        <Ionicons
          name={vehicle.vehicleType === 'Bike' ? 'bicycle' : 'car'}
          size={26}
          color="#F97316"
        />
      </View>
      <View style={vStyles.meta}>
        <View style={vStyles.topRow}>
          <Text style={vStyles.name}>
            {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}
          </Text>
          {vehicle.isPrimary && (
            <View style={vStyles.primaryBadge}>
              <Text style={vStyles.primaryBadgeText}>Primary</Text>
            </View>
          )}
        </View>
        <Text style={vStyles.plate}>{vehicle.plateNumber}</Text>
        <Text style={vStyles.detail}>
          {[vehicle.color, vehicle.vehicleType].filter(Boolean).join(' • ')}
        </Text>
      </View>
      <View style={vStyles.actions}>
        <TouchableOpacity onPress={onEdit} style={vStyles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="pencil" size={16} color="#94A3B8" />
        </TouchableOpacity>
        {!vehicle.isPrimary && (
          <TouchableOpacity onPress={onSetPrimary} style={vStyles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDelete} style={vStyles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const vStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  iconWrap: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: 'rgba(249,115,22,0.12)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  meta: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  name: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', flex: 1 },
  primaryBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6,
  },
  primaryBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
  plate: { color: '#F97316', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  detail: { color: '#64748B', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 4, marginLeft: 6 },
  actionBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
});

// ─── Vehicle Form Modal ───────────────────────────────────────────────────────
function VehicleModal({ visible, onClose, onSave, editing }) {
  const [make, setMake]     = useState('');
  const [model, setModel]   = useState('');
  const [year, setYear]     = useState('');
  const [color, setColor]   = useState('');
  const [plate, setPlate]   = useState('');
  const [type, setType]     = useState('Car');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setMake(editing.make || ''); setModel(editing.model || '');
      setYear(editing.year || ''); setColor(editing.color || '');
      setPlate(editing.plateNumber || ''); setType(editing.vehicleType || 'Car');
    } else {
      setMake(''); setModel(''); setYear(''); setColor(''); setPlate(''); setType('Car');
    }
  }, [editing, visible]);

  const handleSave = async () => {
    if (!make.trim() || !model.trim() || !plate.trim()) {
      Alert.alert('Required Fields', 'Please fill in Make, Model, and Plate Number.');
      return;
    }
    setSaving(true);
    await onSave({ make, model, year, color, plateNumber: plate, vehicleType: type });
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <View style={mStyles.sheetHandle} />
          <View style={mStyles.header}>
            <Text style={mStyles.title}>{editing ? 'Edit Vehicle' : 'Add New Vehicle'}</Text>
            <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={mStyles.label}>Vehicle Type</Text>
            <View style={mStyles.typeRow}>
              {VEHICLE_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[mStyles.chip, type === t && mStyles.chipActive]}
                  onPress={() => setType(t)} activeOpacity={0.7}
                >
                  <Text style={[mStyles.chipText, type === t && mStyles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={mStyles.label}>Make (Brand) *</Text>
            <TextInput style={mStyles.input} placeholder="Toyota, Honda, Suzuki..."
              placeholderTextColor="#475569" value={make} onChangeText={setMake} />

            <Text style={mStyles.label}>Model *</Text>
            <TextInput style={mStyles.input} placeholder="Corolla, Civic, Alto..."
              placeholderTextColor="#475569" value={model} onChangeText={setModel} />

            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={mStyles.label}>Year</Text>
                <TextInput style={mStyles.input} placeholder="2020"
                  placeholderTextColor="#475569" value={year} onChangeText={setYear}
                  keyboardType="numeric" maxLength={4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mStyles.label}>Color</Text>
                <TextInput style={mStyles.input} placeholder="White..."
                  placeholderTextColor="#475569" value={color} onChangeText={setColor} />
              </View>
            </View>

            <View style={mStyles.typeRow}>
              {CAR_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[mStyles.chip, color === c && mStyles.chipActive]}
                  onPress={() => setColor(c)} activeOpacity={0.7}
                >
                  <Text style={[mStyles.chipText, color === c && mStyles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={mStyles.label}>Plate Number *</Text>
            <TextInput style={[mStyles.input, { textTransform: 'uppercase' }]}
              placeholder="e.g. LHR-2356" placeholderTextColor="#475569"
              value={plate} onChangeText={t => setPlate(t.toUpperCase())}
              autoCapitalize="characters" />

            <TouchableOpacity
              style={[mStyles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave} disabled={saving} activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={mStyles.saveBtnText}>{editing ? 'Update Vehicle' : 'Add Vehicle'}</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#334155', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center' },
  label: { color: '#64748B', fontSize: 11, fontWeight: '700', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 12, color: '#F8FAFC', fontSize: 15 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
  chipActive: { backgroundColor: 'rgba(249,115,22,0.15)', borderColor: '#F97316' },
  chipText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#F97316', fontWeight: '700' },
  saveBtn: { backgroundColor: '#F97316', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24, marginBottom: 8, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DriverProfileScreen
// ═══════════════════════════════════════════════════════════════════════════════
export default function DriverProfileScreen({ navigation }) {
  const { user, token, logout } = useAuth();

  const [stats, setStats]       = useState({ totalRescues: 0, totalVehicles: 0, rating: 5.0 });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [activeTab, setActiveTab]   = useState('profile');
  const [profileImage, setProfileImage] = useState(null); // local URI of picked image

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || stats);
        setVehicles(data.user?.vehicles || []);
      }
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  // ── Pick profile picture ───────────────────────────────────────────────────
  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow photo library access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setProfileImage(result.assets[0].uri);
      // TODO: upload to backend when file upload is supported
    }
  };

  // ── Vehicle save ───────────────────────────────────────────────────────────
  const handleSaveVehicle = async (formData) => {
    try {
      const url = editingVehicle
        ? `${API_URL}/profile/vehicles/${editingVehicle.id}`
        : `${API_URL}/profile/vehicles`;
      const method = editingVehicle ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert(editingVehicle ? 'Updated! ✅' : 'Added! 🚗', data.message);
        fetchProfile();
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (_) {
      Alert.alert('Error', 'Could not reach server. Please try again.');
    } finally {
      setShowModal(false);
      setEditingVehicle(null);
    }
  };

  const handleDeleteVehicle = (v) => {
    Alert.alert('Delete Vehicle', `Remove ${v.make} ${v.model}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/profile/vehicles/${v.id}`, {
              method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) fetchProfile();
          } catch (_) {}
        },
      },
    ]);
  };

  const handleSetPrimary = async (v) => {
    try {
      await fetch(`${API_URL}/profile/vehicles/${v.id}/primary`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      fetchProfile();
    } catch (_) {}
  };

  // ── Profile menu items (with navigation) ──────────────────────────────────
  const menuItems = [
    {
      icon: 'card-outline', title: 'Payment Methods',
      subtitle: 'Cards & Wallets', color: '#F59E0B',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      icon: 'notifications-outline', title: 'Notifications',
      subtitle: 'Alerts & Updates', color: '#3B82F6',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'shield-checkmark-outline', title: 'Privacy & Security',
      subtitle: 'Password & Account Security', color: '#8B5CF6',
      onPress: () => navigation.navigate('PrivacySecurity'),
    },
    {
      icon: 'time-outline', title: 'Service History',
      subtitle: 'View past rescues', color: '#10B981',
      onPress: () => navigation.navigate('History'),
    },
    {
      icon: 'help-buoy-outline', title: 'Help & Support',
      subtitle: 'FAQ & Contact Us', color: '#EF4444',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  if (loading) {
    return (
      <ScreenWrapper useSafeArea>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper useSafeArea>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          {/* Avatar with camera button */}
          <View style={styles.avatarWrap}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'D'}
                </Text>
              </View>
            )}
            {/* Camera button */}
            <TouchableOpacity style={styles.cameraBtn} onPress={pickProfileImage} activeOpacity={0.8}>
              <Ionicons name="camera" size={15} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Only name shown */}
          <Text style={styles.heroName}>{user?.fullName || 'Driver'}</Text>

          {/* Member since */}
          <View style={styles.memberRow}>
            <Ionicons name="calendar-outline" size={12} color="#475569" />
            <Text style={styles.memberText}>
              Member since{' '}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'Today'}
            </Text>
          </View>
        </View>

        {/* ── STATS ── */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.totalRescues ?? 0}</Text>
            <Text style={styles.statLbl}>Rescues</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.totalVehicles ?? vehicles.length}</Text>
            <Text style={styles.statLbl}>Vehicles</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#F59E0B' }]}>
              {(stats.rating ?? 5).toFixed(1)}
            </Text>
            <StarRow rating={stats.rating ?? 5} />
            <Text style={styles.statLbl}>Rating</Text>
          </View>
        </View>

        {/* ── TABS ── */}
        <View style={styles.tabs}>
          {['profile', 'vehicles'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab === 'profile'
                  ? (activeTab === tab ? 'person' : 'person-outline')
                  : (activeTab === tab ? 'car' : 'car-outline')}
                size={15}
                color={activeTab === tab ? '#F97316' : '#64748B'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.tabTxt, activeTab === tab && styles.tabTxtActive]}>
                {tab === 'profile' ? 'Profile' : `Vehicles${vehicles.length ? ` (${vehicles.length})` : ''}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <View style={styles.section}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i} style={styles.menuItem}
                onPress={item.onPress} activeOpacity={0.75}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={21} color={item.color} />
                </View>
                <View style={styles.menuMeta}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSub}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#334155" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutTxt}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── VEHICLES TAB ── */}
        {activeTab === 'vehicles' && (
          <View style={styles.section}>
            {vehicles.length === 0 && (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="car-outline" size={38} color="#334155" />
                </View>
                <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
                <Text style={styles.emptyDesc}>
                  Add your vehicle so mechanics can quickly identify your car.
                </Text>
              </View>
            )}

            {vehicles.map(v => (
              <VehicleCard
                key={v.id} vehicle={v}
                onSetPrimary={() => handleSetPrimary(v)}
                onDelete={() => handleDeleteVehicle(v)}
                onEdit={() => { setEditingVehicle(v); setShowModal(true); }}
              />
            ))}

            {vehicles.length < 5 && (
              <TouchableOpacity
                style={styles.addVehicleBtn}
                onPress={() => { setEditingVehicle(null); setShowModal(true); }}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color="#F97316" style={{ marginRight: 8 }} />
                <Text style={styles.addVehicleTxt}>Add New Vehicle</Text>
              </TouchableOpacity>
            )}

            <View style={styles.tipBox}>
              <Ionicons name="information-circle-outline" size={17} color="#3B82F6" style={{ marginRight: 8 }} />
              <Text style={styles.tipTxt}>
                Your primary vehicle is auto-filled when you create a rescue request.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <VehicleModal
        visible={showModal}
        onClose={() => { setShowModal(false); setEditingVehicle(null); }}
        onSave={handleSaveVehicle}
        editing={editingVehicle}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 48 },

  // Hero — only name
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 20, backgroundColor: '#0F172A' },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarFallback: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(249,115,22,0.4)',
  },
  avatarImg: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: 'rgba(249,115,22,0.4)',
  },
  avatarLetter: { fontSize: 40, color: '#FFF', fontWeight: '800' },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F97316',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#0F172A',
    shadowColor: '#F97316', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 3,
  },
  heroName: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberText: { color: '#475569', fontSize: 12 },

  // Stats
  statsCard: {
    flexDirection: 'row', backgroundColor: '#1E293B',
    borderRadius: 18, marginHorizontal: 20, marginTop: -6, marginBottom: 18,
    paddingVertical: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  statLbl: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 2 },

  // Tabs
  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: 'rgba(249,115,22,0.12)' },
  tabTxt: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  tabTxtActive: { color: '#F97316', fontWeight: '700' },

  // Section
  section: { paddingHorizontal: 20 },

  // Menu
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  menuIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuMeta: { flex: 1 },
  menuTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  menuSub: { color: '#64748B', fontSize: 12 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14,
    paddingVertical: 14, marginTop: 10, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.14)',
  },
  logoutTxt: { color: '#EF4444', fontSize: 16, fontWeight: '700', marginLeft: 8 },

  // Vehicles empty
  emptyBox: { alignItems: 'center', paddingVertical: 28 },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTitle: { color: '#94A3B8', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { color: '#475569', fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 20 },

  // Add vehicle
  addVehicleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(249,115,22,0.35)', borderStyle: 'dashed',
    borderRadius: 14, paddingVertical: 14, marginTop: 4, marginBottom: 14,
    backgroundColor: 'rgba(249,115,22,0.05)',
  },
  addVehicleTxt: { color: '#F97316', fontSize: 15, fontWeight: '700' },

  // Tip
  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(59,130,246,0.07)', borderRadius: 12,
    padding: 12, marginTop: 2,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.14)',
  },
  tipTxt: { color: '#94A3B8', fontSize: 12, lineHeight: 17, flex: 1 },
});
