import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const PRIMARY = '#0F4C81';
const ACCENT = '#FF7A00';

export default function MechanicVerificationScreen({ navigation }) {
  const [cnic, setCnic] = useState(null);
  const [license, setLicense] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('not_submitted'); // not_submitted | pending | verified | rejected

  const pickDocument = async (setter) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
      if (result.type === 'success') {
        setter(result);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const removeFile = (setter) => setter(null);

  const submitVerification = async () => {
    if (!cnic || !license || !certificate) {
      Alert.alert('Missing Documents', 'Please upload all required documents before submitting.');
      return;
    }

    setUploading(true);
    setVerificationStatus('pending');

    // Simulate upload/verification flow. Replace with real API calls.
    setTimeout(() => {
      setUploading(false);
      const success = true; // Replace based on API response
      if (success) {
        setVerificationStatus('verified');
        Alert.alert('Verification Submitted', 'Your documents were submitted and verified.');
      } else {
        setVerificationStatus('rejected');
        Alert.alert('Verification Failed', 'Your documents were rejected. Please re-upload clearer copies.');
      }
    }, 1800);
  };

  const renderPreview = (file) => {
    if (!file) return null;
    const uri = file.uri;
    const isImage = file.mime?.startsWith('image') || (uri && (uri.endsWith('.jpg') || uri.endsWith('.png') || uri.endsWith('.jpeg')));

    return (
      <View style={styles.previewRow} key={file.name || file.uri}>
        {isImage ? (
          <Image source={{ uri }} style={styles.previewImage} />
        ) : (
          <View style={styles.previewIcon}>
            <Ionicons name="document-text-outline" size={28} color={PRIMARY} />
          </View>
        )}
        <View style={styles.previewMeta}>
          <Text style={styles.previewName} numberOfLines={1}>{file.name || file.uri}</Text>
          <Text style={styles.previewSize}>{file.size ? `${Math.round(file.size / 1024)} KB` : ''}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mechanic Document Verification</Text>
          <Text style={styles.subtitle}>Upload documents to verify your mechanic profile</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Required Documents</Text>

          <View style={styles.uploadRow}>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadLabel}>CNIC (Front/Back)</Text>
              <Text style={styles.uploadDesc}>Upload a clear photo or PDF of your CNIC.</Text>
            </View>
            <View style={styles.uploadActions}>
              <TouchableOpacity style={styles.uploadButton} onPress={() => pickDocument(setCnic)}>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
              {cnic && (
                <TouchableOpacity style={styles.previewBtn} onPress={() => removeFile(setCnic)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {renderPreview(cnic)}

          <View style={styles.separator} />

          <View style={styles.uploadRow}>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadLabel}>Driving License</Text>
              <Text style={styles.uploadDesc}>Upload your valid driving license (photo or PDF).</Text>
            </View>
            <View style={styles.uploadActions}>
              <TouchableOpacity style={styles.uploadButton} onPress={() => pickDocument(setLicense)}>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
              {license && (
                <TouchableOpacity style={styles.previewBtn} onPress={() => removeFile(setLicense)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {renderPreview(license)}

          <View style={styles.separator} />

          <View style={styles.uploadRow}>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadLabel}>Mechanic Certificate</Text>
              <Text style={styles.uploadDesc}>Upload your mechanic certification or training documents.</Text>
            </View>
            <View style={styles.uploadActions}>
              <TouchableOpacity style={styles.uploadButton} onPress={() => pickDocument(setCertificate)}>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
              {certificate && (
                <TouchableOpacity style={styles.previewBtn} onPress={() => removeFile(setCertificate)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {renderPreview(certificate)}

          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Verification Instructions</Text>
            <Text style={styles.instructionsText}>Please upload clear scans or photos of your CNIC, driving license, and mechanic certificate. Ensure the documents are readable and all text is visible. Verification typically completes within 24-72 hours.</Text>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={submitVerification} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Verification</Text>}
          </TouchableOpacity>

          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Verification Status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusPill, verificationStatus === 'not_submitted' && styles.statusNeutral]}>
                <Text style={styles.statusPillText}>{verificationStatus === 'not_submitted' ? 'Not Submitted' : verificationStatus === 'pending' ? 'Pending' : verificationStatus === 'verified' ? 'Verified' : 'Rejected'}</Text>
              </View>
              <View style={styles.statusActions}>
                {verificationStatus === 'verified' && (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                )}
                {verificationStatus === 'rejected' && (
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                )}
                {verificationStatus === 'pending' && (
                  <ActivityIndicator color={PRIMARY} />
                )}
              </View>
            </View>
            {verificationStatus === 'rejected' && (
              <Text style={styles.rejectedText}>Your documents were rejected. Please review the requirements and re-upload clearer copies.</Text>
            )}
            {verificationStatus === 'verified' && (
              <Text style={styles.verifiedText}>Your account is verified. You can now receive mechanic requests.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  subtitle: { fontSize: 13, color: '#666', marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginTop: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: PRIMARY, marginBottom: 12 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  uploadInfo: { flex: 1 },
  uploadLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  uploadDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  uploadActions: { marginLeft: 12, alignItems: 'center' },
  uploadButton: { backgroundColor: PRIMARY, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  uploadButtonText: { color: '#fff', marginLeft: 8, fontWeight: '700' },
  previewBtn: { marginTop: 8 },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 10, backgroundColor: '#FAFBFC', borderRadius: 12 },
  previewImage: { width: 72, height: 54, borderRadius: 8, marginRight: 12, backgroundColor: '#EEE' },
  previewIcon: { width: 72, height: 54, borderRadius: 8, marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8' },
  previewMeta: { flex: 1 },
  previewName: { fontSize: 13, fontWeight: '700', color: '#333' },
  previewSize: { fontSize: 12, color: '#888', marginTop: 4 },
  separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  instructionsCard: { padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, marginTop: 10 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', color: PRIMARY, marginBottom: 6 },
  instructionsText: { fontSize: 13, color: '#666', lineHeight: 18 },
  submitButton: { marginTop: 14, backgroundColor: ACCENT, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  statusCard: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0F0F0' },
  statusTitle: { fontSize: 14, fontWeight: '700', color: PRIMARY, marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F4F8' },
  statusPillText: { color: '#333', fontWeight: '700' },
  statusNeutral: { backgroundColor: '#FFEFD5' },
  statusActions: { flexDirection: 'row', alignItems: 'center' },
  rejectedText: { color: '#EF4444', marginTop: 8 },
  verifiedText: { color: '#10B981', marginTop: 8 },
});
