import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const getVerificationStatus = (value) => {
  switch ((value || '').toUpperCase()) {
    case 'PENDING':
      return 'pending';
    case 'APPROVED':
    case 'VERIFIED':
      return 'verified';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'not_submitted';
  }
};

const statusDetails = {
  not_submitted: { label: 'Not Submitted', color: colors.textMuted, icon: 'alert-circle-outline' },
  pending: { label: 'Pending', color: colors.warning, icon: 'time-outline' },
  verified: { label: 'Verified', color: colors.success, icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', color: colors.error, icon: 'close-circle-outline' },
};

function UploadCard({ title, description, file, required, onSelect, onRemove }) {
  return (
    <View style={styles.uploadCard}>
      <View style={styles.uploadCardHeader}>
        <View style={styles.documentIcon}>
          <Ionicons name="image-outline" size={20} color={colors.secondary} />
        </View>
        <View style={styles.uploadInfo}>
          <View style={styles.uploadTitleRow}>
            <Text style={styles.uploadTitle}>{title}</Text>
            <Text style={required ? styles.requiredLabel : styles.optionalLabel}>
              {required ? 'Required' : 'Optional'}
            </Text>
          </View>
          <Text style={styles.uploadDescription}>{description}</Text>
        </View>
      </View>

      {file ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: file.uri }} style={styles.previewImage} />
          <View style={styles.previewInfo}>
            <Text style={styles.previewName} numberOfLines={1}>{file.fileName || title}</Text>
            <View style={styles.selectedStatus}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.selectedStatusText}>Selected on this device</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${title}`}
          >
            <Ionicons name="trash-outline" size={19} color={colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.notSelectedRow}>
          <Ionicons name="ellipse-outline" size={16} color={colors.textMuted} />
          <Text style={styles.notSelectedText}>Not selected</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.selectButton}
        onPress={onSelect}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Ionicons name={file ? 'refresh-outline' : 'image-outline'} size={18} color={colors.secondary} />
        <Text style={styles.selectButtonText}>{file ? 'Replace Image' : 'Select Image'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProgressRow({ icon, title, detail, complete }) {
  return (
    <View style={styles.progressRow}>
      <View style={[styles.progressIcon, complete && styles.progressIconComplete]}>
        <Ionicons name={icon} size={17} color={complete ? colors.success : colors.textMuted} />
      </View>
      <View style={styles.progressInfo}>
        <Text style={styles.progressTitle}>{title}</Text>
        <Text style={styles.progressDetail}>{detail}</Text>
      </View>
      <Ionicons
        name={complete ? 'checkmark-circle' : 'ellipse-outline'}
        size={19}
        color={complete ? colors.success : colors.border}
      />
    </View>
  );
}

export default function MechanicVerificationScreen({ route }) {
  const { user, isLoading } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email] = useState(user?.email || '');
  const [cnicNumber, setCnicNumber] = useState(user?.cnic || '');
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [drivingLicense, setDrivingLicense] = useState(null);
  const [licenseApplicable, setLicenseApplicable] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const existingStatus = getVerificationStatus(user?.verificationStatus);
  const status = demoSubmitted && existingStatus === 'not_submitted' ? 'pending' : existingStatus;
  const currentStatus = statusDetails[status];
  const personalComplete = Boolean(fullName.trim() && phone.trim() && email.trim() && cnicNumber.trim());
  const documentsComplete = Boolean(cnicFront && cnicBack && profilePhoto && (!licenseApplicable || drivingLicense));

  const selectImage = async (setter, label) => {
    setError('');
    setNotice('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(`Photo library permission is required to select ${label}. You can enable it in your device settings.`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setter(result.assets[0]);
      }
    } catch (pickerError) {
      console.error('Verification image selection failed:', pickerError);
      setError(`Unable to select ${label}. Please try again.`);
    }
  };

  const handleSubmit = () => {
    setError('');
    setNotice('');
    if (!fullName.trim() || !phone.trim() || !email.trim() || !cnicNumber.trim()) {
      setError('Complete your full name, phone number, email address, and CNIC number.');
      return;
    }
    if (!cnicFront || !cnicBack || !profilePhoto || (licenseApplicable && !drivingLicense)) {
      setError('Select the required CNIC front, CNIC back, and profile photo. Add a driving license if applicable.');
      return;
    }

    setSubmitting(true);
    setDemoSubmitted(true);
    setNotice('Demo submission recorded on this screen only. Your information and images were not uploaded or sent for verification.');
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <Header title="Mechanic Verification" showBack fallbackRoute="Dashboard" backTab={route?.params?.backTab} />
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateMessage}>Loading profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header title="Mechanic Verification" showBack fallbackRoute="Dashboard" backTab={route?.params?.backTab} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="shield-checkmark-outline" size={25} color={colors.primary} />
          </View>
          <Text style={styles.title}>Verify your mechanic profile</Text>
          <Text style={styles.subtitle}>
            Provide accurate identity details and clear images for verification. Selected images stay on this device in this demo.
          </Text>
          <View style={styles.currentStatus}>
            <Text style={styles.currentStatusLabel}>Current status</Text>
            <View style={[styles.statusBadge, { borderColor: `${currentStatus.color}66`, backgroundColor: `${currentStatus.color}1A` }]}>
              <Ionicons name={currentStatus.icon} size={16} color={currentStatus.color} />
              <Text style={[styles.statusText, { color: currentStatus.color }]}>
                {demoSubmitted && existingStatus === 'not_submitted' ? 'Pending · Demo' : currentStatus.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person-outline" size={19} color={colors.primary} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Text style={styles.sectionSubtitle}>Review your account details and enter your CNIC.</Text>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number not available"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[styles.textInput, styles.readOnlyInput]}
              value={email}
              editable={false}
              placeholder="Email address not available"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
            />
            <Text style={styles.fieldHint}>Email is taken from your account and cannot be changed here.</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CNIC Number</Text>
            <TextInput
              style={styles.textInput}
              value={cnicNumber}
              onChangeText={setCnicNumber}
              placeholder="Enter your CNIC number"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={15}
            />
            <Text style={styles.fieldHint}>This number is only kept in this screen state in the demo.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Ionicons name="documents-outline" size={19} color={colors.primary} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.sectionTitle}>Identity Documents</Text>
              <Text style={styles.sectionSubtitle}>Choose a clear image for each required document.</Text>
            </View>
          </View>

          <UploadCard
            title="CNIC Front Image"
            description="Front side of your identity card."
            file={cnicFront}
            required
            onSelect={() => selectImage(setCnicFront, 'the CNIC front')}
            onRemove={() => setCnicFront(null)}
          />
          <UploadCard
            title="CNIC Back Image"
            description="Back side of your identity card."
            file={cnicBack}
            required
            onSelect={() => selectImage(setCnicBack, 'the CNIC back')}
            onRemove={() => setCnicBack(null)}
          />
          <UploadCard
            title="Mechanic Profile Photo"
            description="A clear photo to identify your mechanic profile."
            file={profilePhoto}
            required
            onSelect={() => selectImage(setProfilePhoto, 'your profile photo')}
            onRemove={() => setProfilePhoto(null)}
          />

          <View style={styles.licenseToggle}>
            <View style={styles.licenseToggleText}>
              <Text style={styles.inputLabel}>Driving license applicable</Text>
              <Text style={styles.fieldHint}>Turn on if a license is required for your services.</Text>
            </View>
            <Switch
              value={licenseApplicable}
              onValueChange={setLicenseApplicable}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.white}
              accessibilityLabel="Driving license applicable"
            />
          </View>
          {licenseApplicable && (
            <UploadCard
              title="Driving License"
              description="A clear image of your valid driving license."
              file={drivingLicense}
              required
              onSelect={() => selectImage(setDrivingLicense, 'the driving license')}
              onRemove={() => setDrivingLicense(null)}
            />
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Ionicons name="list-outline" size={19} color={colors.primary} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.sectionTitle}>Verification Progress</Text>
              <Text style={styles.sectionSubtitle}>This checklist reflects local form completion only.</Text>
            </View>
          </View>
          <ProgressRow
            icon="person-outline"
            title="Personal Information"
            detail={personalComplete ? 'Details entered' : 'Name, contact, and CNIC required'}
            complete={personalComplete}
          />
          <ProgressRow
            icon="document-text-outline"
            title="Identity Documents"
            detail={documentsComplete ? 'Required images selected' : 'CNIC front/back and profile photo required'}
            complete={documentsComplete}
          />
          <ProgressRow
            icon="time-outline"
            title="Submission Status"
            detail={existingStatus === 'pending' ? 'Submitted for review' : existingStatus === 'verified' ? 'Verified by the existing account status' : existingStatus === 'rejected' ? 'Review required' : demoSubmitted ? 'Demo submission only · not sent' : 'Not submitted'}
            complete={existingStatus === 'pending' || existingStatus === 'verified' || existingStatus === 'rejected' || demoSubmitted}
          />
        </View>

        {!!error && (
          <View style={styles.messageBannerError}>
            <Ionicons name="alert-circle-outline" size={19} color={colors.error} />
            <Text style={styles.messageBannerTextError}>{error}</Text>
          </View>
        )}
        {!!notice && (
          <View style={styles.messageBannerNotice}>
            <Ionicons name="information-circle-outline" size={19} color={colors.secondary} />
            <Text style={styles.messageBannerTextNotice}>{notice}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={19} color={colors.white} />
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.submitDisclaimer}>
          Demo only: this screen does not upload documents or submit a verification request.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  stateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  stateMessage: { color: colors.textMuted, fontSize: typography.sizes.sm, marginTop: spacing.md },
  introCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  introIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    marginBottom: spacing.sm,
  },
  title: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  subtitle: { color: colors.textMuted, fontSize: typography.sizes.sm, lineHeight: 20, marginTop: spacing.xs },
  currentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  currentStatusLabel: { color: colors.textMuted, fontSize: typography.sizes.sm, marginRight: spacing.sm },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.round, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  statusText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, marginLeft: spacing.xs },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionHeadingText: { flex: 1 },
  sectionTitle: { color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  sectionSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 17, marginTop: 2 },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { color: colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, marginBottom: spacing.xs },
  textInput: {
    minHeight: 46,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: typography.sizes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  readOnlyInput: { opacity: 0.75 },
  fieldHint: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: spacing.xs },
  uploadCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  uploadCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  uploadInfo: { flex: 1 },
  uploadTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  uploadTitle: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginRight: spacing.xs },
  requiredLabel: { color: colors.warning, fontSize: 10, fontWeight: typography.weights.bold },
  optionalLabel: { color: colors.textMuted, fontSize: 10, fontWeight: typography.weights.semibold },
  uploadDescription: { color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 17, marginTop: 3 },
  previewRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.xs, marginTop: spacing.sm },
  previewImage: { width: 58, height: 52, borderRadius: borderRadius.sm, backgroundColor: colors.card },
  previewInfo: { flex: 1, marginHorizontal: spacing.sm },
  previewName: { color: colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  selectedStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  selectedStatusText: { color: colors.success, fontSize: 10, marginLeft: 3 },
  removeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  notSelectedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  notSelectedText: { color: colors.textMuted, fontSize: typography.sizes.xs, marginLeft: spacing.xs },
  selectButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  selectButtonText: { color: colors.secondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, marginLeft: spacing.xs },
  licenseToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.xs, marginBottom: spacing.md },
  licenseToggleText: { flex: 1, marginRight: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  progressIcon: { width: 34, height: 34, borderRadius: borderRadius.round, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  progressIconComplete: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  progressInfo: { flex: 1 },
  progressTitle: { color: colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  progressDetail: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  messageBannerError: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(239, 68, 68, 0.12)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.35)', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  messageBannerTextError: { flex: 1, color: colors.error, fontSize: typography.sizes.xs, lineHeight: 18, marginLeft: spacing.sm },
  messageBannerNotice: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(59, 130, 246, 0.12)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  messageBannerTextNotice: { flex: 1, color: colors.secondary, fontSize: typography.sizes.xs, lineHeight: 18, marginLeft: spacing.sm },
  submitButton: { minHeight: 50, backgroundColor: colors.primary, borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitDisabled: { opacity: 0.65 },
  submitButtonText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, marginLeft: spacing.sm },
  submitDisclaimer: { color: colors.textMuted, textAlign: 'center', fontSize: 10, lineHeight: 16, marginTop: spacing.sm },
});
