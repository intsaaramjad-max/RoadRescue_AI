import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

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

const getLocationLabel = (location) => {
  if (typeof location === 'string') return location || 'Not available';
  return location?.address || 'Not available';
};

const getVehicleLabel = (request) => {
  const vehicle = request?.vehicleInfo || {};
  const makeAndModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
  if (makeAndModel) return makeAndModel;
  if (typeof request?.vehicleDetails === 'string' && request.vehicleDetails.trim()) {
    return request.vehicleDetails.trim();
  }
  if (request?.vehicleDetails && typeof request.vehicleDetails === 'object') {
    const details = request.vehicleDetails;
    return [details.make, details.model].filter(Boolean).join(' ') || 'Not available';
  }
  return 'Not available';
};

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={17} color={colors.secondary} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not available'}</Text>
      </View>
    </View>
  );
}

export default function MechanicTrackingScreen({ route, navigation }) {
  const requestId = route?.params?.requestId;
  const demoRequest = route?.params?.isDemoRequest ? route.params.request : null;
  const { token, isLoading: authLoading } = useAuth();

  const [request, setRequest] = useState(demoRequest || null);
  const [loading, setLoading] = useState(!demoRequest);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchTracking = useCallback(async () => {
    if (demoRequest) {
      setRequest(demoRequest);
      setError('');
      setLoading(false);
      return;
    }
    if (!requestId) {
      setRequest(null);
      setError('No request ID was provided. Open tracking from a service request.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.request) {
        throw new Error(data.message || 'Unable to load this service request.');
      }
      setRequest(data.request);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || 'Network error while loading service details.');
    } finally {
      setLoading(false);
    }
  }, [demoRequest, requestId, token]);

  useEffect(() => {
    if (!authLoading) fetchTracking();
  }, [authLoading, fetchTracking]);

  const updateServiceStatus = async (nextStatus) => {
    if (!requestId) {
      setError('This request does not have a valid ID.');
      return;
    }

    setUpdating(true);
    setError('');
    if (demoRequest) {
      setRequest((currentRequest) => ({ ...currentRequest, status: nextStatus }));
      setUpdating(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Could not update service status.');
      }
      if (data.request) setRequest(data.request);
      else await fetchTracking();
    } catch (updateError) {
      console.error(updateError);
      setError(updateError.message || 'Network error while updating service status.');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <ScreenWrapper>
        <Header title="Service Tracking" showBack fallbackRoute="Dashboard" />
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateMessage}>Loading service details...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!request) {
    return (
      <ScreenWrapper>
        <Header title="Service Tracking" showBack fallbackRoute="Dashboard" />
        <View style={styles.stateContainer}>
          <View style={styles.stateIcon}>
            <Ionicons name={requestId ? 'cloud-offline-outline' : 'document-text-outline'} size={30} color={colors.textMuted} />
          </View>
          <Text style={styles.stateTitle}>{requestId ? 'Tracking unavailable' : 'No service selected'}</Text>
          <Text style={styles.stateMessage}>{error || 'Request details are not available.'}</Text>
          {!!requestId && (
            <TouchableOpacity style={styles.retryButton} onPress={fetchTracking} activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenWrapper>
    );
  }

  const status = (request.status || '').toUpperCase();
  const location = getLocationLabel(request.location);
  const isDemo = Boolean(demoRequest);
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
  const nextStatus = status === 'PENDING'
    ? 'ACCEPTED'
    : status === 'ACCEPTED'
      ? 'IN_PROGRESS'
      : status === 'IN_PROGRESS'
        ? 'COMPLETED'
        : null;
  const actionLabel = status === 'PENDING'
    ? 'Update Service Status · Accept'
    : status === 'ACCEPTED'
      ? 'Start Service'
      : status === 'IN_PROGRESS'
        ? 'Complete Service'
        : null;

  return (
    <ScreenWrapper>
      <Header title="Service Tracking" showBack fallbackRoute="Dashboard" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.requestHeader}>
          <View style={styles.requestHeaderText}>
            <Text style={styles.eyebrow}>REQUEST</Text>
            <Text style={styles.requestId}>{request.id || requestId || 'Not available'}</Text>
          </View>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={[styles.statusText, statusTextStyle]}>{getStatusLabel(status)}</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeading}>
            <View style={styles.mapTitleGroup}>
              <Ionicons name="map-outline" size={19} color={colors.secondary} />
              <Text style={styles.mapTitle}>Route Overview</Text>
            </View>
            <View style={styles.demoMapBadge}>
              <Text style={styles.demoMapText}>DEMO MAP</Text>
            </View>
          </View>
          <View style={styles.mapArea}>
            <View style={styles.mapGrid} />
            <View style={styles.roadOne} />
            <View style={styles.roadTwo} />
            <View style={styles.routeLine} />
            <View style={[styles.mapMarker, styles.mechanicMarker]}>
              <Ionicons name="construct" size={17} color={colors.white} />
            </View>
            <View style={[styles.mapMarker, styles.customerMarker]}>
              <Ionicons name="location" size={18} color={colors.white} />
            </View>
            <View style={styles.mechanicLabel}>
              <Text style={styles.markerLabelText}>Mechanic · location unavailable</Text>
            </View>
            <View style={styles.customerLabel}>
              <Text style={styles.markerLabelText}>Customer · address only</Text>
            </View>
          </View>
          <Text style={styles.mapDisclaimer}>
            Illustrative map only. GPS, live positions, and turn-by-turn routing are not connected.
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="resize-outline" size={18} color={colors.secondary} />
            </View>
            <Text style={styles.metricCaption}>DISTANCE</Text>
            <Text style={styles.metricValue}>{isDemo ? '3.2 km' : 'Not available'}</Text>
            {isDemo && <Text style={styles.metricDemo}>Demo value</Text>}
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.metricCaption}>EST. ARRIVAL</Text>
            <Text style={styles.metricValue}>{isDemo ? '12 min' : 'Not available'}</Text>
            {isDemo && <Text style={styles.metricDemo}>Demo value</Text>}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person-outline" size={19} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Customer & Service</Text>
          </View>
          <InfoRow icon="person-outline" label="Customer" value={request.driverName} />
          <InfoRow icon="car-outline" label="Vehicle" value={getVehicleLabel(request)} />
          <InfoRow icon="construct-outline" label="Service type" value={request.serviceType} />
          <InfoRow icon="location-outline" label="Customer location" value={location} />
          {request.driverPhone ? (
            <InfoRow icon="call-outline" label="Contact" value={request.driverPhone} />
          ) : null}
          <View style={styles.communicationRow}>
            <TouchableOpacity
              style={[styles.communicationButton, styles.chatButton]}
              onPress={() => navigation.navigate('Chat', {
                requestId: request.id || requestId,
                recipientName: request.driverName || 'Customer',
                recipientImage: request.driver?.profileImage || request.customer?.profileImage,
                request,
              })}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.white} />
              <Text style={styles.communicationText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.communicationButton, styles.callButton]}
              onPress={() => Alert.alert(
                'Calling unavailable',
                'Voice calling is not connected in this app yet.'
              )}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Ionicons name="call-outline" size={18} color={colors.text} />
              <Text style={styles.callText}>Call unavailable</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={19} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {updating ? (
          <View style={styles.updatingState}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.updatingText}>Updating service status...</Text>
          </View>
        ) : nextStatus ? (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Service Actions</Text>
            <Text style={styles.actionsDescription}>
              {isDemo
                ? 'Demo request changes stay on this screen and are not sent to the server.'
                : 'Status changes are saved through the existing service API.'}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => updateServiceStatus(nextStatus)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Ionicons name={nextStatus === 'COMPLETED' ? 'checkmark-done-outline' : 'construct-outline'} size={19} color={colors.white} />
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.finalStatusCard}>
            <Ionicons
              name={status === 'COMPLETED' ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={22}
              color={status === 'COMPLETED' ? colors.success : colors.textMuted}
            />
            <Text style={styles.finalStatusText}>
              {status === 'COMPLETED' ? 'Service completed' : status === 'CANCELLED' ? 'This request was cancelled' : 'No service action is available for this status.'}
            </Text>
          </View>
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
  stateContainer: {
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
  stateMessage: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    textAlign: 'center',
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  requestHeaderText: { flex: 1 },
  eyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.8,
  },
  requestId: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  statusText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
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
  mapCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  mapHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mapTitleGroup: { flexDirection: 'row', alignItems: 'center' },
  mapTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.sm,
  },
  demoMapBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  demoMapText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  mapArea: {
    height: 245,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#DDE8E4',
    position: 'relative',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.48,
    backgroundColor: '#CADBD4',
    borderWidth: 18,
    borderColor: '#ECF2EF',
    transform: [{ rotate: '-9deg' }, { scale: 1.35 }],
  },
  roadOne: {
    position: 'absolute',
    left: '-6%',
    top: '34%',
    width: '120%',
    height: 15,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#F8FAFC',
    backgroundColor: '#BBCBC5',
    transform: [{ rotate: '18deg' }],
  },
  roadTwo: {
    position: 'absolute',
    left: '50%',
    top: '-15%',
    width: 13,
    height: '135%',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#F8FAFC',
    backgroundColor: '#BBCBC5',
    transform: [{ rotate: '27deg' }],
  },
  routeLine: {
    position: 'absolute',
    left: '22%',
    top: '50%',
    width: '55%',
    height: 4,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    transform: [{ rotate: '-20deg' }],
  },
  mapMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  mechanicMarker: { left: '16%', top: '55%', backgroundColor: colors.secondary },
  customerMarker: { right: '16%', top: '25%', backgroundColor: colors.primary },
  mechanicLabel: { position: 'absolute', left: '5%', top: '77%' },
  customerLabel: { position: 'absolute', right: '4%', top: '45%' },
  markerLabelText: {
    color: colors.background,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  mapDisclaimer: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricCaption: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.6,
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  metricDemo: { color: colors.warning, fontSize: 10, marginTop: 2 },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  infoIcon: { width: 27, alignItems: 'flex-start' },
  infoTextContainer: { flex: 1 },
  infoLabel: { color: colors.textMuted, fontSize: 10 },
  infoValue: { color: colors.text, fontSize: typography.sizes.sm, marginTop: 2 },
  communicationRow: { flexDirection: 'row', marginTop: spacing.sm },
  communicationButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: { backgroundColor: colors.primary, marginRight: spacing.xs },
  callButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.xs,
  },
  communicationText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.xs,
  },
  callText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.xs,
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
  actionsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionsTitle: { color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  actionsDescription: { color: colors.textMuted, fontSize: typography.sizes.xs, lineHeight: 18, marginTop: spacing.xs },
  primaryButton: {
    minHeight: 48,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  primaryButtonText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, marginLeft: spacing.sm },
  updatingState: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  updatingText: { color: colors.textMuted, fontSize: typography.sizes.sm, marginLeft: spacing.sm },
  finalStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  finalStatusText: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginLeft: spacing.sm },
});
