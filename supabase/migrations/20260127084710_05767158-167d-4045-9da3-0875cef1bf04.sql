-- Update RLS policy to allow public read of content_ keys
DROP POLICY IF EXISTS "Public can read safe store settings" ON public.store_settings;

CREATE POLICY "Public can read safe store settings" 
ON public.store_settings 
FOR SELECT 
USING (
  key = ANY (ARRAY[
    'store_name'::text, 
    'contact_email'::text, 
    'instagram_id'::text, 
    'upi_id'::text, 
    'upi_qr_image'::text, 
    'seo_title'::text, 
    'seo_description'::text, 
    'seo_og_image_url'::text, 
    'theme_mode'::text, 
    'theme_primary'::text, 
    'theme_primary_foreground'::text, 
    'theme_accent'::text, 
    'theme_accent_foreground'::text, 
    'theme_background'::text, 
    'theme_foreground'::text, 
    'theme_card'::text, 
    'theme_card_foreground'::text, 
    'theme_muted'::text, 
    'theme_muted_foreground'::text, 
    'theme_border'::text, 
    'theme_ring'::text, 
    'theme_font_sans'::text, 
    'theme_font_mono'::text, 
    'theme_logo_url'::text
  ])
  OR key LIKE 'content_%'
);