/**
 * ReportsPage — Business reports with date range and Excel export
 * 
 * Features:
 * - Date range picker
 * - Summary stats (trips, revenue, completed, cancelled)
 * - Utility consumption (SMS, emails, duty slips)
 * - Export to Excel
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { toast } from '../src/utils/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { formatCurrency } from '../src/data/placeholder';
import reportsApi, { ReportSummary } from '../src/api/reports';

export default function ReportsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportSummary | null>(null);

  // Simulate date picker
  const pickDate = useCallback((type: 'from' | 'to') => {
    // In real app, use a date picker
    const today = new Date();
    const daysAgo = type === 'from' ? 30 : 0;
    const date = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const formatted = date.toISOString().split('T')[0];
    
    if (type === 'from') {
      setFromDate(formatted);
    } else {
      setToDate(formatted);
    }
  }, []);

  // Load reports from API on mount
  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await reportsApi.get();
        setReportData(data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      }
    };
    loadReports();
  }, []);

  // Generate report
  const handleGenerate = useCallback(async () => {
    if (!fromDate || !toDate) {
      toast.warning('Both from date and to date are required');
      return;
    }

    setLoading(true);
    try {
      const data = await reportsApi.getSummary(fromDate, toDate);
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  // Download Excel
  const handleDownloadExcel = useCallback(async () => {
    toast.info('Excel download will start shortly...', 'Download');
    // In real app, trigger file download
  }, []);

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Business Reports</Text>
          <Text style={styles.headerSubtitle}>Audit revenue, trips, and communication metrics</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Range Picker */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.dateCard}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.dateRow}>
            <Pressable style={styles.dateButton} onPress={() => pickDate('from')}>
              <Ionicons name="calendar-outline" size={18} color={colors.text.tertiary} />
              <Text style={[styles.dateText, !fromDate && styles.datePlaceholder]}>
                {fromDate || 'From Date'}
              </Text>
            </Pressable>
            <Ionicons name="arrow-forward-outline" size={16} color={colors.text.tertiary} />
            <Pressable style={styles.dateButton} onPress={() => pickDate('to')}>
              <Ionicons name="calendar-outline" size={18} color={colors.text.tertiary} />
              <Text style={[styles.dateText, !toDate && styles.datePlaceholder]}>
                {toDate || 'To Date'}
              </Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.generateButton, loading && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
          >
            <Ionicons name="bar-chart-outline" size={18} color="#FFFFFF" />
            <Text style={styles.generateText}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Report Results */}
        {reportData && (
          <>
            {/* Summary Stats */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Trips"
                  value={reportData.totalTrips.toString()}
                  icon="car-outline"
                  color="#3B82F6"
                  colors={colors}
                />
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(reportData.totalRevenue)}
                  icon="trending-up-outline"
                  color="#22C55E"
                  colors={colors}
                />
                <StatCard
                  title="Completed"
                  value={String(reportData.completedTrips ?? reportData.totalTrips ?? 0)}
                  icon="checkmark-circle-outline"
                  color="#10B981"
                  colors={colors}
                />
                <StatCard
                  title="Cancelled"
                  value={String(reportData.cancelledTrips ?? 0)}
                  icon="close-circle-outline"
                  color="#EF4444"
                  colors={colors}
                />
              </View>
            </Animated.View>

            {/* Utility Consumption */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Utility Consumption</Text>
              <View style={styles.utilityCard}>
                <UtilityRow
                  icon="chatbubble-outline"
                  label="SMS Credits Sent"
                  value={String(reportData.smsCredits ?? 0)}
                  colors={colors}
                />
                <UtilityRow
                  icon="mail-outline"
                  label="Emails Sent"
                  value={String(reportData.emailsSent ?? 0)}
                  colors={colors}
                />
                <UtilityRow
                  icon="document-text-outline"
                  label="Duty Slips Generated"
                  value={String(reportData.dutySlipsGenerated ?? 0)}
                  colors={colors}
                />
              </View>
            </Animated.View>

            {/* Export Button */}
            <Animated.View entering={FadeInDown.delay(400)}>
              <Pressable style={styles.exportButton} onPress={handleDownloadExcel}>
                <Ionicons name="download-outline" size={20} color={colors.accent.primary} />
                <Text style={[styles.exportText, { color: colors.accent.primary }]}>
                  Export to Excel
                </Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({ title, value, icon, color, colors }: any) {
  return (
    <View style={[statStyles.card, { backgroundColor: colors.bg.card }]}>
      <View style={[statStyles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[statStyles.title, { color: colors.text.tertiary }]}>{title}</Text>
      <Text style={[statStyles.value, { color: colors.text.primary }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
});

// ─── Utility Row ───────────────────────────────────────────────────
function UtilityRow({ icon, label, value, colors }: any) {
  return (
    <View style={utilityStyles.row}>
      <View style={utilityStyles.left}>
        <Ionicons name={icon} size={18} color={colors.text.tertiary} />
        <Text style={[utilityStyles.label, { color: colors.text.secondary }]}>{label}</Text>
      </View>
      <Text style={[utilityStyles.value, { color: colors.text.primary }]}>{value}</Text>
    </View>
  );
}

const utilityStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// ─── Styles ────────────────────────────────────────────────────────
function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.bg.base,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg.card,
    },
    headerContent: {
      marginLeft: 12,
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text.primary,
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    dateCard: {
      backgroundColor: colors.bg.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 12,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    dateButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 44,
      backgroundColor: colors.bg.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateText: {
      fontSize: 14,
      color: colors.text.primary,
    },
    datePlaceholder: {
      color: colors.text.tertiary,
    },
    generateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      backgroundColor: colors.accent.primary,
      borderRadius: 12,
    },
    generateButtonDisabled: {
      opacity: 0.6,
    },
    generateText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    section: {
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    utilityCard: {
      backgroundColor: colors.bg.card,
      borderRadius: 12,
      padding: 16,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      backgroundColor: 'transparent',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.accent.primary,
    },
    exportText: {
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
