// -----------------------------------------------------------------------------
// src/lib/auth/sms-service.ts
// ShopSphere Real SMS Gateway & Mobile OTP Service (Server-Only)
// -----------------------------------------------------------------------------

import crypto from 'crypto';
import { normalizePhoneNumber, maskPhoneNumber, validatePhoneNumber } from './phone-utils';
import { isDevOtpAllowed } from './phone-config';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export interface SmsProviderStatus {
  provider: 'msg91' | 'twilio' | 'supabase' | 'none';
  configured: boolean;
  details: string;
}

export interface SmsSendResult {
  success: boolean;
  message: string;
  maskedPhone?: string;
  normalizedPhone?: string;
  cooldownSeconds?: number;
  provider?: string;
  isSandbox?: boolean;
  error?: string;
}

export interface SmsVerifyResult {
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
  phone?: string;
  remainingAttempts?: number;
  error?: string;
}

interface LoginChallengeState {
  challengeToken: string;
  userId: string;
  email: string;
  phone: string;
  otpHash?: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  supabaseManaged?: boolean;
  twilioVerifyManaged?: boolean;
  isSandbox?: boolean;
}

// In-memory challenge store (keyed by challengeToken and normalizedPhone)
const activeChallenges = new Map<string, LoginChallengeState>();
const phoneToChallenge = new Map<string, string>();

// Server-side HMAC secret for OTP hashing (never stored in plain text)
const HMAC_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.AUTH_SECRET || 'shopsphere-sms-hmac-salt-secure';

function hashOtp(otp: string, phone: string): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(`${phone}:${otp.trim()}`).digest('hex');
}

/**
 * Inspect configured SMS provider (MSG91 preferred for Indian carriers, Twilio as fallback)
 */
export function getSmsProviderStatus(): SmsProviderStatus {
  const msg91AuthKey = process.env.MSG91_AUTH_KEY;
  if (msg91AuthKey && !msg91AuthKey.includes('placeholder')) {
    return {
      provider: 'msg91',
      configured: true,
      details: 'MSG91 Flow API configured for Indian carrier SMS delivery (Jio, Airtel, Vi, BSNL).',
    };
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (twilioSid && twilioToken && (twilioVerifySid || twilioPhone) && !twilioSid.includes('placeholder')) {
    return {
      provider: 'twilio',
      configured: true,
      details: twilioVerifySid
        ? 'Twilio Verify API v2 configured with active Verify Service SID.'
        : 'Twilio REST Messages API configured with sender phone number.',
    };
  }

  return {
    provider: 'none',
    configured: false,
    details: 'No SMS provider configured. Set MSG91_AUTH_KEY (or TWILIO credentials) in .env.local.',
  };
}

/**
 * Dispatch OTP SMS via official MSG91 Flow API
 * Uses approved DLT template and direct Indian telecom operator SMPP pipes
 */
export async function sendMsg91FlowSms(
  normalizedPhone: string,
  otp: string
): Promise<{ success: boolean; message: string; messageId?: string; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID || process.env.NEXT_PUBLIC_MSG91_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID || 'SHPSPH';

  if (!authKey || authKey.includes('placeholder')) {
    return {
      success: false,
      message: 'MSG91 authentication key is not configured in environment variables.',
      error: 'MSG91_NOT_CONFIGURED',
    };
  }

  // MSG91 mobile numbers format requires country code without leading plus (e.g., "919876543210")
  const recipientMobile = normalizedPhone.replace(/^\+/, '').replace(/\D/g, '');

  const payload = {
    template_id: templateId,
    sender: senderId,
    short_url: '0',
    recipients: [
      {
        mobiles: recipientMobile,
        otp: otp,
      },
    ],
  };

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.type === 'error') {
      const errorMsg = data.message || `MSG91 rejected SMS dispatch (HTTP ${res.status})`;
      console.error('[ShopSphere SMS] MSG91 rejected dispatch:', errorMsg);
      return {
        success: false,
        message: `MSG91 delivery failed: ${errorMsg}`,
        error: data.code || 'MSG91_DISPATCH_REJECTED',
      };
    }

    const messageId = data.message_id || data.request_id || 'msg91-queued';
    console.log(`[ShopSphere SMS] Dispatched SMS via MSG91 Flow API (Recipient: ${maskPhoneNumber(normalizedPhone)}, RequestID: ${messageId})`);

    return {
      success: true,
      message: 'SMS successfully dispatched via MSG91 Flow API.',
      messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error connecting to MSG91';
    console.error('[ShopSphere SMS] MSG91 network error:', errorMsg);
    return {
      success: false,
      message: `Failed to connect to MSG91 SMS gateway: ${errorMsg}`,
      error: 'MSG91_NETWORK_ERROR',
    };
  }
}

/**
 * Generates a cryptographically strong 6-digit numeric OTP
 */
function generateSecureSixDigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create a new Login Challenge after email+password verification
 */
export function createLoginChallenge(
  userId: string,
  email: string,
  registeredPhone: string,
  emailVerified: boolean
): { challengeToken: string; maskedPhone: string; normalizedPhone: string } {
  const challengeToken = crypto.randomBytes(24).toString('hex');
  const normalizedPhone = normalizePhoneNumber('+91', registeredPhone);
  const now = Date.now();

  const state: LoginChallengeState = {
    challengeToken,
    userId,
    email: email.trim().toLowerCase(),
    phone: normalizedPhone,
    expiresAt: now + 15 * 60 * 1000, // 15-minute challenge window
    attempts: 0,
    lastSentAt: 0,
    emailVerified,
    phoneVerified: false,
  };

  activeChallenges.set(challengeToken, state);
  phoneToChallenge.set(normalizedPhone, challengeToken);

  return {
    challengeToken,
    maskedPhone: maskPhoneNumber(normalizedPhone),
    normalizedPhone,
  };
}

/**
 * Retrieve active login challenge by token
 */
export function getLoginChallenge(challengeToken: string): LoginChallengeState | null {
  const challenge = activeChallenges.get(challengeToken);
  if (!challenge) return null;
  if (Date.now() > challenge.expiresAt) {
    activeChallenges.delete(challengeToken);
    phoneToChallenge.delete(challenge.phone);
    return null;
  }
  return challenge;
}

/**
 * Dispatch real 6-digit SMS OTP to customer's mobile phone
 */
export async function sendMobileSmsOtp(
  challengeToken: string,
  countryCode: string,
  rawPhone: string
): Promise<SmsSendResult> {
  const challenge = getLoginChallenge(challengeToken);
  if (!challenge) {
    return {
      success: false,
      message: 'Login session expired or invalid. Please sign in again with your email and password.',
      error: 'EXPIRED_CHALLENGE',
    };
  }

  if (!challenge.emailVerified) {
    return {
      success: false,
      message: 'Email verification is mandatory before SMS OTP can be dispatched.',
      error: 'EMAIL_UNVERIFIED',
    };
  }

  const validation = validatePhoneNumber(countryCode, rawPhone);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.error || 'Invalid mobile phone number format.',
      error: 'INVALID_PHONE',
    };
  }

  const normalized = normalizePhoneNumber(countryCode, rawPhone);
  challenge.phone = normalized;
  const now = Date.now();

  // Cooldown rate-limit: 30 seconds
  if (challenge.lastSentAt && now - challenge.lastSentAt < 30 * 1000) {
    const remainingSeconds = Math.ceil((30 * 1000 - (now - challenge.lastSentAt)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
      cooldownSeconds: remainingSeconds,
      error: 'RATE_LIMIT_COOLDOWN',
    };
  }

  // Attempt limits: Maximum 5 OTP dispatches per challenge
  if (challenge.attempts >= 5) {
    activeChallenges.delete(challengeToken);
    phoneToChallenge.delete(normalized);
    return {
      success: false,
      message: 'Too many OTP requests. For security reasons, please log in again with your credentials.',
      error: 'MAX_ATTEMPTS_EXCEEDED',
    };
  }

  const providerStatus = getSmsProviderStatus();
  const isDev = isDevOtpAllowed();
  const isSandbox = !providerStatus.configured && isDev;

  // In local development without SMS credentials, default test code to 123456 so developer is not blocked.
  // In production, cryptographically secure 6-digit OTP is ALWAYS generated.
  const otp = isSandbox ? '123456' : generateSecureSixDigitOtp();
  challenge.otpHash = hashOtp(otp, normalized);
  challenge.lastSentAt = now;
  challenge.attempts += 1;
  challenge.isSandbox = isSandbox;

  const maskedPhone = maskPhoneNumber(normalized);

  // 1. Dispatch via MSG91 Flow API if configured (Primary Indian Telecom Pipe: Jio, Airtel, Vi, BSNL)
  if (providerStatus.provider === 'msg91') {
    const msg91Res = await sendMsg91FlowSms(normalized, otp);
    if (!msg91Res.success) {
      return {
        success: false,
        message: msg91Res.message,
        error: msg91Res.error,
      };
    }

    return {
      success: true,
      message: `A genuine verification code has been dispatched via MSG91 to ${maskedPhone}.`,
      maskedPhone,
      normalizedPhone: normalized,
      cooldownSeconds: 30,
      provider: 'msg91',
    };
  }

  // 2. Dispatch via Twilio REST API if configured
  if (providerStatus.provider === 'twilio') {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    // 1A. Twilio Verify API v2 (Official Twilio OTP Service - Zero custom OTP storage)
    if (verifyServiceSid && !verifyServiceSid.includes('placeholder')) {
      try {
        const endpoint = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`;
        const bodyParams = new URLSearchParams();
        bodyParams.set('To', normalized);
        bodyParams.set('Channel', 'sms');

        const twilioRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        const twilioData = await twilioRes.json();
        if (!twilioRes.ok) {
          console.error('[ShopSphere SMS] Twilio Verify dispatch rejected:', twilioData.message || twilioData);
          return {
            success: false,
            message: `SMS delivery failed: ${twilioData.message || 'Twilio Verify rejected the dispatch'}.`,
            error: twilioData.code ? `TWILIO_${twilioData.code}` : 'TWILIO_VERIFY_FAILED',
          };
        }

        challenge.twilioVerifyManaged = true;
        console.log(`[ShopSphere SMS] Dispatched real SMS via Twilio Verify to ${maskedPhone} (SID: ${twilioData.sid})`);
        return {
          success: true,
          message: `A genuine verification code has been dispatched via Twilio Verify to ${maskedPhone}.`,
          maskedPhone,
          normalizedPhone: normalized,
          cooldownSeconds: 30,
          provider: 'twilio-verify',
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Twilio Verify network error';
        console.error('[ShopSphere SMS] Twilio Verify exception:', errorMsg);
        return {
          success: false,
          message: `Failed to connect to Twilio Verify: ${errorMsg}`,
          error: 'TWILIO_VERIFY_NETWORK_ERROR',
        };
      }
    }

    // 1B. Twilio Messages API
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const bodyParams = new URLSearchParams();
      bodyParams.set('To', normalized);
      if (messagingServiceSid) {
        bodyParams.set('MessagingServiceSid', messagingServiceSid);
      } else if (fromPhone) {
        bodyParams.set('From', fromPhone);
      }
      bodyParams.set(
        'Body',
        `Your ShopSphere login verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`
      );

      const twilioRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const twilioData = await twilioRes.json();
      if (!twilioRes.ok) {
        console.error('[ShopSphere SMS] Twilio dispatch rejected:', twilioData.message || twilioData);
        return {
          success: false,
          message: `SMS delivery failed: ${twilioData.message || 'Twilio rejected the dispatch'}.`,
          error: twilioData.code ? `TWILIO_${twilioData.code}` : 'TWILIO_DISPATCH_FAILED',
        };
      }

      console.log(`[ShopSphere SMS] Dispatched real SMS via Twilio to ${maskedPhone} (SID: ${twilioData.sid})`);
      return {
        success: true,
        message: `A genuine verification code has been dispatched via SMS to ${maskedPhone}.`,
        maskedPhone,
        normalizedPhone: normalized,
        cooldownSeconds: 30,
        provider: 'twilio',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Twilio network error';
      console.error('[ShopSphere SMS] Twilio exception:', errorMsg);
      return {
        success: false,
        message: `Failed to connect to SMS provider: ${errorMsg}`,
        error: 'TWILIO_NETWORK_ERROR',
      };
    }
  }

  // 2. Dispatch via Supabase Native Phone Auth (if Twilio/Vonage configured in Supabase Dashboard)
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error: supaError } = await supabase.auth.signInWithOtp({
        phone: normalized,
      });

      if (!supaError) {
        challenge.supabaseManaged = true;
        console.log(`[ShopSphere SMS] Dispatched real SMS via Supabase Phone Auth to ${maskedPhone}`);
        return {
          success: true,
          message: `A genuine verification code has been dispatched via SMS to ${maskedPhone}.`,
          maskedPhone,
          normalizedPhone: normalized,
          cooldownSeconds: 30,
          provider: 'supabase',
        };
      }
    } catch {
      // Supabase phone provider check fallback
    }
  }

  // 3. Automated Test / Local Test Sandbox Handling
  // In development/test mode, if no SMS provider keys have been provided yet:
  const isTestOrDev = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'test';
  if (isTestOrDev) {
    console.log(`[ShopSphere SMS Test Mode] SMS provider not configured in .env. Test OTP generated for ${maskedPhone}.`);
    return {
      success: true,
      message: `[Test Sandbox] Real SMS provider not configured yet. Dispatched test code to ${maskedPhone}.`,
      maskedPhone,
      normalizedPhone: normalized,
      cooldownSeconds: 30,
      provider: 'sandbox',
      isSandbox: true,
    };
  }

  // 3. Environment without SMS Provider -> Reject with clear error
  return {
    success: false,
    message:
      'SMS Gateway is not configured. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in .env.local, or enable Phone Auth in the Supabase Dashboard.',
    error: 'SMS_GATEWAY_NOT_CONFIGURED',
  };
}

/**
 * Verify 6-digit SMS OTP against stored cryptographic hash
 */
export async function verifyMobileSmsOtp(
  challengeToken: string,
  otpInput: string
): Promise<SmsVerifyResult> {
  const challenge = getLoginChallenge(challengeToken);
  if (!challenge) {
    return {
      success: false,
      message: 'Verification session has expired or is invalid. Please sign in again.',
      error: 'EXPIRED_SESSION',
    };
  }

  const cleanOtp = otpInput.replace(/\D/g, '').trim();
  if (cleanOtp.length !== 6) {
    return {
      success: false,
      message: 'Please enter the complete 6-digit verification code.',
      error: 'INVALID_FORMAT',
    };
  }

  if (Date.now() > challenge.expiresAt) {
    activeChallenges.delete(challengeToken);
    return {
      success: false,
      message: 'This verification code has expired. Please log in again to request a fresh code.',
      error: 'CODE_EXPIRED',
    };
  }

  // If dispatched via Twilio Verify API, verify with Twilio VerificationCheck API
  if (challenge.twilioVerifyManaged) {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (twilioSid && twilioToken && verifyServiceSid) {
      try {
        const endpoint = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`;
        const bodyParams = new URLSearchParams();
        bodyParams.set('To', challenge.phone);
        bodyParams.set('Code', cleanOtp);

        const twilioRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        const twilioData = await twilioRes.json();
        if (twilioRes.ok && twilioData.status === 'approved') {
          challenge.phoneVerified = true;
          activeChallenges.delete(challengeToken);
          phoneToChallenge.delete(challenge.phone);
          return {
            success: true,
            message: 'Mobile number verified successfully via Twilio Verify!',
            userId: challenge.userId,
            email: challenge.email,
            phone: challenge.phone,
          };
        } else {
          challenge.attempts += 1;
          const remainingAttempts = Math.max(0, 5 - challenge.attempts);
          return {
            success: false,
            message: twilioData.message || `Invalid verification code. ${remainingAttempts} attempts remaining.`,
            remainingAttempts,
            error: 'INCORRECT_CODE',
          };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Twilio Verify error';
        return {
          success: false,
          message: `Verification check error: ${errorMsg}`,
          error: 'TWILIO_CHECK_ERROR',
        };
      }
    }
  }

  // If dispatched via Supabase native Phone Auth, verify with Supabase Auth API
  if (challenge.supabaseManaged && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: challenge.phone,
        token: cleanOtp,
        type: 'sms',
      });

      if (!error) {
        challenge.phoneVerified = true;
        activeChallenges.delete(challengeToken);
        phoneToChallenge.delete(challenge.phone);
        return {
          success: true,
          message: 'Mobile number verified successfully via Supabase Auth!',
          userId: challenge.userId,
          email: challenge.email,
          phone: challenge.phone,
        };
      } else {
        challenge.attempts += 1;
        const remainingAttempts = Math.max(0, 5 - challenge.attempts);
        return {
          success: false,
          message: error.message || `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts,
          error: 'INCORRECT_CODE',
        };
      }
    } catch {
      // Fallback
    }
  }

  if (!challenge.otpHash) {
    return {
      success: false,
      message: 'No verification code has been dispatched. Please request an OTP first.',
      error: 'NO_OTP_SENT',
    };
  }

  const expectedHash = challenge.otpHash;
  const inputHash = hashOtp(cleanOtp, challenge.phone);

  // Constant-time buffer comparison to prevent timing attacks.
  // Demo OTP 123456 is strictly permitted only in local development sandbox mode, NEVER in production.
  const isBufferMatch =
    expectedHash.length === inputHash.length &&
    crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(inputHash));
  const isMatch = isBufferMatch || (isDevOtpAllowed() && challenge.isSandbox && cleanOtp === '123456');

  if (!isMatch) {
    challenge.attempts += 1;
    const remainingAttempts = Math.max(0, 5 - challenge.attempts);

    if (remainingAttempts === 0) {
      activeChallenges.delete(challengeToken);
      phoneToChallenge.delete(challenge.phone);
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Your login challenge has been cancelled for security.',
        remainingAttempts: 0,
        error: 'MAX_ATTEMPTS_EXCEEDED',
      };
    }

    return {
      success: false,
      message: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      remainingAttempts,
      error: 'INCORRECT_CODE',
    };
  }

  // OTP verified successfully!
  challenge.phoneVerified = true;
  activeChallenges.delete(challengeToken);
  phoneToChallenge.delete(challenge.phone);

  return {
    success: true,
    message: 'Mobile number verified successfully!',
    userId: challenge.userId,
    email: challenge.email,
    phone: challenge.phone,
  };
}
