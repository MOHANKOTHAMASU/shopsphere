// -----------------------------------------------------------------------------
// src/lib/auth/demo-users.ts
// Demo credentials and session type definitions (No 'use server' directive)
// -----------------------------------------------------------------------------

export interface DemoUserSession {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'admin';
  phone?: string;
}

export const CUSTOMER_SESSION_COOKIE = 'shopsphere_customer_session';
export const ADMIN_SESSION_COOKIE = 'shopsphere_admin_session';
// Backward-compatible alias
export const DEMO_COOKIE_NAME = 'shopsphere_customer_session';

export const DEMO_USERS = {
  customer: {
    id: 'usr-demo-customer',
    email: 'customer@shopsphere.dev',
    full_name: 'Rahul Sharma',
    role: 'customer' as const,
    phone: '+91 98765 43210',
  },
  admin: {
    id: 'usr-admin-master',
    email: 'admin@shopsphere.dev',
    full_name: 'Store Administrator',
    role: 'admin' as const,
    phone: '+91 98765 43210',
  },
};
