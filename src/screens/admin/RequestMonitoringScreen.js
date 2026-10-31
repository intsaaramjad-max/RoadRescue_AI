import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

export default function RequestMonitoringScreen({ navigation }) {
  const { userToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL | PENDING | ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED
  const [search, setSearch] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      let url = `${API_URL}/admin/requests`;
      if (filter !== 'ALL') {
        url += `?status=${filter}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch requests');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error');
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
    const query = search.toLowerCase();
    return (
      (r.id && r.id.toLowerCase().includes(query)) ||
      (r.serviceType && r.serviceType.toLowerCase().includes(query)) ||
      (r.driverName && r.driverName.toLowerCase().includes(query)) ||
      (r.mechanicName && r.mechanicName.toLowerCase().includes(query))
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
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

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.requestId}>Request #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.serviceType}>🛠️ {item.serviceType || 'Roadside Assistance'}</Text>
          <Text style={styles.infoLine}>📍 Location: {item.location?.address || `${item.location?.latitude?.toFixed(4)}, ${item.location?.longitude?.toFixed(4)}` || 'N/A'}</Text>
          <Text style={styles.infoLine}>🚗 Vehicle: {item.vehicleInfo?.make || 'Unknown'} {item.vehicleInfo?.model || ''} ({item.vehicleInfo?.plateNumber || 'No Plate'})</Text>
          <Text style={styles.infoLine}>👤 Driver ID: {item.driverId}</Text>
          <Text style={styles.infoLine}>🔧 Mechanic: {item.mechanicName || item.mechanicId || 'Not Assigned'}</Text>
          {item.cost && <Text style={styles.costText}>💰 Cost: PKR {item.cost}</Text>}
          <Text style={styles.dateText}>📅 Created: {new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <Header title="All Requests Monitor" showBack />

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
        {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((tab) => (
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
      ) : filteredRequests.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No service requests match your criteria.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listContainer}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
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
