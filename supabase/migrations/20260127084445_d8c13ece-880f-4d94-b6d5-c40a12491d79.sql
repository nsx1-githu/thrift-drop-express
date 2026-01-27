-- Add is_featured column to products table
ALTER TABLE public.products ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Create index for efficient featured products lookup
CREATE INDEX idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;