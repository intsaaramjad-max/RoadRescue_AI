import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Image, Modal, ScrollView
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const DOCUMENT_LABELS = {
  cnicFront: 'CNIC Front',
  cnicBack: 'CNIC Back',
  policeCert: 'Police Certificate',
  workshopPics: 'Workshop Photo',
};

const getAvailableDocuments = (documents) => {
  if (!documents) return [];

  const entries = Array.isArray(documents)
    ? documents.map((document, index) => [document?.type || `Document ${index + 1}`, document])
    : Object.entries(documents);

  return entries.flatMap(([key, value]) => {
    if (key === 'uploadedAt' || value == null || value === '') return [];

    const values = Array.isArray(value) ? value : [value];
    return values.filter((document) => document != null && document !== '').map((document, index) => {
      const uri = typeof document === 'string'
        ? document
        : document.url || document.uri || document.path;
      const previewUri = typeof uri === 'string' && /^(https?:\/\/|file:\/\/|data:image\/)/i.test(uri)
        ? uri
        : null;

      return {
        key: `${key}-${index}`,
        title: DOCUMENT_LABELS[key] || key,
        previewUri,
      };
    });
  });
};

export default function VerificationManagementScreen() {
  const { token: userToken } = useAuth();
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('PENDING'); // PENDING | ALL | APPROVED | REJECTED
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVerifications = useCallback(async () => {
    try {
      if (!userToken) {
        setMechanics([]);
        setError('Your admin session is missing. Please sign in again.');
        return;
      }

      let url = `${API_URL}/admin/users?role=MECHANIC`;
      if (filter !== 'ALL') {
        url += `&status=${filter}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        if (!Array.isArray(data.users)) {
          throw new Error('The server returned an invalid mechanic list.');
        }
        setMechanics(data.users.filter((mechanic) => (
          String(mechanic.role || '').toUpperCase() === 'MECHANIC' &&
          (filter === 'ALL' || String(mechanic.verificationStatus || '').toUpperCase() === filter)
        )));
        setError(null);
      } else {
        setMechanics([]);
        setError(data.message || `Failed to fetch verification requests (${response.status})`);
      }
    } catch (requestError) {
      setMechanics([]);
      setError(requestError.message || 'Unable to load mechanic verification requests.');
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
        Alert.alert('Success', data.message || `Mechanic ${status.toLowerCase()} successfully.`);
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
    const status = String(item.verificationStatus || 'PENDING').toUpperCase();
    const isPending = status === 'PENDING';
    const isApproved = status === 'APPROVED';
    const documents = getAvailableDocuments(item.documents);

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
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.docCount}>
            Documents: {documents.length} available
          </Text>
          <Text style={styles.detailBtnText}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <Header title="Mechanic Verifications" />

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
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchVerifications();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
                {!!selectedMechanic.fullName && <Text style={styles.modalLabel}>Name: <Text style={styles.modalVal}>{selectedMechanic.fullName}</Text></Text>}
                {!!selectedMechanic.email && <Text style={styles.modalLabel}>Email: <Text style={styles.modalVal}>{selectedMechanic.email}</Text></Text>}
                {!!selectedMechanic.phone && <Text style={styles.modalLabel}>Phone: <Text style={styles.modalVal}>{selectedMechanic.phone}</Text></Text>}
                {(selectedMechanic.cnicNumber || selectedMechanic.cnic) && (
                  <Text style={styles.modalLabel}>CNIC: <Text style={styles.modalVal}>{selectedMechanic.cnicNumber || selectedMechanic.cnic}</Text></Text>
                )}
                <Text style={styles.modalLabel}>Status: <Text style={styles.modalVal}>{String(selectedMechanic.verificationStatus || 'PENDING').toUpperCase()}</Text></Text>

                <Text style={[styles.modalTitle, { fontSize: typography.sizes.md, marginTop: spacing.md }]}>Uploaded Documents</Text>

                {getAvailableDocuments(selectedMechanic.documents).length === 0 ? (
                  <Text style={styles.emptyText}>No documents attached.</Text>
                ) : (
                  getAvailableDocuments(selectedMechanic.documents).map((document) => (
                    <View key={document.key} style={styles.docBox}>
                      <Text style={styles.docTitle}>{document.title}</Text>
                      {document.previewUri ? (
                        <Image source={{ uri: document.previewUri }} style={styles.docImage} resizeMode="cover" />
                      ) : (
                        <Text style={styles.documentUnavailable}>Document information is available; no preview was provided.</Text>
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
  documentUnavailable: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
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
