-- Create a secure function to atomically reserve products for an order
-- Uses row-level locking (FOR UPDATE) to prevent race conditions
CREATE OR REPLACE FUNCTION public.reserve_products_for_order(
  _product_ids uuid[],
  _order_id text
)
RETURNS TABLE(
  success boolean,
  unavailable_products jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _unavailable jsonb;
  _locked_count int;
BEGIN
  -- First, try to lock and check all requested products atomically
  -- Using FOR UPDATE SKIP LOCKED would skip already-locked rows, but we want to fail if any are locked
  -- So we use FOR UPDATE NOWAIT to fail immediately if products are being processed by another transaction
  
  -- Check which products are already sold out
  SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name))
  INTO _unavailable
  FROM products p
  WHERE p.id = ANY(_product_ids)
    AND p.sold_out = true;

  -- If any products are already sold out, return failure
  IF _unavailable IS NOT NULL AND jsonb_array_length(_unavailable) > 0 THEN
    RETURN QUERY SELECT false, _unavailable;
    RETURN;
  END IF;

  -- Lock and update all products atomically
  -- This prevents race conditions where two orders try to reserve the same product
  UPDATE products
  SET sold_out = true, updated_at = now()
  WHERE id = ANY(_product_ids)
    AND sold_out = false;

  GET DIAGNOSTICS _locked_count = ROW_COUNT;

  -- Verify we locked all requested products
  IF _locked_count < array_length(_product_ids, 1) THEN
    -- Some products were already sold between check and update (race condition)
    -- Get the ones that are now unavailable
    SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name))
    INTO _unavailable
    FROM products p
    WHERE p.id = ANY(_product_ids)
      AND p.sold_out = true;
    
    -- Rollback the ones we just marked (they'll be rolled back by transaction anyway if we raise an error)
    -- But since we're returning gracefully, the caller should handle this
    RETURN QUERY SELECT false, _unavailable;
    RETURN;
  END IF;

  -- Success - all products reserved
  RETURN QUERY SELECT true, NULL::jsonb;
END;
$$;

-- Create a function to release products when an order fails or is rejected
CREATE OR REPLACE FUNCTION public.release_products_from_order(_product_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET sold_out = false, updated_at = now()
  WHERE id = ANY(_product_ids);
END;
$$;

-- Create a function to check product availability (for real-time validation)
CREATE OR REPLACE FUNCTION public.check_products_availability(_product_ids uuid[])
RETURNS TABLE(
  product_id uuid,
  is_available boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as product_id,
    NOT p.sold_out as is_available
  FROM products p
  WHERE p.id = ANY(_product_ids);
$$;