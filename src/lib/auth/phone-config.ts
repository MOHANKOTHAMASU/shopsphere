// -----------------------------------------------------------------------------
// src/lib/auth/phone-config.ts
// Server-only Phone Authentication Configuration & Test Mode Secrets
// (DO NOT IMPORT IN CLIENT COMPONENTS)
// -----------------------------------------------------------------------------

// Test OTP restricted exclusively to non-production local/test environments
export const DEVELOPMENT_TEST_OTP = '123456';

/**
 * Returns true if the environment is strictly local development or automated test runner.
 * Never allows test OTP in production runtime.
 */
export function isDevOtpAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'test';
}
