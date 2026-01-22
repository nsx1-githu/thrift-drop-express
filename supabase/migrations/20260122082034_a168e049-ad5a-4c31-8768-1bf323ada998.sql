-- Add new category values to the product_category enum
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'bags';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'caps';