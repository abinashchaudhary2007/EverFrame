-- =====================================================
-- EVERFRAME PRODUCT REVIEWS & COMMENTS SCHEMA
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id BIGINT,
    product_slug TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert reviews" ON public.reviews;
CREATE POLICY "Allow public insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete reviews" ON public.reviews;
CREATE POLICY "Allow public delete reviews" ON public.reviews
  FOR DELETE USING (true);

-- 4. Insert initial sample reviews for starter catalog
INSERT INTO public.reviews (product_slug, user_name, rating, title, comment, is_verified, created_at)
VALUES
('classic-wooden-frame', 'Aarav Sharma', 5, 'Superior craftsmanship!', 'The oak wood finish is stunning and arrived perfectly packaged in Kathmandu within 2 days.', true, NOW() - INTERVAL '3 days'),
('classic-wooden-frame', 'Pooja Thapa', 5, 'Beautiful family portrait frame', 'Ordered this for our 5th anniversary portrait. Looks very premium on the living room wall.', true, NOW() - INTERVAL '8 days'),
('premium-black-frame', 'Sujan Shrestha', 4, 'Minimalist and sleek', 'Matte finish looks modern. Great value for the price.', true, NOW() - INTERVAL '5 days'),
('couple-memory-frame', 'Bikash & Anjali', 5, 'Best gift ever ❤️', 'Custom engraved with our wedding date. She absolutely loved it!', true, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;
