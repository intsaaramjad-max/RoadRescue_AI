import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors, spacing, borderRadius } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

const LANGUAGES = [
  { code: 'en', label: 'English', locale: 'en-US' },
  { code: 'ur', label: 'اردو', locale: 'ur-PK' },
];

const DEMO_RESULT = {
  issue: 'Example cooling-system concern',
  symptoms: 'Demonstration symptoms: coolant loss and a rising engine temperature.',
  severity: 'Medium',
  action: 'Stop safely and allow the engine to cool. Do not open a hot radiator.',
  mechanic: 'If symptoms continue, request an inspection from a qualified mechanic.',
  summary: 'This is a simulated example only. No AI service analyzed your image or recording.',
  speech: {
    en: 'This is a simulated diagnosis example. A possible cooling system concern could involve coolant loss and rising engine temperature. Stop safely, allow the engine to cool, and request a qualified mechanic if symptoms continue.',
    ur: 'یہ صرف ایک فرضی تشخیصی مثال ہے۔ کولنگ سسٹم میں مسئلہ ہو سکتا ہے۔ محفوظ جگہ پر رکیں، انجن کو ٹھنڈا ہونے دیں، اور علامات برقرار رہنے پر مستند مکینک سے رابطہ کریں۔',
  },
};

function SectionTitle({ icon, title, color = colors.primary }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function LanguageSelector({ value, onChange }) {
  return (
    <View style={styles.languageRow}>
      {LANGUAGES.map((language) => {
        const selected = language.code === value;
        return (
          <TouchableOpacity
            key={language.code}
            style={[styles.languageChip, selected && styles.languageChipSelected]}
            onPress={() => onChange(language.code)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.languageText, selected && styles.languageTextSelected]}>
              {language.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DemoDiagnosisResult({ result, onRequestMechanic, onListen }) {
  const severityColor = {
    Low: colors.success,
    Medium: colors.warning,
    High: colors.error,
  }[result.severity] || colors.warning;

  return (
    <Card style={styles.resultCard}>
      <View style={styles.demoBanner}>
        <Ionicons name="flask-outline" size={16} color="#FBBF24" />
        <Text style={styles.demoBannerText}>DEMO / SIMULATED RESULT</Text>
      </View>
      <Text style={styles.resultDisclaimer}>{result.summary}</Text>
      <View style={styles.resultBlock}>
        <Text style={styles.resultLabel}>Possible Vehicle Problem</Text>
        <Text style={styles.resultValue}>{result.issue}</Text>
      </View>
      <View style={styles.resultBlock}>
        <Text style={styles.resultLabel}>Symptoms Detected</Text>
        <Text style={styles.resultValue}>{result.symptoms}</Text>
      </View>
      <View style={styles.severityRow}>
        <Text style={styles.resultLabel}>Severity Level</Text>
        <View style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}>
          <Text style={[styles.severityText, { color: severityColor }]}>{result.severity}</Text>
        </View>
      </View>
      <View style={styles.resultBlock}>
        <Text style={styles.resultLabel}>Recommended Action</Text>
        <Text style={styles.resultValue}>{result.action}</Text>
      </View>
      <View style={styles.resultBlock}>
        <Text style={styles.resultLabel}>Mechanic Assistance</Text>
        <Text style={styles.resultValue}>{result.mechanic}</Text>
      </View>
      <View style={styles.summaryBox}>
        <Text style={styles.resultLabel}>Diagnosis Summary</Text>
        <Text style={styles.resultValue}>{result.summary}</Text>
      </View>
      <Button
        title="Listen to Diagnosis"
        onPress={onListen}
        variant="outline"
        style={styles.fullButton}
        icon={<Ionicons name="volume-high-outline" size={18} color={colors.primary} />}
      />
      <Button
        title="Request Mechanic"
        onPress={onRequestMechanic}
        style={[styles.fullButton, styles.requestButton]}
        icon={<Ionicons name="construct-outline" size={18} color="#FFFFFF" />}
      />
    </Card>
  );
}

export default function AIDiagnosisScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState('image');
  const [imageUri, setImageUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingNotice, setRecordingNotice] = useState('');
  const [problemText, setProblemText] = useState('');
  const [inputLanguage, setInputLanguage] = useState('en');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPaused, setSpeechPaused] = useState(false);
  const [ttsMessage, setTtsMessage] = useState('');
  const analysisTimer = useRef(null);
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingStartedAt = useRef(null);
  const recordingTimer = useRef(null);
  const recordingSecondsRef = useRef(0);
  const completedDurationLabel = useRef('0:00');
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  recorderRef.current = recorder;
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(audioUri);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setRecognitionAvailable(Boolean(
        globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition
      ));
    }

    return () => {
      if (analysisTimer.current) clearTimeout(analysisTimer.current);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      Speech.stop();
      if (recorderRef.current?.isRecording) recorderRef.current.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (playerStatus.error) setRecordingNotice(playerStatus.error);
  }, [playerStatus.error]);

  const clearResult = () => {
    setResult(null);
    setErrorMessage('');
  };

  const acceptImage = (asset) => {
    if (!asset?.uri) {
      setErrorMessage('The selected image could not be opened. Please choose another image.');
      return;
    }
    setImageUri(asset.uri);
    clearResult();
  };

  const chooseImage = async (source) => {
    setErrorMessage('');
    try {
      let permission;
      if (source === 'camera') {
        permission = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permission.granted) {
        setErrorMessage(
          source === 'camera'
            ? 'Camera permission is needed to capture an image. You can allow access in device settings or choose an image from your gallery.'
            : 'Gallery permission is needed to select an image. You can allow access in device settings or capture a new image.'
        );
        return;
      }

      const picker = source === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
      const selection = await picker({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!selection.canceled) acceptImage(selection.assets?.[0]);
    } catch (error) {
      setErrorMessage(error.message || 'Image selection is not available on this device.');
    }
  };

  const analyze = (source) => {
    if (source === 'image' && !imageUri) {
      setErrorMessage('Capture or select an image before starting the demo.');
      return;
    }
    if (source === 'sound' && !audioUri) {
      setErrorMessage('Record an engine sound before starting the demo.');
      return;
    }

    setErrorMessage('');
    setResult(null);
    setAnalyzing(true);
    analysisTimer.current = setTimeout(() => {
      setResult(DEMO_RESULT);
      setAnalyzing(false);
      analysisTimer.current = null;
    }, 1400);
  };

  const startRecording = async () => {
    setErrorMessage('');
    setRecordingNotice('');
    setAudioUri(null);
    setRecordingDurationSeconds(0);
    recordingSecondsRef.current = 0;
    completedDurationLabel.current = '0:00';
    clearResult();
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setRecordingNotice('Microphone permission denied. Allow microphone access in settings to record engine sound.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingStartedAt.current = Date.now();
      recordingTimer.current = setInterval(() => {
        if (recordingStartedAt.current) {
          const seconds = Math.floor((Date.now() - recordingStartedAt.current) / 1000);
          recordingSecondsRef.current = seconds;
          setRecordingDurationSeconds(seconds);
        }
      }, 250);
      setRecordingNotice('Recording engine sound…');
    } catch (error) {
      setRecordingNotice(error.message || 'Audio recording is unavailable. Check microphone permissions and try again.');
    }
  };

  const stopRecording = async () => {
    try {
      const elapsedSeconds = recordingStartedAt.current
        ? Math.floor((Date.now() - recordingStartedAt.current) / 1000)
        : 0;
      const completedDuration = Math.max(
        recordingSecondsRef.current,
        Math.floor((recorderState.durationMillis || 0) / 1000),
        elapsedSeconds
      );
      recordingSecondsRef.current = completedDuration;
      setRecordingDurationSeconds(completedDuration);
      completedDurationLabel.current = formatDuration(completedDuration);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      recordingTimer.current = null;
      recordingStartedAt.current = null;
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setRecordingNotice('No audio recording was created. Please try recording again.');
        return;
      }
      setAudioUri(uri);
      setRecordingNotice('Recording ready to preview.');
    } catch (error) {
      setRecordingNotice(error.message || 'Could not stop the recording. Please try again.');
    }
  };

  const discardRecording = async () => {
    try {
      if (recorderState.isRecording) await recorder.stop();
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      recordingTimer.current = null;
      recordingStartedAt.current = null;
      player.pause();
      setAudioUri(null);
      setRecordingDurationSeconds(0);
      recordingSecondsRef.current = 0;
      completedDurationLabel.current = '0:00';
      setRecordingNotice('');
      clearResult();
    } catch (error) {
      setRecordingNotice(error.message || 'Could not remove the recording.');
    }
  };

  const toggleAudioPlayback = async () => {
    if (!audioUri) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playerStatus.playing) {
        player.pause();
      } else {
        if (playerStatus.didJustFinish) await player.seekTo(0);
        player.play();
      }
    } catch (error) {
      setRecordingNotice(error.message || 'Audio playback is unavailable on this device.');
    }
  };

  const startSpeechRecognition = () => {
    setErrorMessage('');
    if (Platform.OS !== 'web') {
      setErrorMessage('Speech-to-text is not configured in this app on Android or iOS. You can type your vehicle symptoms instead.');
      return;
    }

    const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    if (!Recognition) {
      setErrorMessage('Speech recognition is not available in this browser. You can type your vehicle symptoms instead.');
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = LANGUAGES.find((item) => item.code === inputLanguage)?.locale || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((item) => item[0]?.transcript || '')
          .join(' ')
          .trim();
        if (transcript) {
          setProblemText((current) => [current.trim(), transcript].filter(Boolean).join(' '));
        }
      };
      recognition.onerror = (event) => {
        setErrorMessage(
          event.error === 'not-allowed' || event.error === 'service-not-allowed'
            ? 'Microphone permission was denied for speech recognition. Allow access in your browser settings.'
            : `Speech recognition failed (${event.error || 'unknown error'}). You can type your symptoms instead.`
        );
        setRecognizing(false);
      };
      recognition.onend = () => {
        setRecognizing(false);
        recognitionRef.current = null;
      };
      recognitionRef.current = recognition;
      recognition.start();
      setRecognizing(true);
    } catch (error) {
      setRecognizing(false);
      setErrorMessage(error.message || 'Could not start speech recognition. You can type your symptoms instead.');
    }
  };

  const stopSpeechRecognition = () => {
    recognitionRef.current?.stop();
    setRecognizing(false);
  };

  const listenToDiagnosis = async () => {
    if (!result) return;
    setTtsMessage('');
    const selectedLanguage = LANGUAGES.find((item) => item.code === outputLanguage);
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const voice = voices.find((item) =>
        item.language?.toLowerCase().startsWith(outputLanguage)
      );
      if (!voice) {
        setTtsMessage(`No ${selectedLanguage?.label || outputLanguage} speech voice is available on this device.`);
        return;
      }
      Speech.speak(result.speech[outputLanguage], {
        language: selectedLanguage.locale,
        voice: voice.identifier,
        onStart: () => { setIsSpeaking(true); setSpeechPaused(false); },
        onPause: () => setSpeechPaused(true),
        onResume: () => setSpeechPaused(false),
        onDone: () => { setIsSpeaking(false); setSpeechPaused(false); },
        onStopped: () => { setIsSpeaking(false); setSpeechPaused(false); },
        onError: (error) => {
          setIsSpeaking(false);
          setSpeechPaused(false);
          setTtsMessage(error.message || 'Text-to-speech could not read this diagnosis.');
        },
      });
    } catch (error) {
      setTtsMessage(error.message || 'Text-to-speech is not available on this device.');
    }
  };

  const toggleSpeechPause = async () => {
    try {
      if (speechPaused) {
        await Speech.resume();
        setSpeechPaused(false);
      } else {
        await Speech.pause();
        setSpeechPaused(true);
      }
    } catch (error) {
      setTtsMessage(error.message || 'Speech pause controls are unavailable.');
    }
  };

  const stopSpeech = async () => {
    await Speech.stop();
    setIsSpeaking(false);
    setSpeechPaused(false);
  };

  const requestMechanic = () => {
    if (result) {
      navigation.navigate('CreateRequest', {
        serviceType: 'General Request',
        diagnosisSummary: result.summary,
      });
    }
  };

  const formatDuration = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const recordingDurationLabel = recorderState.isRecording
    ? formatDuration(recordingDurationSeconds)
    : audioUri && playerStatus.duration > 0
      ? formatDuration(Math.floor(playerStatus.duration))
      : audioUri && completedDurationLabel.current !== '0:00'
        ? completedDurationLabel.current
        : audioUri
          ? 'Duration unavailable'
          : '0:00';

  return (
    <ScreenWrapper useSafeArea>
      <Header title="AI Vehicle Diagnosis" showBack />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Describe a vehicle problem, share an image, or record an engine sound to view a simulated diagnosis example.
        </Text>

        <View style={[styles.modeGrid, width > 620 && styles.modeGridWide]}>
          <TouchableOpacity
            style={[styles.modeCard, mode === 'image' && styles.modeCardActive]}
            onPress={() => { setMode('image'); setErrorMessage(''); }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'image' }}
          >
            <View style={[styles.modeIcon, mode === 'image' && styles.modeIconActive]}>
              <Ionicons name="images-outline" size={22} color={mode === 'image' ? '#FFFFFF' : colors.primary} />
            </View>
            <Text style={styles.modeTitle}>Image-Based Diagnosis</Text>
            <Text style={styles.modeDescription}>Use a photo of a warning light or vehicle part</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeCard, mode === 'sound' && styles.modeCardActive]}
            onPress={() => { setMode('sound'); setErrorMessage(''); }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'sound' }}
          >
            <View style={[styles.modeIcon, mode === 'sound' && styles.modeIconActive]}>
              <Ionicons name="musical-notes-outline" size={22} color={mode === 'sound' ? '#FFFFFF' : colors.primary} />
            </View>
            <Text style={styles.modeTitle}>Engine Sound Diagnosis</Text>
            <Text style={styles.modeDescription}>Record an engine sound for a demo result</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.inputCard}>
          <SectionTitle
            icon={mode === 'image' ? 'camera-outline' : 'mic-outline'}
            title={mode === 'image' ? 'Image-Based Diagnosis' : 'Engine Sound Diagnosis'}
          />

          {mode === 'image' ? (
            <>
              {imageUri ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => { setImageUri(null); clearResult(); }}
                    accessibilityRole="button"
                    accessibilityLabel="Remove selected image"
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.previewLabel}>Image selected</Text>
                </View>
              ) : (
                <View style={styles.emptyMedia}>
                  <Ionicons name="image-outline" size={34} color="#64748B" />
                  <Text style={styles.emptyMediaTitle}>No image selected</Text>
                  <Text style={styles.emptyMediaText}>Capture a photo or choose one from your gallery.</Text>
                </View>
              )}
              <View style={styles.actionRow}>
                <Button
                  title="Take Photo"
                  onPress={() => chooseImage('camera')}
                  variant="outline"
                  style={styles.flexButton}
                  icon={<Ionicons name="camera-outline" size={18} color={colors.primary} />}
                />
                <Button
                  title="Choose Image"
                  onPress={() => chooseImage('gallery')}
                  variant="secondary"
                  style={styles.flexButton}
                  icon={<Ionicons name="images-outline" size={18} color={colors.text} />}
                />
              </View>
              <Button
                title="Analyze Image"
                onPress={() => analyze('image')}
                isLoading={analyzing && mode === 'image'}
                disabled={!imageUri || analyzing}
                style={styles.fullButton}
              />
            </>
          ) : (
            <>
              <View style={[styles.emptyMedia, recorderState.isRecording && styles.recordingPanel]}>
                <View style={[styles.recordingIcon, recorderState.isRecording && styles.recordingIconActive]}>
                  <Ionicons
                    name={recorderState.isRecording ? 'radio' : 'mic-outline'}
                    size={28}
                    color={recorderState.isRecording ? '#FFFFFF' : colors.primary}
                  />
                </View>
                <Text style={styles.emptyMediaTitle}>
                  {recorderState.isRecording ? 'Recording engine sound' : audioUri ? 'Recording ready' : 'No recording yet'}
                </Text>
                <Text style={styles.durationText}>
                  {recordingDurationLabel}
                  {recorderState.isRecording ? ' • Recording' : audioUri ? ' • Ready to play' : ' • Idle'}
                </Text>
              </View>
              {recordingNotice ? <Text style={styles.noticeText}>{recordingNotice}</Text> : null}
              <View style={styles.actionRow}>
                {recorderState.isRecording ? (
                  <Button
                    title="Stop Recording"
                    onPress={stopRecording}
                    variant="danger"
                    style={styles.flexButton}
                    icon={<Ionicons name="stop-circle-outline" size={18} color="#FFFFFF" />}
                  />
                ) : (
                  <Button
                    title={audioUri ? 'Record Again' : 'Start Recording'}
                    onPress={startRecording}
                    variant="primary"
                    style={styles.flexButton}
                    icon={<Ionicons name="mic-outline" size={18} color="#FFFFFF" />}
                  />
                )}
                {audioUri && !recorderState.isRecording ? (
                  <Button
                    title={playerStatus.playing ? 'Pause' : 'Play'}
                    onPress={toggleAudioPlayback}
                    variant="outline"
                    style={styles.flexButton}
                    icon={<Ionicons name={playerStatus.playing ? 'pause' : 'play'} size={18} color={colors.primary} />}
                  />
                ) : null}
                {audioUri && !recorderState.isRecording ? (
                  <TouchableOpacity
                    style={styles.deleteAudioButton}
                    onPress={discardRecording}
                    accessibilityRole="button"
                    accessibilityLabel="Delete recording"
                  >
                    <Ionicons name="trash-outline" size={19} color={colors.error} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Button
                title="Analyze Engine Sound"
                onPress={() => analyze('sound')}
                isLoading={analyzing && mode === 'sound'}
                disabled={!audioUri || analyzing || recorderState.isRecording}
                style={styles.fullButton}
              />
            </>
          )}
        </Card>

        <Card style={styles.symptomsCard}>
          <SectionTitle icon="chatbox-ellipses-outline" title="Describe the Problem" color={colors.secondary} />
          <Text style={styles.helperText}>Speak where supported or type symptoms. Speech recognition availability depends on your browser.</Text>
          <LanguageSelector value={inputLanguage} onChange={setInputLanguage} />
          <TextInput
            style={styles.symptomInput}
            placeholder="Describe sounds, warning lights, or other symptoms..."
            placeholderTextColor="#64748B"
            value={problemText}
            onChangeText={setProblemText}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Vehicle problem description"
          />
          <View style={styles.actionRow}>
            <Button
              title={recognizing ? 'Stop Listening' : 'Speak Symptoms'}
              onPress={recognizing ? stopSpeechRecognition : startSpeechRecognition}
              variant="outline"
              style={styles.flexButton}
              icon={<Ionicons name={recognizing ? 'stop' : 'mic-outline'} size={17} color={colors.primary} />}
            />
            {problemText ? (
              <TouchableOpacity
                style={styles.clearTextButton}
                onPress={() => setProblemText('')}
                accessibilityRole="button"
                accessibilityLabel="Clear symptom description"
              >
                <Ionicons name="close-circle-outline" size={18} color="#94A3B8" />
                <Text style={styles.clearTextLabel}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.capabilityText}>
            {Platform.OS !== 'web'
              ? 'Speech-to-text is unavailable in this app on Android/iOS; typing remains available.'
              : recognitionAvailable
                ? 'Browser speech recognition is available if microphone permission is granted.'
                : 'This browser does not provide speech recognition; you can type symptoms instead.'}
          </Text>
        </Card>

        {errorMessage ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Ionicons name="warning-outline" size={19} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {analyzing ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Preparing demo result…</Text>
            <Text style={styles.helperText}>This is a frontend simulation, not AI processing.</Text>
          </Card>
        ) : null}

        {result && !analyzing ? (
          <View style={styles.resultSection}>
            <SectionTitle icon="document-text-outline" title="Diagnosis Result" />
            <DemoDiagnosisResult
              result={result}
              onListen={listenToDiagnosis}
              onRequestMechanic={requestMechanic}
            />
            <Card style={styles.ttsCard}>
              <View style={styles.ttsHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ttsTitle}>Listen to Diagnosis</Text>
                  <Text style={styles.helperText}>Uses an available device or browser speech voice.</Text>
                </View>
                {isSpeaking ? <View style={styles.speakingBadge}><View style={styles.speakingDot} /><Text style={styles.speakingText}>Speaking</Text></View> : null}
              </View>
              <LanguageSelector value={outputLanguage} onChange={setOutputLanguage} />
              <View style={styles.ttsControls}>
                <TouchableOpacity
                  style={styles.ttsControl}
                  onPress={listenToDiagnosis}
                  accessibilityRole="button"
                  accessibilityLabel="Play diagnosis"
                >
                  <Ionicons name="play" size={20} color={colors.primary} />
                  <Text style={styles.ttsControlText}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ttsControl, Platform.OS === 'android' && styles.disabledControl]}
                  onPress={toggleSpeechPause}
                  disabled={!isSpeaking || Platform.OS === 'android'}
                  accessibilityRole="button"
                  accessibilityLabel={speechPaused ? 'Resume diagnosis' : 'Pause diagnosis'}
                >
                  <Ionicons name={speechPaused ? 'play' : 'pause'} size={20} color={Platform.OS === 'android' ? '#475569' : colors.secondary} />
                  <Text style={styles.ttsControlText}>{speechPaused ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ttsControl, !isSpeaking && styles.disabledControl]}
                  onPress={stopSpeech}
                  disabled={!isSpeaking}
                  accessibilityRole="button"
                  accessibilityLabel="Stop diagnosis speech"
                >
                  <Ionicons name="stop" size={20} color={isSpeaking ? colors.error : '#475569'} />
                  <Text style={styles.ttsControlText}>Stop</Text>
                </TouchableOpacity>
              </View>
              {Platform.OS === 'android' ? (
                <Text style={styles.capabilityText}>Pause is not supported by Expo Speech on Android.</Text>
              ) : null}
              {ttsMessage ? <Text style={styles.noticeText}>{ttsMessage}</Text> : null}
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 820, alignSelf: 'center', padding: spacing.md, paddingBottom: spacing.xl },
  intro: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: spacing.md },
  modeGrid: { gap: spacing.sm, marginBottom: spacing.md },
  modeGridWide: { flexDirection: 'row' },
  modeCard: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md },
  modeCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(249,115,22,0.08)' },
  modeIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  modeIconActive: { backgroundColor: colors.primary },
  modeTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  modeDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  inputCard: { padding: spacing.md, marginBottom: spacing.md },
  symptomsCard: { padding: spacing.md, marginBottom: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700', flex: 1 },
  emptyMedia: { minHeight: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: spacing.md, marginBottom: spacing.md },
  emptyMediaTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
  emptyMediaText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: spacing.xs },
  imagePreviewWrap: { position: 'relative', marginBottom: spacing.md },
  imagePreview: { width: '100%', height: 230, borderRadius: borderRadius.md, backgroundColor: colors.background },
  removeImageButton: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.82)' },
  previewLabel: { color: colors.success, fontSize: 12, fontWeight: '600', marginTop: spacing.xs },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  flexButton: { flex: 1, minWidth: 0 },
  fullButton: { width: '100%', marginTop: spacing.sm },
  requestButton: { marginTop: spacing.sm },
  recordingPanel: { borderColor: 'rgba(239,68,68,0.45)', backgroundColor: 'rgba(239,68,68,0.06)' },
  recordingIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(249,115,22,0.13)', alignItems: 'center', justifyContent: 'center' },
  recordingIconActive: { backgroundColor: colors.error },
  durationText: { color: colors.textMuted, fontSize: 13, fontVariant: ['tabular-nums'], marginTop: 7 },
  noticeText: { color: '#FBBF24', fontSize: 12, lineHeight: 18, marginBottom: spacing.sm },
  deleteAudioButton: { width: 46, height: 46, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.1)' },
  helperText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: spacing.sm },
  languageRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  languageChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: borderRadius.round, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  languageChipSelected: { borderColor: colors.secondary, backgroundColor: 'rgba(59,130,246,0.18)' },
  languageText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  languageTextSelected: { color: '#BFDBFE' },
  symptomInput: { minHeight: 94, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: spacing.md, fontSize: 14, lineHeight: 20, marginBottom: spacing.sm },
  clearTextButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8 },
  clearTextLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  capabilityText: { color: '#64748B', fontSize: 11, lineHeight: 16, marginTop: 2 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: '#FCA5A5', fontSize: 13, lineHeight: 19, flex: 1 },
  loadingCard: { alignItems: 'center', padding: spacing.lg, marginBottom: spacing.md },
  loadingTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  resultSection: { marginTop: spacing.sm, marginBottom: spacing.md },
  resultCard: { padding: spacing.md, borderColor: 'rgba(245,158,11,0.35)', marginBottom: spacing.md },
  demoBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: borderRadius.round, marginBottom: spacing.sm },
  demoBannerText: { color: '#FBBF24', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  resultDisclaimer: { color: '#FBBF24', fontSize: 12, lineHeight: 18, marginBottom: spacing.md },
  resultBlock: { marginBottom: spacing.md },
  resultLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  resultValue: { color: colors.text, fontSize: 14, lineHeight: 20 },
  severityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  severityBadge: { borderRadius: borderRadius.round, paddingHorizontal: 11, paddingVertical: 5 },
  severityText: { fontSize: 12, fontWeight: '800' },
  summaryBox: { backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  ttsCard: { padding: spacing.md },
  ttsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  ttsTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  speakingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: borderRadius.round, paddingHorizontal: 9, paddingVertical: 6 },
  speakingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  speakingText: { color: colors.success, fontSize: 11, fontWeight: '700' },
  ttsControls: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  ttsControl: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md },
  disabledControl: { opacity: 0.5 },
  ttsControlText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
});
