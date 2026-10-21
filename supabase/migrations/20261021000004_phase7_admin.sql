-- =============================================================================
-- ShopSphere Marketplace: Phase 7 Admin Panel & Role-Based Access Migration
-- =============================================================================

-- 1. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
    max_discount_amount NUMERIC(10, 2) CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
    usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
    used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

-- Seed initial valid marketplace coupons if they don't already exist
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES
    ('SHOPSPHERE10', 'percentage', 10.00, 999.00, 500.00, true),
    ('WELCOME500', 'fixed', 500.00, 2999.00, NULL, true),
    ('FESTIVE20', 'percentage', 20.00, 1999.00, 1000.00, true)
ON CONFLICT (code) DO NOTHING;

-- 2. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON public.admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- 3. ROW LEVEL SECURITY (RLS) FOR ADMIN OPERATIONS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Coupons RLS Policies:
-- Public & customers can read active coupons to validate discounts
DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
    DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Anyone can view active coupons"
    ON public.coupons FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage coupons"
    ON public.coupons FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Audit Logs RLS Policies:
-- Only admins can read audit logs; inserts allowed for admins and security functions
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
    DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (public.is_admin());

-- Restrict product & category modifications strictly to admins
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
    DROP POLICY IF EXISTS "Admins can update products" ON public.products;
    DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
    DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
    DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
    DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can insert products"
    ON public.products FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
    ON public.products FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete products"
    ON public.products FOR DELETE
    USING (public.is_admin());

CREATE POLICY "Admins can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
    ON public.categories FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete categories"
    ON public.categories FOR DELETE
    USING (public.is_admin());
