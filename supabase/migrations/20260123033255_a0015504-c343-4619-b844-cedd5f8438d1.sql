-- Add manual refund tracking fields to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS refund_reference text NULL,
ADD COLUMN IF NOT EXISTS refund_note text NULL,
ADD COLUMN IF NOT EXISTS refunded_at timestamp with time zone NULL;

-- Basic index for admin filtering
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON public.orders (refund_status);
CREATE INDEX IF NOT EXISTS idx_orders_refunded_at ON public.orders (refunded_at);