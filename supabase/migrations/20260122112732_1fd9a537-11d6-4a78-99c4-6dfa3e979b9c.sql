-- Tighten public access to store_settings (row-level)
DO $$
BEGIN
  -- Drop overly-permissive policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_settings'
      AND policyname = 'Settings are viewable by everyone'
  ) THEN
    EXECUTE 'DROP POLICY "Settings are viewable by everyone" ON public.store_settings';
  END IF;
END $$;

-- Public can read ONLY a safe allowlist of settings rows
CREATE POLICY "Public can read safe store settings"
ON public.store_settings
FOR SELECT
USING (
  key = ANY (ARRAY[
    'store_name',
    'contact_email',
    'instagram_id',
    'upi_id',
    'upi_qr_image',
    'seo_title',
    'seo_description',
    'seo_og_image_url',
    'theme_mode',
    'theme_primary',
    'theme_primary_foreground',
    'theme_accent',
    'theme_accent_foreground',
    'theme_background',
    'theme_foreground',
    'theme_card',
    'theme_card_foreground',
    'theme_muted',
    'theme_muted_foreground',
    'theme_border',
    'theme_ring',
    'theme_font_sans',
    'theme_font_mono',
    'theme_logo_url'
  ])
);

-- Admins can read all settings
CREATE POLICY "Admins can read all store settings"
ON public.store_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));


-- Lock down orders: remove unauthenticated direct INSERTs (orders should be created via backend function)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'Anyone can create orders'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can create orders" ON public.orders';
  END IF;
END $$;


-- Secure order tracking: allow public to fetch ONLY their own order by (order_id + phone)
-- This avoids exposing a general SELECT policy on the orders table.
CREATE OR REPLACE FUNCTION public.track_order(_order_id text, _customer_phone text)
RETURNS TABLE (
  id uuid,
  order_id text,
  customer_name text,
  customer_phone text,
  customer_address text,
  items jsonb,
  subtotal integer,
  shipping integer,
  total integer,
  payment_method text,
  payment_status public.payment_status,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic input validation to reduce abuse
  IF _order_id IS NULL OR length(trim(_order_id)) < 4 OR length(trim(_order_id)) > 32 THEN
    RETURN;
  END IF;

  IF _customer_phone IS NULL OR length(trim(_customer_phone)) < 8 OR length(trim(_customer_phone)) > 15 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.order_id,
    o.customer_name,
    o.customer_phone,
    o.customer_address,
    o.items,
    o.subtotal,
    o.shipping,
    o.total,
    o.payment_method,
    o.payment_status,
    o.created_at
  FROM public.orders o
  WHERE o.order_id = upper(trim(_order_id))
    AND o.customer_phone = trim(_customer_phone)
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.track_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;