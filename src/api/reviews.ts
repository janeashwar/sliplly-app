/**
 * Reviews API — List reviews and rating stats
 *
 * Uses the shared api client from ./client
 * Endpoint: /partner/reviews
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Review {
  id: string;
  tripId?: string;
  guestName?: string;
  reviewer?: string;
  rating: number;
  comment?: string;
  text?: string;
  date?: string;
  tripRoute?: string;
  vehicle?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution?: { stars: number; count: number }[];
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  reviews?: Review[];
  [key: string]: any;
}

// ── API ────────────────────────────────────────────────

const reviewsApi = {
  /** List all reviews (with stats) */
  async list(): Promise<ReviewStats> {
    return api.get<ReviewStats>('/partner/reviews');
  },

  /** Get rating statistics */
  async getStats(): Promise<ReviewStats> {
    return api.get<ReviewStats>('/partner/reviews');
  },
};

export default reviewsApi;
