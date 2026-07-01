import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import reviewsApi, { ReviewStats, Review } from '../src/api/reviews';

export default function ReviewsScreen() {
  const { colors, isDark, shadows } = useTheme();
  const styles = getStyles(colors, isDark, shadows);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reviewsData, setReviewsData] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await reviewsApi.list();
      setReviewsData(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={[typography.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>Loading reviews...</Text>
      </View>
    );
  }

  const distribution = reviewsData?.distribution || [];
  const reviews = reviewsData?.reviews || [];
  const maxCount = distribution.length > 0 ? Math.max(...distribution.map((d) => d.count)) : 1;

  const renderStars = (rating: number, size = 14) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? '#FBBF24' : colors.text.tertiary}
        />
      ))}
    </View>
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Rating */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.ratingOverviewCard}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingBig}>{(reviewsData?.averageRating || 0).toFixed(1)}</Text>
            {renderStars(Math.round(reviewsData?.averageRating || 0), 18)}
            <Text style={styles.totalReviewsText}>{reviewsData?.totalReviews || 0} reviews</Text>
          </View>
          <View style={styles.ratingRight}>
            {distribution.map((item) => (
              <View key={item.stars} style={styles.distributionRow}>
                <Text style={styles.distStarLabel}>{item.stars}</Text>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <View style={styles.barContainer}>
                  <Animated.View
                    entering={FadeInDown.delay(200 + item.stars * 50).duration(500)}
                    style={[
                      styles.barFill,
                      {
                        width: `${(item.count / maxCount) * 100}%`,
                        backgroundColor:
                          item.stars >= 4
                            ? colors.semantic.success
                            : item.stars === 3
                            ? colors.semantic.warning
                            : colors.semantic.error,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Reviews List */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>All Reviews</Text>
        </Animated.View>

        {reviews.map((review, index) => (
          <Animated.View
            key={review.id}
            entering={FadeInDown.delay(300 + index * 80).duration(400)}
            style={styles.reviewCard}
          >
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerAvatar}>
                <Text style={styles.reviewerInitials}>{getInitials(review.reviewer || review.guestName || 'G')}</Text>
              </View>
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>{review.reviewer || review.guestName || 'Guest'}</Text>
                <View style={styles.reviewMetaRow}>
                  {renderStars(review.rating)}
                  <Text style={styles.reviewDate}>{formatDate(review.date || review.createdAt || '')}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.reviewText}>{review.text || review.comment || ''}</Text>

            <View style={styles.tripDetailRow}>
              <Ionicons name="navigate-outline" size={13} color={colors.text.tertiary} />
              <Text style={styles.tripDetailText} numberOfLines={1}>{review.tripRoute || ''}</Text>
              <Text style={styles.vehicleTag}>{review.vehicle || ''}</Text>
            </View>
          </Animated.View>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: Colors, isDark: boolean, shadows: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.lg,
    },

    // Rating Overview
    ratingOverviewCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      flexDirection: 'row',
      gap: spacing.lg,
    },
    ratingLeft: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minWidth: 90,
    },
    ratingBig: {
      fontSize: 44,
      fontWeight: '800',
      color: colors.text.primary,
      letterSpacing: -1.5,
    },
    starsRow: {
      flexDirection: 'row',
      gap: 2,
    },
    totalReviewsText: {
      ...typography.caption,
      color: colors.text.tertiary,
    },
    ratingRight: {
      flex: 1,
      gap: 6,
      justifyContent: 'center',
    },
    distributionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    distStarLabel: {
      ...typography.caption,
      color: colors.text.secondary,
      width: 12,
      textAlign: 'right',
    },
    barContainer: {
      flex: 1,
      height: 8,
      backgroundColor: colors.bg.base,
      borderRadius: 4,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
    },
    distCount: {
      ...typography.label,
      color: colors.text.tertiary,
      width: 24,
      textAlign: 'right',
    },

    // Section
    sectionTitle: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing.md,
    },

    // Review Card
    reviewCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    reviewHeader: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    reviewerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent.dim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewerInitials: {
      ...typography.caption,
      color: colors.accent.primary,
      fontWeight: '700',
    },
    reviewerInfo: {
      flex: 1,
    },
    reviewerName: {
      ...typography.bodyMedium,
      color: colors.text.primary,
      fontWeight: '600',
      marginBottom: 2,
    },
    reviewMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    reviewDate: {
      ...typography.caption,
      color: colors.text.tertiary,
    },
    reviewText: {
      ...typography.body,
      color: colors.text.secondary,
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    tripDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    tripDetailText: {
      ...typography.caption,
      color: colors.text.tertiary,
      flex: 1,
    },
    vehicleTag: {
      ...typography.label,
      color: colors.accent.primary,
      backgroundColor: colors.accent.dim,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
  });
