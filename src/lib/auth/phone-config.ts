// -----------------------------------------------------------------------------
// src/lib/auth/phone-config.ts
// Server-only Phone Authentication Configuration & Test Mode Secrets
// (DO NOT IMPORT IN CLIENT COMPONENTS)
// -----------------------------------------------------------------------------

// Test OTP restricted exclusively to non-production local/test environments
export const DEVELOPMENT_TEST_OTP = '123456';

/**
 * Returns true strictly if the environment is local development.
 * Never allows test OTP in production runtime or any deployed Vercel preview/production environment.
 * NEVER uses frontend environment variables (like NEXT_PUBLIC_*) to evaluate security bypasses.
 */
export function isDevOtpAllowed(): boolean {
  // Production runtime and Vercel deployments are strictly forbidden from using development test OTP
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview'
  ) {
    return false;
  }
  return process.env.NODE_ENV === 'development';
}
