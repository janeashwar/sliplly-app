/**
 * Users API — Manage team members
 *
 * Uses the shared api client from ./client
 * Endpoint: /partner/users
 */

import api from './client';

// ── Types ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'PARTNER_PRIMARY' | 'PARTNER_ADMIN' | 'PARTNER_USER';
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED';
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'PARTNER_ADMIN' | 'PARTNER_USER';
  password?: string;
}

// ── API ────────────────────────────────────────────────

const usersApi = {
  /** List all users */
  async list(): Promise<User[]> {
    return api.get<User[]>('/partner/users');
  },

  /** Create a new user */
  async create(data: CreateUserRequest): Promise<User> {
    return api.post<User>('/partner/users', data);
  },

  /** Update a user */
  async update(id: string, data: Partial<CreateUserRequest>): Promise<User> {
    return api.put<User>(`/partner/users/${id}`, data);
  },

  /** Deactivate a user */
  async deactivate(id: string): Promise<User> {
    return api.put<User>(`/partner/users/${id}/deactivate`, {});
  },
};

export default usersApi;
