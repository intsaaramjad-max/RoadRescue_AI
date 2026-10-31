import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

export default function IncomingRequestsScreen({ navigation }) {
  const { userToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState(null);

  const fetchIncoming = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/requests/nearby`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        // Fallback to GET /api/requests?status=PENDING
        const fallbackRes = await fetch(`${API_URL}/requests?status=PENDING`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok) {
          setRequests(fallbackData.requests || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchIncoming();
  }, [fetchIncoming]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIncoming();
  };

  const handleAccept = async (requestId) => {
    setActionId(requestId);
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

  const renderItem = ({ item }) => {
    const isBusy = actionId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceText}>🛠️ {item.serviceType || 'Emergency Assistance'}</Text>
          </View>
          <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <Text style={styles.driverName}>Driver: {item.driverName || 'Vehicle Owner'}</Text>
        <Text style={styles.detailLine}>📍 {item.location?.address || 'Location Shared'}</Text>
        <Text style={styles.detailLine}>🚗 {item.vehicleInfo?.make || 'Vehicle'} {item.vehicleInfo?.model || ''} ({item.vehicleInfo?.plateNumber || 'N/A'})</Text>

        {item.description ? (
          <Text style={styles.descText}>"{item.description}"</Text>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={() => handleAccept(item.id)}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.acceptBtnText}>Accept Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <Header title="Incoming Service Requests" showBack />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptySubtitle}>You're all clear! New requests from drivers nearby will appear here in real-time.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderItem}
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
  listContainer: {
    padding: spacing.md,
  },
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
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border || '#DDD',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  serviceBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  serviceText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  timeText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  driverName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  detailLine: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  descText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    backgroundColor: colors.background,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  actionRow: {
    marginTop: spacing.md,
  },
  btn: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#28A745',
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
});
