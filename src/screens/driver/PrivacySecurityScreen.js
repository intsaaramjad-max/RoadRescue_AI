import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Switch, Alert,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

export default function PrivacySecurityScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [locationSharing, setLocationSharing] = useState(true);
  const [twoFactor, setTwoFactor]             = useState(false);
  const [dataSharing, setDataSharing]         = useState(true);

  // Change Password (UI only — backend TODO)
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Please fill all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    Alert.alert('Success ✅', 'Password changed successfully!');
    setShowPwForm(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const sections = [
    {
      title: 'Account Security',
      items: [
        {
          icon: 'lock-closed-outline', color: '#8B5CF6',
          label: 'Change Password',
          sub: 'Update your login password',
          onPress: () => setShowPwForm(v => !v),
          arrow: true,
        },
        {
          icon: 'phone-portrait-outline', color: '#3B82F6',
          label: 'Two-Factor Authentication',
          sub: 'Add extra security to your account',
          toggle: twoFactor,
          onToggle: setTwoFactor,
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          icon: 'location-outline', color: '#10B981',
          label: 'Location Sharing',
          sub: 'Share location with mechanics',
          toggle: locationSharing,
          onToggle: setLocationSharing,
        },
        {
          icon: 'analytics-outline', color: '#F59E0B',
          label: 'Improve RoadRescue AI',
          sub: 'Share usage data to improve service',
          toggle: dataSharing,
          onToggle: setDataSharing,
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          icon: 'trash-outline', color: '#EF4444',
          label: 'Delete Account',
          sub: 'Permanently remove your account',
          onPress: handleDeleteAccount,
          arrow: true,
          danger: true,
        },
      ],
    },
  ];

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Privacy & Security" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Account info card */}
        <View style={styles.infoCard}>
          <Ionicons name="person-circle-outline" size={24} color="#F97316" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.infoName}>{user?.fullName || 'Driver'}</Text>
            <Text style={styles.infoEmail}>{user?.email}</Text>
          </View>
        </View>

        {sections.map((section, si) => (
          <View key={si}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={[styles.row, item.danger && styles.rowDanger]}
                onPress={item.onPress}
                activeOpacity={item.onPress ? 0.75 : 1}
                disabled={!item.onPress && item.toggle === undefined}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.rowMeta}>
                  <Text style={[styles.rowLabel, item.danger && { color: '#EF4444' }]}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                {item.toggle !== undefined ? (
                  <Switch
                    value={item.toggle}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#334155', true: 'rgba(249,115,22,0.4)' }}
                    thumbColor={item.toggle ? '#F97316' : '#64748B'}
                  />
                ) : item.arrow ? (
                  <Ionicons name="chevron-forward" size={17} color={item.danger ? '#EF4444' : '#334155'} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Change Password Form */}
        {showPwForm && (
          <View style={styles.pwForm}>
            <Text style={styles.pwFormTitle}>Change Password</Text>
            {[
              { label: 'Current Password', value: currentPw, onChange: setCurrentPw },
              { label: 'New Password', value: newPw, onChange: setNewPw },
              { label: 'Confirm New Password', value: confirmPw, onChange: setConfirmPw },
            ].map((field, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholderTextColor="#475569"
                  placeholder="••••••••"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} activeOpacity={0.85}>
              <Text style={styles.saveBtnTxt}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(249,115,22,0.07)', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(249,115,22,0.15)' },
  infoName: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  infoEmail: { color: '#64748B', fontSize: 13, marginTop: 2 },
  sectionTitle: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  rowDanger: { borderColor: 'rgba(239,68,68,0.15)', backgroundColor: 'rgba(239,68,68,0.05)' },
  iconWrap: { width: 42, height: 42, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowMeta: { flex: 1 },
  rowLabel: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  rowSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  pwForm: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 18, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pwFormTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  fieldLabel: { color: '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 12, color: '#F8FAFC', fontSize: 15 },
  saveBtn: { backgroundColor: '#8B5CF6', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
