import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { toast } from '../src/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography, type Colors } from '../src/theme/colors';
import { useTheme } from '../src/context/ThemeContext';
import PageLayout from '../src/components/PageLayout';
import EmptyState from '../src/components/common/EmptyState';
import walletApi, { Transaction } from '../src/api/wallet';

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export default function WalletScreen() {
  const { colors, statusBadges, shadows, isDark } = useTheme();
  const styles = getStyles(colors, isDark, shadows);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      // Fetch transactions
      const txnData = await walletApi.getTransactions();
      const txnList = Array.isArray(txnData) ? txnData : (txnData as any).content || (txnData as any).transactions || [];
      setTransactions(txnList);

      // Try to fetch wallet balance
      try {
        const wallet = await walletApi.get();
        setBalance(wallet.balance || 0);
      } catch {
        // Wallet endpoint may not exist, calculate from transactions
        const credits = txnList.filter((t: Transaction) => (t.type || '').toLowerCase() === 'credit').reduce((s: number, t: Transaction) => s + (t.amount || 0), 0);
        const debits = txnList.filter((t: Transaction) => (t.type || '').toLowerCase() === 'debit').reduce((s: number, t: Transaction) => s + (t.amount || 0), 0);
        setBalance(credits - debits);
      }
    } catch (err: any) {
      console.error('Failed to fetch wallet data:', err);
      setError(err?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const totalCredits = transactions
    .filter((t) => (t.type || '').toLowerCase() === 'credit')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalDebits = transactions
    .filter((t) => (t.type || '').toLowerCase() === 'debit')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  if (loading) {
    return (
      <PageLayout title="Wallet">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxxxl * 2 }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[typography.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>Loading wallet...</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Wallet">
      {/* Hero Balance */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
        <Text style={styles.heroValue}>{formatCurrency(balance)}</Text>

        <View style={styles.quickStatsRow}>
          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: colors.semantic.success + '18' }]}>
              <Ionicons name="arrow-down-outline" size={16} color={colors.semantic.success} />
            </View>
            <View>
              <Text style={styles.quickStatLabel}>Credits</Text>
              <Text style={[styles.quickStatValue, { color: colors.semantic.success }]}>
                +{formatCurrency(totalCredits)}
              </Text>
            </View>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: colors.semantic.error + '18' }]}>
              <Ionicons name="arrow-up-outline" size={16} color={colors.semantic.error} />
            </View>
            <View>
              <Text style={styles.quickStatLabel}>Debits</Text>
              <Text style={[styles.quickStatValue, { color: colors.semantic.error }]}>
                -{formatCurrency(totalDebits)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionCard} onPress={() => toast.info('This feature will be available soon!', 'Coming Soon')}>
          <View style={[styles.actionIcon, { backgroundColor: colors.accent.dim }]}>
            <Ionicons name="wallet-outline" size={22} color={colors.accent.primary} />
          </View>
          <Text style={styles.actionLabel}>Add Funds</Text>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => toast.info('This feature will be available soon!', 'Coming Soon')}>
          <View style={[styles.actionIcon, { backgroundColor: colors.semantic.info + '18' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.semantic.info} />
          </View>
          <Text style={styles.actionLabel}>Recharge SMS</Text>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => toast.info('This feature will be available soon!', 'Coming Soon')}>
          <View style={[styles.actionIcon, { backgroundColor: colors.semantic.warning + '18' }]}>
            <Ionicons name="mail-outline" size={22} color={colors.semantic.warning} />
          </View>
          <Text style={styles.actionLabel}>Recharge Email</Text>
        </Pressable>
      </View>

      {/* Error */}
      {error && (
        <View style={{ padding: spacing.sm, marginBottom: spacing.md, backgroundColor: colors.semantic.error + '18', borderRadius: radius.sm }}>
          <Text style={{ color: colors.semantic.error, ...typography.caption }}>{error}</Text>
        </View>
      )}

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
      {transactions.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No transactions yet"
          subtitle="Your transaction history will appear here"
        />
      ) : (
      <View style={styles.txnCard}>
        {transactions.map((txn, index) => (
          <View
            key={txn.id}
            style={[
              styles.txnItem,
              index < transactions.length - 1 && styles.txnBorder,
            ]}
          >
            <View
              style={[
                styles.txnIcon,
                {
                  backgroundColor:
                    (txn.type || '').toLowerCase() === 'credit'
                      ? colors.semantic.success + '18'
                      : colors.semantic.error + '18',
                },
              ]}
            >
              <Ionicons
                name={(txn.type || '').toLowerCase() === 'credit' ? 'arrow-down' : 'arrow-up'}
                size={16}
                color={(txn.type || '').toLowerCase() === 'credit' ? colors.semantic.success : colors.semantic.error}
              />
            </View>
            <View style={styles.txnInfo}>
              <Text style={styles.txnDesc} numberOfLines={1}>
                {txn.description}
              </Text>
              <Text style={styles.txnMeta}>
                {txn.category || ''} · {txn.date || txn.createdAt || ''}
              </Text>
            </View>
            <Text
              style={[
                styles.txnAmount,
                { color: (txn.type || '').toLowerCase() === 'credit' ? colors.semantic.success : colors.semantic.error },
              ]}
            >
              {(txn.type || '').toLowerCase() === 'credit' ? '+' : '-'}
              {formatCurrency(txn.amount)}
            </Text>
          </View>
        ))}
      </View>
      )}

      <View style={{ height: spacing.xl }} />
    </PageLayout>
  );
}

const getStyles = (colors: Colors, isDark: boolean, shadows: any) => StyleSheet.create({
  heroCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
     ...(!isDark ? shadows.low : {}),
  },
  heroLabel: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 46,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  quickStatsRow: {
    flexDirection: 'row',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  quickStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickStatIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  quickStatValue: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
     ...(!isDark ? shadows.low : {}),
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  txnCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
     ...(!isDark ? shadows.low : {}),
  },
  txnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  txnBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: {
    flex: 1,
  },
  txnDesc: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  txnMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  txnAmount: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
});
