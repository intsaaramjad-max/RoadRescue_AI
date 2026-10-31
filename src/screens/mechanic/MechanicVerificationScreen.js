
import React, { useRef, useState } from 'react';

import {
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

const PRIMARY = '#0F4C81';
const ACCENT = '#FF7A00';

export default function MechanicVerificationScreen() {
  const [cnic, setCnic] = useState(null);
  const [license, setLicense] = useState(null);
  const [certificate, setCertificate] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [verificationStatus, setVerificationStatus] =
    useState('not_submitted');

  const [cameraVisible, setCameraVisible] = useState(false);
  const [captureStep, setCaptureStep] = useState('front');

  const [faceImages, setFaceImages] = useState({
    front: null,
    left: null,
    right: null,
  });

  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();

  // Select a document
  const pickDocument = async (setter) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setter(result.assets[0]);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select the document.');
    }
  };

  // Remove a selected document
  const removeFile = (setter) => {
    setter(null);
  };

  // Open camera
  const openCamera = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();

        if (!result.granted) {
          Alert.alert(
            'Camera Permission',
            'Please allow camera access to capture face images.'
          );
          return;
        }
      }

      setCaptureStep('front');

      setFaceImages({
        front: null,
        left: null,
        right: null,
      });

      setCameraVisible(true);
    } catch (error) {
      console.error('Camera permission error:', error);

      Alert.alert(
        'Camera Error',
        'Unable to access the camera. Please try again.'
      );
    }
  };

  // Capture front, left and right face images
  const captureFace = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert('Camera Error', 'Camera is not ready yet.');
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo?.uri) {
        Alert.alert('Error', 'Unable to capture the image.');
        return;
      }

      const currentStep = captureStep;

      setFaceImages((previous) => ({
        ...previous,
        [currentStep]: photo.uri,
      }));

      if (currentStep === 'front') {
        setCaptureStep('left');
      } else if (currentStep === 'left') {
        setCaptureStep('right');
      } else {
        setCameraVisible(false);

        Alert.alert(
          'Face Images Captured',
          'All three face images have been captured successfully.'
        );
      }
    } catch (error) {
      console.error('Photo capture error:', error);

      Alert.alert(
        'Capture Failed',
        'Unable to capture the image. Please try again.'
      );
    }
  };

  // Submit verification
  const submitVerification = async () => {
    if (!cnic || !license || !certificate) {
      Alert.alert(
        'Missing Documents',
        'Please upload your CNIC, driving license and mechanic certificate.'
      );
      return;
    }

    if (
      !faceImages.front ||
      !faceImages.left ||
      !faceImages.right
    ) {
      Alert.alert(
        'Missing Face Images',
        'Please capture front, left and right face images.'
      );
      return;
    }

    setUploading(true);
    setVerificationStatus('pending');

    // DEMO ONLY: Replace this simulated flow with your backend API.
    setTimeout(() => {
      setUploading(false);

      setVerificationStatus('verified');

      Alert.alert(
        'Demo Verification',
        'The demo verification flow has completed. Real document and face verification is not connected yet.'
      );
    }, 1800);
  };

  // Display document preview
  const renderPreview = (file, setter) => {
    if (!file) {
      return null;
    }

    const uri = file.uri;

    const isImage =
      file.mimeType?.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp)$/i.test(uri || '');

    return (
      <View style={styles.previewRow} key={uri}>
        {isImage ? (
          <Image
            source={{ uri }}
            style={styles.previewImage}
          />
        ) : (
          <View style={styles.previewIcon}>
            <Ionicons
              name="document-text-outline"
              size={28}
              color={PRIMARY}
            />
          </View>
        )}

        <View style={styles.previewMeta}>
          <Text style={styles.previewName} numberOfLines={1}>
            {file.name || 'Selected document'}
          </Text>

          <Text style={styles.previewSize}>
            {file.size
              ? `${Math.round(file.size / 1024)} KB`
              : 'Document selected'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.previewBtn}
          onPress={() => removeFile(setter)}
          accessibilityLabel="Remove selected document"
        >
          <Ionicons
            name="trash-outline"
            size={21}
            color="#EF4444"
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Document upload row
  const renderDocumentRow = (
    title,
    description,
    file,
    setter
  ) => (
    <View>
      <View style={styles.uploadRow}>
        <View style={styles.uploadInfo}>
          <Text style={styles.uploadLabel}>{title}</Text>

          <Text style={styles.uploadDesc}>
            {description}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickDocument(setter)}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={19}
            color="#FFFFFF"
          />

          <Text style={styles.uploadButtonText}>
            Upload
          </Text>
        </TouchableOpacity>
      </View>

      {renderPreview(file, setter)}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Mechanic Document Verification
          </Text>

          <Text style={styles.subtitle}>
            Upload documents to verify your mechanic profile.
          </Text>
        </View>

        {/* Face Verification */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Face Verification
          </Text>

          <Text style={styles.uploadDesc}>
            Capture your face from the front, left and right.
          </Text>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={openCamera}
          >
            <Ionicons
              name="camera-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.uploadButtonText}>
              Capture Face Images
            </Text>
          </TouchableOpacity>

          <View style={styles.faceImagesRow}>
            {['front', 'left', 'right'].map((position) => (
              <View
                key={position}
                style={styles.faceImageItem}
              >
                <Text style={styles.faceLabel}>
                  {position.charAt(0).toUpperCase() +
                    position.slice(1)}
                </Text>

                {faceImages[position] ? (
                  <Image
                    source={{ uri: faceImages[position] }}
                    style={styles.faceImage}
                  />
                ) : (
                  <View style={styles.facePlaceholder}>
                    <Ionicons
                      name="person-outline"
                      size={25}
                      color="#8A9AAA"
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Required Documents */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Required Documents
          </Text>

          {renderDocumentRow(
            'CNIC (Front/Back)',
            'Upload a clear photo or PDF of your CNIC.',
            cnic,
            setCnic
          )}

          <View style={styles.separator} />

          {renderDocumentRow(
            'Driving License',
            'Upload your valid driving license.',
            license,
            setLicense
          )}

          <View style={styles.separator} />

          {renderDocumentRow(
            'Mechanic Certificate',
            'Upload your mechanic certification or training document.',
            certificate,
            setCertificate
          )}

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>
              Verification Instructions
            </Text>

            <Text style={styles.instructionsText}>
              Upload clear and readable documents. Make sure
              all required information is visible. Actual
              verification time depends on the review process.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              uploading && styles.disabledButton,
            ]}
            onPress={submitVerification}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit Verification
              </Text>
            )}
          </TouchableOpacity>

          {/* Verification Status */}
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>
              Verification Status
            </Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  verificationStatus === 'not_submitted' &&
                  styles.statusNeutral,
                  verificationStatus === 'pending' &&
                  styles.statusPending,
                  verificationStatus === 'verified' &&
                  styles.statusVerified,
                  verificationStatus === 'rejected' &&
                  styles.statusRejected,
                ]}
              >
                <Text style={styles.statusPillText}>
                  {verificationStatus === 'not_submitted'
                    ? 'Not Submitted'
                    : verificationStatus === 'pending'
                      ? 'Pending'
                      : verificationStatus === 'verified'
                        ? 'Verified (Demo)'
                        : 'Rejected'}
                </Text>
              </View>

              {verificationStatus === 'pending' && (
                <ActivityIndicator color={PRIMARY} />
              )}

              {verificationStatus === 'verified' && (
                <Ionicons
                  name="checkmark-circle"
                  size={23}
                  color="#10B981"
                />
              )}

              {verificationStatus === 'rejected' && (
                <Ionicons
                  name="close-circle"
                  size={23}
                  color="#EF4444"
                />
              )}
            </View>

            {verificationStatus === 'verified' && (
              <Text style={styles.verifiedText}>
                The demo flow is complete. Real verification
                must be connected to the backend.
              </Text>
            )}

            {verificationStatus === 'rejected' && (
              <Text style={styles.rejectedText}>
                Please review the requirements and upload
                clearer documents.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Camera Modal - correctly placed inside return */}
      <Modal
        animationType="slide"
        transparent
        visible={cameraVisible}
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styles.cameraContainer}>
          {cameraVisible && (
            <CameraView
              ref={cameraRef}
              style={styles.cameraView}
              facing="front"
            >
              <View style={styles.cameraOverlay}>
                <Text style={styles.cameraInstruction}>
                  Capture {captureStep} face
                </Text>

                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={captureFace}
                >
                  <Ionicons
                    name="camera"
                    size={30}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCameraVisible(false)}
                >
                  <Ionicons
                    name="close"
                    size={28}
                    color="#FFFFFF"
                  />

                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 12,
  },

  title: {
    fontSize: 21,
    fontWeight: '700',
    color: PRIMARY,
  },

  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 6,
    lineHeight: 19,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginTop: 14,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 10,
  },

  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },

  uploadInfo: {
    flex: 1,
  },

  uploadLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
  },

  uploadDesc: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
    lineHeight: 18,
  },

  uploadButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
  },

  uploadButtonText: {
    color: '#FFFFFF',
    marginLeft: 7,
    fontWeight: '700',
    fontSize: 13,
  },

  faceImagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 8,
  },

  faceImageItem: {
    flex: 1,
    alignItems: 'center',
  },

  faceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 7,
  },

  faceImage: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    backgroundColor: '#EEEEEE',
  },

  facePlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    gap: 8,
  },

  previewImage: {
    width: 60,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
  },

  previewIcon: {
    width: 60,
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },

  previewMeta: {
    flex: 1,
  },

  previewName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
  },

  previewSize: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
  },

  previewBtn: {
    padding: 6,
  },

  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 14,
  },

  instructionsCard: {
    padding: 12,
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    marginTop: 18,
  },

  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 6,
  },

  instructionsText: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 19,
  },

  submitButton: {
    marginTop: 16,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.65,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  statusCard: {
    marginTop: 16,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 10,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
  },

  statusPillText: {
    color: '#333333',
    fontWeight: '700',
    fontSize: 12,
  },

  statusNeutral: {
    backgroundColor: '#FFEFD5',
  },

  statusPending: {
    backgroundColor: '#FFF3CD',
  },

  statusVerified: {
    backgroundColor: '#D1FAE5',
  },

  statusRejected: {
    backgroundColor: '#FEE2E2',
  },

  rejectedText: {
    color: '#EF4444',
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
  },

  verifiedText: {
    color: '#047857',
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },

  cameraView: {
    flex: 1,
  },

  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },

  cameraInstruction: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 35,
    textAlign: 'center',
    textTransform: 'capitalize',
  },

  captureButton: {
    backgroundColor: PRIMARY,
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: 20,
  },

  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 20,
  },

  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
