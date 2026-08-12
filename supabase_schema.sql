-- =====================================================
-- EVERFRAME SUPABASE DATABASE SCHEMA & INITIAL DATA
-- Execute this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Categories
INSERT INTO public.categories (id, name, slug) VALUES
('photo-frames', 'Photo Frames', 'photo-frames'),
('wedding-frames', 'Wedding Frames', 'wedding-frames'),
('wall-art', 'Wall Art', 'wall-art'),
('personalized-gifts', 'Personalized Gifts', 'personalized-gifts'),
('collage-frames', 'Collage Frames', 'collage-frames')
ON CONFLICT (id) DO NOTHING;

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT REFERENCES public.categories(id),
    category_label TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    discount NUMERIC,
    badge TEXT,
    rating NUMERIC DEFAULT 5.0,
    review_count INT DEFAULT 0,
    stock INT DEFAULT 50,
    description TEXT,
    images TEXT[] NOT NULL,
    material TEXT,
    frame_type TEXT,
    sizes TEXT[] NOT NULL,
    colors TEXT[] NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Sample Products into Supabase
INSERT INTO public.products (id, name, slug, category, category_label, price, original_price, discount, badge, rating, review_count, stock, description, images, material, frame_type, sizes, colors, is_featured) VALUES
(1, 'Classic Wooden Frame', 'classic-wooden-frame', 'photo-frames', 'PHOTO FRAMES', 1850, NULL, NULL, NULL, 4.8, 312, 50, 'A timeless wooden frame crafted from premium oak wood.', ARRAY['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80'], 'Oak Wood', 'classic', ARRAY['4x6', '5x7', '8x10', '11x14'], ARRAY['Natural', 'Walnut', 'White', 'Black'], TRUE),
(2, 'Premium Black Frame', 'premium-black-frame', 'photo-frames', 'PHOTO FRAMES', 2100, NULL, NULL, NULL, 4.6, 189, 30, 'Sleek matte black frame with a modern minimalist design.', ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'], 'Metal', 'modern', ARRAY['4x6', '5x7', '8x10', '11x14'], ARRAY['Matte Black', 'Gloss Black'], TRUE),
(3, 'Couple Memory Frame', 'couple-memory-frame', 'personalized-gifts', 'PERSONALIZED GIFTS', 2400, NULL, NULL, NULL, 4.9, 421, 25, 'A beautifully personalized frame for couples.', ARRAY['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80'], 'Wood', 'personalized', ARRAY['5x7', '8x10'], ARRAY['White', 'Natural', 'Gold'], TRUE),
(4, 'Family Photo Frame', 'family-photo-frame', 'photo-frames', 'PERSONALIZED GIFTS', 2750, NULL, NULL, NULL, 4.7, 203, 40, 'Capture your family precious moments in this handcrafted frame.', ARRAY['https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80'], 'Wood', 'classic', ARRAY['8x10', '11x14', '16x20'], ARRAY['Natural', 'Walnut', 'White'], TRUE),
(5, 'Wedding Collage Frame', 'wedding-collage-frame', 'wedding-frames', 'WEDDING FRAMES', 3200, 3800, 16, NULL, 4.9, 89, 20, 'Celebrate your special day with this stunning wedding collage frame.', ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80'], 'Wood with Gold Accents', 'collage', ARRAY['11x14', '16x20'], ARRAY['White Gold', 'Rose Gold', 'Silver'], FALSE),
(6, 'Polaroid Wall Set', 'polaroid-wall-set', 'wall-art', 'WALL ART', 1950, 2400, 19, 'BESTSELLER', 4.5, 334, 60, 'Create a gallery wall with this set of polaroid-style frames.', ARRAY['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80'], 'Acrylic', 'polaroid', ARRAY['4x4', '4x6'], ARRAY['White', 'Black', 'Clear'], FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'COD',
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    order_status TEXT NOT NULL DEFAULT 'Order Placed',
    subtotal NUMERIC NOT NULL,
    delivery_charge NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id BIGINT,
    product_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    quantity INT NOT NULL,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Custom Frame Uploads & Saved Customizations Table
CREATE TABLE IF NOT EXISTS public.customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    photo_url TEXT NOT NULL,
    frame_id TEXT NOT NULL,
    size_id TEXT NOT NULL,
    custom_text TEXT,
    estimated_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Row Level Security (RLS) Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customizations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products & categories
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);

-- Allow public order insertion and viewing
DROP POLICY IF EXISTS "Allow public order insertion" ON public.orders;
CREATE POLICY "Allow public order insertion" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public order selection" ON public.orders;
CREATE POLICY "Allow public order selection" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public order_items insertion" ON public.order_items;
CREATE POLICY "Allow public order_items insertion" ON public.order_items FOR INSERT WITH CHECK (true);

-- Allow admin to update order status
DROP POLICY IF EXISTS "Allow public order update" ON public.orders;
CREATE POLICY "Allow public order update" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- Allow reading order items (for track order)
DROP POLICY IF EXISTS "Allow public order_items selection" ON public.order_items;
CREATE POLICY "Allow public order_items selection" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public customization insertion" ON public.customizations;
CREATE POLICY "Allow public customization insertion" ON public.customizations FOR INSERT WITH CHECK (true);

-- 8. Storage Bucket setup for custom user photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('custom-photos', 'custom-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public storage upload access" ON storage.objects;
CREATE POLICY "Public storage upload access" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'custom-photos');

DROP POLICY IF EXISTS "Public storage read access" ON storage.objects;
CREATE POLICY "Public storage read access" ON storage.objects
FOR SELECT USING (bucket_id = 'custom-photos');
