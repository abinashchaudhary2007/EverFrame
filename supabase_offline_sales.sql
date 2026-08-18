-- =====================================================
-- EVERFRAME OFFLINE SALES SUPABASE DATABASE SCHEMA
-- Execute this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. Create Offline Sales Table
CREATE TABLE IF NOT EXISTS public.offline_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    frame_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'photo-frames',
    cost_price NUMERIC NOT NULL DEFAULT 0,
    sold_price NUMERIC NOT NULL DEFAULT 0,
    profit NUMERIC NOT NULL DEFAULT 0,
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration for existing tables: Add category column if missing
ALTER TABLE public.offline_sales ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'photo-frames';


-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.offline_sales ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for public/admin access
DROP POLICY IF EXISTS "Allow public offline_sales selection" ON public.offline_sales;
CREATE POLICY "Allow public offline_sales selection" ON public.offline_sales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public offline_sales insertion" ON public.offline_sales;
CREATE POLICY "Allow public offline_sales insertion" ON public.offline_sales FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public offline_sales update" ON public.offline_sales;
CREATE POLICY "Allow public offline_sales update" ON public.offline_sales FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public offline_sales deletion" ON public.offline_sales;
CREATE POLICY "Allow public offline_sales deletion" ON public.offline_sales FOR DELETE USING (true);
