/**
 * Trip API — CRUD, duty management, billing, notifications
 *
 * Uses the shared apiFetch client from ./client
 * Endpoints: /partner/trips (GET), /partner/trips/:id (GET),
 *   /partner/trips/:id/start-duty (PUT), /partner/trips/:id/end-duty (PUT),
 *   /partner/trips/:id/finalize (PUT), /partner/trips/:id/cancel (PUT),
 *   /partner/trips/calendar (GET)
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface Trip {
  id: string;
  bookingId?: string;
  tripCode?: string;
  title?: string;
  status: 'INITIATED' | 'ASSIGNED' | 'ON_DUTY' | 'COMPLETED' | 'FINALIZE_CHARGES' | 'CANCELLED';
  guestName: string;
  guestPhone?: string;
  guestContact?: string;
  guestEmail?: string;
  pickupLocation?: string;
  dropLocation?: string;
  from?: string;
  to?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  time?: string;
  vehicleType?: string;
  vehicle?: string;
  vehicleNumber?: string;
  assignedDriver?: { id: string; name: string; phone?: string } | string;
  assignedVehicle?: { id: string; name: string; registrationNo: string } | string;
  driver?: string;
  driverName?: string;
  startOdometer?: number;
  endOdometer?: number;
  totalKm?: number;
  totalDistance?: number;
  distance?: string;
  duration?: string;
  totalAmount?: number;
  amount?: number;
  baseAmount?: number;
  extras?: Record<string, number>;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateTripRequest {
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  pickupLocation: string;
  dropLocation: string;
  startDate: string;
  endDate?: string;
  vehicleType: string;
  notes?: string;
  [key: string]: any;
}

export interface AssignRequest {
  driverId?: string;
  vehicleId?: string;
}

export interface DutyRequest {
  odometer: number;
  notes?: string;
}

export interface FinalizeRequest {
  baseAmount: number;
  extras?: Record<string, number>;
  totalAmount: number;
  notes?: string;
}

// ── API ────────────────────────────────────────────────

const tripsApi = {
  /** List all trips */
  async list(): Promise<Trip[]> {
    return api.get<Trip[]>('/partner/trips');
  },

  /** Create a new trip */
  async create(data: CreateTripRequest): Promise<Trip> {
    return api.post<Trip>('/partner/trips', data);
  },

  /** Get trip details by ID */
  async get(id: string): Promise<Trip> {
    return api.get<Trip>(`/partner/trips/${id}`);
  },

  /** Update a trip */
  async update(id: string, data: Partial<CreateTripRequest>): Promise<Trip> {
    return api.put<Trip>(`/partner/trips/${id}`, data);
  },

  /** Assign driver and/or vehicle */
  async assign(id: string, data: AssignRequest): Promise<Trip> {
    return api.put<Trip>(`/partner/trips/${id}/assign`, data);
  },

  /** Start duty — record start odometer */
  async startDuty(id: string, data: DutyRequest): Promise<Trip> {
    return api.put<Trip>(`/partner/trips/${id}/start-duty`, data);
  },

  /** End duty — record end odometer */
  async endDuty(id: string, data: DutyRequest): Promise<Trip> {
    return api.put<Trip>(`/partner/trips/${id}/end-duty`, data);
  },

  /** Finalize charges */
  async finalize(id: string, data: FinalizeRequest): Promise<Trip> {
    return api.put<Trip>(`/partner/trips/${id}/finalize`, data);
  },

  /** Cancel a trip */
  async cancel(id: string, reason?: string): Promise<Trip> {
    return api.put<Trip>(`/partner/trips/${id}/cancel`, { reason });
  },

  /** Get calendar trips */
  async calendar(): Promise<Trip[]> {
    return api.get<Trip[]>('/partner/trips/calendar');
  },

  /** Get duty slip PDF (returns download URL or blob) */
  async getDutySlip(id: string): Promise<any> {
    return api.get<any>(`/partner/trips/${id}/duty-slip`);
  },

  /** Get invoice PDF */
  async getInvoice(id: string): Promise<any> {
    return api.get<any>(`/partner/trips/${id}/invoice`);
  },

  /** Send trip details via SMS */
  async sendSms(id: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/partner/trips/${id}/send-sms`);
  },

  /** Send trip details via email */
  async sendEmail(id: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/partner/trips/${id}/send-email`);
  },
};

export default tripsApi;
