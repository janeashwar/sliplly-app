/**
 * Offers API — List, create, and claim offers
 *
 * Uses the shared api client from ./client
 * Endpoint: /partner/offers
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Offer {
  id: string;
  title: string;
  description?: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscount?: number;
  minTripAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  createdAt: string;
  [key: string]: any;
}

export interface CreateOfferRequest {
  title: string;
  description?: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscount?: number;
  minTripAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
}

// ── API ────────────────────────────────────────────────

const offersApi = {
  /** List all offers */
  async list(): Promise<Offer[]> {
    return api.get<Offer[]>('/partner/offers');
  },

  /** Create a new offer */
  async create(data: CreateOfferRequest): Promise<Offer> {
    return api.post<Offer>('/partner/offers', data);
  },

  /** Claim an offer for the current user */
  async claim(id: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/partner/offers/${id}/claim`);
  },
};

export default offersApi;
