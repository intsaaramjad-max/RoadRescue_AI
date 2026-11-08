import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const getStatusLabel = (status) => {
  const labels = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || 'Status unavailable';
};

const getRequestDate = (createdAt) => {
  if (!createdAt) return 'Not available';
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

const getLocationLabel = (location) => {
  if (typeof location === 'string') return location || 'Not available';
  if (location?.address) return location.address;
  if (location?.latitude != null && location?.longitude != null) {
    return 'Coordinates provided; map display is not connected.';
  }
  if (location?.lat != null && location?.lng != null) {
    return 'Coordinates provided; map display is not connected.';
  }
  return 'Not available';
};

const getVehicleName = (request) => {
  const vehicleInfo = request.vehicleInfo || {};
  const makeAndModel = [vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(' ');
  if (makeAndModel) return makeAndModel;
  if (typeof request.vehicleDetails === 'string' && request.vehicleDetails.trim()) {
    return request.vehicleDetails.trim();
  }
  if (request.vehicleDetails && typeof request.vehicleDetails === 'object') {
    const details = request.vehicleDetails;
    const detailsName = [details.make, details.model].filter(Boolean).join(' ');
    if (detailsName) return detailsName;
  }
  return 'Not available';
};

const getRegistrationNumber = (request) => (
  request.vehicleInfo?.plateNumber ||
  request.vehicleInfo?.registrationNumber ||
  (typeof request.vehicleDetails === 'object'
    ? request.vehicleDetails.plateNumber || request.vehicleDetails.registrationNumber
    : null) ||
  'Not available'
);

const getVehicleType = (request) => (
  request.vehicleInfo?.vehicleType ||
  request.vehicleInfo?.type ||
  (typeof request.vehicleDetails === 'object'
    ? request.vehicleDetails.vehicleType || request.vehicleDetails.type
    : null) ||
  'Not available'
);

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not available'}</Text>
    </View>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={19} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function RequestDetailsScreen({ route, navigation }) {
  const requestId = route?.params?.requestId;
  const demoRequest = route?.params?.isDemoRequest ? route.params.request : null;
  const { token, isLoading: authLoading } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [costInput, setCostInput] = useState('');

  const fetchRequestDetails = useCallback(async () => {
    if (demoRequest) {
      setRequest(demoRequest);
      setError('');
      setCostInput(demoRequest.cost != null ? String(demoRequest.cost) : '');
      setLoading(false);
      return;
    }
    if (!requestId) {
      setError('A request ID was not provided.');
      setLoading(false);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load request details.');
      }
      if (!data.request) {
        throw new Error('The request could not be found.');
      }
      setRequest(data.request);
      if (data.request.cost != null) setCostInput(String(data.request.cost));
    } catch (fetchError) {
      console.error(fetchError);
      setRequest(null);
      setError(fetchError.message || 'Unable to load request details. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [demoRequest, requestId, token]);

  useEffect(() => {
    if (!authLoading) fetchRequestDetails();
  }, [authLoading, fetchRequestDetails]);

  const handleUpdateStatus = async (nextStatus) => {
    if (!requestId) {
      setActionError('This request does not have a valid ID.');
      return;
    }
    if (nextStatus === 'COMPLETED' && (!costInput.trim() || !Number.isFinite(Number(costInput)) || Number(costInput) <= 0)) {
      setActionError('Enter a valid service cost greater than zero before completing this request.');
      return;
    }

    setActionError('');
    if (demoRequest) {
      setUpdating(true);
      setRequest((currentRequest) => ({
        ...currentRequest,
        status: nextStatus,
        ...(nextStatus === 'COMPLETED' ? { cost: String(Number(costInput)) } : {}),
      }));
      setUpdating(false);
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update request status.');
      }
      if (data.request) setRequest(data.request);
      else await fetchRequestDetails();
      Alert.alert('Updated', `Request status changed to ${getStatusLabel(nextStatus)}.`);
    } catch (updateError) {
      console.error(updateError);
      setActionError(updateError.message || 'Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <ScreenWrapper>
        <Header title="Request Details" showBack fallbackRoute="Dashboard" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading request details...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!request) {
    return (
      <ScreenWrapper>
        <Header title="Request Details" showBack fallbackRoute="Dashboard" />
        <View style={styles.centerContainer}>
          <View style={styles.stateIcon}>
            <Ionicons name={requestId ? 'cloud-offline-outline' : 'document-text-outline'} size={30} color={colors.textMuted} />
          </View>
          <Text style={styles.stateTitle}>{requestId ? 'Unable to load request' : 'Request unavailable'}</Text>
          <Text style={styles.stateText}>{error || 'Request not found.'}</Text>
          {!!requestId && (
            <TouchableOpacity style={styles.retryButton} onPress={fetchRequestDetails} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenWrapper>
    );
  }

  const status = (request.status || '').toUpperCase();
  const requestDescription = request.description || request.notes || 'Not available';
  const customerLocation = getLocationLabel(request.location);
  const statusStyle = status === 'PENDING'
    ? styles.pendingBadge
    : status === 'ACCEPTED' || status === 'IN_PROGRESS'
      ? styles.activeBadge
      : status === 'COMPLETED'
        ? styles.completedBadge
        : status === 'CANCELLED'
          ? styles.cancelledBadge
          : styles.unknownBadge;
  const statusTextStyle = status === 'PENDING'
    ? styles.pendingText
    : status === 'ACCEPTED' || status === 'IN_PROGRESS'
      ? styles.activeText
      : status === 'COMPLETED'
        ? styles.completedText
        : status === 'CANCELLED'
          ? styles.cancelledText
          : styles.unknownText;

  return (
    <ScreenWrapper>
      <Header title="Request Details" showBack fallbackRoute="Dashboard" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {demoRequest && (
          <View style={styles.demoNotice}>
            <Ionicons name="flask-outline" size={17} color={colors.warning} />
            <Text style={styles.demoNoticeText}>DEMO REQUEST · status changes are local only</Text>
          </View>
        )}
        <View style={styles.statusCard}>
          <View style={styles.statusHeading}>
            <View>
              <Text style={styles.eyebrow}>SERVICE REQUEST</Text>
              <Text style={styles.requestId}>{request.id || requestId}</Text>
            </View>
            <View style={[styles.statusBadge, statusStyle]}>
              <Text style={[styles.statusBadgeText, statusTextStyle]}>{getStatusLabel(status)}</Text>
            </View>
          </View>
        </View>

        <SectionCard icon="document-text-outline" title="Request Information">
          <InfoRow label="Request ID" value={request.id || requestId} />
          <InfoRow label="Service type" value={request.serviceType} />
          <InfoRow label="Requested" value={getRequestDate(request.createdAt)} />
          <View style={styles.descriptionContainer}>
            <Text style={styles.infoLabel}>Problem description</Text>
            <Text style={styles.descriptionText}>{requestDescription}</Text>
          </View>
        </SectionCard>

        <SectionCard icon="person-outline" title="Customer Information">
          <InfoRow label="Customer name" value={request.driverName} />
          {request.driverPhone ? <InfoRow label="Contact number" value={request.driverPhone} /> : null}
          <InfoRow label="Location / address" value={customerLocation} />
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', {
              requestId: request.id || requestId,
              recipientName: request.driverName || request.customerName,
              recipientImage: request.driver?.profileImage || request.customer?.profileImage,
              request,
            })}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.secondary} />
            <Text style={styles.chatButtonText}>Chat with Customer</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard icon="car-outline" title="Vehicle Information">
          <InfoRow label="Make and model" value={getVehicleName(request)} />
          {getRegistrationNumber(request) !== 'Not available' ? (
            <InfoRow label="Registration number" value={getRegistrationNumber(request)} />
          ) : null}
          {getVehicleType(request) !== 'Not available' ? (
            <InfoRow label="Vehicle type" value={getVehicleType(request)} />
          ) : null}
        </SectionCard>

        <SectionCard icon="location-outline" title="Location">
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={28} color={colors.secondary} />
            <Text style={styles.mapTitle}>Map preview unavailable</Text>
            <Text style={styles.mapDescription}>
              {customerLocation === 'Not available'
                ? 'No location details were provided for this request.'
                : `${customerLocation}\nMap and live GPS tracking are not connected on this screen.`}
            </Text>
          </View>
        </SectionCard>

        {status === 'IN_PROGRESS' && (
          <SectionCard icon="cash-outline" title="Service Cost (PKR)">
            <Text style={styles.costHint}>Enter the final service cost before completing the request.</Text>
            <TextInput
              style={styles.costInput}
              placeholder="Enter final service cost"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={costInput}
              onChangeText={setCostInput}
              accessibilityLabel="Final service cost in PKR"
            />
          </SectionCard>
        )}

        {request.cost != null && request.cost !== '' ? (
          <SectionCard icon="receipt-outline" title="Service Bill">
            <Text style={styles.totalCostText}>PKR {request.cost}</Text>
          </SectionCard>
        ) : null}

        {!!actionError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={19} color={colors.error} />
            <Text style={styles.errorText}>{actionError}</Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {updating ? (
            <View style={styles.updatingState}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.stateText}>Updating request...</Text>
            </View>
          ) : (
            <>
              {status === 'PENDING' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => handleUpdateStatus('ACCEPTED')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                  <Text style={styles.primaryActionText}>Accept Request</Text>
                </TouchableOpacity>
              )}
              {status === 'ACCEPTED' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => handleUpdateStatus('IN_PROGRESS')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Ionicons name="construct-outline" size={20} color={colors.white} />
                  <Text style={styles.primaryActionText}>Start Service</Text>
                </TouchableOpacity>
              )}
              {status === 'IN_PROGRESS' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => handleUpdateStatus('COMPLETED')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Ionicons name="checkmark-done-outline" size={20} color={colors.white} />
                  <Text style={styles.primaryActionText}>Complete Service</Text>
                </TouchableOpacity>
              )}
              {status === 'COMPLETED' && (
                <View style={styles.finalStatusBanner}>
                  <Ionicons name="checkmark-circle" size={21} color={colors.success} />
                  <Text style={styles.finalStatusText}>Service completed</Text>
                </View>
              )}
              {status === 'CANCELLED' && (
                <View style={styles.finalStatusBanner}>
                  <Ionicons name="close-circle" size={21} color={colors.error} />
                  <Text style={styles.cancelledFinalText}>This request was cancelled</Text>
                </View>
              )}
            </>
          )}
        </View>
        {status !== 'CANCELLED' && (
          <TouchableOpacity
            style={styles.trackingButton}
            onPress={() => navigation.navigate('Tracking', {
              requestId: request.id || requestId,
              isDemoRequest: Boolean(demoRequest),
              request,
            })}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Ionicons name="navigate-outline" size={19} color={colors.secondary} />
            <Text style={styles.trackingButtonText}>Open Service Tracking</Text>
          </TouchableOpacity>
        )}
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
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  demoNoticeText: {
    flex: 1,
    color: colors.warning,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stateTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  stateText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.8,
  },
  requestId: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  statusBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  pendingBadge: { backgroundColor: 'rgba(245, 158, 11, 0.16)' },
  pendingText: { color: colors.warning },
  activeBadge: { backgroundColor: 'rgba(59, 130, 246, 0.18)' },
  activeText: { color: colors.secondary },
  completedBadge: { backgroundColor: 'rgba(16, 185, 129, 0.16)' },
  completedText: { color: colors.success },
  cancelledBadge: { backgroundColor: 'rgba(239, 68, 68, 0.16)' },
  cancelledText: { color: colors.error },
  unknownBadge: { backgroundColor: colors.background },
  unknownText: { color: colors.textMuted },
  sectionCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  infoLabel: {
    flex: 0.42,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 19,
  },
  infoValue: {
    flex: 0.58,
    color: colors.text,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    textAlign: 'right',
  },
  descriptionContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  descriptionText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: borderRadius.md,
  },
  chatButtonText: {
    color: colors.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.xs,
  },
  mapPlaceholder: {
    minHeight: 142,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  mapTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm,
  },
  mapDescription: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  costHint: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  costInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalCostText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginLeft: spacing.sm,
  },
  actionsContainer: { marginTop: spacing.xs },
  actionButton: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryAction: { backgroundColor: colors.primary },
  primaryActionText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.sm,
  },
  updatingState: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  finalStatusText: {
    color: colors.success,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
    marginLeft: spacing.sm,
  },
  cancelledFinalText: {
    color: colors.error,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
    marginLeft: spacing.sm,
  },
  trackingButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  trackingButtonText: {
    color: colors.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
});
