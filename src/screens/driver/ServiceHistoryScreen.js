import React, { useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
  TextInput,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';

const { width } = Dimensions.get('window');

const ServiceHistoryScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);

  // Service history with detailed data
  const [serviceHistory] = useState([
    {
      id: 'SR-1024',
      issueType: 'Flat Tire',
      date: '2024-06-01',
      time: '14:30',
      location: 'Lahore, Pakistan',
      vehicle: 'Toyota Corolla 2020',
      vehicleNumber: 'RJ-123-ABC',
      mechanicName: 'John Smith',
      mechanicRating: 4.8,
      cost: 'PKR 2,500',
      status: 'completed',
      duration: '45 mins',
      notes: 'Tire was punctured. Replaced with spare tire.',
    },
    {
      id: 'SR-1025',
      issueType: 'Battery Jump Start',
      date: '2024-05-28',
      time: '09:15',
      location: 'Karachi, Pakistan',
      vehicle: 'Honda Civic 2019',
      vehicleNumber: 'KR-456-XYZ',
      mechanicName: 'Sarah Johnson',
      mechanicRating: 5.0,
      cost: 'PKR 1,500',
      status: 'completed',
      duration: '20 mins',
      notes: 'Battery was completely discharged. Jump started successfully.',
    },
    {
      id: 'SR-1026',
      issueType: 'Fuel Delivery',
      date: '2024-05-20',
      time: '11:45',
      location: 'Islamabad, Pakistan',
      vehicle: 'Suzuki Swift 2021',
      vehicleNumber: 'IS-789-LMN',
      mechanicName: 'Mike Chen',
      mechanicRating: 4.6,
      cost: 'PKR 3,000',
      status: 'completed',
      duration: '15 mins',
      notes: 'Delivered 10 liters of fuel. Vehicle ready to drive.',
    },
    {
      id: 'SR-1027',
      issueType: 'Engine Diagnosis',
      date: '2024-06-15',
      time: '16:20',
      location: 'Multan, Pakistan',
      vehicle: 'Hyundai Tucson 2022',
      vehicleNumber: 'ML-234-PQR',
      mechanicName: 'Emma Wilson',
      mechanicRating: 4.9,
      cost: 'PKR 4,500',
      status: 'in_progress',
      duration: 'Estimated 1 hour',
      notes: 'Conducting comprehensive engine diagnostics...',
    },
    {
      id: 'SR-1028',
      issueType: 'Towing Service',
      date: '2024-05-10',
      time: '13:00',
      location: 'Peshawar, Pakistan',
      vehicle: 'Toyota Hilux 2018',
      vehicleNumber: 'PS-567-STU',
      mechanicName: 'David Brown',
      mechanicRating: 4.7,
      cost: 'PKR 5,000',
      status: 'cancelled',
      duration: 'N/A',
      notes: 'Service was cancelled by user request.',
    },
  ]);

  const filters = [
    { label: 'All', value: 'all', count: 5 },
    { label: 'Completed', value: 'completed', count: 3 },
    { label: 'In Progress', value: 'in_progress', count: 1 },
    { label: 'Cancelled', value: 'cancelled', count: 1 },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#FF7A00';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getIssueIcon = (issueType) => {
    switch (issueType) {
      case 'Flat Tire':
        return 'warning-outline';
      case 'Battery Jump Start':
        return 'flash-outline';
      case 'Fuel Delivery':
        return 'water-outline';
      case 'Engine Diagnosis':
        return 'hammer-outline';
      case 'Towing Service':
        return 'git-branch-outline';
      default:
        return 'car-outline';
    }
  };

  const filteredHistory = serviceHistory.filter((item) => {
    const matchesFilter =
      selectedFilter === 'all' || item.status === selectedFilter;
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.issueType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mechanicName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderServiceCard = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
      activeOpacity={0.7}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.issueContainer}>
          <View style={styles.iconBg}>
            <Ionicons
              name={getIssueIcon(item.issueType)}
              size={24}
              color="#0F4C81"
            />
          </View>
          <View style={styles.issueTextContainer}>
            <Text style={styles.issueType}>{item.issueType}</Text>
            <Text style={styles.serviceId}>{item.id}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      {/* Quick Info Row */}
      <View style={styles.quickInfoRow}>
        <View style={styles.quickInfoItem}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.quickInfoText}>{item.date}</Text>
        </View>
        <View style={styles.quickInfoDivider} />
        <View style={styles.quickInfoItem}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.quickInfoText}>{item.time}</Text>
        </View>
        <View style={styles.quickInfoDivider} />
        <View style={styles.quickInfoItem}>
          <Ionicons name="cash-outline" size={14} color="#FF7A00" />
          <Text style={[styles.quickInfoText, { color: '#FF7A00', fontWeight: '700' }]}>
            {item.cost}
          </Text>
        </View>
      </View>

      {/* Expandable Details */}
      {expandedCard === item.id && (
        <View style={styles.expandedDetails}>
          {/* Location */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="location-outline" size={18} color="#0F4C81" />
              <Text style={styles.detailSectionTitle}>Location</Text>
            </View>
            <Text style={styles.detailValue}>{item.location}</Text>
          </View>

          {/* Vehicle Info */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="car-outline" size={18} color="#0F4C81" />
              <Text style={styles.detailSectionTitle}>Vehicle</Text>
            </View>
            <Text style={styles.detailValue}>{item.vehicle}</Text>
            <Text style={styles.detailSubValue}>{item.vehicleNumber}</Text>
          </View>

          {/* Mechanic Info */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="person-outline" size={18} color="#0F4C81" />
              <Text style={styles.detailSectionTitle}>Mechanic</Text>
            </View>
            <View style={styles.mechanicContainer}>
              <View>
                <Text style={styles.detailValue}>{item.mechanicName}</Text>
                <View style={styles.ratingContainer}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={
                        i < Math.floor(item.mechanicRating) ? 'star' : 'star-outline'
                      }
                      size={12}
                      color="#FFB800"
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <Text style={styles.ratingValue}>{item.mechanicRating}</Text>
                </View>
              </View>
              <View style={styles.durationBadge}>
                <Ionicons name="hourglass-outline" size={14} color="#0F4C81" />
                <Text style={styles.durationText}>{item.duration}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="document-text-outline" size={18} color="#0F4C81" />
              <Text style={styles.detailSectionTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('ServiceRequestDetails', { id: item.id })
              }
            >
              <Ionicons name="eye-outline" size={18} color="#0F4C81" />
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rebookButton]}
              onPress={() =>
                navigation.navigate('CreateRequest', { serviceType: item.issueType })
              }
            >
              <Ionicons name="refresh-outline" size={18} color="#FF7A00" />
              <Text style={[styles.actionButtonText, { color: '#FF7A00' }]}>
                Rebook Service
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Expand Indicator */}
      <View style={styles.expandIndicator}>
        <Ionicons
          name={expandedCard === item.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#0F4C81"
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="car-outline" size={50} color="#CCC" />
      </View>
      <Text style={styles.emptyStateTitle}>No Service History</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery
          ? 'No services match your search'
          : 'Your service history will appear here'}
      </Text>
    </View>
  );

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header title="Service History" showBack />

      {/* Header Section */}
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerTitle}>Service History</Text>
          <Text style={styles.headerSubtitle}>
            View all your previous roadside assistance requests
          </Text>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, type, or mechanic..."
            placeholderTextColor="#CCC"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-outline" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              selectedFilter === filter.value && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter.value &&
                  styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                selectedFilter === filter.value &&
                  styles.countBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  selectedFilter === filter.value &&
                    styles.countTextActive,
                ]}
              >
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Service List */}
      <FlatList
        data={filteredHistory}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState()}
        scrollEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F4C81',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },

  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 14,
    color: '#333',
  },

  filterContainer: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#0F4C81',
    borderColor: '#0F4C81',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#CCC',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
  },
  countTextActive: {
    color: '#FFFFFF',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },

  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },

  issueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  issueTextContainer: {
    flex: 1,
  },

  issueType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F4C81',
    marginBottom: 2,
  },

  serviceId: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  quickInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },

  quickInfoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  quickInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },

  expandedDetails: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 14,
  },

  detailSection: {
    gap: 6,
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F4C81',
  },

  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },

  detailSubValue: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginTop: 2,
  },

  mechanicContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },

  ratingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },

  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },

  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F4C81',
  },

  notesText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
    lineHeight: 18,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0F4F8',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E8F0',
  },

  rebookButton: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFE0CC',
  },

  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F4C81',
  },

  expandIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    backgroundColor: '#FFFFFF',
  },

  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },

  emptyStateSubtitle: {
    fontSize: 13,
    color: '#999',
    fontWeight: '400',
  },
});

export default ServiceHistoryScreen;
