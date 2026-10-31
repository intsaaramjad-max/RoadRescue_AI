import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Speech from 'expo-speech'; // Text-to-speech

export default function AIDiagnosisScreen({ navigation }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech on unmount / navigation away
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
      }
    });
    return () => {
      Speech.stop();
      unsubscribe();
    };
  }, [navigation, isSpeaking]);

  // If a new result appears, ensure any ongoing speech stops
  useEffect(() => {
    if (result && isSpeaking) {
      // stop previous speech before new one could start (user will press button)
      Speech.stop();
      setIsSpeaking(false);
    }
  }, [result]);

  const cleanText = (text) => {
    // Remove markdown symbols and extra whitespace
    return text.replace(/[*_~`>#\-]/g, '').replace(/\s+/g, ' ').trim();
  };

  const buildSpeechText = () => {
    if (!result) return '';
    const parts = [];
    if (result.issue) parts.push(`Detected issue: ${result.issue}.`);
    if (result.description) parts.push(`Explanation: ${cleanText(result.description)}.`);
    if (result.recommendation) parts.push(`Recommendation: ${cleanText(result.recommendation)}.`);
    if (result.cause) parts.push(`Possible cause: ${cleanText(result.cause)}.`);
    if (result.safety) parts.push(`Safety precaution: ${cleanText(result.safety)}.`);
    if (result.estimatedCost) parts.push(`Estimated repair cost: ${cleanText(result.estimatedCost)}.`);
    if (result.mechanicContact) parts.push(`Contact a verified mechanic: ${cleanText(result.mechanicContact)}.`);
    return parts.join(' ');
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    const text = buildSpeechText();
    if (!text) {
      Alert.alert('Speech Unavailable', 'No diagnosis text to read.');
      return;
    }
    Speech.speak(text, {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        Alert.alert('Speech Error', 'An error occurred while reading the diagnosis.');
      },
    });
    setIsSpeaking(true);
  };

  const simulateAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        issue: 'Engine Overheating',
        confidence: '94%',
        description: 'The radiator appears to be leaking coolant. This is a critical issue that requires immediate attention. Do not drive the vehicle further.',
        recommendation: 'Request a Tow Truck to a nearby mechanic.',
        // optional fields for demo purposes
        cause: 'Coolant leak due to cracked hose.',
        safety: 'Turn off engine and let it cool before inspecting.',
        estimatedCost: 'PKR 3,500',
        mechanicContact: 'Call 123-456-7890 for verified mechanics.',
      });
    }, 2000);
  };

  // UI rendering continues below ...



  return (
    <ScreenWrapper>
      <Header title="AI Diagnosis" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.introText}>
          Upload a photo of your dashboard warning lights or under the hood, and our AI will help identify the issue.
        </Text>

        <TouchableOpacity style={styles.uploadArea} onPress={simulateAnalysis}>
          <Ionicons name="camera" size={48} color={colors.primary} />
          <Text style={styles.uploadText}>Tap to take a photo or upload</Text>
        </TouchableOpacity>

        {analyzing && (
          <View style={styles.analyzingState}>
            <Ionicons name="scan-outline" size={48} color={colors.primary} style={styles.scanIcon} />
            <Text style={styles.analyzingText}>Analyzing Image...</Text>
          </View>
        )}

        {result && !analyzing && (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="warning" size={24} color={colors.error} />
              <Text style={styles.resultTitle}>{result.issue}</Text>
            </View>
            
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>AI Confidence Level:</Text>
              <Text style={styles.confidenceValue}>{result.confidence}</Text>
            </View>

            <Text style={styles.descText}>{result.description}</Text>
            
            <View style={styles.recommendationBox}>
              <Text style={styles.recLabel}>Recommendation:</Text>
              <Text style={styles.recText}>{result.recommendation}</Text>
            </View>
            <Button
              title={isSpeaking ? '[ ■ Stop Reading ]' : '[ 🔊 Listen to Diagnosis ]'}
              onPress={handleSpeak}
              style={styles.actionBtn}
            />

            <Button 
              title="Request Assistance" 
              onPress={() => navigation.navigate('CreateRequest', { serviceType: 'Tow Truck' })}
              style={styles.actionBtn}
            />
          </Card>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
  },
  introText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  uploadArea: {
    height: 200,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  uploadText: {
    color: colors.primary,
    marginTop: spacing.md,
    fontWeight: typography.weights.bold,
  },
  analyzingState: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  analyzingText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    marginTop: spacing.md,
  },
  resultCard: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.sm,
  },
  confidenceRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  confidenceLabel: {
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  confidenceValue: {
    color: colors.success,
    fontWeight: typography.weights.bold,
  },
  descText: {
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  recommendationBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  recLabel: {
    color: colors.error,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  recText: {
    color: colors.text,
  },
  actionBtn: {
    width: '100%',
  },
});
