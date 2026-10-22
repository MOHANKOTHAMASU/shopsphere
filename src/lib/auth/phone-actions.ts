'use server';

// -----------------------------------------------------------------------------
// src/lib/auth/phone-actions.ts
// ShopSphere Phone Number & OTP Authentication Actions (Amazon/Flipkart Flow)
// -----------------------------------------------------------------------------

import { revalidatePath } from 'next/cache';
import {
  memoryCustomers,
  memoryAddresses,
} from '@/lib/admin/store';
import { setDemoUserSession } from './actions';
import { type DemoUserSession } from './demo-users';
import { sanitizeRedirectPath } from '@/lib/security/redirects';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { CustomerSummary, Address } from '@/types/ecommerce';

// Phone OTP Session Store: normalizedPhone -> OTP State
interface PhoneOtpState {
  otp: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  lastSentAt: number;
}

// In-memory phone OTP registry (persisted in Node process)
const phoneOtpStore: Map<string, PhoneOtpState> = new Map();

import {
  normalizePhoneNumber,
  maskPhoneNumber,
  validatePhoneNumber,
} from './phone-utils';
import { DEVELOPMENT_TEST_OTP, isDevOtpAllowed } from './phone-config';



/**
 * STEP 1: Send OTP to Mobile Number
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

  const existing = phoneOtpStore.get(normalized);
  if (existing) {
    // 30-second cooldown rate limit
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

  // Check if phone belongs to an existing customer
  const cleanInputPhone = normalized.replace(/\D/g, '');
  const existingCustomer = memoryCustomers.find((c) => {
    if (!c.phone) return false;
    const cleanCustomerPhone = c.phone.replace(/\D/g, '');
    return cleanCustomerPhone.endsWith(cleanInputPhone.slice(-10));
  });

  // Generate 6-digit OTP
  // In development/test mode, use standard predictable code or pseudo-random code
  const isDev = isDevOtpAllowed();
  const otp = isDev ? DEVELOPMENT_TEST_OTP : Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP with 10-minute expiry
  phoneOtpStore.set(normalized, {
    otp,
    expiresAt: now + 10 * 60 * 1000,
    attempts: 0,
    verified: false,
    lastSentAt: now,
  });

  console.log(`[ShopSphere Phone Auth] OTP for ${normalized}: ${otp} (Expires in 10 minutes)`);

  const masked = maskPhoneNumber(normalized);

  return {
    success: true,
    message: `Verification code sent to ${masked}.`,
    maskedPhone: masked,
    normalizedPhone: normalized,
    testOtp: isDev ? otp : undefined,
    isNewUser: !existingCustomer,
  };
}

/**
 * STEP 2: Verify OTP
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
  const state = phoneOtpStore.get(normalized);

  if (!state) {
    return {
      success: false,
      message: 'No active OTP request found for this phone number. Please request a new code.',
      error: 'OTP not requested',
    };
  }

  const now = Date.now();
  if (now > state.expiresAt) {
    phoneOtpStore.delete(normalized);
    return {
      success: false,
      message: 'This verification code has expired. Please request a new OTP.',
      error: 'OTP expired',
    };
  }

  // Check attempt limits (brute-force prevention: max 5 attempts)
  if (state.attempts >= 5) {
    phoneOtpStore.delete(normalized);
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. For your security, please request a new OTP.',
      error: 'Max attempts exceeded',
    };
  }

  state.attempts += 1;

  // Validate OTP code (matches stored OTP or development master test OTP in dev)
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

  // Mark phone as verified
  state.verified = true;

  // Check if an existing customer profile exists with this verified phone number
  let existingCustomer: CustomerSummary | undefined = memoryCustomers.find((c) => {
    if (!c.phone) return false;
    const cleanCustomerPhone = c.phone.replace(/\D/g, '');
    const cleanInputPhone = normalized.replace(/\D/g, '');
    return cleanCustomerPhone.endsWith(cleanInputPhone.slice(-10));
  });

  // Also query Supabase if configured
  if (!existingCustomer && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', normalized)
        .single();

      if (data) {
        existingCustomer = {
          id: data.id,
          fullName: data.full_name || 'Customer',
          email: `${normalized}@shopsphere.in`,
          maskedEmail: 'c***@***',
          phone: data.phone || undefined,
          role: data.role === 'admin' ? 'admin' : 'customer',
          ordersCount: 0,
          totalSpent: 0,
          status: 'active',
          isVerified: true,
          createdAt: data.created_at,
        };
      }
    } catch {
      // Supabase query fallback
    }
  }

  const safeDest = sanitizeRedirectPath(redirectUrl, '/account');

  if (existingCustomer) {
    // Returning Customer -> Authenticate session directly
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
      // safe in non-HTTP scripts
    }

    // Clean up OTP state
    phoneOtpStore.delete(normalized);

    return {
      success: true,
      isNewUser: false,
      message: `Welcome back, ${existingCustomer.fullName}!`,
      redirectTo: safeDest,
    };
  } else {
    // New Customer -> Redirect to personal details registration
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

  // Validate Postal Code: 6 digits for India
  if (!postalCode) {
    errors.postalCode = 'PIN code / Postal code is required.';
  } else if (country.toLowerCase() === 'india' && !/^\d{6}$/.test(postalCode)) {
    errors.postalCode = 'Indian PIN code must be exactly 6 digits (e.g. 560001).';
  }

  // Check for duplicate accounts by phone or email
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

  // Create Customer record in store
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

  // Create Primary Delivery Address
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

  // Persist to Supabase if configured
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

  // Establish Authenticated Session
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

  // Clear OTP state
  phoneOtpStore.delete(phone);

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
