import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Json } from '@/lib/supabase/types';
import { getDemoUserAction } from '@/lib/auth/actions';
import { AdminAuditLog } from '@/types/ecommerce';

import { memoryCustomers } from '@/lib/admin/store';

// In-memory audit log store for dev/testing when Supabase is not connected
export const memoryAuditLogs: AdminAuditLog[] = [
  {
    id: 'audit-001',
    adminId: 'usr-demo-admin',
    adminEmail: 'admin@shopsphere.dev',
    action: 'SYSTEM_BOOT',
    resourceType: 'system',
    resourceId: 'sys-core',
    details: { message: 'ShopSphere Admin security protocol initialized' },
    ipAddress: '127.0.0.1',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export interface VerifiedAdmin {
  adminId: string;
  adminEmail: string;
  adminName: string;
}

export interface AuthenticatedCaller {
  userId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  isVerified: boolean;
}

/**
 * Retrieve the current authenticated user session on the server
 * Checks Supabase Auth first, then falls back to verified demo cookie session
 */
export async function getAuthenticatedCaller(): Promise<AuthenticatedCaller | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle();

        const role = profile?.role === 'admin' ? 'admin' : 'customer';
        const isVerified = Boolean(
          user.email_confirmed_at || (user as unknown as { confirmed_at?: string })?.confirmed_at
        );
        const isBanned = Boolean(
          (user as unknown as { banned_until?: string })?.banned_until &&
            new Date((user as unknown as { banned_until: string }).banned_until) > new Date()
        );
        return {
          userId: user.id,
          email: user.email || '',
          name: profile?.full_name || (user.user_metadata?.full_name as string) || 'Customer',
          role,
          status: isBanned ? 'suspended' : 'active',
          isVerified,
        };
      }
    } catch {
      // Fall through to demo cookie session
    }
  }

  const demo = await getDemoUserAction();
  if (demo && demo.id) {
    const memoryCust = memoryCustomers.find(
      (c) => c.id === demo.id || c.email.toLowerCase() === demo.email.toLowerCase()
    );
    return {
      userId: demo.id,
      email: demo.email,
      name: demo.full_name,
      role: demo.role,
      status: memoryCust?.status || 'active',
      isVerified: memoryCust ? (memoryCust.isVerified ?? true) : true,
    };
  }

  return null;
}

/**
 * Asserts that the caller has a valid authenticated session.
 * Throws a descriptive error if the visitor is unauthenticated, suspended, or unverified.
 */
export async function assertAuthenticatedUser(options?: {
  requireVerified?: boolean;
}): Promise<AuthenticatedCaller> {
  const caller = await getAuthenticatedCaller();
  if (!caller) {
    throw new Error('Unauthorized: Authentication required to access this resource.');
  }

  // Account status check: Restricted / suspended accounts denied access
  if (caller.status === 'suspended') {
    throw new Error('Forbidden: Your account has been suspended. Please contact customer support.');
  }

  // Email verification check: Prevent unverified users from accessing features requiring verification
  if (options?.requireVerified && caller.role !== 'admin' && !caller.isVerified) {
    throw new Error('Please verify your email address before continuing.');
  }

  return caller;
}

/**
 * Helper to assert that caller is both authenticated and email-verified
 */
export async function assertVerifiedUser(): Promise<AuthenticatedCaller> {
  return assertAuthenticatedUser({ requireVerified: true });
}

/**
 * Server-side security guard that strictly asserts administrative privileges.
 * Throws a descriptive error if the caller is not an authenticated administrator.
 *
 * Prevents unauthorized requests from customers, unverified, suspended, or unauthenticated visitors.
 */
export async function assertAdmin(): Promise<VerifiedAdmin> {
  const caller = await getAuthenticatedCaller();
  if (!caller) {
    throw new Error('Unauthorized: Authentication required to access administrative resources.');
  }

  if (caller.role !== 'admin') {
    await logAdminAuditAction({
      adminEmail: caller.email || 'unknown@customer.com',
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      resourceType: 'admin_route',
      resourceId: caller.userId,
      details: { attemptedRole: caller.role, reason: 'Insufficient privileges' },
    });
    throw new Error('Forbidden: Administrative privileges required. Customers cannot access this operation.');
  }

  if (caller.status === 'suspended') {
    throw new Error('Forbidden: Administrative account has been suspended.');
  }

  return {
    adminId: caller.userId,
    adminEmail: caller.email,
    adminName: caller.name,
  };
}

/**
 * Safe non-throwing check of admin authorization
 */
export async function verifyAdminSession(): Promise<{
  authorized: boolean;
  admin?: VerifiedAdmin;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();
    return { authorized: true, admin };
  } catch (err: unknown) {
    return { authorized: false, error: (err as Error).message };
  }
}

/**
 * Records an immutable administrative audit log entry
 */
export async function logAdminAuditAction(params: {
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  const logEntry: AdminAuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    adminId: 'usr-admin',
    adminEmail: params.adminEmail,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    details: params.details,
    ipAddress: params.ipAddress || '127.0.0.1',
    createdAt: new Date().toISOString(),
  };

  memoryAuditLogs.unshift(logEntry);

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.from('admin_audit_logs').insert({
        admin_email: params.adminEmail,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId || null,
        details: params.details as unknown as Json,
        ip_address: params.ipAddress || null,
      });
    } catch {
      // Audit log fallback silently preserved in memory
    }
  }
}
