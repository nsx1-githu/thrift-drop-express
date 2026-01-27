-- Add a safe INSERT policy for orders without exposing PII via public SELECT.
-- This allows order creation only when a secret header is present (intended for trusted backend function usage).

-- Helper: read the secret from store_settings (admin-only; accessed via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.order_insert_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value
  FROM public.store_settings
  WHERE key = 'order_insert_secret'
  LIMIT 1
$$;

-- Helper: validate inserts originate from trusted backend by comparing a request header to the stored secret
CREATE OR REPLACE FUNCTION public.can_insert_order()
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  headers jsonb;
  supplied text;
  expected text;
BEGIN
  expected := public.order_insert_secret();
  IF expected IS NULL OR length(expected) < 32 THEN
    RETURN false;
  END IF;

  headers := COALESCE(current_setting('request.headers', true), '{}')::jsonb;
  supplied := headers ->> 'x-order-secret';

  -- Fallback for environments that normalize header keys differently
  IF supplied IS NULL THEN
    supplied := headers ->> 'x_order_secret';
  END IF;

  RETURN supplied = expected;
END;
$$;

-- Create/replace the INSERT policy for public checkout
DROP POLICY IF EXISTS "Orders can be inserted via backend" ON public.orders;
CREATE POLICY "Orders can be inserted via backend"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (public.can_insert_order());
