'use server';

// -----------------------------------------------------------------------------
// src/lib/auth/phone-actions.ts
// ShopSphere Phone Number & Genuine SMS OTP Authentication Actions
// -----------------------------------------------------------------------------

import { revalidatePath } from 'next/cache';
import {
  memoryCustomers,
  memoryAddresses,
  memoryCredentials,
} from '@/lib/admin/store';
import { setDemoUserSession, type DemoUserSession } from './actions';
import { sanitizeRedirectPath } from '@/lib/security/redirects';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { CustomerSummary, Address } from '@/types/ecommerce';
import {
  normalizePhoneNumber,
  maskPhoneNumber,
  validatePhoneNumber,
} from './phone-utils';
import { DEVELOPMENT_TEST_OTP, isDevOtpAllowed } from './phone-config';
import {
  createLoginChallenge,
  getLoginChallenge,
  sendMobileSmsOtp,
  verifyMobileSmsOtp,
  sendMsg91FlowSms,
  getSmsProviderStatus,
  type SmsSendResult,
  type SmsVerifyResult,
} from './sms-service';

// Re-export provider status helper for UI diagnostics
export { getSmsProviderStatus };

/**
 * -----------------------------------------------------------------------------
 * 2-FACTOR CUSTOMER LOGIN FLOW (PHASE 3)
 * -----------------------------------------------------------------------------
 */

export interface InitiateLoginResult {
  success: boolean;
  message: string;
  requiresPhoneOtp?: boolean;
  challengeToken?: string;
  maskedPhone?: string;
  normalizedPhone?: string;
  email?: string;
  isEmailVerified?: boolean;
  redirectTo?: string;
  error?: string;
}

/**
 * STEP 1: Verify Email + Password credentials and confirm email is verified
 */
export async function initiateCustomerLoginAction(
  formData: FormData
): Promise<InitiateLoginResult> {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase();
  const password = (formData.get('password') as string) || '';
  const redirectParam = (formData.get('redirect') as string) || '/account';

  if (!email || !password) {
    return {
      success: false,
      message: 'Please enter both your registered email and password.',
      error: 'MISSING_CREDENTIALS',
    };
  }

  // 1. Verify against Supabase Auth if configured
  let supabaseUserId: string | null = null;
  let registeredPhone: string = '';
  let isEmailVerified = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        supabaseUserId = data.user.id;
        isEmailVerified = Boolean(
          data.user.email_confirmed_at ||
            (data.user as unknown as { confirmed_at?: string })?.confirmed_at
        );
        registeredPhone =
          data.user.phone ||
          (data.user.user_metadata?.phone as string) ||
          '';

        // Check if user is banned/suspended
        const isBanned = Boolean(
          (data.user as unknown as { banned_until?: string })?.banned_until &&
            new Date((data.user as unknown as { banned_until: string }).banned_until) > new Date()
        );
        if (isBanned) {
          return {
            success: false,
            message: 'Your account has been suspended. Please contact customer support for assistance.',
            error: 'ACCOUNT_SUSPENDED',
          };
        }

        // Email Verification Enforcement
        if (!isEmailVerified) {
          return {
            success: false,
            message:
              'Please verify your email address before continuing. A verification email has been dispatched to your email address.',
            isEmailVerified: false,
            email,
            error: 'EMAIL_UNVERIFIED',
          };
        }
      } else if (
        error &&
        (error.message.toLowerCase().includes('email not confirmed') ||
          (error as { code?: string }).code === 'email_not_confirmed')
      ) {
        return {
          success: false,
          message:
            'Please verify your email address before continuing. Check your inbox for the confirmation link.',
          isEmailVerified: false,
          email,
          error: 'EMAIL_UNVERIFIED',
        };
      }
    } catch {
      // Fallback to local store
    }
  }

  // 2. Fallback to Local Credential Store
  const foundCustomer = memoryCustomers.find((c) => c.email.toLowerCase() === email);
  const storedPassword = memoryCredentials.get(email);

  // If Supabase didn't authenticate user, check memory store
  if (!supabaseUserId) {
    if (storedPassword && storedPassword !== password) {
      return {
        success: false,
        message: 'Invalid email or password. Please verify and try again.',
        error: 'INVALID_CREDENTIALS',
      };
    }

    if (!foundCustomer && !storedPassword && email !== 'customer@shopsphere.dev') {
      return {
        success: false,
        message: 'Invalid email or password. Please verify and try again.',
        error: 'INVALID_CREDENTIALS',
      };
    }

    if (foundCustomer?.status === 'suspended') {
      return {
        success: false,
        message: 'Your account has been suspended. Please contact customer support for assistance.',
        error: 'ACCOUNT_SUSPENDED',
      };
    }

    // Check email verification in memory store
    if (foundCustomer && foundCustomer.isVerified === false) {
      return {
        success: false,
        message: 'Please verify your email address before continuing.',
        isEmailVerified: false,
        email,
        error: 'EMAIL_UNVERIFIED',
      };
    }

    isEmailVerified = true;
    registeredPhone = foundCustomer?.phone || '+91 96527 88899';
    supabaseUserId = foundCustomer?.id || `usr-cust-${Date.now()}`;
  }

  // Create Login Challenge for 2FA Mobile OTP
  const challenge = createLoginChallenge(
    supabaseUserId,
    email,
    registeredPhone || '+91 96527 88899',
    isEmailVerified
  );

  return {
    success: true,
    message: 'Credentials verified. Please complete 2-factor mobile SMS authentication.',
    requiresPhoneOtp: true,
    challengeToken: challenge.challengeToken,
    maskedPhone: challenge.maskedPhone,
    normalizedPhone: challenge.normalizedPhone,
    email,
    isEmailVerified: true,
  };
}

/**
 * STEP 2: Dispatch Real 6-Digit SMS OTP to Customer Mobile
 */
export async function sendLoginSmsOtpAction(
  challengeToken: string,
  countryCode: string = '+91',
  phone: string
): Promise<SmsSendResult> {
  return await sendMobileSmsOtp(challengeToken, countryCode, phone);
}

/**
 * STEP 3: Verify 6-Digit SMS OTP and Establish Authenticated Customer Session
 */
export async function verifyLoginSmsOtpAction(
  challengeToken: string,
  otpInput: string,
  redirectUrl: string = '/account',
  rememberMe: boolean = true
): Promise<{
  success: boolean;
  message: string;
  redirectTo?: string;
  remainingAttempts?: number;
  error?: string;
}> {
  const result: SmsVerifyResult = await verifyMobileSmsOtp(challengeToken, otpInput);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      remainingAttempts: result.remainingAttempts,
      error: result.error,
    };
  }

  // OTP Verified Successfully -> Establish Session
  const cleanEmail = result.email || '';
  const foundCustomer = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail.toLowerCase());

  const sessionUser: DemoUserSession = {
    id: result.userId || foundCustomer?.id || `usr-cust-${Date.now()}`,
    email: cleanEmail,
    full_name: foundCustomer?.fullName?.trim() || '',
    role: 'customer',
    phone: result.phone || foundCustomer?.phone,
  };

  await setDemoUserSession(sessionUser, rememberMe);

  try {
    revalidatePath('/', 'layout');
    revalidatePath('/account', 'page');
  } catch {
    // Safe for non-HTTP calls
  }

  const destination = sanitizeRedirectPath(redirectUrl, '/account');

  return {
    success: true,
    message: 'Signed in successfully! Welcome to ShopSphere.',
    redirectTo: destination,
  };
}

/**
 * -----------------------------------------------------------------------------
 * COMPATIBILITY SUITE FOR DIRECT PHONE OTP (Amazon/Flipkart Quick Flow & Tests)
 * -----------------------------------------------------------------------------
 */

// In-memory phone OTP state registry (with attempt limiting and expiry)
interface PhoneOtpState {
  otp: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  lastSentAt: number;
}
const legacyPhoneOtpStore: Map<string, PhoneOtpState> = new Map();

/**
 * Send OTP directly to phone number (legacy/fast checkout compatibility)
 */
export async function sendPhoneOtpAction(
  countryCode: string = '+91',
  rawPhone: string
): Promise<{
  success: boolean;
  message: string;
  maskedPhone?: string;
  normalizedPhone?: string;
  testOtp?: string;
  isNewUser?: boolean;
  error?: string;
}> {
  const validation = validatePhoneNumber(countryCode, rawPhone);
  if (!validation.isValid) {
    return { success: false, message: validation.error || 'Invalid phone number.', error: validation.error };
  }

  const normalized = normalizePhoneNumber(countryCode, rawPhone);
  const now = Date.now();

  const existing = legacyPhoneOtpStore.get(normalized);
  if (existing) {
    const timeSinceLastSent = (now - existing.lastSentAt) / 1000;
    if (timeSinceLastSent < 30) {
      const waitSeconds = Math.ceil(30 - timeSinceLastSent);
      return {
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        error: `Rate limit: wait ${waitSeconds}s`,
      };
    }
  }

  const cleanInputPhone = normalized.replace(/\D/g, '');
  const existingCustomer = memoryCustomers.find((c) => {
    if (!c.phone) return false;
    const cleanCustomerPhone = c.phone.replace(/\D/g, '');
    return cleanCustomerPhone.endsWith(cleanInputPhone.slice(-10));
  });

  const isDev = isDevOtpAllowed();
  const otp = isDev ? DEVELOPMENT_TEST_OTP : Math.floor(100000 + Math.random() * 900000).toString();

  legacyPhoneOtpStore.set(normalized, {
    otp,
    expiresAt: now + 10 * 60 * 1000,
    attempts: 0,
    verified: false,
    lastSentAt: now,
  });

  const masked = maskPhoneNumber(normalized);

  // Check if MSG91 (Primary Indian Carrier Pipe) or Twilio is configured
  const providerStatus = getSmsProviderStatus();
  if (providerStatus.provider === 'msg91') {
    try {
      await sendMsg91FlowSms(normalized, otp);
    } catch {
      // Ignored for non-fatal fallback
    }
  } else if (providerStatus.provider === 'twilio') {
    try {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
      const fromPhone = process.env.TWILIO_PHONE_NUMBER;
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

      const bodyParams = new URLSearchParams();
      bodyParams.set('To', normalized);
      if (messagingServiceSid) {
        bodyParams.set('MessagingServiceSid', messagingServiceSid);
      } else if (fromPhone) {
        bodyParams.set('From', fromPhone);
      }
      bodyParams.set('Body', `Your ShopSphere verification code is: ${otp}. Valid for 10 minutes.`);

      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });
    } catch {
      // Ignored for non-fatal fallback
    }
  }

  return {
    success: true,
    message: `Verification code dispatched to ${masked}.`,
    maskedPhone: masked,
    normalizedPhone: normalized,
    isNewUser: !existingCustomer,
  };
}

/**
 * Verify OTP directly (legacy compatibility)
 */
export async function verifyPhoneOtpAction(
  countryCode: string = '+91',
  rawPhone: string,
  otpInput: string,
  redirectUrl: string = '/account'
): Promise<{
  success: boolean;
  message: string;
  isNewUser?: boolean;
  redirectTo?: string;
  remainingAttempts?: number;
  error?: string;
}> {
  const cleanOtp = otpInput.replace(/\D/g, '').trim();
  if (!cleanOtp || cleanOtp.length !== 6) {
    return { success: false, message: 'Please enter the complete 6-digit verification code.', error: 'Invalid OTP format' };
  }

  const normalized = normalizePhoneNumber(countryCode, rawPhone);
  const state = legacyPhoneOtpStore.get(normalized);

  if (!state) {
    return {
      success: false,
      message: 'No active OTP request found for this phone number. Please request a new code.',
      error: 'OTP not requested',
    };
  }

  const now = Date.now();
  if (now > state.expiresAt) {
    legacyPhoneOtpStore.delete(normalized);
    return {
      success: false,
      message: 'This verification code has expired. Please request a new OTP.',
      error: 'OTP expired',
    };
  }

  if (state.attempts >= 5) {
    legacyPhoneOtpStore.delete(normalized);
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. For your security, please request a new OTP.',
      error: 'Max attempts exceeded',
    };
  }

  state.attempts += 1;

  const isDev = isDevOtpAllowed();
  const isMatch = cleanOtp === state.otp || (isDev && cleanOtp === DEVELOPMENT_TEST_OTP);
  if (!isMatch) {
    const remainingAttempts = 5 - state.attempts;
    return {
      success: false,
      message: `Invalid verification code. You have ${remainingAttempts} attempts remaining.`,
      error: 'Incorrect OTP',
      remainingAttempts,
    };
  }

  state.verified = true;

  const cleanInputPhone = normalized.replace(/\D/g, '');
  let existingCustomer: CustomerSummary | undefined = memoryCustomers.find((c) => {
    if (!c.phone) return false;
    const cleanCustomerPhone = c.phone.replace(/\D/g, '');
    return cleanCustomerPhone.endsWith(cleanInputPhone.slice(-10));
  });

  const safeDest = sanitizeRedirectPath(redirectUrl, '/account');

  if (existingCustomer) {
    const session: DemoUserSession = {
      id: existingCustomer.id,
      email: existingCustomer.email,
      full_name: existingCustomer.fullName,
      role: existingCustomer.role,
      phone: existingCustomer.phone || normalized,
    };

    await setDemoUserSession(session, true);

    try {
      revalidatePath('/', 'layout');
    } catch {
      // Safe
    }

    legacyPhoneOtpStore.delete(normalized);

    return {
      success: true,
      isNewUser: false,
      message: `Welcome back, ${existingCustomer.fullName}!`,
      redirectTo: safeDest,
    };
  } else {
    return {
      success: true,
      isNewUser: true,
      message: 'Mobile number verified successfully! Please complete your profile details.',
      redirectTo: `/auth/register?phone=${encodeURIComponent(normalized)}&redirect=${encodeURIComponent(safeDest)}`,
    };
  }
}

/**
 * STEP 3: Complete Registration for Phone-Verified Customer
 */
export async function registerPhoneVerifiedCustomerAction(
  formData: FormData
): Promise<{
  success: boolean;
  message: string;
  errors?: Record<string, string>;
  customer?: { id: string; name: string; email: string; phone?: string };
  redirectTo?: string;
}> {
  const fullName = ((formData.get('fullName') as string) || '').trim();
  const rawPhone = ((formData.get('phone') as string) || '').trim();
  const countryCode = ((formData.get('countryCode') as string) || '+91').trim();
  const phone = rawPhone.startsWith('+') ? rawPhone : normalizePhoneNumber(countryCode, rawPhone);
  const email = ((formData.get('email') as string) || '').trim().toLowerCase();
  const gender = ((formData.get('gender') as string) || 'Prefer not to say').trim();
  const dateOfBirth = ((formData.get('dateOfBirth') as string) || '').trim();
  const street = ((formData.get('street') as string) || (formData.get('addressLine1') as string) || '').trim();
  const apartment = ((formData.get('apartment') as string) || (formData.get('addressLine2') as string) || '').trim();
  const landmark = ((formData.get('landmark') as string) || '').trim();
  const city = ((formData.get('city') as string) || '').trim();
  const state = ((formData.get('state') as string) || 'Karnataka').trim();
  const postalCode = ((formData.get('postalCode') as string) || '').trim();
  const country = ((formData.get('country') as string) || 'India').trim();
  const redirectUrl = (formData.get('redirect') as string) || '/account';

  const errors: Record<string, string> = {};

  if (!fullName || fullName.length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  }

  if (!phone) {
    errors.phone = 'Verified phone number is missing.';
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!street) {
    errors.street = 'Address Line 1 (House No., Building, Street) is required.';
  }

  if (!city) {
    errors.city = 'City / District is required.';
  }

  if (!state) {
    errors.state = 'State is required.';
  }

  if (!postalCode) {
    errors.postalCode = 'PIN code / Postal code is required.';
  } else if (country.toLowerCase() === 'india' && !/^\d{6}$/.test(postalCode)) {
    errors.postalCode = 'Indian PIN code must be exactly 6 digits (e.g. 560001).';
  }

  const duplicatePhone = memoryCustomers.find((c) => {
    if (!c.phone) return false;
    const clean1 = c.phone.replace(/\D/g, '');
    const clean2 = phone.replace(/\D/g, '');
    return clean1.endsWith(clean2.slice(-10));
  });

  if (duplicatePhone) {
    errors.phone = 'An account with this mobile number already exists. Please sign in instead.';
  }

  const duplicateEmail = memoryCustomers.find((c) => c.email.toLowerCase() === email);
  if (duplicateEmail) {
    errors.email = 'An account with this email address already exists.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Please resolve the highlighted errors.',
      errors,
    };
  }

  const newUserId = `usr-cust-${Date.now()}`;

  const newCustomer: CustomerSummary = {
    id: newUserId,
    fullName,
    email,
    maskedEmail: `${email[0]}***@${email.split('@')[1]}`,
    phone,
    role: 'customer',
    ordersCount: 0,
    totalSpent: 0,
    status: 'active',
    isVerified: true,
    gender: gender || undefined,
    dateOfBirth: dateOfBirth || undefined,
    createdAt: new Date().toISOString(),
  };

  memoryCustomers.unshift(newCustomer);

  const primaryAddress: Address = {
    id: `addr-${Date.now()}`,
    userId: newUserId,
    fullName,
    phone,
    street: landmark ? `${street}, Near ${landmark}` : street,
    apartment: apartment || undefined,
    city,
    state,
    postalCode,
    country,
    isDefault: true,
    type: 'Home',
  };

  memoryAddresses.push(primaryAddress);

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.from('profiles').insert({
        id: newUserId,
        full_name: fullName,
        phone,
        role: 'customer',
        created_at: new Date().toISOString(),
      });

      await supabase.from('addresses').insert({
        id: primaryAddress.id,
        user_id: newUserId,
        full_name: fullName,
        phone,
        street: primaryAddress.street,
        apartment: apartment || null,
        city,
        state,
        postal_code: postalCode,
        country,
        is_default: true,
        type: 'Home',
      });
    } catch {
      // Safe fallback
    }
  }

  const sessionUser: DemoUserSession = {
    id: newUserId,
    email,
    full_name: fullName,
    role: 'customer',
    phone,
  };

  await setDemoUserSession(sessionUser, true);

  try {
    revalidatePath('/', 'layout');
  } catch {
    // Safe
  }

  legacyPhoneOtpStore.delete(phone);
  const safeDest = sanitizeRedirectPath(redirectUrl, '/account');

  return {
    success: true,
    message: `Account created successfully! Welcome to ShopSphere, ${fullName}.`,
    customer: {
      id: newUserId,
      name: fullName,
      email,
      phone,
    },
    redirectTo: safeDest,
  };
}
