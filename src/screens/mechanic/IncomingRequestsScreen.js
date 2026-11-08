import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const requestFilters = ['All', 'Pending', 'Accepted', 'Completed'];

const demoRequests = [
  {
    id: 'DEMO-SR-001',
    isDemoRequest: true,
    status: 'PENDING',
    driverName: 'Ayesha Khan (Demo)',
    serviceType: 'Flat Tire',
    notes: 'Front passenger-side tire is losing air and needs roadside assistance.',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    location: { address: 'Model Town, Lahore (Demo location)' },
    vehicleInfo: { make: 'Toyota', model: 'Corolla', plateNumber: 'DEMO-001', vehicleType: 'Sedan' },
    distance: 'Not available',
  },
  {
    id: 'DEMO-SR-002',
    isDemoRequest: true,
    status: 'PENDING',
    driverName: 'Hamza Ali (Demo)',
    serviceType: 'Battery Assistance',
    notes: 'Vehicle will not start; dashboard lights come on but engine does not crank.',
    createdAt: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    location: { address: 'Gulberg III, Lahore (Demo location)' },
    vehicleInfo: { make: 'Honda', model: 'Civic', plateNumber: 'DEMO-002', vehicleType: 'Sedan' },
    distance: 'Not available',
  },
  {
    id: 'DEMO-SR-003',
    isDemoRequest: true,
    status: 'PENDING',
    driverName: 'Sara Ahmed (Demo)',
    serviceType: 'Engine Trouble',
    notes: 'Engine temperature warning appeared; vehicle is safely parked roadside.',
    createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    location: { address: 'Johar Town, Lahore (Demo location)' },
    vehicleInfo: { make: 'Suzuki', model: 'Swift', plateNumber: 'DEMO-003', vehicleType: 'Hatchback' },
    distance: 'Not available',
  },
];

const getRequestId = (request) => request.id || request._id;

const getRequestStatus = (request) => (request.status || '').toUpperCase();

const getRequestLocation = (location) => {
  if (typeof location === 'string') return location || 'Not available';
  return location?.address || 'Not available';
};

const getVehicleName = (request) => {
  const vehicleName = [request.vehicleInfo?.make, request.vehicleInfo?.model]
    .filter(Boolean)
    .join(' ');
  return vehicleName || request.vehicleDetails || 'Not available';
};

const getDistance = (request) => {
  const distance = request.distance ?? request.distanceKm ?? request.distanceMiles;
  if (distance === undefined || distance === null || distance === '') return 'Not available';
  if (request.distanceKm !== undefined) return `${distance} km`;
  if (request.distanceMiles !== undefined) return `${distance} mi`;
  return String(distance);
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

const getStatusLabel = (status) => {
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (!status) return 'Status unavailable';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const matchesFilter = (request, filter) => {
  if (filter === 'All') return true;
  const status = getRequestStatus(request);
  if (filter === 'Accepted') return status === 'ACCEPTED' || status === 'IN_PROGRESS';
  return status === filter.toUpperCase();
};

export default function IncomingRequestsScreen({ navigation }) {
  const { token } = useAuth();
  const userToken = token;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [error, setError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchIncoming = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/requests/nearby`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.requests) && data.requests.length > 0) {
        setRequests(data.requests);
        setIsDemoMode(false);
      } else {
        // Fallback to GET /api/requests?status=PENDING
        const fallbackRes = await fetch(`${API_URL}/requests?status=PENDING`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && Array.isArray(fallbackData.requests) && fallbackData.requests.length > 0) {
          setRequests(fallbackData.requests);
          setIsDemoMode(false);
        } else {
          setRequests(demoRequests);
          setIsDemoMode(true);
        }
      }
    } catch (err) {
      console.error(err);
      setRequests(demoRequests);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchIncoming();
  }, [fetchIncoming]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIncoming();
  };

  const handleAccept = async (requestId) => {
    if (!requestId) {
      Alert.alert('Unable to accept request', 'This request does not have a valid ID.');
      return;
    }
    setActionId(requestId);
    const request = requests.find((item) => getRequestId(item) === requestId);
    if (request?.isDemoRequest) {
      setRequests((currentRequests) => currentRequests.map((item) => (
        getRequestId(item) === requestId ? { ...item, status: 'ACCEPTED' } : item
      )));
      setActionId(null);
      Alert.alert('Demo request accepted', 'This demo status was changed locally only. No API request was sent.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Request Accepted! 🎉', 'You are now assigned to this job.', [
          {
            text: 'View Job Details',
            onPress: () => {
              if (navigation && navigation.navigate) {
                navigation.navigate('RequestDetails', { requestId });
              }
            }
          }
        ]);
        fetchIncoming();
      } else {
        Alert.alert('Error', data.message || 'Could not accept request');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Reject unavailable',
      'The current API does not provide a mechanic rejection action. No request changes were made.'
    );
  };

  const openRequestDetails = (request) => {
    const requestId = getRequestId(request);
    if (!requestId) {
      Alert.alert('Details unavailable', 'This request does not have a valid ID.');
      return;
    }
    navigation.navigate('RequestDetails', {
      requestId,
      ...(request.isDemoRequest ? { isDemoRequest: true, request } : {}),
    });
  };

  const renderItem = ({ item }) => {
    const requestId = getRequestId(item);
    const status = getRequestStatus(item);
    const isPending = status === 'PENDING';
    const isBusy = actionId === requestId;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceText}>{item.serviceType || 'Service type unavailable'}</Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(status)]}>
            <Text style={[styles.statusText, getStatusTextStyle(status)]}>{getStatusLabel(status)}</Text>
          </View>
        </View>

        <Text style={styles.driverName}>{item.driverName || 'Customer name not available'}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vehicle</Text>
          <Text style={styles.detailValue}>{getVehicleName(item)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Problem / Service</Text>
          <Text style={styles.detailValue}>{item.serviceType || item.notes || 'Not available'}</Text>
        </View>
        {item.notes && item.serviceType ? (
          <Text style={styles.notesText}>{item.notes}</Text>
        ) : null}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{getRequestLocation(item.location)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{getDistance(item)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Requested</Text>
          <Text style={styles.detailValue}>{formatDateTime(item.createdAt)}</Text>
        </View>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn]}
              onPress={() => handleAccept(requestId)}
              disabled={isBusy}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Accept request"
            >
              {isBusy ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.acceptBtnText}>Accept</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={handleReject}
              disabled={isBusy}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Reject request"
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => openRequestDetails(item)}
          activeOpacity={0.75}
          accessibilityRole="button"
          disabled={!requestId}
        >
          <Text style={styles.detailsBtnText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const filteredRequests = requests.filter((request) => matchesFilter(request, selectedFilter));

  return (
    <ScreenWrapper>
      <Header title="Incoming Requests" showBack fallbackRoute="Dashboard" />
      {isDemoMode && (
        <View style={styles.demoNotice}>
          <Ionicons name="flask-outline" size={17} color={colors.warning} />
          <View style={styles.demoNoticeTextContainer}>
            <Text style={styles.demoNoticeTitle}>DEMO REQUESTS</Text>
            <Text style={styles.demoNoticeSubtitle}>Sample data for interface testing only; not real customer requests.</Text>
          </View>
        </View>
      )}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {requestFilters.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, isSelected && styles.filterTabSelected]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.75}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateSubtitle}>Loading requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={42} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Couldn't load requests</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchIncoming} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="file-tray-outline" size={42} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No {selectedFilter === 'All' ? '' : selectedFilter.toLowerCase() + ' '}requests</Text>
          <Text style={styles.stateSubtitle}>
            {selectedFilter === 'All'
              ? 'Requests will appear here when available.'
              : `There are no ${selectedFilter.toLowerCase()} requests in the loaded list.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item, index) => String(getRequestId(item) || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  demoNoticeTextContainer: { flex: 1, marginLeft: spacing.sm },
  demoNoticeTitle: {
    color: colors.warning,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.6,
  },
  demoNoticeSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  filtersContainer: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  filterTextSelected: { color: colors.white },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stateSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  serviceBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.16)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    maxWidth: '62%',
  },
  serviceText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  pendingBadge: { backgroundColor: 'rgba(245, 158, 11, 0.16)' },
  pendingStatusText: { color: colors.warning },
  acceptedBadge: { backgroundColor: 'rgba(59, 130, 246, 0.18)' },
  acceptedStatusText: { color: colors.secondary },
  completedBadge: { backgroundColor: 'rgba(16, 185, 129, 0.16)' },
  completedStatusText: { color: colors.success },
  neutralBadge: { backgroundColor: colors.background },
  neutralStatusText: { color: colors.textMuted },
  driverName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    flex: 0.42,
  },
  detailValue: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    flex: 0.58,
    textAlign: 'right',
  },
  notesText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },
  acceptBtnText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  rejectBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.xs,
  },
  rejectBtnText: {
    color: colors.text,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  detailsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  detailsBtnText: {
    color: colors.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginRight: spacing.xs,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  retryBtnText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});

function getStatusStyle(status) {
  if (status === 'PENDING') return styles.pendingBadge;
  if (status === 'ACCEPTED' || status === 'IN_PROGRESS') return styles.acceptedBadge;
  if (status === 'COMPLETED') return styles.completedBadge;
  return styles.neutralBadge;
}

function getStatusTextStyle(status) {
  if (status === 'PENDING') return styles.pendingStatusText;
  if (status === 'ACCEPTED' || status === 'IN_PROGRESS') return styles.acceptedStatusText;
  if (status === 'COMPLETED') return styles.completedStatusText;
  return styles.neutralStatusText;
}
