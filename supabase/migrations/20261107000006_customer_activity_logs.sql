-- =============================================================================
-- MIGRATION: 20261107000006_customer_activity_logs.sql
-- Description: Customer Activity & Lifecycle Security Audit Trail
-- Tracks Account Created, Login, Logout, and What Customers Buy with Date/Time
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'ACCOUNT_CREATED', 'LOGIN', 'LOGOUT', 'ORDER_PLACED', 'PROFILE_UPDATED', 'ADDRESS_SAVED'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_activity_user_id ON public.customer_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_action ON public.customer_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_customer_activity_created_at ON public.customer_activity_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.customer_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can view all logs; users can view their own activity history
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.customer_activity_logs;
CREATE POLICY "Users can view own activity logs" ON public.customer_activity_logs
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "System and users can insert activity logs" ON public.customer_activity_logs;
CREATE POLICY "System and users can insert activity logs" ON public.customer_activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

