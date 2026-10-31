import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Image, Modal
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

export default function VerificationManagementScreen() {
  const { userToken } = useAuth();
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('PENDING'); // PENDING | ALL | APPROVED | REJECTED
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifications = useCallback(async () => {
    try {
      let url = `${API_URL}/admin/users?role=MECHANIC`;
      if (filter !== 'ALL') {
        url += `&status=${filter}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMechanics(data.users || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch verification requests');
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
    fetchVerifications();
  }, [fetchVerifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVerifications();
  };

  const handleVerify = async (mechanicId, status) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${mechanicId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ verificationStatus: status }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', `Mechanic ${status.toLowerCase()} successfully!`);
        setModalVisible(false);
        fetchVerifications();
      } else {
        Alert.alert('Error', data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const renderMechanicItem = ({ item }) => {
    const isPending = item.verificationStatus === 'PENDING';
    const isApproved = item.verificationStatus === 'APPROVED';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedMechanic(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.fullName || item.email || 'M')[0].toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{item.fullName || 'Unnamed Mechanic'}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.phone}>{item.phone || 'No phone provided'}</Text>
          </View>
          <View style={[
            styles.badge,
            isApproved ? styles.badgeApproved : isPending ? styles.badgePending : styles.badgeRejected
          ]}>
            <Text style={[
              styles.badgeText,
              isApproved ? styles.textApproved : isPending ? styles.textPending : styles.textRejected
            ]}>
              {item.verificationStatus || 'PENDING'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.docCount}>
            📄 Documents: {item.documents ? item.documents.length : 0} uploaded
          </Text>
          <Text style={styles.detailBtnText}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <Header title="Mechanic Verifications" showBack />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.activeTab]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : mechanics.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No mechanic verification requests found.</Text>
        </View>
      ) : (
        <FlatList
          data={mechanics}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderMechanicItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        />
      )}

      {/* Detail & Action Modal */}
      {selectedMechanic && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Verification Details</Text>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalLabel}>Name: <Text style={styles.modalVal}>{selectedMechanic.fullName}</Text></Text>
                <Text style={styles.modalLabel}>Email: <Text style={styles.modalVal}>{selectedMechanic.email}</Text></Text>
                <Text style={styles.modalLabel}>Phone: <Text style={styles.modalVal}>{selectedMechanic.phone || 'N/A'}</Text></Text>
                <Text style={styles.modalLabel}>CNIC: <Text style={styles.modalVal}>{selectedMechanic.cnic || 'N/A'}</Text></Text>
                <Text style={styles.modalLabel}>Status: <Text style={styles.modalVal}>{selectedMechanic.verificationStatus}</Text></Text>

                <Text style={[styles.modalTitle, { fontSize: typography.sizes.md, marginTop: spacing.md }]}>Uploaded Documents</Text>

                {(!selectedMechanic.documents || selectedMechanic.documents.length === 0) ? (
                  <Text style={styles.emptyText}>No documents attached.</Text>
                ) : (
                  selectedMechanic.documents.map((doc, idx) => (
                    <View key={idx} style={styles.docBox}>
                      <Text style={styles.docTitle}>{doc.type || `Document #${idx + 1}`}</Text>
                      {doc.url ? (
                        <Image source={{ uri: doc.url }} style={styles.docImage} resizeMode="cover" />
                      ) : (
                        <Text style={styles.emptyText}>No image preview</Text>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleVerify(selectedMechanic.id, 'REJECTED')}
                    >
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleVerify(selectedMechanic.id, 'APPROVED')}
                    >
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  activeTabText: {
    color: '#FFF',
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
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  email: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  phone: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgePending: { backgroundColor: '#FFF3CD' },
  badgeApproved: { backgroundColor: '#D4EDDA' },
  badgeRejected: { backgroundColor: '#F8D7DA' },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  textPending: { color: '#856404' },
  textApproved: { color: '#155724' },
  textRejected: { color: '#721C24' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#EEE',
  },
  docCount: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  detailBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalScroll: {
    marginVertical: spacing.sm,
  },
  modalLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  modalVal: {
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  docBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  docTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  docImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: '#28A745' },
  rejectBtn: { backgroundColor: '#DC3545' },
  actionBtnText: { color: '#FFF', fontWeight: typography.weights.bold },
  closeBtn: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  closeBtnText: {
    color: colors.textMuted,
  },
});
