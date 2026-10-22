'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { validateSignupData, validateLoginData, isValidEmail, isValidPassword } from './validation';
import { sanitizeRedirectPath } from '@/lib/security/redirects';
import { checkRateLimit } from '@/lib/security/rate-limit';

import { DEMO_USERS, DEMO_COOKIE_NAME, type DemoUserSession } from './demo-users';
import { memoryCustomers, memoryAddresses } from '@/lib/admin/store';
import { CustomerSummary } from '@/types/ecommerce';

export type { DemoUserSession };

export interface AuthActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  redirectTo?: string;
}

let memoryDemoSession: DemoUserSession | null = null;

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
export async function setDemoUserSession(user: DemoUserSession): Promise<void> {
  memoryDemoSession = user;
  try {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE_NAME, JSON.stringify(user), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
        'Registration successful! Please check your email inbox to verify your email address before signing in.',
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
}

/**
 * Server Action: Customer Login (Sign In)
 */
export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';
  const redirectParam = (formData.get('redirect') as string) || '/account';

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

  // Graceful fallback for Demo / Dev Mode when Supabase keys are not set
  if (!isSupabaseConfigured()) {
    const requestedRole = (formData.get('role') as string) || '';
    const isStoreAdmin =
      requestedRole === 'admin' ||
      redirectParam.startsWith('/admin') ||
      cleanEmail === 'admin@shopsphere.dev' ||
      cleanEmail === 'kmvsubbarao28@gmail.com';

    const foundCustomer = memoryCustomers.find((c) => c.email.toLowerCase() === cleanEmail);

    // Enforce credential verification: only registered customers or admin can sign in
    if (!isStoreAdmin && !foundCustomer && cleanEmail !== 'customer@shopsphere.dev') {
      return {
        success: false,
        message: 'Invalid email or password. Please verify and try again.',
      };
    }

    const demoUser: DemoUserSession = {
      id: isStoreAdmin ? DEMO_USERS.admin.id : (foundCustomer?.id || `usr-cust-${Date.now()}`),
      email: cleanEmail,
      full_name: isStoreAdmin
        ? (cleanEmail === 'kmvsubbarao28@gmail.com' ? 'K.M.V. Subbarao (Admin)' : DEMO_USERS.admin.full_name)
        : (foundCustomer?.fullName || cleanEmail.split('@')[0].replace(/[._-]/g, ' ') || 'Demo Customer'),
      role: isStoreAdmin ? 'admin' : 'customer',
      phone: foundCustomer?.phone || (isStoreAdmin ? DEMO_USERS.admin.phone : '+91 98765 43210'),
    };

    await setDemoUserSession(demoUser);
    safeRevalidate('/', 'layout');

    const fallbackDest = isStoreAdmin ? '/admin/dashboard' : '/';
    const destination = sanitizeRedirectPath(redirectParam, fallbackDest);

    return {
      success: true,
      message: 'Signed in successfully! Welcome to ShopSphere.',
      redirectTo: destination,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Provide generic, safe error messages without revealing email presence
    if (error.message.includes('Email not confirmed')) {
      return {
        success: false,
        message: 'Please verify your email address before signing in. Check your inbox for the confirmation link.',
      };
    }
    return {
      success: false,
      message: 'Invalid email or password. Please verify and try again.',
    };
  }

  safeRevalidate('/', 'layout');

  const destination = sanitizeRedirectPath(redirectParam, '/');

  return {
    success: true,
    message: 'Signed in successfully!',
    redirectTo: destination,
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
 * Server Action: Password Reset Request (Forgot Password)
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string) || '';
  const cleanEmail = email.trim().toLowerCase();

  // Rate Limiting: 3 password reset requests per 15 minutes
  const rateLimit = checkRateLimit(`forgot-pass:${cleanEmail || 'anonymous'}`, 3, 900);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many password reset requests. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
    };
  }

  if (!isValidEmail(email)) {
    return {
      success: false,
      errors: { email: 'Please enter a valid email address.' },
      message: 'Invalid email address provided.',
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      message: 'Demo Mode: Password reset email simulated! You can sign in directly using 1-Click Demo Sign In.',
    };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: 'Password reset instructions have been dispatched to your email address.',
  };
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
      message: 'Demo Mode: Password updated successfully. You may now sign in.',
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


