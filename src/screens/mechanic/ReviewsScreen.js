import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';
import { API_URL } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

const filters = ['All Reviews', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];

const formatReviewDate = (value) => {
  if (!value) return 'Date not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not available' : date.toLocaleDateString();
};

const getInitials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'C';
};

export default function ReviewsScreen({ route }) {
  const { token, user, logout } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All Reviews');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);

  const fetchReviews = useCallback(async () => {
    setAuthError(false);
    if (!token || !user?.id) {
      setReviews([]);
      setReviewStats(null);
      setError('No valid backend login session was found. Sign in again to view your reviews.');
      setAuthError(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (user.role?.toUpperCase() !== 'MECHANIC') {
      setReviews([]);
      setReviewStats(null);
      setError('Sign in with a mechanic account to view mechanic reviews.');
      setAuthError(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/feedback/mechanic/${encodeURIComponent(user.id)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (response.status === 401) {
        setAuthError(true);
        throw new Error('Your login session has expired or is invalid. Sign in again to view your reviews.');
      }
      if (response.status === 403) {
        throw new Error('Your account is not authorized to view these reviews.');
      }
      if (!response.ok) throw new Error(data.message || `Reviews request failed (${response.status})`);
      setReviews(Array.isArray(data.feedback) ? data.feedback : []);
      setReviewStats(data.stats || null);
      setError(null);
      setAuthError(false);
    } catch (requestError) {
      setReviews([]);
      setReviewStats(null);
      setError(requestError.message || 'Unable to load reviews. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = useMemo(() => {
    if (selectedFilter === 'All Reviews') return reviews;
    const targetRating = Number(selectedFilter[0]);
    return reviews.filter((review) => Number(review.rating) === targetRating);
  }, [reviews, selectedFilter]);

  const ratingBreakdown = reviewStats?.ratingBreakdown || {};
  const totalReviews = Number(reviewStats?.totalReviews) || 0;
  const averageRating = Number(reviewStats?.averageRating);
  const hasAverage = totalReviews > 0 && Number.isFinite(averageRating);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  return (
    <ScreenWrapper>
      <Header title="Reviews" showBack fallbackRoute="Dashboard" backTab={route?.params?.backTab} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Loading reviews...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={34} color={colors.warning} />
            <Text style={styles.stateTitle}>Reviews unavailable</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={authError ? logout : fetchReviews}
              accessibilityRole="button"
            >
              <Ionicons name={authError ? 'log-in-outline' : 'refresh-outline'} size={17} color={colors.white} />
              <Text style={styles.retryButtonText}>{authError ? 'Sign In Again' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryEyebrow}>Customer rating</Text>
                  <Text style={styles.ratingValue}>{hasAverage ? averageRating.toFixed(1) : '—'}</Text>
                  <View style={styles.averageStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={hasAverage && star <= Math.round(averageRating) ? 'star' : 'star-outline'}
                        size={17}
                        color={colors.primary}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.totalReviewsBox}>
                  <Ionicons name="chatbubbles-outline" size={21} color={colors.secondary} />
                  <Text style={styles.totalReviewsValue}>{totalReviews}</Text>
                  <Text style={styles.totalReviewsLabel}>Total Reviews</Text>
                </View>
              </View>
              <View style={styles.breakdown}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = Number(ratingBreakdown[rating]) || 0;
                  const percent = totalReviews ? Math.min((count / totalReviews) * 100, 100) : 0;
                  return (
                    <View key={rating} style={styles.breakdownRow}>
                      <Text style={styles.breakdownRating}>{rating}</Text>
                      <Ionicons name="star" size={13} color={colors.primary} />
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${percent}%` }]} />
                      </View>
                      <Text style={styles.breakdownCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
              {totalReviews === 0 && (
                <Text style={styles.noRatingHint}>No customer ratings have been submitted yet.</Text>
              )}
            </View>

            <View style={styles.listHeading}>
              <View>
                <Text style={styles.sectionTitle}>Customer Reviews</Text>
                <Text style={styles.sectionSubtitle}>Feedback received for your completed services</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              {filters.map((filter) => {
                const active = selectedFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setSelectedFilter(filter)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {reviews.length === 0 ? (
              <View style={styles.stateCard}>
                <Ionicons name="star-outline" size={34} color={colors.textMuted} />
                <Text style={styles.stateTitle}>No reviews yet</Text>
                <Text style={styles.stateText}>Customer reviews will appear here when submitted.</Text>
              </View>
            ) : filteredReviews.length === 0 ? (
              <View style={styles.stateCard}>
                <Ionicons name="filter-outline" size={34} color={colors.textMuted} />
                <Text style={styles.stateTitle}>No matching reviews</Text>
                <Text style={styles.stateText}>There are no reviews with {selectedFilter.toLowerCase()}.</Text>
              </View>
            ) : (
              filteredReviews.map((review, index) => (
                <ReviewCard key={review.id || review.requestId || index} review={review} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function ReviewCard({ review }) {
  const customerName = review.customerName || review.driverName || 'Customer';
  const profileImage = review.customerImage || review.driverImage || review.profileImage;
  const rating = Number(review.rating);

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.avatar}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(customerName)}</Text>
          )}
        </View>
        <View style={styles.reviewer}>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt || review.date)}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color={colors.primary} />
          <Text style={styles.ratingBadgeText}>{Number.isFinite(rating) ? rating : '—'}</Text>
        </View>
      </View>

      <View style={styles.reviewStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={Number.isFinite(rating) && star <= rating ? 'star' : 'star-outline'}
            size={15}
            color={colors.primary}
          />
        ))}
      </View>

      <Text style={styles.reviewComment}>
        {review.comment?.trim() || 'No written comment was provided.'}
      </Text>

      <View style={styles.reviewFooter}>
        <View style={styles.serviceMeta}>
          <Ionicons name="construct-outline" size={15} color={colors.secondary} />
          <Text style={styles.serviceText}>{review.serviceType || 'Service type not provided'}</Text>
        </View>
        {review.requestId ? (
          <Text style={styles.requestId}>Request {review.requestId}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  summaryCard: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.md },
  summaryEyebrow: { color: colors.textMuted, fontSize: typography.sizes.xs },
  ratingValue: { color: colors.text, fontSize: 38, fontWeight: typography.weights.bold, marginTop: 2 },
  averageStars: { flexDirection: 'row', gap: 2, marginTop: 1 },
  totalReviewsBox: { minWidth: 115, alignItems: 'center', justifyContent: 'center', padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.background },
  totalReviewsValue: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginTop: 3 },
  totalReviewsLabel: { color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  breakdown: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginVertical: 3 },
  breakdownRating: { width: 12, color: colors.text, fontSize: typography.sizes.xs, textAlign: 'right' },
  barTrack: { flex: 1, height: 8, overflow: 'hidden', borderRadius: borderRadius.round, backgroundColor: colors.background, marginHorizontal: spacing.xs },
  barFill: { height: '100%', borderRadius: borderRadius.round, backgroundColor: colors.primary },
  breakdownCount: { width: 27, color: colors.textMuted, fontSize: typography.sizes.xs, textAlign: 'right' },
  noRatingHint: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: spacing.sm },
  listHeading: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  sectionSubtitle: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
  filterList: { flexDirection: 'row', gap: spacing.xs, paddingBottom: spacing.md },
  filterChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.round, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  filterText: { color: colors.textMuted, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  filterTextActive: { color: colors.white },
  reviewCard: { padding: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.16)', marginRight: spacing.sm },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  reviewer: { flex: 1 },
  customerName: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  reviewDate: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 3 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: borderRadius.round, backgroundColor: 'rgba(249,115,22,0.12)' },
  ratingBadgeText: { color: colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  reviewStars: { flexDirection: 'row', gap: 2, marginTop: spacing.md },
  reviewComment: { color: colors.text, fontSize: typography.sizes.sm, lineHeight: 21, marginTop: spacing.sm },
  reviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  serviceText: { color: colors.textMuted, fontSize: typography.sizes.xs, flexShrink: 1 },
  requestId: { color: colors.textMuted, fontSize: 10 },
  stateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  stateCard: { alignItems: 'center', padding: spacing.xl, borderRadius: borderRadius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  stateTitle: { color: colors.text, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, marginTop: spacing.sm, textAlign: 'center' },
  stateText: { color: colors.textMuted, fontSize: typography.sizes.sm, textAlign: 'center', lineHeight: 20, marginTop: spacing.xs },
  retryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md, backgroundColor: colors.primary },
  retryButtonText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
});
