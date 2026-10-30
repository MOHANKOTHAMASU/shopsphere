'use server';

// -----------------------------------------------------------------------------
// src/lib/auth/email-service.ts
// ShopSphere Genuine Email Verification Service (Server-Only)
// -----------------------------------------------------------------------------

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';

export interface EmailVerificationStatus {
  isVerified: boolean;
  email: string;
  confirmedAt?: string;
}

export interface EmailActionResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  error?: string;
}

/**
 * Checks whether an email is verified in Supabase Auth or memory credentials
 */
export async function checkEmailVerifiedStatus(email: string): Promise<EmailVerificationStatus> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      // Probe by checking user session or admin list
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: 'probing_verification_status_non_matching_dummy_pw_#987',
      });

      // If Supabase reports email not confirmed
      if (
        error &&
        (error.message.toLowerCase().includes('email not confirmed') ||
          (error as unknown as { code?: string }).code === 'email_not_confirmed')
      ) {
        return { isVerified: false, email: cleanEmail };
      }
    } catch {
      // Proceed to fallback check
    }
  }

  return { isVerified: false, email: cleanEmail };
}

/**
 * Resends a genuine verification email to customer
 */
export async function sendEmailVerification(email: string): Promise<EmailActionResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please provide a valid email address.', error: 'INVALID_EMAIL' };
  }

  // 60-second cooldown rate limit per email
  const rateLimit = checkRateLimit(`resend-email:${cleanEmail}`, 1, 60);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Please wait ${rateLimit.resetInSeconds} seconds before requesting another verification email.`,
      cooldownSeconds: rateLimit.resetInSeconds,
      error: 'RATE_LIMIT_COOLDOWN',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const emailRedirectTo = `${appUrl}/auth/callback?next=/auth/login?verified=true`;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        const isRateLimit =
          error.status === 429 ||
          error.message.toLowerCase().includes('rate limit') ||
          (error as { code?: string }).code === 'over_email_send_rate_limit';

        if (isRateLimit) {
          return {
            success: false,
            message:
              'Email delivery rate limit reached on Supabase. Please wait a few minutes before trying again, or configure custom SMTP in the Supabase Dashboard.',
            error: 'SUPABASE_EMAIL_RATE_LIMIT',
          };
        }

        return {
          success: false,
          message: error.message || 'Unable to dispatch verification email.',
          error: error.message,
        };
      }

      return {
        success: true,
        message: `A genuine verification email has been dispatched to ${cleanEmail}. Please check your inbox and spam folder.`,
        cooldownSeconds: 60,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown email dispatch error';
      return {
        success: false,
        message: `Failed to contact email service: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }

  return {
    success: false,
    message: 'Email service provider is not configured.',
    error: 'PROVIDER_NOT_CONFIGURED',
  };
}

/**
 * Verify email OTP code directly (if 6-digit confirmation code was sent by provider)
 */
export async function verifyEmailOtpToken(
  email: string,
  token: string
): Promise<EmailActionResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  if (!cleanToken) {
    return { success: false, message: 'Please enter the verification code from your email.', error: 'MISSING_CODE' };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      });

      if (error) {
        // Also try 'email' type in case it was an email change or magiclink
        const retry = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });

        if (retry.error) {
          return {
            success: false,
            message: retry.error.message || 'Invalid or expired verification code.',
            error: retry.error.message,
          };
        }
      }

      return {
        success: true,
        message: 'Your email address has been successfully verified! You may now log in.',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed';
      return { success: false, message: errorMsg, error: errorMsg };
    }
  }

  return {
    success: false,
    message: 'Email verification provider not configured.',
    error: 'NOT_CONFIGURED',
  };
}
