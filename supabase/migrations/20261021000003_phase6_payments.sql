-- =============================================================================
-- ShopSphere Marketplace: Phase 6 Razorpay Payment Gateway Migration
-- =============================================================================

-- 1. Create payments audit and transaction records table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    payment_method VARCHAR(30) NOT NULL DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    error_code VARCHAR(100),
    error_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create payment_events table for webhook idempotency
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for rapid queries and idempotency lookups
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_id ON public.payment_events(event_id);

-- 4. Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Customer can view their own payment records; admins can view all
DO $$ BEGIN
    DROP POLICY IF EXISTS "Customers can view their own payments" ON public.payments;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Customers can view their own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

-- Webhook events are restricted to service role / admin only
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins have access to payment events" ON public.payment_events;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins have access to payment events"
    ON public.payment_events FOR ALL
    USING (public.is_admin());
