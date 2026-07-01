/**
 * Auth API — Login, Signup, OTP, Password Reset
 *
 * Uses the shared apiFetch client from ./client
 */

import api from './client';

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  agencyName: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'PARTNER_PRIMARY' | 'PARTNER_ADMIN' | 'PARTNER_USER';
  agencyName?: string;
  agencyId?: string;
  logoUrl?: string;
  createdAt?: string;
  totalTrips?: number;
  totalRevenue?: number;
  activeDrivers?: number;
  [key: string]: any;
}

const authApi = {
  /** Login with email + password */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', data);
  },

  /** Register a new account */
  async signup(data: SignupRequest): Promise<{ message: string; email: string }> {
    return api.post<{ message: string; email: string }>('/auth/signup', data);
  },

  /** Verify email OTP after signup */
  async verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/verify-otp', data);
  },

  /** Resend OTP to email */
  async resendOtp(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/resend-otp', { email });
  },

  /** Request password reset */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/forgot-password', { email });
  },

  /** Reset password with token */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password', data);
  },

  /** Get current authenticated user */
  async getCurrentUser(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  /** Logout (best-effort, clears local tokens regardless) */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore — tokens are cleared locally anyway
    }
  },
};

export default authApi;
