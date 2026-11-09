# ShopSphere — Customer Database & Analytics Architecture Report

**Author:** Supabase Database Architect & Data Engineer  
**Date:** November 9, 2026  
**Status:** Validated  

---

## 1. Customer Database Schema

ShopSphere uses a relational database design backed by PostgreSQL and Supabase Auth:

### 1.1 `profiles` Table
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 1.2 `customer_activity_logs` Table
```sql
CREATE TABLE public.customer_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('ACCOUNT_CREATED', 'LOGIN', 'LOGOUT', 'ORDER_PLACED', 'ADDRESS_SAVED', 'PROFILE_UPDATED', 'WISHLIST_ADD')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_customer_activity_logs_user_id ON public.customer_activity_logs(user_id);
CREATE INDEX idx_customer_activity_logs_created_at ON public.customer_activity_logs(created_at DESC);
```

### 1.3 `addresses` Table
```sql
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'Home',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 2. Customer Analytics in Admin Dashboard

The Admin Management Console (`/admin/dashboard` and `/admin/users`) computes real-time customer analytics:

| Metric Name | Calculation Method | Purpose |
| :--- | :--- | :--- |
| **Total Registered Customers** | Count of all profile records in database + memory customers | Measures user acquisition |
| **Verified Customers** | `isVerified === true` (email confirmed) | Identifies trustworthy accounts |
| **Unverified Customers** | `isVerified === false` (pending confirmation) | Targets re-engagement campaigns |
| **Active Customers** | `status === 'active'` (unbanned) | Operational customer pool |
| **Suspended Customers** | `status === 'suspended'` (security lock) | Compliance review pool |
| **Customers with Purchases** | Count of distinct `userId`s in non-cancelled orders | Measures conversion rate |
| **New Customers Today** | Accounts created after 00:00:00 UTC today | Tracks daily marketing momentum |
| **New Customers (7 Days)** | Accounts created in the trailing 7 days | Tracks weekly user velocity |

---

## 3. Row-Level Security (RLS) Policies

1. **Profiles:**
   * `SELECT`: Authenticated users can view their own profile (`auth.uid() = id`). Administrators can view all profiles.
   * `UPDATE`: Authenticated users can update their own profile only (`auth.uid() = id`).
2. **Addresses:**
   * `ALL`: Restricted strictly to `auth.uid() = user_id`. No customer can view or update another customer's addresses.
3. **Orders:**
   * `SELECT`: Customers can only query orders where `user_id = auth.uid()`. Administrators can query all orders.
