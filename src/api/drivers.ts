/**
 * Drivers API — CRUD operations
 *
 * Uses the shared api client from ./client
 * Endpoints: /partner/drivers (GET/POST), /partner/drivers/:id (GET/PUT/DELETE)
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNo?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_DUTY' | 'Available' | 'On Trip' | 'Off Duty';
  rating?: number;
  totalTrips?: number;
  tripCount?: number;
  assignedVehicle?: string;
  vehicleName?: string;
  joinDate?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateDriverRequest {
  name: string;
  phone: string;
  email?: string;
  licenseNo: string;
  licenseExpiry: string;
}

export interface UpdateDriverRequest {
  name?: string;
  phone?: string;
  email?: string;
  licenseNo?: string;
  licenseExpiry?: string;
  status?: string;
}

// ── API ────────────────────────────────────────────────

const driversApi = {
  /** List all drivers */
  async list(): Promise<Driver[]> {
    return api.get<Driver[]>('/partner/drivers');
  },

  /** Get driver details by ID */
  async get(id: string): Promise<Driver> {
    return api.get<Driver>(`/partner/drivers/${id}`);
  },

  /** Create a new driver */
  async create(data: CreateDriverRequest): Promise<Driver> {
    return api.post<Driver>('/partner/drivers', data);
  },

  /** Update an existing driver */
  async update(id: string, data: UpdateDriverRequest): Promise<Driver> {
    return api.put<Driver>(`/partner/drivers/${id}`, data);
  },

  /** Delete a driver */
  async remove(id: string): Promise<void> {
    return api.delete<void>(`/partner/drivers/${id}`);
  },
};

export default driversApi;
