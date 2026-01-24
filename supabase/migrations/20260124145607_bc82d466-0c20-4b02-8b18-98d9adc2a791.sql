-- Add auto-incrementing order number column (never resets)
-- This provides a permanent sequential order counter

-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- Add order_number column with default from sequence
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_number bigint NOT NULL DEFAULT nextval('public.order_number_seq');

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- Backfill existing orders with sequential numbers based on created_at
-- This ensures existing orders get proper numbers in chronological order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.orders
  WHERE order_number = 0 OR order_number IS NULL
)
UPDATE public.orders o
SET order_number = n.rn
FROM numbered n
WHERE o.id = n.id;

-- Reset sequence to continue after highest existing order
SELECT setval('public.order_number_seq', COALESCE((SELECT MAX(order_number) FROM public.orders), 0) + 1, false);