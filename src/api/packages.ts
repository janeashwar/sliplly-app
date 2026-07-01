/**
 * Packages API — CRUD operations
 *
 * Uses the shared api client from ./client
 * Endpoints: /partner/packages (GET/POST), /partner/packages/:id (GET/PUT/DELETE)
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Package {
  id: string;
  name: string;
  description?: string;
  vehicleType?: string;
  type?: string;
  baseRate?: number;
  basePrice?: number;
  ratePerKm?: number;
  ratePerHour?: number;
  includedKm?: number;
  includedHours?: number;
  extraKmRate?: number;
  extraKmCharge?: number;
  extraHourRate?: number;
  extraHourCharge?: number;
  daysIncluded?: number;
  extraDayPrice?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreatePackageRequest {
  name: string;
  description?: string;
  vehicleType: string;
  baseRate: number;
  ratePerKm?: number;
  ratePerHour?: number;
  includedKm?: number;
  includedHours?: number;
  extraKmRate?: number;
  extraHourRate?: number;
}

export interface UpdatePackageRequest {
  name?: string;
  description?: string;
  vehicleType?: string;
  baseRate?: number;
  ratePerKm?: number;
  ratePerHour?: number;
  includedKm?: number;
  includedHours?: number;
  extraKmRate?: number;
  extraHourRate?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

// ── API ────────────────────────────────────────────────

const packagesApi = {
  /** List all packages */
  async list(): Promise<Package[]> {
    return api.get<Package[]>('/partner/packages');
  },

  /** Get package details by ID */
  async get(id: string): Promise<Package> {
    return api.get<Package>(`/partner/packages/${id}`);
  },

  /** Create a new package */
  async create(data: CreatePackageRequest): Promise<Package> {
    return api.post<Package>('/partner/packages', data);
  },

  /** Update an existing package */
  async update(id: string, data: UpdatePackageRequest): Promise<Package> {
    return api.put<Package>(`/partner/packages/${id}`, data);
  },

  /** Delete a package */
  async remove(id: string): Promise<void> {
    return api.delete<void>(`/partner/packages/${id}`);
  },
};

export default packagesApi;
