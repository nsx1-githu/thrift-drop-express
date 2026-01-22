-- Add optional payment proof fields for manual verification
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_payer_name TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Helpful index for admin search/filtering (optional)
CREATE INDEX IF NOT EXISTS idx_orders_payment_payer_name ON public.orders (payment_payer_name);