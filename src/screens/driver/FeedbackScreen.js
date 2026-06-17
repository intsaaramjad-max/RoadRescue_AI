import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const API_URL = Platform.select({
  ios: 'https://road-rescue-ai-poc2.vercel.app/api',
  android: 'https://road-rescue-ai-poc2.vercel.app/api',
  default: 'https://road-rescue-ai-poc2.vercel.app/api',
});

// Star Rating Component
function StarRating({ rating, onRate }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRate(star)}
          activeOpacity={0.7}
          style={starStyles.starBtn}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={42}
            color={star <= rating ? '#F59E0B' : '#334155'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', marginVertical: 8 },
  starBtn: { padding: 4 },
});

// Rating label
const ratingLabel = {
  0: '',
  1: 'Very Poor 😞',
  2: 'Poor 😕',
  3: 'Average 😐',
  4: 'Good 😊',
  5: 'Excellent! 🤩',
};

export default function FeedbackScreen({ route, navigation }) {
  const { token } = useAuth();

  // Optional: receive requestId & mechanicId from navigation params
  const requestId = route?.params?.requestId || 'demo-request';
  const mechanicId = route?.params?.mechanicId || 'demo-mechanic';
  const mechanicName = route?.params?.mechanicName || 'Your Mechanic';
  const serviceType = route?.params?.serviceType || 'Roadside Service';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const quickTags = [
    'Very Professional',
    'Fast Arrival',
    'Fair Pricing',
    'Friendly',
    'Skilled',
    'Would Recommend',
  ];
  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    setLoading(true);
    try {
      const fullComment = [
        selectedTags.length > 0 ? selectedTags.join(', ') : null,
        comment.trim() || null,
      ]
        .filter(Boolean)
        .join(' • ');

      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          mechanicId,
          rating,
          comment: fullComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If already reviewed or demo mode, still show success
        if (data.message?.includes('already')) {
          Alert.alert('Already Submitted', 'You have already reviewed this service.');
          return;
        }
      }

      // Show success animation
      setSubmitted(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      // Demo mode — show success anyway
      setSubmitted(true);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ScreenWrapper useSafeArea={true}>
        <View style={styles.successContainer}>
          <Animated.View
            style={[styles.successCircle, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}
          >
            <Ionicons name="checkmark" size={56} color="#FFF" />
          </Animated.View>
          <Animated.Text style={[styles.successTitle, { opacity: fadeAnim }]}>
            Thank You! 🎉
          </Animated.Text>
          <Animated.Text style={[styles.successSubtitle, { opacity: fadeAnim }]}>
            Your feedback helps improve the service experience for everyone.
          </Animated.Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper useSafeArea={true}>
      <Header title="Rate Your Experience" showBack />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mechanic Info Card */}
        <View style={styles.mechanicCard}>
          <View style={styles.mechanicAvatar}>
            <Text style={styles.mechanicAvatarText}>
              {mechanicName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.mechanicMeta}>
            <Text style={styles.mechanicName}>{mechanicName}</Text>
            <Text style={styles.serviceTypeText}>{serviceType}</Text>
          </View>
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.completedBadgeText}>Completed</Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingQuestion}>How was your experience?</Text>
          <StarRating rating={rating} onRate={setRating} />
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{ratingLabel[rating]}</Text>
          )}
        </View>

        {/* Quick Tags */}
        {rating > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What went well?</Text>
            <View style={styles.tagsWrap}>
              {quickTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected,
                  ]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Written Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience in detail..."
            placeholderTextColor="#475569"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Ionicons name="send" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.submitBtnText}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.skipBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingBottom: 48,
  },
  mechanicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: spacing.xl,
  },
  mechanicAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mechanicAvatarText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },
  mechanicMeta: { flex: 1 },
  mechanicName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  serviceTypeText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  ratingCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.xl,
  },
  ratingQuestion: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tagSelected: {
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderColor: '#F97316',
  },
  tagText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#F97316',
    fontWeight: '700',
  },
  commentInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    color: '#F8FAFC',
    fontSize: 14,
    minHeight: 110,
    lineHeight: 20,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  // Success state
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#0F172A',
  },
  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 20,
  },
  doneBtn: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 48,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
