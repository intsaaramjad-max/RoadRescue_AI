import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfileScreen() {
  const { user, token, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (!currentPassword || newPassword.length < 6) {
      Alert.alert('Invalid password', 'Enter your current password and a new password of at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      Alert.alert('Updated', 'Admin password changed successfully.');
      setCurrentPassword(''); setNewPassword(''); setShowPassword(false);
    } catch (error) { Alert.alert('Error', error.message || 'Could not change password.'); }
    finally { setSaving(false); }
  };

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Admin Profile" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCard}><View style={styles.avatar}><Ionicons name="shield-checkmark" size={32} color={colors.primary} /></View><Text style={styles.name}>{user?.fullName || 'Admin User'}</Text><Text style={styles.email}>{user?.email || 'admin@example.com'}</Text><View style={styles.roleBadge}><Text style={styles.roleText}>ADMINISTRATOR</Text></View></View>
        <Text style={styles.sectionTitle}>Account settings</Text>
        <TouchableOpacity style={styles.row} onPress={() => setShowPassword((value) => !value)}><View style={styles.iconWrap}><Ionicons name="lock-closed-outline" size={20} color={colors.primary} /></View><View style={styles.meta}><Text style={styles.title}>Change password</Text><Text style={styles.subtitle}>Update admin login credentials</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></TouchableOpacity>
        {showPassword && <View style={styles.passwordBox}><TextInput style={styles.input} placeholder="Current password" placeholderTextColor={colors.textMuted} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} /><TextInput style={styles.input} placeholder="New password" placeholderTextColor={colors.textMuted} secureTextEntry value={newPassword} onChangeText={setNewPassword} /><TouchableOpacity style={styles.primaryButton} onPress={changePassword} disabled={saving}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Save password</Text>}</TouchableOpacity></View>}
        <TouchableOpacity style={styles.row} onPress={() => Alert.alert('Admin account', 'Your administrator account has full platform management access.')}><View style={styles.iconWrap}><Ionicons name="settings-outline" size={20} color={colors.primary} /></View><View style={styles.meta}><Text style={styles.title}>Manage admin account</Text><Text style={styles.subtitle}>Review account access and role</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></TouchableOpacity>
        <TouchableOpacity style={styles.logout} onPress={logout}><Ionicons name="log-out-outline" size={20} color={colors.error} /><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg }, profileCard: { alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl }, avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.15)', marginBottom: spacing.md }, name: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: '700' }, email: { color: colors.textMuted, marginTop: 4 }, roleBadge: { backgroundColor: 'rgba(139,92,246,0.16)', paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: borderRadius.round, marginTop: spacing.md }, roleText: { color: '#A78BFA', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }, sectionTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: spacing.sm }, row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm }, iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.12)', marginRight: spacing.md }, meta: { flex: 1 }, title: { color: colors.text, fontWeight: '700', fontSize: typography.sizes.sm }, subtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 }, passwordBox: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm }, input: { color: colors.text, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm }, primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md }, primaryText: { color: '#FFF', fontWeight: '700' }, logout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginTop: spacing.lg, borderRadius: borderRadius.md, backgroundColor: 'rgba(239,68,68,0.1)' }, logoutText: { color: colors.error, fontWeight: '700' },
});
