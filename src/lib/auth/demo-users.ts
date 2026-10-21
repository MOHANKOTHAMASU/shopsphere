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

export const DEMO_COOKIE_NAME = 'shopsphere_demo_session';

export const DEMO_USERS = {
  customer: {
    id: 'usr-demo-customer',
    email: 'customer@shopsphere.dev',
    full_name: 'Rahul Sharma',
    role: 'customer' as const,
    phone: '+91 98765 43210',
  },
  admin: {
    id: 'usr-demo-admin',
    email: 'admin@shopsphere.dev',
    full_name: 'Store Admin',
    role: 'admin' as const,
    phone: '+91 98765 00001',
  },
};
