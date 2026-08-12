-- =====================================================
-- EVERFRAME — COUPONS TABLE
-- Run this in your Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC NOT NULL DEFAULT 0,
    max_uses INT DEFAULT NULL,       -- NULL = unlimited
    usage_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public coupon read" ON public.coupons;
CREATE POLICY "Allow public coupon read" ON public.coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public coupon insert" ON public.coupons;
CREATE POLICY "Allow public coupon insert" ON public.coupons FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public coupon update" ON public.coupons;
CREATE POLICY "Allow public coupon update" ON public.coupons FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public coupon delete" ON public.coupons;
CREATE POLICY "Allow public coupon delete" ON public.coupons FOR DELETE USING (true);

-- Sample Coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_uses, is_active) VALUES
('WELCOME10', 'percentage', 10, 1000, 100, true),
('SAVE200', 'fixed', 200, 2000, 50, true),
('NEPAL15', 'percentage', 15, 1500, NULL, true)
ON CONFLICT (code) DO NOTHING;
