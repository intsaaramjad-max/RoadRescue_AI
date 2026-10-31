import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';

const reviews = [
  { id: '1', name: 'Ahmed Khan', service: 'Battery Assistance', date: 'Today', text: 'Quick response and very professional service.', rating: 5 },
  { id: '2', name: 'Sara Malik', service: 'Flat Tire Repair', date: '2 days ago', text: 'Reached my location on time and fixed the issue.', rating: 5 },
  { id: '3', name: 'Usman Ali', service: 'Tow Truck', date: 'Last week', text: 'Helpful communication throughout the service.', rating: 4 },
];

export default function ReviewsScreen() {
  return (
    <ScreenWrapper>
      <Header title="Reviews" showBack />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <Text style={styles.rating}>4.9</Text>
          <View style={styles.stars}>{[1, 2, 3, 4, 5].map((star) => <Ionicons key={star} name="star" size={18} color="#F59E0B" />)}</View>
          <Text style={styles.summaryText}>Based on 120 driver reviews</Text>
        </View>
        <Text style={styles.sectionTitle}>Recent feedback</Text>
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{review.name.charAt(0)}</Text></View>
              <View style={styles.reviewer}><Text style={styles.name}>{review.name}</Text><Text style={styles.service}>{review.service}</Text></View>
              <Text style={styles.date}>{review.date}</Text>
            </View>
            <View style={styles.reviewStars}>{[1, 2, 3, 4, 5].map((star) => <Ionicons key={star} name="star" size={14} color={star <= review.rating ? '#F59E0B' : colors.border} />)}</View>
            <Text style={styles.reviewText}>{review.text}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  summary: { alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  rating: { color: colors.text, fontSize: 38, fontWeight: typography.weights.bold },
  stars: { flexDirection: 'row', gap: 3, marginTop: 2 },
  summaryText: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, marginTop: spacing.xl, marginBottom: spacing.sm },
  reviewCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(249,115,22,0.16)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  avatarText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  reviewer: { flex: 1 },
  name: { color: colors.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  service: { color: colors.textMuted, fontSize: typography.sizes.xs, marginTop: 2 },
  date: { color: colors.textMuted, fontSize: 11 },
  reviewStars: { flexDirection: 'row', gap: 2, marginTop: spacing.sm },
  reviewText: { color: colors.textMuted, fontSize: typography.sizes.sm, lineHeight: 20, marginTop: spacing.sm },
});
