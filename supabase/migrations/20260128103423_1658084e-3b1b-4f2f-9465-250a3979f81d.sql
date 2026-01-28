-- Step 1: Add new enum values to payment_status
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'locked';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'payment_submitted';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'expired';

-- Step 2: Add reservation tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_product_ids UUID[] DEFAULT '{}';