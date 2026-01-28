-- Step 1: Create a function to check if a product has an active lock
CREATE OR REPLACE FUNCTION public.is_product_locked(_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.orders
    WHERE _product_id = ANY(locked_product_ids)
      AND payment_status = 'locked'
      AND reservation_expires_at > now()
  );
END;
$$;

-- Step 2: Create a function to reserve products for a new order (with lock check)
CREATE OR REPLACE FUNCTION public.create_order_reservation(
  _customer_name TEXT,
  _customer_phone TEXT,
  _customer_address TEXT,
  _pincode TEXT,
  _state TEXT,
  _city TEXT,
  _area TEXT,
  _landmark TEXT,
  _items JSONB,
  _subtotal INTEGER,
  _shipping INTEGER,
  _total INTEGER,
  _payment_method TEXT,
  _product_ids UUID[]
)
RETURNS TABLE(
  success BOOLEAN,
  order_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  unavailable_products JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_id TEXT;
  _expires_at TIMESTAMP WITH TIME ZONE;
  _unavailable JSONB;
BEGIN
  -- Check if any products are already locked or sold out
  SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name))
  INTO _unavailable
  FROM products p
  WHERE p.id = ANY(_product_ids)
    AND (
      p.sold_out = true 
      OR EXISTS (
        SELECT 1 FROM orders o 
        WHERE p.id = ANY(o.locked_product_ids) 
          AND o.payment_status = 'locked' 
          AND o.reservation_expires_at > now()
      )
    );

  IF _unavailable IS NOT NULL AND jsonb_array_length(_unavailable) > 0 THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE, _unavailable;
    RETURN;
  END IF;

  -- Generate order ID and set expiry (10 minutes from now)
  _order_id := 'THR' || upper(to_hex(extract(epoch from now())::bigint)) || upper(substring(gen_random_uuid()::text, 1, 4));
  _expires_at := now() + interval '10 minutes';

  -- Create the order with locked status
  INSERT INTO orders (
    order_id,
    customer_name,
    customer_phone,
    customer_address,
    pincode,
    state,
    city,
    area,
    landmark,
    items,
    subtotal,
    shipping,
    total,
    payment_method,
    payment_status,
    reserved_at,
    reservation_expires_at,
    locked_product_ids
  ) VALUES (
    _order_id,
    _customer_name,
    _customer_phone,
    _customer_address,
    _pincode,
    _state,
    _city,
    _area,
    _landmark,
    _items,
    _subtotal,
    _shipping,
    _total,
    _payment_method,
    'locked',
    now(),
    _expires_at,
    _product_ids
  );

  RETURN QUERY SELECT true, _order_id, _expires_at, NULL::JSONB;
END;
$$;

-- Step 3: Create a function to submit payment for a locked order
CREATE OR REPLACE FUNCTION public.submit_order_payment(
  _order_id TEXT,
  _customer_phone TEXT,
  _payment_reference TEXT,
  _payment_payer_name TEXT,
  _payment_proof_url TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order RECORD;
BEGIN
  -- Find and validate the order
  SELECT * INTO _order
  FROM orders
  WHERE order_id = upper(trim(_order_id))
    AND customer_phone = trim(_customer_phone)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Order not found or phone number does not match'::TEXT;
    RETURN;
  END IF;

  -- Check if order is still in locked state
  IF _order.payment_status != 'locked' THEN
    RETURN QUERY SELECT false, ('Order is no longer in reserved state. Current status: ' || _order.payment_status)::TEXT;
    RETURN;
  END IF;

  -- Check if reservation has expired
  IF _order.reservation_expires_at < now() THEN
    -- Auto-expire the order
    UPDATE orders 
    SET payment_status = 'expired'
    WHERE id = _order.id;
    
    RETURN QUERY SELECT false, 'Reservation has expired. Please place a new order.'::TEXT;
    RETURN;
  END IF;

  -- Update order with payment details
  UPDATE orders
  SET 
    payment_status = 'payment_submitted',
    razorpay_payment_id = trim(_payment_reference),
    payment_payer_name = trim(_payment_payer_name),
    payment_proof_url = _payment_proof_url,
    updated_at = now()
  WHERE id = _order.id;

  -- Mark products as sold_out now that payment is submitted
  UPDATE products
  SET sold_out = true, updated_at = now()
  WHERE id = ANY(_order.locked_product_ids);

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

-- Step 4: Create a function to expire stale reservations
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _expired_count INTEGER;
BEGIN
  UPDATE orders
  SET payment_status = 'expired', updated_at = now()
  WHERE payment_status = 'locked'
    AND reservation_expires_at < now();
  
  GET DIAGNOSTICS _expired_count = ROW_COUNT;
  
  RETURN _expired_count;
END;
$$;

-- Step 5: Create a function to check product availability (including locks)
CREATE OR REPLACE FUNCTION public.check_product_availability_with_locks(_product_ids UUID[])
RETURNS TABLE(product_id UUID, is_available BOOLEAN, is_locked BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    NOT p.sold_out as is_available,
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE p.id = ANY(o.locked_product_ids) 
        AND o.payment_status = 'locked' 
        AND o.reservation_expires_at > now()
    ) as is_locked
  FROM products p
  WHERE p.id = ANY(_product_ids);
END;
$$;

-- Step 6: Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.is_product_locked(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_reservation(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, INTEGER, INTEGER, INTEGER, TEXT, UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_order_payment(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_reservations() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_product_availability_with_locks(UUID[]) TO anon, authenticated;