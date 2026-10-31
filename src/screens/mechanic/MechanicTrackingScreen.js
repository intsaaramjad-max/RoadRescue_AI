import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function MechanicTrackingScreen({ route, navigation }) {
  const requestId = route?.params?.requestId;
  const { userToken } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState('12 mins');

  const fetchTracking = useCallback(async () => {
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [requestId, userToken]);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000); // Poll every 10 sec for live tracking
    return () => clearInterval(interval);
  }, [fetchTracking]);

  if (loading) {
    return (
      <ScreenWrapper>
        <Header title="Live Mechanic Tracking" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.mapArea}>
          <View style={styles.mapPattern} />
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>ROUTE TO DRIVER</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={fetchTracking}>
              <Ionicons name="refresh" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.routeLine} />
          <View style={[styles.mapMarker, styles.mechanicMarker]}>
            <Ionicons name="person" size={18} color="#FFF" />
          </View>
          <View style={[styles.mapMarker, styles.destinationMarker]}>
            <Ionicons name="location" size={20} color="#FFF" />
          </View>
          <View style={styles.mapLabelMechanic}>
            <Text style={styles.mapLabelText}>You</Text>
          </View>
          <View style={styles.mapLabelDestination}>
            <Text style={styles.mapLabelText}>Driver location</Text>
          </View>

          <View style={styles.etaPill}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <View>
              <Text style={styles.etaCaption}>ARRIVING IN</Text>
              <Text style={styles.etaValue}>{eta}</Text>
            </View>
          </View>
        </View>

        {/* Tracking details */}
        <View style={styles.mapContainer}>
          <View style={styles.mechanicHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View style={styles.mechanicMeta}>
              <Text style={styles.mechanicName}>
                {request?.driverName || 'Assigned Driver'}
              </Text>
              <Text style={styles.serviceType}>
                {request?.serviceType || 'Emergency Repair'}
              </Text>
            </View>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>{request?.status || 'EN ROUTE'}</Text>
            </View>
          </View>

          <View style={styles.destinationRow}>
            <Ionicons name="navigate-outline" size={19} color={colors.primary} />
            <View style={styles.destinationMeta}>
              <Text style={styles.destinationCaption}>DRIVER LOCATION</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {request?.location?.address || 'Location not available'}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.routeStatus}>You are on the way to the driver</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.chatBtn]}
              onPress={() => {
                navigation.navigate('Chat', {
                  requestId: request?.id || requestId,
                  recipientName: request?.driverName || 'Driver',
                });
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>Chat Driver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.callBtn]}
              onPress={async () => {
                const phone = request?.driverPhone;
                if (!phone) {
                  Alert.alert('Phone unavailable', 'This driver has not shared a phone number.');
                  return;
                }
                const phoneUrl = `tel:${phone}`;
                try {
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.location.href = phoneUrl;
                  } else if (await Linking.canOpenURL(phoneUrl)) {
                    await Linking.openURL(phoneUrl);
                  } else {
                    Alert.alert('Calling unavailable', 'This device cannot place phone calls.');
                  }
                } catch (error) {
                  Alert.alert('Calling unavailable', 'This device cannot place phone calls.');
                }
              }}
            >
              <Ionicons name="call" size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>Call Driver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapArea: {
    flex: 1,
    minHeight: 390,
    backgroundColor: '#D8E5E1',
    overflow: 'hidden',
    position: 'relative',
  },
  mapPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
    backgroundColor: '#C7D8D2',
    borderWidth: 18,
    borderColor: '#E6EFEB',
    transform: [{ rotate: '-12deg' }, { scale: 1.4 }],
  },
  topBar: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.88)',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.88)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 7,
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  routeLine: {
    position: 'absolute',
    width: '78%',
    height: 5,
    left: '13%',
    top: '51%',
    borderRadius: 4,
    backgroundColor: colors.primary,
    transform: [{ rotate: '-23deg' }],
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  mapMarker: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    elevation: 5,
  },
  mechanicMarker: {
    left: '18%',
    top: '58%',
    backgroundColor: '#0F766E',
  },
  destinationMarker: {
    right: '16%',
    top: '31%',
    backgroundColor: '#DC2626',
  },
  mapLabelMechanic: {
    position: 'absolute',
    left: '11%',
    top: '71%',
  },
  mapLabelDestination: {
    position: 'absolute',
    right: '9%',
    top: '44%',
  },
  mapLabelText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: typography.weights.bold,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  etaPill: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  etaCaption: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  etaValue: {
    color: '#0F172A',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 1,
  },
  mapContainer: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -18,
    zIndex: 2,
    elevation: 8,
  },
  mechanicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  mechanicMeta: {
    flex: 1,
  },
  mechanicName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  serviceType: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  statusChip: {
    backgroundColor: 'rgba(16,185,129,0.14)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusChipText: {
    color: '#34D399',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  locationText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    marginTop: 3,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  destinationMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  destinationCaption: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#334155',
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    width: '62%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  routeStatus: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    alignItems: 'center',
  },
  chatBtn: {
    backgroundColor: colors.primary,
  },
  callBtn: {
    backgroundColor: '#28A745',
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
});
