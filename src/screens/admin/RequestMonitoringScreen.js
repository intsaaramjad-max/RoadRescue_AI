import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const getLocationLabel = (location) => {
  if (!location) return 'Not provided';
  if (typeof location === 'string') return location;
  if (location.address) return location.address;

  const latitude = Number(location.latitude ?? location.lat);
  const longitude = Number(location.longitude ?? location.lng ?? location.lon);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
  return 'Not provided';
};

const getDateLabel = (dateValue) => {
  if (!dateValue) return 'Not available';
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

export default function RequestMonitoringScreen() {
  const { token: userToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      if (!userToken) {
        setRequests([]);
        setError('Your admin session is missing. Please sign in again.');
        return;
      }

      const query = filter === 'ALL' ? '' : `?status=${filter}`;
      const url = `${API_URL}/admin/requests${query}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        if (!Array.isArray(data.requests)) {
          throw new Error('The server returned an invalid request list.');
        }
        setRequests(data.requests);
        setError(null);
      } else {
        setRequests([]);
        setError(data.message || `Failed to fetch requests (${response.status})`);
      }
    } catch (requestError) {
      setRequests([]);
      setError(requestError.message || 'Unable to load service requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, filter]);

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const filteredRequests = requests.filter(r => {
    if (!search.trim()) return true;
    const query = search.trim().toLocaleLowerCase();
    return [r.id, r._id, r.serviceType, r.driverName, r.driverId, r.mechanicName, r.mechanicId]
      .some(value => String(value || '').toLocaleLowerCase().includes(query));
  });

  const getStatusColor = (status) => {
    switch (String(status || '').toUpperCase()) {
      case 'PENDING': return { bg: '#FFF3CD', text: '#856404' };
      case 'ACCEPTED': return { bg: '#CCE5FF', text: '#004085' };
      case 'IN_PROGRESS': return { bg: '#D1ECF1', text: '#0C5460' };
      case 'COMPLETED': return { bg: '#D4EDDA', text: '#155724' };
      case 'CANCELLED': return { bg: '#F8D7DA', text: '#721C24' };
      default: return { bg: '#E2E3E5', text: '#383D41' };
    }
  };

  const renderRequestItem = ({ item }) => {
    const statusStyle = getStatusColor(item.status);
    const vehicle = item.vehicleDetails || item.vehicleInfo;
    const vehicleLabel = typeof vehicle === 'string'
      ? vehicle
      : vehicle
        ? [vehicle.make, vehicle.model, vehicle.plateNumber].filter(Boolean).join(' ')
        : 'Not provided';
    const requestId = item.id || item._id || 'Unavailable';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.requestId}>Request #{requestId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{String(item.status || 'UNKNOWN').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.serviceType}>{item.serviceType || 'Service not specified'}</Text>
          <Text style={styles.infoLine}>Location: {getLocationLabel(item.location)}</Text>
          <Text style={styles.infoLine}>Vehicle: {vehicleLabel}</Text>
          <Text style={styles.infoLine}>Driver: {item.driverName || 'Name unavailable'}{item.driverId ? ` (${item.driverId})` : ''}</Text>
          <Text style={styles.infoLine}>Mechanic: {item.mechanicName || (item.mechanicId ? 'Name unavailable' : 'Not assigned')}{item.mechanicId ? ` (${item.mechanicId})` : ''}</Text>
          {item.cost !== null && item.cost !== undefined && item.cost !== '' && (
            <Text style={styles.costText}>Cost: PKR {item.cost}</Text>
          )}
          <Text style={styles.dateText}>Created: {getDateLabel(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <Header title="All Requests Monitor" />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID, driver, mechanic, service..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {['ALL', 'PENDING', 'ACTIVE', 'COMPLETED'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.activeFilterChip]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterText, filter === tab && styles.activeFilterText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchRequests();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          renderItem={renderRequestItem}
          contentContainerStyle={[styles.listContainer, !filteredRequests.length && styles.emptyListContainer]}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {requests.length
                ? 'No service requests match your search.'
                : 'No service requests are currently available.'}
            </Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border || '#DDD',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border || '#DDD',
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  activeFilterText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
  },
  listContainer: {
    padding: spacing.md,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requestId: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  cardBody: {
    gap: 4,
  },
  serviceType: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: 4,
  },
  infoLine: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  costText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#28A745',
    marginTop: 4,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
