/**
 * Guests API — CRUD operations and search
 *
 * Uses the shared api client from ./client
 * Endpoints: /partner/guests (GET), /partner/guests/:id (GET),
 *   /partner/guests/search?mobile=X (GET)
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Guest {
  id: string;
  name: string;
  phone: string;
  mobile?: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  totalTrips?: number;
  tripCount?: number;
  totalSpent?: number;
  lastTripDate?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateGuestRequest {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
}

export interface UpdateGuestRequest {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
}

// ── API ────────────────────────────────────────────────

const guestsApi = {
  /** List all guests */
  async list(): Promise<Guest[]> {
    return api.get<Guest[]>('/partner/guests');
  },

  /** Get guest details by ID */
  async get(id: string): Promise<Guest> {
    return api.get<Guest>(`/partner/guests/${id}`);
  },

  /** Create a new guest */
  async create(data: CreateGuestRequest): Promise<Guest> {
    return api.post<Guest>('/partner/guests', data);
  },

  /** Update an existing guest */
  async update(id: string, data: UpdateGuestRequest): Promise<Guest> {
    return api.put<Guest>(`/partner/guests/${id}`, data);
  },

  /** Search guests by mobile number */
  async search(mobile: string): Promise<Guest[]> {
    return api.get<Guest[]>(`/partner/guests/search?mobile=${encodeURIComponent(mobile)}`);
  },

  /** Search guests by name */
  async searchByName(name: string): Promise<Guest[]> {
    return api.get<Guest[]>(`/partner/guests/search-by-name?name=${encodeURIComponent(name)}`);
  },
};

export default guestsApi;
