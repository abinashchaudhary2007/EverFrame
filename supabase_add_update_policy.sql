-- Fix: Allow public UPDATE on orders table so admin can update order_status
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard

DROP POLICY IF EXISTS "Allow public order update" ON public.orders;
CREATE POLICY "Allow public order update" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- Also allow order_items select for track order feature
DROP POLICY IF EXISTS "Allow public order_items selection" ON public.order_items;
CREATE POLICY "Allow public order_items selection" ON public.order_items FOR SELECT USING (true);
