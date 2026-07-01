/**
 * Dashboard API — Stats and summary
 *
 * Uses the shared api client from ./client
 * Endpoint: /partner/dashboard
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface DashboardStats {
  agencyName?: string;
  todayTrips?: number;
  thisMonthTrips?: number;
  pendingTrips?: number;
  completedTrips?: number;
  dutySlipBalance?: number;
  smsBalance?: number;
  emailBalance?: number;
  planExpiryDate?: string;
  recentTrips?: any[];
  totalTrips?: number;
  activeTrips?: number;
  totalRevenue?: number;
  pendingPayments?: number;
  completionRate?: number;
  avgTripDuration?: string;
  tripsToday?: number;
  tripsThisMonth?: number;
  pendingAssignments?: number;
  completedSlips?: number;
  balance?: number;
  monthlyTrips?: { month: string; count: number }[];
  recentActivity?: { id: string; action: string; detail: string; time: string }[];
  [key: string]: any;
}

// ── API ────────────────────────────────────────────────

const dashboardApi = {
  /** Get dashboard statistics */
  async getStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/partner/dashboard');
  },
};

export default dashboardApi;
