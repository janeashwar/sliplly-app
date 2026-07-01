/**
 * Auth Store — Zustand store for authentication state
 *
 * Persists tokens via AsyncStorage (handled by tokenStorage in client.ts).
 * Loads user on app start; exposes login/signup/verifyOtp/logout.
 */

import { create } from 'zustand';
import authApi, { User, LoginRequest, SignupRequest } from '../api/auth';
import { tokenStorage } from '../api/client';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginRequest) => Promise<boolean>;
  signup: (data: SignupRequest) => Promise<{ success: boolean; email?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Login
  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(data);

      // API client already unwraps { success, data } → data
      await tokenStorage.setTokens(response.accessToken, response.refreshToken);

      // Update state
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      const message = error?.message || 'Login failed. Please try again.';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  // Signup
  signup: async (data: SignupRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.signup(data);
      set({ isLoading: false, error: null });
      return { success: true, email: response.email };
    } catch (error: any) {
      const message = error?.message || 'Signup failed. Please try again.';
      set({ isLoading: false, error: message });
      return { success: false };
    }
  },

  // Verify OTP
  verifyOtp: async (email: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.verifyOtp({ email, otp });

      // API client already unwraps { success, data } → data
      await tokenStorage.setTokens(response.accessToken, response.refreshToken);

      // Update state
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      const message = error?.message || 'OTP verification failed.';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  // Resend OTP
  resendOtp: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.resendOtp(email);
      set({ isLoading: false, error: null });
      return true;
    } catch (error: any) {
      const message = error?.message || 'Failed to resend OTP.';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      // Clear tokens
      await tokenStorage.clearTokens();

      // Reset state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Load user from stored token (called on app start)
  loadUser: async () => {
    set({ isLoading: true });
    try {
      const token = await tokenStorage.getAccessToken();

      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await authApi.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token invalid or expired
      await tokenStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
