-- Revert the unnecessary policy and functions - the edge function already handles this securely
DROP POLICY IF EXISTS "Orders can be inserted via backend" ON public.orders;
DROP FUNCTION IF EXISTS public.can_insert_order();
DROP FUNCTION IF EXISTS public.order_insert_secret();