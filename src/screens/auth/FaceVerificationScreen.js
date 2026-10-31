import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// ─── Step config ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'front',
    label: 'Front',
    instruction: 'Look straight\nat the camera',
    icon: 'person-circle-outline',
    arrowIcon: null,
  },
  {
    id: 'right',
    label: 'Right',
    instruction: 'Slowly turn your\nhead to the RIGHT',
    icon: 'arrow-forward-circle-outline',
    arrowIcon: 'arrow-forward',
  },
  {
    id: 'left',
    label: 'Left',
    instruction: 'Slowly turn your\nhead to the LEFT',
    icon: 'arrow-back-circle-outline',
    arrowIcon: 'arrow-back',
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const showAlert = (title, msg) => {
  if (Platform.OS === 'web') alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function FaceVerificationScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraRef = useRef(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [currentStep]);

  if (!permission) {
    return (
      <LinearGradient colors={['#071022', '#0d1b3e', '#162b66']} style={styles.center}>
        <ActivityIndicator color="#FF7A00" size="large" />
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#071022', '#0d1b3e', '#162b66']} style={styles.center}>
        <Ionicons name="camera-off-outline" size={56} color="#FF7A00" />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>
          Face verification needs camera access to confirm your identity.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const step = STEPS[currentStep];
  const allCaptured = Object.keys(captures).length === STEPS.length;

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
      });
      setCaptures(prev => ({ ...prev, [step.id]: photo.uri }));
      if (currentStep < STEPS.length - 1) {
        fadeAnim.setValue(0);
        setCurrentStep(s => s + 1);
      }
    } catch (err) {
      showAlert('Capture Error', err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setIsSubmitting(false);
    showAlert(
      'Verification Submitted',
      'Your face scan has been submitted for review. You will be notified once approved.'
    );
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#071022', '#0d1b3e', '#162b66']}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FF7A00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face Verification</Text>
      </View>

      {/* Step progress */}
      <View style={styles.stepsRow}>
        {STEPS.map((s, idx) => {
          const done   = captures[s.id] !== undefined;
          const active = idx === currentStep;
          return (
            <View key={s.id} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                done   && styles.stepDotDone,
                active && !done && styles.stepDotActive,
              ]}>
                {done
                  ? <Ionicons name="checkmark" size={13} color="#fff" />
                  : <Text style={[styles.stepDotText, active && { color: '#FF7A00' }]}>{idx + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>
                {s.label}
              </Text>
              {idx < STEPS.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Camera view or Done view */}
      {!allCaptured ? (
        <Animated.View style={[styles.cameraWrapper, { opacity: fadeAnim }]}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="front"
          />

          {/* Vignette */}
          <View style={styles.vignette} pointerEvents="none" />

          {/* Instruction badge */}
          <View style={styles.instructionBadge}>
            <Ionicons name={step.icon} size={20} color="#FF7A00" style={{ marginBottom: 4 }} />
            <Text style={styles.instructionText}>{step.instruction}</Text>
          </View>

          {/* Face oval ring */}
          <Animated.View
            style={[styles.faceRing, { transform: [{ scale: pulseAnim }] }]}
            pointerEvents="none"
          >
            {step.arrowIcon && (
              <View style={[
                styles.arrowCue,
                step.id === 'right' ? styles.arrowCueRight : styles.arrowCueLeft,
              ]}>
                <Ionicons name={step.arrowIcon} size={30} color="#FF7A00" />
              </View>
            )}
          </Animated.View>

          {/* Shutter button */}
          <TouchableOpacity
            style={[styles.captureBtn, isCapturing && styles.captureBtnDisabled]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            {isCapturing
              ? <ActivityIndicator color="#fff" />
              : <View style={styles.captureBtnInner} />
            }
          </TouchableOpacity>

          {/* Thumbnail strip */}
          <View style={styles.thumbnailRow}>
            {STEPS.map(s => (
              <View key={s.id} style={styles.thumbSlot}>
                {captures[s.id]
                  ? <Image source={{ uri: captures[s.id] }} style={styles.thumbImg} />
                  : <Ionicons name="camera-outline" size={18} color="rgba(255,255,255,0.3)" />
                }
                <Text style={styles.thumbLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : (
        /* All scans done */
        <View style={styles.doneContainer}>
          <View style={styles.doneIconWrapper}>
            <Ionicons name="shield-checkmark" size={54} color="#10B981" />
          </View>
          <Text style={styles.doneTitle}>Scans Captured!</Text>
          <Text style={styles.doneSub}>
            All three face angles have been recorded successfully.
          </Text>

          <View style={styles.previewRow}>
            {STEPS.map(s => (
              <View key={s.id} style={styles.previewCard}>
                <Image source={{ uri: captures[s.id] }} style={styles.previewImg} />
                <View style={styles.previewCheck}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                </View>
                <Text style={styles.previewLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Submit for Verification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const RING_W = 300;
const RING_H = RING_W * 1.2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 50 : 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  backBtn: { marginRight: 14 },
  headerTitle: { color: '#FF7A00', fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },

  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  stepItem: { alignItems: 'center', flexDirection: 'row' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive:  { borderColor: '#FF7A00', backgroundColor: 'rgba(255,122,0,0.12)' },
  stepDotDone:    { backgroundColor: '#FF7A00', borderColor: '#FF7A00' },
  stepDotText:    { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' },
  stepLabel:      { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginLeft: 5, fontWeight: '600' },
  stepLabelActive:{ color: '#FF7A00' },
  stepLine:       { width: 36, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 6, borderRadius: 1 },
  stepLineDone:   { backgroundColor: '#FF7A00' },

  cameraWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 80,
    borderColor: 'rgba(7,16,34,0.85)',
  },

  faceRing: {
    width: RING_W, height: RING_H,
    borderRadius: RING_W / 2,
    borderWidth: 3, borderColor: '#FF7A00',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16, shadowOpacity: 0.5,
    elevation: 10,
  },
  arrowCue: {
    position: 'absolute', top: '40%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20, padding: 4,
  },
  arrowCueRight: { right: -46 },
  arrowCueLeft:  { left: -46 },

  instructionBadge: {
    position: 'absolute', top: 28,
    alignSelf: 'center',
    backgroundColor: 'rgba(7,16,34,0.75)',
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,122,0,0.3)',
  },
  instructionText: { color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 20, fontWeight: '500' },

  captureBtn: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3, borderColor: '#FF7A00',
    justifyContent: 'center', alignItems: 'center',
  },
  captureBtnDisabled: { opacity: 0.5 },
  captureBtnInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FF7A00' },

  thumbnailRow: { position: 'absolute', bottom: 18, flexDirection: 'row', gap: 18, alignSelf: 'center' },
  thumbSlot: { alignItems: 'center', gap: 4 },
  thumbImg: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#10B981' },
  thumbLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' },

  doneContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 30 },
  doneIconWrapper: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(16,185,129,0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18, borderWidth: 2, borderColor: 'rgba(16,185,129,0.3)',
  },
  doneTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  doneSub:   { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 32 },

  previewRow: { flexDirection: 'row', gap: 16, marginBottom: 36 },
  previewCard: { alignItems: 'center', gap: 6 },
  previewImg: { width: 80, height: 96, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,122,0,0.4)' },
  previewCheck: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(7,16,34,0.7)', borderRadius: 10 },
  previewLabel: { color: '#E2E8F0', fontSize: 12, fontWeight: '600' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FF7A00', borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 36,
    shadowColor: '#FF7A00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  permTitle: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  permSub: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  permBtn: { backgroundColor: '#FF7A00', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 30, marginTop: 8 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
