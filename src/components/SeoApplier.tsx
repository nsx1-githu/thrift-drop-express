import { Helmet } from "react-helmet-async";
import { useStoreSettings } from "@/hooks/useStoreSettings";

/**
 * Applies store-configured SEO defaults across the whole app.
 * Route-specific SEO can still override these later if needed.
 */
export function SeoApplier() {
  const { get } = useStoreSettings();

  const title = get("seo_title", get("store_name", "")) || "";
  const description = get("seo_description", "") || "";
  const ogImage = get("seo_og_image_url", "") || "";
  const canonical = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Helmet>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}

      {/* Open Graph */}
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? <meta property="og:description" content={description} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      {title ? <meta name="twitter:title" content={title} /> : null}
      {description ? <meta name="twitter:description" content={description} /> : null}
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
}
