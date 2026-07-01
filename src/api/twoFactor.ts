/**
 * 2FA API — Two-Factor Authentication
 */

import api from './client';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  lastVerified?: string;
  backupCodesRemaining?: number;
}

const twoFactorApi = {
  // Get 2FA status
  async getStatus(): Promise<TwoFactorStatus> {
    return api.get<TwoFactorStatus>('/auth/2fa/status');
  },

  // Initiate 2FA setup (generates secret + QR code)
  async setup(): Promise<TwoFactorSetup> {
    return api.post<TwoFactorSetup>('/auth/2fa/setup');
  },

  // Verify TOTP code and enable 2FA
  async verify(code: string): Promise<{ success: boolean; backupCodes: string[] }> {
    return api.post('/auth/2fa/verify', { code });
  },

  // Disable 2FA
  async disable(code: string): Promise<{ success: boolean }> {
    return api.post('/auth/2fa/disable', { code });
  },

  // Verify login with 2FA
  async verifyLogin(code: string, sessionToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return api.post('/auth/2fa/verify-login', { code, sessionToken });
  },

  // Regenerate backup codes
  async regenerateBackupCodes(): Promise<{ backupCodes: string[] }> {
    return api.post('/auth/2fa/backup-codes');
  },
};

export default twoFactorApi;
