/**
 * Vehicles API — CRUD operations
 *
 * Uses the shared api client from ./client
 * Endpoints: /partner/vehicles (GET/POST), /partner/vehicles/:id (GET/PUT/DELETE)
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Vehicle {
  id: string;
  name: string;
  registrationNo?: string;
  registrationNumber?: string;
  type: string;
  model?: string;
  year?: number;
  capacity?: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'INACTIVE' | 'Active' | 'Maintenance' | 'Inactive';
  currentOdometer?: number;
  assignedDriver?: string;
  driverName?: string;
  tripCount?: number;
  lastServiceDate?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateVehicleRequest {
  name: string;
  registrationNo: string;
  type: string;
  model: string;
  year?: number;
  capacity?: number;
}

export interface UpdateVehicleRequest {
  name?: string;
  registrationNo?: string;
  type?: string;
  model?: string;
  year?: number;
  capacity?: number;
  status?: string;
}

// ── API ────────────────────────────────────────────────

const vehiclesApi = {
  /** List all vehicles */
  async list(): Promise<Vehicle[]> {
    return api.get<Vehicle[]>('/partner/vehicles');
  },

  /** Get vehicle details by ID */
  async get(id: string): Promise<Vehicle> {
    return api.get<Vehicle>(`/partner/vehicles/${id}`);
  },

  /** Create a new vehicle */
  async create(data: CreateVehicleRequest): Promise<Vehicle> {
    return api.post<Vehicle>('/partner/vehicles', data);
  },

  /** Update an existing vehicle */
  async update(id: string, data: UpdateVehicleRequest): Promise<Vehicle> {
    return api.put<Vehicle>(`/partner/vehicles/${id}`, data);
  },

  /** Delete a vehicle */
  async remove(id: string): Promise<void> {
    return api.delete<void>(`/partner/vehicles/${id}`);
  },
};

export default vehiclesApi;
