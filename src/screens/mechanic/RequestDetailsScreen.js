import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

export default function RequestDetailsScreen({ route, navigation }) {
  const requestId = route?.params?.requestId;
  const { userToken } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [costInput, setCostInput] = useState('');

  const fetchRequestDetails = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setRequest(data.request);
        if (data.request?.cost) setCostInput(String(data.request.cost));
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch details');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  }, [requestId, userToken]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  const handleUpdateStatus = async (nextStatus) => {
    if (nextStatus === 'COMPLETED' && (!costInput || isNaN(costInput) || Number(costInput) <= 0)) {
      Alert.alert('Validation Required', 'Please enter a valid final service cost before marking completed.');
      return;
    }

    setUpdating(true);
    try {
      const body = { status: nextStatus };
      if (nextStatus === 'COMPLETED') body.cost = Number(costInput);

      const response = await fetch(`${API_URL}/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Updated', `Request status changed to ${nextStatus}!`);
        fetchRequestDetails();
      } else {
        Alert.alert('Error', data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <Header title="Request Details" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!request) {
    return (
      <ScreenWrapper>
        <Header title="Request Details" showBack />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Request not found or invalid ID.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const { status } = request;

  return (
    <ScreenWrapper>
      <Header title={`Job #${request.id}`} showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Status Header */}
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <Text style={styles.statusValue}>{status}</Text>
        </View>

        {/* Service Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🛠️ Service Details</Text>
          <Text style={styles.infoText}><Text style={styles.bold}>Type:</Text> {request.serviceType}</Text>
          <Text style={styles.infoText}><Text style={styles.bold}>Description:</Text> {request.description || 'None provided'}</Text>
          <Text style={styles.infoText}><Text style={styles.bold}>Requested At:</Text> {new Date(request.createdAt).toLocaleString()}</Text>
        </View>

        {/* Driver & Location Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📍 Location & Driver</Text>
          <Text style={styles.infoText}><Text style={styles.bold}>Driver Name:</Text> {request.driverName || 'Driver'}</Text>
          <Text style={styles.infoText}><Text style={styles.bold}>Address:</Text> {request.location?.address || 'GPS Location shared'}</Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Vehicle:</Text> {request.vehicleInfo?.make} {request.vehicleInfo?.model} ({request.vehicleInfo?.plateNumber})
          </Text>

          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => {
              if (navigation && navigation.navigate) {
                navigation.navigate('Chat', { requestId: request.id });
              }
            }}
          >
            <Text style={styles.chatBtnText}>💬 Chat with Driver</Text>
          </TouchableOpacity>
        </View>

        {/* Completion Cost Input (when status is IN_PROGRESS or ACCEPTED) */}
        {(status === 'ACCEPTED' || status === 'IN_PROGRESS') && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💰 Service Cost (PKR)</Text>
            <TextInput
              style={styles.costInput}
              placeholder="Enter final bill amount (e.g. 1500)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={costInput}
              onChangeText={setCostInput}
            />
          </View>
        )}

        {request.cost ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💰 Bill Amount</Text>
            <Text style={styles.totalCostText}>PKR {request.cost}</Text>
          </View>
        ) : null}

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          {updating ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              {status === 'ACCEPTED' && (
                <TouchableOpacity
                  style={[styles.btn, styles.progressBtn]}
                  onPress={() => handleUpdateStatus('IN_PROGRESS')}
                >
                  <Text style={styles.btnText}>Start Job (Mark In Progress)</Text>
                </TouchableOpacity>
              )}

              {status === 'IN_PROGRESS' && (
                <TouchableOpacity
                  style={[styles.btn, styles.completeBtn]}
                  onPress={() => handleUpdateStatus('COMPLETED')}
                >
                  <Text style={styles.btnText}>Complete Job & Submit Bill</Text>
                </TouchableOpacity>
              )}

              {status === 'COMPLETED' && (
                <View style={styles.completedBanner}>
                  <Text style={styles.completedText}>✅ Job Completed</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
  },
  statusBox: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusLabel: {
    color: '#FFF',
    opacity: 0.8,
    fontSize: typography.sizes.xs,
  },
  statusValue: {
    color: '#FFF',
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#DDD',
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: 4,
  },
  bold: {
    fontWeight: typography.weights.bold,
  },
  chatBtn: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chatBtnText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  costInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border || '#DDD',
  },
  totalCostText: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    color: '#28A745',
  },
  actionsContainer: {
    marginTop: spacing.sm,
  },
  btn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  progressBtn: {
    backgroundColor: '#007BFF',
  },
  completeBtn: {
    backgroundColor: '#28A745',
  },
  btnText: {
    color: '#FFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  completedBanner: {
    backgroundColor: '#D4EDDA',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  completedText: {
    color: '#155724',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
});
