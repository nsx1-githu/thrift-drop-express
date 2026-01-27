import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to monitor a single product's availability in real-time.
 * Returns the current availability status and refreshes automatically.
 */
export const useProductAvailability = (productId: string | undefined) => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAvailability = useCallback(async () => {
    if (!productId) {
      setIsAvailable(null);
      setIsLoading(false);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      setIsAvailable(true); // Assume mock products are available
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('sold_out')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Product availability check error:', error);
        setIsAvailable(null);
      } else {
        setIsAvailable(!data.sold_out);
      }
    } catch (err) {
      console.error('Product availability check failed:', err);
      setIsAvailable(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  // Initial check
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Real-time subscription for this specific product
  useEffect(() => {
    if (!productId) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) return;

    const channel = supabase
      .channel(`product-${productId}-availability`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          const updated = payload.new as { sold_out: boolean };
          setIsAvailable(!updated.sold_out);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  return { isAvailable, isLoading, refresh: checkAvailability };
};
