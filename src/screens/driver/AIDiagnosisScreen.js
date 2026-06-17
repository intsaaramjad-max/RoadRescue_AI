import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function AIDiagnosisScreen({ navigation }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const simulateAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        issue: 'Engine Overheating',
        confidence: '94%',
        description: 'The radiator appears to be leaking coolant. This is a critical issue that requires immediate attention. Do not drive the vehicle further.',
        recommendation: 'Request a Tow Truck to a nearby mechanic.',
      });
    }, 3000);
  };

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
