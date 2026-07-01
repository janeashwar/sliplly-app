/**
 * Wallet API — Balance and transactions
 *
 * Uses the shared api client from ./client
 * Endpoint: /partner/transactions
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Wallet {
  id?: string;
  balance: number;
  currency?: string;
  lastUpdated?: string;
  [key: string]: any;
}

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'credit' | 'debit';
  amount: number;
  description: string;
  referenceId?: string;
  date?: string;
  category?: string;
  icon?: string;
  createdAt?: string;
  [key: string]: any;
}

// ── API ────────────────────────────────────────────────

const walletApi = {
  /** Get wallet balance and details */
  async get(): Promise<Wallet> {
    return api.get<Wallet>('/partner/wallet');
  },

  /** List all transactions */
  async getTransactions(): Promise<Transaction[]> {
    return api.get<Transaction[]>('/partner/transactions');
  },
};

export default walletApi;
