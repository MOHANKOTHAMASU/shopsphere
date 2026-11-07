// -----------------------------------------------------------------------------
// src/lib/security/activity-logger.ts
// ShopSphere Customer Activity & Lifecycle Security Logger
// Tracks Account Creation, Login, Logout, and Purchases with Date & Time
// -----------------------------------------------------------------------------

import { CustomerActivityLog } from '@/types/ecommerce';
import { memoryCustomerActivities, memoryCustomers } from '@/lib/admin/store';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export interface LogCustomerActivityInput {
  userId: string;
  userEmail: string;
  action: CustomerActivityLog['action'];
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Persists customer lifecycle events (Creation, Login, Logout, Purchases)
 * Writes both to in-memory audit store and Supabase database (when connected)
 */
export async function logCustomerActivity(input: LogCustomerActivityInput): Promise<CustomerActivityLog> {
  const timestamp = new Date().toISOString();
  const activity: CustomerActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: input.userId,
    userEmail: input.userEmail.toLowerCase().trim(),
    action: input.action,
    details: input.details || {},
    ipAddress: input.ipAddress || '127.0.0.1',
    userAgent: input.userAgent || 'ShopSphere-Web/1.0',
    createdAt: timestamp,
  };

  // 1. Commit to in-memory store
  memoryCustomerActivities.unshift(activity);

  // Keep memory capped at 500 records to prevent memory exhaustion
  if (memoryCustomerActivities.length > 500) {
    memoryCustomerActivities.length = 500;
  }

  // 2. Update customer metadata in memoryCustomers
  const customer = memoryCustomers.find(
    (c) => c.id === input.userId || c.email.toLowerCase() === input.userEmail.toLowerCase()
  );
  if (customer) {
    if (input.action === 'LOGIN') {
      customer.lastLoginAt = timestamp;
    } else if (input.action === 'LOGOUT') {
      customer.lastLogoutAt = timestamp;
    }
  }

  // 3. Persist to Supabase database if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('customer_activity_logs').insert({
        user_id: input.userId.startsWith('usr-') ? null : input.userId, // Valid UUID or null
        user_email: input.userEmail,
        action: input.action,
        details: input.details || {},
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
        created_at: timestamp,
      });
    } catch {
      // Non-fatal fallback to in-memory logging
    }
  }

  return activity;
}

/**
 * Retrieves customer activity history for administrative and account audit
 */
export async function getCustomerActivities(userId?: string): Promise<CustomerActivityLog[]> {
  if (userId) {
    return memoryCustomerActivities.filter((a) => a.userId === userId);
  }
  return [...memoryCustomerActivities];
}
