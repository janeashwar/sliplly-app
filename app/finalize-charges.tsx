/**
 * FinalizeChargesPage — Finalize trip charges with additional surcharges
 * 
 * Features:
 * - System-calculated charges (base fare, distance, duration overage)
 * - Additional surcharges (Toll, Fooding, Parking, Hauling/Stay)
 * - Grand total calculation
 * - Submit to complete trip
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { formatCurrency } from '../src/data/placeholder';
import { toast } from '../src/utils/toast';

// Charge types
const CHARGE_TYPES = [
  { value: 'TOLL', label: 'Toll', icon: 'cash-outline' },
  { value: 'FOODING', label: 'Fooding', icon: 'restaurant-outline' },
  { value: 'PARKING', label: 'Parking', icon: 'car-outline' },
  { value: 'HAULTING_STAY', label: 'Hauling/Stay', icon: 'bed-outline' },
];

// Mock trip data for finalize
const MOCK_TRIP = {
  id: '1',
  tripCode: 'SL-8842',
  guestName: 'Reliance Retail Ltd',
  from: 'Mumbai Central',
  to: 'Pune Station',
  status: 'FINALIZE_CHARGES',
  // System calculations
  baseFare: 4500,
  distanceOverage: 600,
  durationOverage: 300,
  extraDays: 0,
  fixedPrice: 0,
  gst: 0,
  subtotal: 5400,
  grandTotal: 5400,
  // Trip details
  distance: '148 km',
  duration: '2h 45m',
  package: 'Outstation - Sedan',
};

export default function FinalizeChargesPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  
  const [trip, setTrip] = useState(MOCK_TRIP);
  const [additionalRows, setAdditionalRows] = useState<{ id: number; chargeType: string; amount: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Add new charge row
  const addRow = useCallback(() => {
    setAdditionalRows(prev => [
      ...prev,
      { id: Date.now(), chargeType: '', amount: '' }
    ]);
  }, []);

  // Remove charge row
  const removeRow = useCallback((rowId: number) => {
    setAdditionalRows(prev => prev.filter(r => r.id !== rowId));
  }, []);

  // Update charge row
  const updateRow = useCallback((rowId: number, field: string, value: string) => {
    setAdditionalRows(prev =>
      prev.map(r => r.id === rowId ? { ...r, [field]: value } : r)
    );
  }, []);

  // Calculate additional total
  const additionalTotal = useMemo(
    () => additionalRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
    [additionalRows]
  );

  // Calculate final grand total
  const finalGrandTotal = useMemo(
    () => trip.grandTotal + additionalTotal,
    [trip.grandTotal, additionalTotal]
  );

  // Handle submit
  const handleSubmit = useCallback(async () => {
    // Validate
    const invalid = additionalRows.some(r => !r.chargeType || !r.amount || parseFloat(r.amount) <= 0);
    if (additionalRows.length > 0 && invalid) {
      toast.warning('Please fill in all charge fields with valid amounts');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Trip completed successfully!');
      router.replace(`/trip-details?id=${tripId}`);
    } catch (err) {
      toast.error('Failed to finalize charges');
    } finally {
      setSubmitting(false);
    }
  }, [additionalRows, tripId, router]);

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Finalize Charges</Text>
          <Text style={styles.headerSubtitle}>{trip.tripCode}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Info Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripCode}>{trip.tripCode}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Finalize</Text>
            </View>
          </View>
          <Text style={styles.guestName}>{trip.guestName}</Text>
          <View style={styles.routeRow}>
            <View style={styles.routeDot} />
            <Text style={styles.routeText}>{trip.from}</Text>
            <Ionicons name="arrow-forward-outline" size={16} color={colors.text.tertiary} />
            <Text style={styles.routeText}>{trip.to}</Text>
            <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
          </View>
          <View style={styles.tripMeta}>
            <Text style={styles.metaText}>{trip.distance}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{trip.duration}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{trip.package}</Text>
          </View>
        </Animated.View>

        {/* System Calculations */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>System Calculations</Text>
          <View style={styles.calcCard}>
            <CalcRow label="Base Fare Package" value={trip.baseFare} colors={colors} />
            <CalcRow label="Distance Overage" value={trip.distanceOverage} colors={colors} />
            <CalcRow label="Duration Overage" value={trip.durationOverage} colors={colors} />
            {trip.extraDays > 0 && (
              <CalcRow label="Extra Days" value={trip.extraDays} colors={colors} />
            )}
            {trip.fixedPrice > 0 && (
              <CalcRow label="Fixed Price" value={trip.fixedPrice} colors={colors} />
            )}
            {trip.gst > 0 && (
              <CalcRow label="GST" value={trip.gst} colors={colors} />
            )}
            <View style={styles.divider} />
            <CalcRow label="Subtotal" value={trip.subtotal} colors={colors} bold />
          </View>
        </Animated.View>

        {/* Additional Charges */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Additional Charges</Text>
            <Pressable onPress={addRow} style={styles.addButton}>
              <Ionicons name="add-circle-outline" size={20} color={colors.accent.primary} />
              <Text style={[styles.addText, { color: colors.accent.primary }]}>Add</Text>
            </Pressable>
          </View>

          {additionalRows.length === 0 ? (
            <View style={styles.emptyCharges}>
              <Ionicons name="receipt-outline" size={32} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No additional charges</Text>
              <Text style={styles.emptySubtext}>Tap "Add" to include tolls, parking, etc.</Text>
            </View>
          ) : (
            additionalRows.map((row, index) => (
              <ChargeRow
                key={row.id}
                row={row}
                index={index}
                onUpdate={updateRow}
                onRemove={removeRow}
                colors={colors}
                isDark={isDark}
              />
            ))
          )}

          {additionalRows.length > 0 && (
            <View style={styles.additionalTotalRow}>
              <Text style={styles.additionalTotalLabel}>Additional Total</Text>
              <Text style={[styles.additionalTotalValue, { color: colors.accent.primary }]}>
                {formatCurrency(additionalTotal)}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Grand Total */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.grandTotalCard}>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(finalGrandTotal)}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Submit Button */}
      <Animated.View
        entering={FadeInUp.delay(500)}
        style={[styles.submitContainer, { paddingBottom: insets.bottom + 16 }]}
      >
        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.submitText}>
            {submitting ? 'Processing...' : 'Complete Trip'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Calculation Row ───────────────────────────────────────────────
function CalcRow({ label, value, colors, bold }: { label: string; value: number; colors: any; bold?: boolean }) {
  return (
    <View style={calcStyles.row}>
      <Text style={[calcStyles.label, bold && calcStyles.labelBold, { color: colors.text.secondary }]}>
        {label}
      </Text>
      <Text style={[calcStyles.value, bold && calcStyles.valueBold, { color: colors.text.primary }]}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

const calcStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
  },
  labelBold: {
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueBold: {
    fontWeight: '700',
    fontSize: 15,
  },
});

// ─── Charge Row ────────────────────────────────────────────────────
function ChargeRow({ row, index, onUpdate, onRemove, colors, isDark }: any) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      style={[chargeStyles.container, { backgroundColor: colors.bg.card }]}
    >
      <View style={chargeStyles.header}>
        <Text style={[chargeStyles.index, { color: colors.text.tertiary }]}>#{index + 1}</Text>
        <Pressable onPress={() => onRemove(row.id)} style={chargeStyles.removeButton}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </Pressable>
      </View>

      {/* Charge Type Selector */}
      <Text style={[chargeStyles.label, { color: colors.text.secondary }]}>Charge Type</Text>
      <View style={chargeStyles.typeGrid}>
        {CHARGE_TYPES.map(type => (
          <Pressable
            key={type.value}
            style={[
              chargeStyles.typeChip,
              {
                backgroundColor: row.chargeType === type.value
                  ? colors.accent.primary + '20'
                  : colors.bg.surface,
                borderColor: row.chargeType === type.value
                  ? colors.accent.primary
                  : colors.border,
              },
            ]}
            onPress={() => onUpdate(row.id, 'chargeType', type.value)}
          >
            <Ionicons
              name={type.icon as any}
              size={16}
              color={row.chargeType === type.value ? colors.accent.primary : colors.text.tertiary}
            />
            <Text
              style={[
                chargeStyles.typeText,
                {
                  color: row.chargeType === type.value ? colors.accent.primary : colors.text.secondary,
                },
              ]}
            >
              {type.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Amount Input */}
      <Text style={[chargeStyles.label, { color: colors.text.secondary }]}>Amount (₹)</Text>
      <TextInput
        style={[chargeStyles.input, { 
          backgroundColor: colors.bg.surface,
          color: colors.text.primary,
          borderColor: colors.border,
        }]}
        placeholder="Enter amount"
        placeholderTextColor={colors.text.tertiary}
        keyboardType="numeric"
        value={row.amount}
        onChangeText={(value) => onUpdate(row.id, 'amount', value)}
      />
    </Animated.View>
  );
}

const chargeStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  index: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
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
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text.primary,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    tripCard: {
      backgroundColor: colors.bg.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    tripHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    tripCode: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: '#F59E0B' + '20',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#F59E0B',
    },
    guestName: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 12,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    routeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#22C55E',
    },
    routeText: {
      fontSize: 14,
      color: colors.text.primary,
      flex: 1,
    },
    tripMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaText: {
      fontSize: 12,
      color: colors.text.tertiary,
    },
    metaDot: {
      fontSize: 12,
      color: colors.text.tertiary,
    },
    section: {
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addText: {
      fontSize: 14,
      fontWeight: '600',
    },
    calcCard: {
      backgroundColor: colors.bg.card,
      borderRadius: 12,
      padding: 16,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
    emptyCharges: {
      backgroundColor: colors.bg.card,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.secondary,
      marginTop: 12,
    },
    emptySubtext: {
      fontSize: 12,
      color: colors.text.tertiary,
      marginTop: 4,
    },
    additionalTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    additionalTotalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
    },
    additionalTotalValue: {
      fontSize: 16,
      fontWeight: '700',
    },
    grandTotalCard: {
      backgroundColor: colors.accent.primary + '15',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.accent.primary + '30',
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    grandTotalLabel: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    grandTotalValue: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.accent.primary,
    },
    submitContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.bg.base,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent.primary,
      height: 52,
      borderRadius: 12,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
