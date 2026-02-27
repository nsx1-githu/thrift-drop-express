
DROP FUNCTION IF EXISTS public.track_order(text, text);

CREATE OR REPLACE FUNCTION public.track_order(_order_id text, _customer_phone text)
 RETURNS TABLE(id uuid, order_id text, customer_name text, customer_phone text, customer_address text, items jsonb, subtotal integer, shipping integer, total integer, payment_method text, payment_status payment_status, shipping_status text, courier_name text, tracking_url text, awb_number text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
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
    o.shipping_status,
    o.courier_name,
    o.tracking_url,
    o.awb_number,
    o.created_at
  FROM public.orders o
  WHERE o.order_id = upper(trim(_order_id))
    AND o.customer_phone = trim(_customer_phone)
  LIMIT 1;
END;
$function$;
