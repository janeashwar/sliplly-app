/**
 * Plans API — Subscription plans
 *
 * Uses the shared api client from ./client
 * Endpoint: /partner/plans
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  price: number;
  period?: string;
  features: string[];
  vehicleLimit?: string | number;
  driverLimit?: string | number;
  isCurrent?: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  [key: string]: any;
}

// ── API ────────────────────────────────────────────────

const plansApi = {
  /** List all available plans */
  async list(): Promise<Plan[]> {
    return api.get<Plan[]>('/partner/plans');
  },
};

export default plansApi;
