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

const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
      return colors.success;
    case 'ACCEPTED':
    case 'IN_PROGRESS':
      return colors.secondary;
    case 'CANCELLED':
      return colors.error;
    case 'PENDING':
    default:
      return colors.warning;
  }
};

export default function ServiceRequestDetailsScreen({ route, navigation }) {
  const requestId = route?.params?.requestId;
  const { token } = useAuth();

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
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setRequest(data.request);

        if (data.request?.status === 'COMPLETED') {
          // Check feedback
          const fbRes = await fetch(`${API_URL}/feedback/request/${requestId}`, {
            headers: { Authorization: `Bearer ${token}` }
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
  }, [requestId, token]);

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
                  Authorization: `Bearer ${token}`,
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
          Authorization: `Bearer ${token}`,
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
        <View style={[styles.statusBox, { borderColor: getStatusColor(status) }]}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(status) }]}>{status}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ {request.serviceType}</Text>
          <Text style={styles.cardText}><Text style={styles.cardLabel}>Vehicle: </Text><Text style={styles.cardValue}>{request.vehicleInfo?.make} {request.vehicleInfo?.model} ({request.vehicleInfo?.plateNumber})</Text></Text>
          <Text style={styles.cardText}><Text style={styles.cardLabel}>Pickup Location: </Text><Text style={styles.cardValue}>{request.location?.address || 'GPS Coordinates'}</Text></Text>
          {request.description ? <Text style={styles.cardText}><Text style={styles.cardLabel}>Notes: </Text><Text style={styles.cardValue}>{request.description}</Text></Text> : null}
          <Text style={styles.cardText}><Text style={styles.cardLabel}>Created: </Text><Text style={styles.cardValue}>{new Date(request.createdAt).toLocaleString()}</Text></Text>
        </View>

        {/* Mechanic Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔧 Assigned Mechanic</Text>
          {request.mechanicName || request.mechanicId ? (
            <>
              <Text style={styles.cardText}><Text style={styles.cardLabel}>Name: </Text><Text style={styles.cardValue}>{request.mechanicName || 'Assigned Mechanic'}</Text></Text>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.trackBtn]}
                  onPress={() => {
                    if (navigation && navigation.navigate) {
                      navigation.navigate('LiveTracking', { requestId: request.id });
                    }
                  }}
                >
                  <Text style={styles.btnText}>📍 Track Location</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, styles.chatBtn]}
                  onPress={() => {
                    if (navigation && navigation.navigate) {
                      navigation.navigate('Chat', {
                        requestId: request.id,
                        recipientName: request.mechanic?.fullName || request.mechanicFullName || request.mechanicName,
                        recipientImage: request.mechanic?.profileImage || request.mechanic?.avatarUrl,
                        request,
                      });
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
  emptyText: { color: colors.textMuted },
  statusBox: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  statusValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  cardValue: {
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  pendingText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  smallBtn: { flex: 1, minHeight: 44, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  trackBtn: { backgroundColor: colors.secondary },
  chatBtn: { backgroundColor: colors.primary },
  btnText: { color: colors.white, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm },
  costText: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.success },
  actionSection: { marginTop: spacing.md, marginBottom: spacing.xl },
  mainBtn: { minHeight: 48, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  reviewBtn: { backgroundColor: colors.primary },
  cancelBtn: { backgroundColor: colors.error },
  mainBtnText: { color: colors.white, fontWeight: typography.weights.bold, fontSize: typography.sizes.md },
});
