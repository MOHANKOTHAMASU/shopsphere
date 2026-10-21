import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Json } from '@/lib/supabase/types';
import { getDemoUserAction } from '@/lib/auth/actions';
import { AdminAuditLog } from '@/types/ecommerce';

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

/**
 * Server-side security guard that strictly asserts administrative privileges.
 * Throws a descriptive error if the caller is not an authenticated administrator.
 *
 * Prevents unauthorized requests from customers or unauthenticated visitors.
 */
export async function assertAdmin(): Promise<VerifiedAdmin> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Unauthorized: Authentication required to access administrative resources.');
      }

      // Query profiles table for verified role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (error || !profile || profile.role !== 'admin') {
        // Record unauthorized attempt for security monitoring
        await logAdminAuditAction({
          adminEmail: user.email || 'unknown@customer.com',
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          resourceType: 'admin_route',
          resourceId: user.id,
          details: { attemptedRole: profile?.role || 'none', reason: 'Insufficient privileges' },
        });

        throw new Error('Forbidden: Administrative privileges required. Customers cannot access this operation.');
      }

      return {
        adminId: user.id,
        adminEmail: user.email || 'admin@shopsphere.in',
        adminName: profile.full_name || 'Store Administrator',
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith('Forbidden')) {
        throw err;
      }
      if (err instanceof Error && err.message.startsWith('Unauthorized')) {
        throw err;
      }
      throw new Error(`Admin authorization failed: ${(err as Error).message}`);
    }
  }

  // Graceful Demo / Development Mode verification
  const demoUser = await getDemoUserAction();
  if (!demoUser) {
    throw new Error('Unauthorized: Authentication required to access administrative resources.');
  }

  if (demoUser.role !== 'admin') {
    throw new Error('Forbidden: Administrative privileges required. Customers cannot access this operation.');
  }

  return {
    adminId: demoUser.id,
    adminEmail: demoUser.email,
    adminName: demoUser.full_name,
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
