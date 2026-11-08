import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const valueOrFallback = (value) => (value === undefined || value === null || value === '' ? 'Not provided' : String(value));

const maskCnic = (value) => {
  if (!value) return 'Not provided';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 5) return '••••';
  return `${'•'.repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString();
};

const formatMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `Rs. ${amount.toLocaleString()}` : 'Not available';
};

const getVerification = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED' || normalized === 'VERIFIED') return { label: 'Verified', color: colors.success };
  if (normalized === 'PENDING') return { label: 'Pending', color: colors.warning };
  if (normalized === 'REJECTED') return { label: 'Rejected', color: colors.error };
  return { label: 'Not submitted', color: colors.textMuted };
};

export default function MechanicProfileScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [profileError, setProfileError] = useState(null);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveNotice, setSaveNotice] = useState(null);
  const [localProfileEdits, setLocalProfileEdits] = useState({});
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    workshopName: '',
    experience: '',
    specialization: '',
  });

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setProfile(user || {});
      setProfileError('Sign in to load current profile and performance information.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Profile request failed (${response.status})`);
      setProfile(data.user || user || {});
      setStats(data.stats || null);
      setProfileError(null);
    } catch (error) {
      setProfile(user || {});
      setStats(null);
      setProfileError(error.message || 'Unable to load profile information.');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayProfile = useMemo(() => ({ ...profile, ...localProfileEdits }), [profile, localProfileEdits]);
  const verification = getVerification(displayProfile.verificationStatus);
  const profileImage = displayProfile.profileImage || displayProfile.profilePhoto || displayProfile.avatar || displayProfile.imageUrl;
  const name = displayProfile.fullName || '';
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
  const cnic = displayProfile.cnicNumber || displayProfile.cnic || displayProfile.nationalId;
  const location = displayProfile.city || displayProfile.location || displayProfile.address;
  const services = Array.isArray(displayProfile.servicesOffered)
    ? displayProfile.servicesOffered.filter(Boolean).map((service) => typeof service === 'string' ? service : service.name || service.title).filter(Boolean)
    : [];
  const ratingAvailable = Number(stats?.totalReviews) > 0 && Number.isFinite(Number(stats?.rating));

  const openEditor = () => {
    setForm({
      fullName: displayProfile.fullName || '',
      phone: displayProfile.phone || '',
      city: displayProfile.city || displayProfile.location || '',
      workshopName: displayProfile.workshopName || '',
      experience: String(displayProfile.experience ?? displayProfile.experienceYears ?? ''),
      specialization: displayProfile.specialization || '',
    });
    setSaveError(null);
    setEditVisible(true);
  };

  const saveProfile = async () => {
    const fullName = form.fullName.trim();
    const phone = form.phone.trim();
    if (!fullName || !phone) {
      setSaveError('Full name and phone number are required.');
      return;
    }
    if (!token) {
      setSaveError('A signed-in session is required to save profile changes.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Profile update failed (${response.status})`);

      const updatedProfile = data.user || { ...profile, fullName, phone };
      setProfile(updatedProfile);
      const localOnly = {
        city: form.city.trim(),
        workshopName: form.workshopName.trim(),
        experience: form.experience.trim(),
        specialization: form.specialization.trim(),
      };
      setLocalProfileEdits(localOnly);
      setSaveNotice('Name and phone saved to your account. Other edited fields are temporary on this screen only.');
      setEditVisible(false);
    } catch (error) {
      setSaveError(error.message || 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (isAvailable) => {
    if (!token) {
      setAvailabilityError('Sign in to update availability.');
      return;
    }
    setAvailabilitySaving(true);
    setAvailabilityError(null);
    try {
      const response = await fetch(`${API_URL}/profile/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Availability update failed (${response.status})`);
      setProfile((current) => ({ ...current, ...(data.user || {}), isAvailable }));
    } catch (error) {
      setAvailabilityError(error.message || 'Unable to update availability.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const shortcuts = [
    { icon: 'document-text-outline', title: 'Verification Status', subtitle: verification.label, action: () => navigation.navigate('HomeStack', { screen: 'Verification', params: { backTab: 'Profile' } }) },
    { icon: 'construct-outline', title: 'Services Offered', subtitle: 'View service settings', action: () => navigation.navigate('HomeStack', { screen: 'ServicesOffered', params: { backTab: 'Profile' } }) },
    { icon: 'cash-outline', title: 'Earnings', subtitle: 'View completed service earnings', action: () => navigation.navigate('Earnings') },
    { icon: 'star-outline', title: 'Reviews', subtitle: 'View customer feedback', action: () => navigation.navigate('HomeStack', { screen: 'Reviews', params: { backTab: 'Profile' } }) },
    { icon: 'settings-outline', title: 'Settings', subtitle: 'App preferences', action: () => navigation.navigate('HomeStack', { screen: 'MechanicSettings', params: { backTab: 'Profile' } }) },
  ];

  const informationRows = [
    { label: 'Full Name', value: valueOrFallback(displayProfile.fullName), icon: 'person-outline' },
    { label: 'Phone Number', value: valueOrFallback(displayProfile.phone), icon: 'call-outline' },
    { label: 'Email Address', value: valueOrFallback(displayProfile.email), icon: 'mail-outline' },
    { label: 'CNIC Number', value: maskCnic(cnic), icon: 'card-outline' },
    { label: 'City / Location', value: valueOrFallback(location), icon: 'location-outline' },
  ];

  const professionalRows = [
    { label: 'Mechanic Experience', value: valueOrFallback(displayProfile.experience ?? displayProfile.experienceYears), icon: 'time-outline' },
    { label: 'Specialization', value: valueOrFallback(displayProfile.specialization), icon: 'construct-outline' },
    { label: 'Services Offered', value: services.length ? services.join(', ') : 'Not provided', icon: 'build-outline' },
    { label: 'Workshop Name', value: valueOrFallback(displayProfile.workshopName), icon: 'business-outline' },
    { label: 'Working Availability', value: displayProfile.isAvailable === undefined ? 'Not available' : displayProfile.isAvailable ? 'Online' : 'Offline', icon: 'radio-outline' },
  ];

  return (
    <ScreenWrapper>
      <Header title="Mechanic Profile" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {profileError && (
          <View style={styles.noticeCard}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeText}>{profileError}</Text>
              <TouchableOpacity onPress={fetchProfile} accessibilityRole="button">
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.mutedText}>Refreshing profile...</Text>
          </View>
        )}

        {saveNotice && (
          <TouchableOpacity style={styles.successBanner} onPress={() => setSaveNotice(null)} accessibilityRole="button">
            <Ionicons name="checkmark-circle-outline" size={19} color={colors.success} />
            <Text style={styles.successText}>{saveNotice}</Text>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatar}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <View style={styles.heroIdentity}>
              <Text style={styles.name}>{valueOrFallback(displayProfile.fullName)}</Text>
              <Text style={styles.contactText}>{valueOrFallback(displayProfile.email)}</Text>
              <Text style={styles.contactText}>{valueOrFallback(displayProfile.phone)}</Text>
            </View>
          </View>
          <View style={styles.heroMetaRow}>
            <View style={[styles.statusBadge, { borderColor: `${verification.color}66`, backgroundColor: `${verification.color}1A` }]}>
              <View style={[styles.statusDot, { backgroundColor: verification.color }]} />
              <Text style={[styles.statusText, { color: verification.color }]}>{verification.label}</Text>
            </View>
            <Text style={styles.memberText}>Member since {formatDate(stats?.memberSince || displayProfile.createdAt)}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={openEditor} accessibilityRole="button">
            <Ionicons name="create-outline" size={18} color={colors.white} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <View style={styles.availabilityRow}>
            <View style={styles.availabilityMeta}>
              <Ionicons name="radio-outline" size={19} color={displayProfile.isAvailable ? colors.success : colors.textMuted} />
              <View>
                <Text style={styles.availabilityTitle}>Working availability</Text>
                <Text style={styles.availabilityState}>
                  {displayProfile.isAvailable === undefined ? 'Unavailable' : displayProfile.isAvailable ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
            <Switch
              value={Boolean(displayProfile.isAvailable)}
              onValueChange={toggleAvailability}
              disabled={availabilitySaving || displayProfile.isAvailable === undefined}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.white}
            />
          </View>
          {availabilitySaving && <Text style={styles.mutedText}>Updating availability...</Text>}
          {availabilityError && <Text style={styles.inlineError}>{availabilityError}</Text>}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          {stats && <Text style={styles.sectionCaption}>Account data</Text>}
        </View>
        <View style={styles.statsGrid}>
          <Metric icon="checkmark-done-outline" label="Completed Services" value={stats?.completedJobs ?? '—'} />
          <Metric icon="cash-outline" label="Total Earnings" value={stats ? formatMoney(stats.totalEarnings) : '—'} />
          <Metric icon="star-outline" label="Customer Rating" value={ratingAvailable ? Number(stats.rating).toFixed(1) : '—'} />
          <Metric icon="people-outline" label="Total Reviews" value={stats?.totalReviews ?? '—'} />
        </View>
        {!stats && <Text style={styles.dataHint}>Performance data is unavailable until your account profile loads.</Text>}

        <Section title="Personal Information">
          {informationRows.map((row) => <InfoRow key={row.label} {...row} />)}
        </Section>

        <Section title="Professional Information">
          {professionalRows.map((row) => <InfoRow key={row.label} {...row} />)}
        </Section>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Account & Shortcuts</Text>
        </View>
        <View style={styles.menuContainer}>
          {shortcuts.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.menuItem}
              onPress={item.action}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={21} color={colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={21} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSubtitle}>Update your account and professional details.</Text>
              </View>
              <TouchableOpacity onPress={() => setEditVisible(false)} accessibilityRole="button" accessibilityLabel="Close edit profile">
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <EditField label="Full Name *" value={form.fullName} onChangeText={(value) => setForm((current) => ({ ...current, fullName: value }))} />
              <EditField label="Phone Number *" value={form.phone} keyboardType="phone-pad" onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))} />
              <EditField label="City / Location" value={form.city} onChangeText={(value) => setForm((current) => ({ ...current, city: value }))} />
              <EditField label="Workshop Name" value={form.workshopName} onChangeText={(value) => setForm((current) => ({ ...current, workshopName: value }))} />
              <EditField label="Mechanic Experience" value={form.experience} onChangeText={(value) => setForm((current) => ({ ...current, experience: value }))} />
              <EditField label="Specialization" value={form.specialization} onChangeText={(value) => setForm((current) => ({ ...current, specialization: value }))} />
              <View style={styles.editApiNote}>
                <Ionicons name="information-circle-outline" size={18} color={colors.secondary} />
                <Text style={styles.editApiNoteText}>
                  The profile API saves name and phone. City, workshop, experience and specialization are temporary UI-only values; this backend does not store them.
                </Text>
              </View>
              {saveError && <Text style={styles.inlineError}>{saveError}</Text>}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditVisible(false)} disabled={saving}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={saveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}

function Metric({ icon, label, value }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}><Ionicons name={icon} size={19} color={colors.primary} /></View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.infoCard}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={18} color={colors.secondary} /></View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function EditField({ label, value, onChangeText, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        placeholder={label.replace(' *', '')}
        placeholderTextColor={colors.textMuted}
        autoCapitalize={keyboardType === 'phone-pad' ? 'none' : 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  mutedText: { color: colors.textMuted, fontSize: typography.sizes.xs },
  noticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, marginBottom: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  noticeContent: { flex: 1 },
  noticeText: { color: colors.textMuted, fontSize: typography.sizes.sm, lineHeight: 20 },
  retryText: { color: colors.secondary, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, marginTop: spacing.xs },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, marginBottom: spacing.md, borderRadius: borderRadius.md, backgroundColor: 'rgba(16,185,129,0.12)' },
  successText: { flex: 1, color: colors.text, fontSize: typography.sizes.xs },
  heroCard: { padding: spacing.md, marginBottom: spacing.lg, borderRadius: borderRadius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  heroTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.secondaryDark, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: spacing.md },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { color: colors.white, fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold },
  heroIdentity: { flex: 1 },
  name: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  contactText: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 4 },
  heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: borderRadius.round, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, textTransform: 'capitalize' },
  memberText: { color: colors.textMuted, fontSize: typography.sizes.xs },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minHeight: 44, marginTop: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary },
  editButtonText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  availabilityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  availabilityMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  availabilityTitle: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  availabilityState: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 2 },
  inlineError: { color: colors.error, fontSize: typography.sizes.xs, marginTop: spacing.sm, lineHeight: 18 },
  section: { marginBottom: spacing.lg },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  sectionCaption: { color: colors.textMuted, fontSize: typography.sizes.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  metricCard: { flexBasis: '48%', flexGrow: 1, minHeight: 112, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  metricIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: 'rgba(249,115,22,0.12)' },
  metricValue: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, marginTop: spacing.xs },
  metricLabel: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 2 },
  dataHint: { color: colors.textMuted, fontSize: typography.sizes.xs, marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  infoCard: { paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.12)', marginRight: spacing.sm },
  infoText: { flex: 1 },
  infoLabel: { color: colors.textMuted, fontSize: typography.sizes.xs },
  infoValue: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginTop: 3 },
  menuContainer: { marginBottom: spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  menuIconContainer: { width: 42, height: 42, borderRadius: borderRadius.md, backgroundColor: 'rgba(249,115,22,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text },
  menuSubtitle: { fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 3 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: borderRadius.md, marginBottom: spacing.xl },
  logoutText: { color: colors.error, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalCard: { maxHeight: '92%', padding: spacing.md, paddingBottom: spacing.lg, backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  modalTitle: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  modalSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
  field: { marginBottom: spacing.sm },
  fieldLabel: { color: colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.xs },
  fieldInput: { minHeight: 46, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text, fontSize: typography.sizes.sm },
  editApiNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: 'rgba(59,130,246,0.1)', marginTop: spacing.xs },
  editApiNoteText: { flex: 1, color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancelButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  cancelButtonText: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  saveButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, backgroundColor: colors.primary },
  saveButtonText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  disabledButton: { opacity: 0.6 },
});
