// -----------------------------------------------------------------------------
// src/lib/admin/store.ts
// In-Memory Data Store for Admin & Fallback Operations (No 'use server' directive)
// -----------------------------------------------------------------------------

import { DEVELOPMENT_SEED_PRODUCTS } from '@/data/seed-products';
import { DEVELOPMENT_SEED_CATEGORIES } from '@/data/seed-categories';
import {
  Product,
  Category,
  CouponRecord,
  CustomerSummary,
} from '@/types/ecommerce';

// Active Products repository (deep copy of seed products)
export const memoryProducts: Product[] = DEVELOPMENT_SEED_PRODUCTS.map((p) => ({ ...p }));

// Active Categories repository
export const memoryCategories: Category[] = DEVELOPMENT_SEED_CATEGORIES.map((c) => ({ ...c }));

// Active Coupons repository
export const memoryCoupons: CouponRecord[] = [
  {
    id: 'coup-001',
    code: 'SHOPSPHERE10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 999,
    maxDiscountAmount: 500,
    usageLimit: 1000,
    usedCount: 42,
    isActive: true,
    startsAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 24 * 60).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: 'coup-002',
    code: 'WELCOME500',
    discountType: 'fixed',
    discountValue: 500,
    minOrderAmount: 2999,
    maxDiscountAmount: 500,
    usageLimit: 500,
    usedCount: 18,
    isActive: true,
    startsAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 24 * 90).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: 'coup-003',
    code: 'FESTIVE20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 1999,
    maxDiscountAmount: 1000,
    usageLimit: 250,
    usedCount: 5,
    isActive: true,
    startsAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 24 * 20).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
];

// Active Customers repository
export const memoryCustomers: CustomerSummary[] = [
  {
    id: 'usr-customer-01',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    maskedEmail: 'r*****.s*****@example.com',
    phone: '+91 98765 43210',
    role: 'customer',
    ordersCount: 2,
    totalSpent: 53480,
    lastOrderDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
  },
  {
    id: 'usr-customer-02',
    fullName: 'Priya Patel',
    email: 'priya.patel@example.com',
    maskedEmail: 'p****.p****@example.com',
    phone: '+91 98112 34567',
    role: 'customer',
    ordersCount: 1,
    totalSpent: 8495,
    lastOrderDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
  },
  {
    id: 'usr-customer-03',
    fullName: 'Vikram Joshi',
    email: 'vikram.j@example.com',
    maskedEmail: 'v*****.j@example.com',
    phone: '+91 97654 32109',
    role: 'customer',
    ordersCount: 1,
    totalSpent: 3248,
    lastOrderDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: 'usr-demo-customer',
    fullName: 'Rahul Sharma (Demo)',
    email: 'customer@shopsphere.dev',
    maskedEmail: 'c*******@shopsphere.dev',
    phone: '+91 98765 43210',
    role: 'customer',
    ordersCount: 1,
    totalSpent: 26990,
    lastOrderDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
];
