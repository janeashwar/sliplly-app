/**
 * Reports API — Generate and download reports
 *
 * Uses the shared api client from ./client
 * Endpoint: /partner/reports
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Report {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  downloadUrl?: string;
  createdAt: string;
  [key: string]: any;
}

export interface ReportSummary {
  totalTrips: number;
  totalRevenue: number;
  totalAmount?: number;
  totalDistance?: number;
  completedTrips?: number;
  cancelledTrips?: number;
  smsCredits?: number;
  emailsSent?: number;
  dutySlipsGenerated?: number;
  tripsByStatus?: Record<string, number>;
  [key: string]: any;
}

// ── API ────────────────────────────────────────────────

const reportsApi = {
  /** Get reports */
  async get(): Promise<ReportSummary> {
    return api.get<ReportSummary>('/partner/reports');
  },

  /** Generate a report for a date range */
  async generate(fromDate: string, toDate: string): Promise<Report> {
    return api.post<Report>('/partner/reports/generate', { fromDate, toDate });
  },

  /** Get report details / download URL */
  async download(id: string): Promise<{ downloadUrl: string }> {
    return api.get<{ downloadUrl: string }>(`/partner/reports/${id}/download`);
  },

  /** Get report summary stats */
  async getSummary(fromDate: string, toDate: string): Promise<ReportSummary> {
    return api.get<ReportSummary>(`/partner/reports/summary?from=${fromDate}&to=${toDate}`);
  },
};

export default reportsApi;
