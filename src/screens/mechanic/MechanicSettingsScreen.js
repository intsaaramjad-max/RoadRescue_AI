import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import appConfig from '../../../app.json';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const PREFERENCES_KEY = 'roadrescue_mechanic_notification_preferences';
const LANGUAGE_KEY = 'roadrescue_mechanic_language_preference';

const initialNotifications = {
  serviceRequests: true,
  chat: true,
  promotions: false,
  security: true,
};

const verificationLabel = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED' || normalized === 'VERIFIED') return 'Verified';
  if (normalized === 'PENDING') return 'Pending';
  if (normalized === 'REJECTED') return 'Rejected';
  return 'Not provided';
};

export default function MechanicSettingsScreen({ navigation, route }) {
  const { user, token, logout } = useAuth();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [language, setLanguage] = useState('English');
  const [availability, setAvailability] = useState(user?.isAvailable);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(Boolean(token));
  const [profileError, setProfileError] = useState(null);
  const [accountProfile, setAccountProfile] = useState(user || {});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [languageVisible, setLanguageVisible] = useState(false);
  const [languageNotice, setLanguageNotice] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setProfileLoading(false);
      setProfileError('Sign in to load current account and availability status.');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Profile request failed (${response.status})`);
      setAccountProfile(data.user || user || {});
      setAvailability(data.user?.isAvailable);
      setProfileError(null);
    } catch (error) {
      setProfileError(error.message || 'Unable to load account availability.');
    } finally {
      setProfileLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    let active = true;
    const loadPreferences = async () => {
      try {
        const [storedNotifications, storedLanguage] = await Promise.all([
          AsyncStorage.getItem(PREFERENCES_KEY),
          AsyncStorage.getItem(LANGUAGE_KEY),
        ]);
        if (!active) return;
        if (storedNotifications) setNotifications({ ...initialNotifications, ...JSON.parse(storedNotifications) });
        if (storedLanguage === 'English' || storedLanguage === 'Urdu') setLanguage(storedLanguage);
      } catch (error) {
        if (active) setLanguageNotice(`Saved preferences could not be loaded: ${error.message}`);
      }
    };
    loadPreferences();
    return () => { active = false; };
  }, []);

  const toggleAvailability = async (nextValue) => {
    if (!token) {
      setAvailabilityError('Sign in to change your availability.');
      return;
    }
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      const response = await fetch(`${API_URL}/profile/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: nextValue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Availability update failed (${response.status})`);
      setAvailability(data.user?.isAvailable ?? nextValue);
      setAccountProfile((current) => ({ ...current, ...(data.user || {}), isAvailable: nextValue }));
    } catch (error) {
      setAvailabilityError(error.message || 'Unable to update availability.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const updateNotification = async (key, value) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    } catch (error) {
      setNotifications((current) => ({ ...current, [key]: !value }));
      setLanguageNotice(`Could not save notification preference: ${error.message}`);
    }
  };

  const selectLanguage = async (nextLanguage) => {
    setLanguage(nextLanguage);
    setLanguageVisible(false);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage);
      setLanguageNotice('Preference saved. App content is currently available in English; language translation is not implemented.');
    } catch (error) {
      setLanguageNotice(`Could not save language preference: ${error.message}`);
    }
  };

  const submitPasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Complete all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (!token) {
      setPasswordError('Sign in again before changing your password.');
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordNotice(null);
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
      if (!response.ok) throw new Error(data.message || `Password update failed (${response.status})`);
      setPasswordNotice(data.message || 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordVisible(false);
    } catch (error) {
      setPasswordError(error.message || 'Unable to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to log out?')) logout();
      return;
    }
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const goToProfile = () => navigation.getParent()?.navigate('Profile');
  const version = appConfig.expo?.version || 'Not available';

  return (
    <ScreenWrapper>
      <Header title="Settings" showBack fallbackRoute="Dashboard" backTab={route?.params?.backTab} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {profileError && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
            <View style={styles.flex}>
              <Text style={styles.errorText}>{profileError}</Text>
              <TouchableOpacity onPress={fetchProfile} accessibilityRole="button">
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <SectionTitle title="Account" subtitle="Profile and sign-in controls" />
        <SettingsRow
          icon="person-outline"
          title="Edit Profile"
          subtitle="Update your personal and professional details"
          onPress={goToProfile}
        />
        <SettingsRow
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Update your account password"
          onPress={() => { setPasswordError(null); setPasswordNotice(null); setPasswordVisible(true); }}
        />
        <View style={styles.accountCard}>
          <View style={styles.accountIcon}><Ionicons name="person-circle-outline" size={22} color={colors.secondary} /></View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{accountProfile.fullName || 'Account name unavailable'}</Text>
            <Text style={styles.rowSubtitle}>{accountProfile.email || 'Email not provided'}</Text>
            <Text style={styles.rowSubtitle}>{accountProfile.phone || 'Phone not provided'}</Text>
          </View>
          {profileLoading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        <SectionTitle title="Availability" subtitle="Manage service request availability" />
        <View style={styles.settingRow}>
          <View style={styles.iconWrap}><Ionicons name="radio-outline" size={21} color={colors.primary} /></View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>Online / Offline</Text>
            <Text style={styles.rowSubtitle}>
              {availability === undefined ? 'Status unavailable' : availability ? 'You are online and available' : 'You are offline'}
            </Text>
            {availabilityError && <Text style={styles.inlineError}>{availabilityError}</Text>}
          </View>
          {availabilityLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Switch
              value={Boolean(availability)}
              onValueChange={toggleAvailability}
              disabled={availability === undefined || !token}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.white}
            />
          )}
        </View>

        <SectionTitle title="Notification Preferences" subtitle="Saved on this device; push delivery is not connected" />
        <PreferenceRow icon="construct-outline" title="Service Request Notifications" subtitle="New service requests" value={notifications.serviceRequests} onChange={(value) => updateNotification('serviceRequests', value)} />
        <PreferenceRow icon="chatbubble-ellipses-outline" title="Chat Notifications" subtitle="Messages in service chats" value={notifications.chat} onChange={(value) => updateNotification('chat', value)} />
        <PreferenceRow icon="megaphone-outline" title="Promotional Notifications" subtitle="Offers and product announcements" value={notifications.promotions} onChange={(value) => updateNotification('promotions', value)} />
        <PreferenceRow icon="shield-checkmark-outline" title="Security Alerts" subtitle="Account and sign-in notices" value={notifications.security} onChange={(value) => updateNotification('security', value)} />

        <SectionTitle title="Privacy & Security" subtitle="Current account security information" />
        <SettingsRow
          icon="scan-outline"
          title="Face Verification"
          subtitle="Camera capture exists; verification status is not connected to a server"
          trailing={<Text style={styles.notActiveBadge}>Not connected</Text>}
        />
        <SettingsRow
          icon="shield-outline"
          title="Account Security"
          subtitle={token ? 'Signed in with an authenticated session' : 'No authenticated session'}
          trailing={<Ionicons name={token ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={20} color={token ? colors.success : colors.warning} />}
        />

        <SectionTitle title="App Preferences" subtitle="Language selection does not translate the app yet" />
        <SettingsRow
          icon="language-outline"
          title="Language"
          subtitle={`${language} preference`}
          onPress={() => setLanguageVisible(true)}
        />
        {languageNotice && (
          <TouchableOpacity style={styles.noteCard} onPress={() => setLanguageNotice(null)} accessibilityRole="button">
            <Ionicons name="information-circle-outline" size={18} color={colors.secondary} />
            <Text style={styles.noteText}>{languageNotice}</Text>
          </TouchableOpacity>
        )}
        <SettingsRow
          icon="information-circle-outline"
          title="About RoadRescue AI"
          subtitle={`Version ${version}`}
        />
        {passwordNotice && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle-outline" size={19} color={colors.success} />
            <Text style={styles.successText}>{passwordNotice}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={21} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={passwordVisible} transparent animationType="slide" onRequestClose={() => setPasswordVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Change Password</Text>
                <Text style={styles.rowSubtitle}>Choose a new password with at least 6 characters.</Text>
              </View>
              <TouchableOpacity onPress={() => setPasswordVisible(false)} accessibilityRole="button" accessibilityLabel="Close change password">
                <Ionicons name="close" size={23} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <PasswordField label="Current Password" value={passwordForm.currentPassword} onChangeText={(value) => setPasswordForm((form) => ({ ...form, currentPassword: value }))} />
            <PasswordField label="New Password" value={passwordForm.newPassword} onChangeText={(value) => setPasswordForm((form) => ({ ...form, newPassword: value }))} />
            <PasswordField label="Confirm New Password" value={passwordForm.confirmPassword} onChangeText={(value) => setPasswordForm((form) => ({ ...form, confirmPassword: value }))} />
            {passwordError && <Text style={styles.inlineError}>{passwordError}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPasswordVisible(false)} disabled={passwordSaving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, passwordSaving && styles.disabledButton]} onPress={submitPasswordChange} disabled={passwordSaving}>
                {passwordSaving ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.saveText}>Save Password</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={languageVisible} transparent animationType="fade" onRequestClose={() => setLanguageVisible(false)}>
        <View style={styles.languageOverlay}>
          <View style={styles.languageCard}>
            <Text style={styles.modalTitle}>Choose Language</Text>
            <Text style={styles.rowSubtitle}>This saves a preference only; translations are not implemented.</Text>
            {['English', 'Urdu'].map((option) => (
              <TouchableOpacity key={option} style={styles.languageOption} onPress={() => selectLanguage(option)}>
                <Text style={styles.rowTitle}>{option}</Text>
                {language === option && <Ionicons name="checkmark" size={19} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setLanguageVisible(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function SettingsRow({ icon, title, subtitle, onPress, trailing }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.75 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.iconWrap}><Ionicons name={icon} size={21} color={colors.primary} /></View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing || (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null)}
    </TouchableOpacity>
  );
}

function PreferenceRow({ icon, title, subtitle, value, onChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.iconWrap}><Ionicons name={icon} size={21} color={colors.primary} /></View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: 'rgba(249,115,22,0.5)' }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

function PasswordField({ label, value, onChangeText }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionHeading: { marginTop: spacing.md, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  sectionSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 17, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.12)', marginRight: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  rowSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 17, marginTop: 3 },
  accountCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  accountIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.13)', marginRight: spacing.md },
  errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  errorText: { color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 18 },
  retryText: { color: colors.secondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, marginTop: spacing.xs },
  inlineError: { color: colors.error, fontSize: typography.sizes.xs, lineHeight: 18, marginTop: spacing.xs },
  notActiveBadge: { color: colors.warning, fontSize: 10, fontWeight: typography.weights.bold, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: borderRadius.round, backgroundColor: 'rgba(245,158,11,0.12)' },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: 'rgba(59,130,246,0.1)', padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  noteText: { flex: 1, color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 18 },
  successCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginTop: spacing.sm, backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: borderRadius.md },
  successText: { flex: 1, color: colors.text, fontSize: typography.sizes.xs },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: borderRadius.md, marginTop: spacing.lg, marginBottom: spacing.xl },
  logoutText: { color: colors.error, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalCard: { padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  modalTitle: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  field: { marginTop: spacing.sm },
  fieldLabel: { color: colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.xs },
  fieldInput: { minHeight: 46, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text, fontSize: typography.sizes.sm },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancelButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  cancelText: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  saveButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, backgroundColor: colors.primary, marginTop: spacing.md },
  saveText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  disabledButton: { opacity: 0.6 },
  languageOverlay: { flex: 1, justifyContent: 'center', padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.65)' },
  languageCard: { padding: spacing.lg, borderRadius: borderRadius.xl, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  languageOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50, marginTop: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.card },
});
