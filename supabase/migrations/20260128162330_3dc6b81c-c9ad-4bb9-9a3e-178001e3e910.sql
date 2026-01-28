-- Create a private storage bucket for payment proofs (sensitive financial data)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Remove any existing policies for this bucket to start fresh
DROP POLICY IF EXISTS "Admins can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload payment proofs" ON storage.objects;

-- Allow admins to view payment proofs
CREATE POLICY "Admins can view payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow service role to upload payment proofs (edge functions use service role)
-- Note: service role bypasses RLS, so this is mainly for documentation
CREATE POLICY "Service role can upload payment proofs"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'payment-proofs');