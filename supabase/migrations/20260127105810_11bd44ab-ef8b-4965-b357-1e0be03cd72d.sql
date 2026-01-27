-- Enable realtime for products table to support live availability updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;