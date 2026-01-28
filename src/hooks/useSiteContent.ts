import { useMemo } from 'react';
import { useStoreSettings } from './useStoreSettings';

// Default content values
const DEFAULTS: Record<string, string> = {
  // Owner Section
  content_owner_name: 'The Owner',
  content_owner_bio: 'Passionate about sustainable fashion and giving pre-loved pieces a second life. Every item is hand-picked with love.',
  content_owner_image: '',
  // Hero Section
  content_hero_subtitle: 'Sustainable Fashion',
  content_hero_title: 'What is Thrifting?',
  content_hero_description: "Thrifting is the art of finding pre-loved treasures. It's about giving beautiful pieces a second life while reducing fashion's environmental footprint.",
  content_hero_button: 'SHOP NOW',
  content_why_thrift_title: 'Why Thrift?',
  content_benefit_1_title: 'Eco-Friendly',
  content_benefit_1_desc: 'Reduce textile waste and carbon footprint',
  content_benefit_2_title: 'Unique Finds',
  content_benefit_2_desc: "One-of-a-kind pieces you won't find elsewhere",
  content_benefit_3_title: 'Affordable',
  content_benefit_3_desc: 'Premium brands at a fraction of retail',
  content_benefit_4_title: 'Circular',
  content_benefit_4_desc: 'Extend the lifecycle of quality garments',
  content_highlights_title: 'Latest Drops',
  content_category_title: 'Shop by Category',
  content_products_title: 'All Products',
  content_products_empty: 'No products found',
  content_cart_title: 'Your Cart',
  content_cart_empty: 'Your cart is empty',
  content_cart_checkout_button: 'Proceed to Checkout',
  content_checkout_title: 'Checkout',
  content_checkout_success: 'Order placed successfully!',
  content_footer_tagline: 'Curated vintage & streetwear',
  content_footer_copyright: '© 2024 All rights reserved.',
  content_sold_out_label: 'Sold Out',
  content_featured_label: 'Featured',
  content_add_to_cart_button: 'Add to Cart',
};

export function useSiteContent() {
  const { settings, isLoading } = useStoreSettings();

  const getContent = useMemo(() => {
    return (key: string): string => {
      // Try to get from settings, fallback to defaults
      const value = settings[key];
      if (value && value.trim() !== '') {
        return value;
      }
      return DEFAULTS[key] || '';
    };
  }, [settings]);

  return { getContent, isLoading };
}
