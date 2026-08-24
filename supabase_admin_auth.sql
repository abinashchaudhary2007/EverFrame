-- =====================================================
-- EVERFRAME ADMIN AUTHENTICATION & SETTINGS TABLE
-- Execute this SQL in your Supabase SQL Editor if you
-- want admin credentials synced across all devices.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
    id TEXT PRIMARY KEY DEFAULT 'admin_auth',
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read & write for admin_settings (or restrict if Supabase auth role is used)
CREATE POLICY "Allow public select on admin_settings"
    ON public.admin_settings FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on admin_settings"
    ON public.admin_settings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on admin_settings"
    ON public.admin_settings FOR UPDATE
    USING (true);
