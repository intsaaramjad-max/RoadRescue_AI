import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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

const showMessage = (title, message) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const profileValue = (value) => (
  typeof value === 'string' && value.trim() ? value.trim() : 'Not provided'
);

export default function AdminProfileScreen() {
  const { user, userRole, token, updateUserProfile, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const isAdmin = String(userRole || user?.role || '').toUpperCase() === 'ADMIN';

  const fetchProfile = useCallback(async () => {
    if (!token || !isAdmin) {
      setProfileError('An authenticated Admin session is required to view this profile.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Profile could not be loaded (${response.status})`);
      }
      if (!data.user?.id || String(data.user.role || '').toUpperCase() !== 'ADMIN') {
        throw new Error('The server did not return an administrator profile.');
      }
      setProfile(data.user);
      setProfileError(null);
    } catch (error) {
      setProfileError(error.message || 'Unable to load your profile.');
      setProfile(user || null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token, user]);

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  const openEditProfile = () => {
    setFullName(profile?.fullName || '');
    setPhone(profile?.phone || '');
    setEditVisible(true);
  };

  const saveProfile = async () => {
    const normalizedName = fullName.trim();
    const normalizedPhone = phone.trim();
    const digits = normalizedPhone.replace(/\D/g, '');

    if (!normalizedName) {
      showMessage('Name required', 'Enter your full name.');
      return;
    }
    if (!/^\+?[0-9\s()-]+$/.test(normalizedPhone) || digits.length < 7 || digits.length > 15) {
      showMessage('Invalid phone number', 'Enter a phone number containing 7 to 15 digits.');
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await updateUserProfile({
        fullName: normalizedName,
        phone: normalizedPhone,
      });
      setProfile(updatedUser);
      setEditVisible(false);
      showMessage('Profile updated', 'Your profile changes were saved to your account.');
    } catch (error) {
      showMessage('Update failed', error.message || 'Your profile could not be updated.');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!token || !isAdmin) {
      showMessage('Sign-in required', 'Sign in with an Admin account to change your password.');
      return;
    }
    if (!currentPassword || newPassword.length < 6) {
      showMessage('Invalid password', 'Enter your current password and a new password of at least 6 characters.');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Password change failed (${response.status})`);
      }
      setCurrentPassword('');
      setNewPassword('');
      setPasswordVisible(false);
      showMessage('Password updated', data.message || 'Your password was changed.');
    } catch (error) {
      showMessage('Password change failed', error.message || 'Your password could not be changed.');
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to log out?')) {
        logout();
      }
      return;
    }

    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isAdmin) {
    return (
      <ScreenWrapper useSafeArea>
        <Header title="Admin Profile" />
        <View style={styles.stateContainer}>
          <Ionicons name="lock-closed-outline" size={36} color={colors.error} />
          <Text style={styles.stateTitle}>Admin access required</Text>
          <Text style={styles.stateText}>Sign in with an administrator account to view this page.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Admin Profile" />
      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading account details…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {!!profileError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{profileError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setLoading(true);
                  fetchProfile();
                }}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={styles.name}>{profileValue(profile?.fullName)}</Text>
            <Text style={styles.email}>{profileValue(profile?.email)}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>ADMINISTRATOR</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile information</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={openEditProfile}
              disabled={!token}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Ionicons name="create-outline" size={17} color={colors.primary} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <InfoRow icon="person-outline" label="Full name" value={profileValue(profile?.fullName)} />
          <InfoRow icon="mail-outline" label="Email address" value={profileValue(profile?.email)} />
          <InfoRow icon="call-outline" label="Phone number" value={profileValue(profile?.phone)} />

          <Text style={[styles.sectionTitle, styles.securityHeading]}>Account & security</Text>
          <InfoRow icon="shield-checkmark-outline" label="Account role" value="Administrator" />
          <InfoRow
            icon="ellipse"
            label="Account status"
            value={typeof profile?.isActive === 'boolean' ? (profile.isActive ? 'Active' : 'Inactive') : 'Not available'}
            valueColor={profile?.isActive === true ? colors.success : profile?.isActive === false ? colors.error : colors.textMuted}
          />

          <TouchableOpacity
            style={styles.row}
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
          >
            <View style={styles.iconWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>Change password</Text>
              <Text style={styles.rowSubtitle}>Verify your current password to continue</Text>
            </View>
            <Ionicons name={passwordVisible ? 'chevron-up' : 'chevron-forward'} size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {passwordVisible && (
            <View style={styles.formCard}>
              <TextInput
                style={styles.input}
                placeholder="Current password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                editable={!savingPassword}
                autoComplete="current-password"
              />
              <TextInput
                style={styles.input}
                placeholder="New password (at least 6 characters)"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!savingPassword}
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={[styles.primaryButton, savingPassword && styles.disabledButton]}
                onPress={changePassword}
                disabled={savingPassword}
              >
                {savingPassword
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.primaryText}>Save password</Text>}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit profile</Text>
            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.textMuted}
              editable={!savingProfile}
              maxLength={100}
              autoComplete="name"
            />
            <Text style={styles.fieldLabel}>Phone number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              editable={!savingProfile}
              maxLength={20}
              autoComplete="tel"
            />
            <Text style={styles.readOnlyNote}>Email address is managed by your account and cannot be changed here.</Text>
            <TouchableOpacity
              style={[styles.primaryButton, savingProfile && styles.disabledButton]}
              onPress={saveProfile}
              disabled={savingProfile}
            >
              {savingProfile
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.primaryText}>Save changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditVisible(false)} disabled={savingProfile}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

function InfoRow({ icon, label, value, valueColor = colors.text }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={valueColor === colors.error ? colors.error : colors.primary} />
      </View>
      <View style={styles.infoMeta}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  stateTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700', marginTop: spacing.md },
  stateText: { color: colors.textMuted, fontSize: typography.sizes.sm, textAlign: 'center', marginTop: spacing.sm },
  errorCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.error, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: typography.sizes.sm },
  retryButton: { alignSelf: 'flex-start', marginTop: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: typography.sizes.xs },
  profileCard: { alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.15)', marginBottom: spacing.md },
  name: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: '700', textAlign: 'center' },
  email: { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  roleBadge: { backgroundColor: 'rgba(139,92,246,0.16)', paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: borderRadius.round, marginTop: spacing.md },
  roleText: { color: '#A78BFA', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { color: colors.textMuted, fontSize: typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  editText: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  infoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.12)', marginRight: spacing.md },
  infoMeta: { flex: 1 },
  infoLabel: { color: colors.textMuted, fontSize: typography.sizes.xs },
  infoValue: { fontSize: typography.sizes.sm, fontWeight: '600', marginTop: 3 },
  securityHeading: { marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.12)', marginRight: spacing.md },
  rowMeta: { flex: 1 },
  rowTitle: { color: colors.text, fontWeight: '700', fontSize: typography.sizes.sm },
  rowSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
  formCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  input: { color: colors.text, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  primaryButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.xs },
  primaryText: { color: '#FFF', fontWeight: '700' },
  disabledButton: { opacity: 0.65 },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginTop: spacing.lg, borderRadius: borderRadius.md, backgroundColor: 'rgba(239,68,68,0.1)' },
  logoutText: { color: colors.error, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.65)' },
  modalCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg },
  modalTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700', marginBottom: spacing.md },
  fieldLabel: { color: colors.text, fontSize: typography.sizes.xs, fontWeight: '700', marginBottom: spacing.xs },
  readOnlyNote: { color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 18, marginBottom: spacing.sm },
  cancelText: { textAlign: 'center', color: colors.textMuted, padding: spacing.md },
});
