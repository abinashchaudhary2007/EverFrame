-- =====================================================
-- EVERFRAME PRODUCT MANAGEMENT MIGRATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add is_available column (hide/show products)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- 2. Add updated_at column
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Update all existing products to be available by default
UPDATE public.products SET is_available = TRUE WHERE is_available IS NULL;

-- 4. Sync the id sequence with existing rows (prevents primary key unique constraint error)
SELECT setval(pg_get_serial_sequence('public.products', 'id'), COALESCE(max(id), 1)) FROM public.products;

-- 4. RLS: Allow admin to INSERT products (using permissive policy matching existing pattern)
DROP POLICY IF EXISTS "Allow admin product insert" ON public.products;
CREATE POLICY "Allow admin product insert" ON public.products
  FOR INSERT WITH CHECK (true);

-- 5. RLS: Allow admin to UPDATE products
DROP POLICY IF EXISTS "Allow admin product update" ON public.products;
CREATE POLICY "Allow admin product update" ON public.products
  FOR UPDATE USING (true) WITH CHECK (true);

-- 6. RLS: Allow admin to DELETE products
DROP POLICY IF EXISTS "Allow admin product delete" ON public.products;
CREATE POLICY "Allow admin product delete" ON public.products
  FOR DELETE USING (true);

-- 7. Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage policies for product-images bucket
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
CREATE POLICY "Product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Product images admin upload" ON storage.objects;
CREATE POLICY "Product images admin upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Product images admin update" ON storage.objects;
CREATE POLICY "Product images admin update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Product images admin delete" ON storage.objects;
CREATE POLICY "Product images admin delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');

-- Done! Your products table now supports:
-- - is_available: hide/show products from customer-facing pages
-- - updated_at: track when products were last modified
-- - Admin CRUD operations via RLS policies
-- - product-images storage bucket for product photo uploads
