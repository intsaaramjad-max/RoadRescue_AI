import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

export default function ServiceRequestDetailsScreen({ route, navigation }) {
  const requestId = route?.params?.requestId;
  const { userToken } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Feedback / Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchDetails = useCallback(async () => {
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

        if (data.request?.status === 'COMPLETED') {
          // Check feedback
          const fbRes = await fetch(`${API_URL}/feedback/request/${requestId}`, {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          const fbData = await fbRes.json();
          if (fbRes.ok && fbData.hasReviewed) {
            setHasReviewed(true);
          }
        }
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
    fetchDetails();
  }, [fetchDetails]);

  const handleCancelRequest = async () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this service request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const response = await fetch(`${API_URL}/requests/${requestId}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({ status: 'CANCELLED' }),
              });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Cancelled', 'Your request has been cancelled.');
                fetchDetails();
              } else {
                Alert.alert('Error', data.message || 'Could not cancel request');
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Network error');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmitReview = async () => {
    if (!request?.mechanicId) return;
    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          mechanicId: request.mechanicId,
          rating,
          comment,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Thank You! ⭐', 'Your review has been submitted.');
        setReviewModalVisible(false);
        setHasReviewed(true);
      } else {
        Alert.alert('Error', data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <Header title="Request Status" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!request) {
    return (
      <ScreenWrapper>
        <Header title="Request Status" showBack />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Request details not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const { status } = request;

  return (
    <ScreenWrapper>
      <Header title={`Service #${request.id}`} showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Status Pill */}
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{status}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ {request.serviceType}</Text>
          <Text style={styles.cardText}><Text style={styles.bold}>Vehicle:</Text> {request.vehicleInfo?.make} {request.vehicleInfo?.model} ({request.vehicleInfo?.plateNumber})</Text>
          <Text style={styles.cardText}><Text style={styles.bold}>Pickup Location:</Text> {request.location?.address || 'GPS Coordinates'}</Text>
          {request.description ? <Text style={styles.cardText}><Text style={styles.bold}>Notes:</Text> {request.description}</Text> : null}
          <Text style={styles.cardText}><Text style={styles.bold}>Created:</Text> {new Date(request.createdAt).toLocaleString()}</Text>
        </View>

        {/* Mechanic Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔧 Assigned Mechanic</Text>
          {request.mechanicName || request.mechanicId ? (
            <>
              <Text style={styles.cardText}><Text style={styles.bold}>Name:</Text> {request.mechanicName || 'Assigned Mechanic'}</Text>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.trackBtn]}
                  onPress={() => {
                    if (navigation && navigation.navigate) {
                      navigation.navigate('MechanicTracking', { requestId: request.id });
                    }
                  }}
                >
                  <Text style={styles.btnText}>📍 Track Location</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, styles.chatBtn]}
                  onPress={() => {
                    if (navigation && navigation.navigate) {
                      navigation.navigate('Chat', { requestId: request.id });
                    }
                  }}
                >
                  <Text style={styles.btnText}>💬 Chat</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.pendingText}>Searching for nearest available mechanics...</Text>
          )}
        </View>

        {/* Cost & Payment Card */}
        {request.cost ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💰 Service Cost</Text>
            <Text style={styles.costText}>PKR {request.cost}</Text>
          </View>
        ) : null}

        {/* Action Controls */}
        <View style={styles.actionSection}>
          {status === 'COMPLETED' && !hasReviewed && (
            <TouchableOpacity
              style={[styles.mainBtn, styles.reviewBtn]}
              onPress={() => setReviewModalVisible(true)}
            >
              <Text style={styles.mainBtnText}>⭐ Rate & Review Mechanic</Text>
            </TouchableOpacity>
          )}

          {['PENDING', 'ACCEPTED'].includes(status) && (
            <TouchableOpacity
              style={[styles.mainBtn, styles.cancelBtn]}
              onPress={handleCancelRequest}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.mainBtnText}>❌ Cancel Service Request</Text>
              )}
            </TouchableOpacity>
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
  emptyText: { color: colors.textSecondary },
  statusBox: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusLabel: { color: '#FFF', opacity: 0.8, fontSize: typography.sizes.xs },
  statusValue: { color: '#FFF', fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#DDD',
  },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.xs },
  cardText: { fontSize: typography.sizes.sm, color: colors.text, marginBottom: 4 },
  bold: { fontWeight: typography.weights.bold },
  pendingText: { color: colors.textSecondary, fontStyle: 'italic' },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  smallBtn: { flex: 1, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, alignItems: 'center' },
  trackBtn: { backgroundColor: '#007BFF' },
  chatBtn: { backgroundColor: colors.primary },
  btnText: { color: '#FFF', fontWeight: typography.weights.bold, fontSize: typography.sizes.xs },
  costText: { fontSize: 24, fontWeight: typography.weights.bold, color: '#28A745' },
  actionSection: { marginTop: spacing.sm },
  mainBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  reviewBtn: { backgroundColor: '#FFC107' },
  cancelBtn: { backgroundColor: '#DC3545' },
  mainBtnText: { color: '#FFF', fontWeight: typography.weights.bold, fontSize: typography.sizes.md },
});
