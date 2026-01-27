import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

/**
 * Hook that monitors cart items for availability changes.
 * Automatically removes sold-out items and notifies the user.
 */
export const useCartAvailability = () => {
  const { items, removeItem } = useCartStore();
  const lastCheckRef = useRef<number>(0);
  const checkingRef = useRef<boolean>(false);

  const checkAvailability = useCallback(async () => {
    if (items.length === 0 || checkingRef.current) return;
    
    // Throttle checks to every 5 seconds minimum
    const now = Date.now();
    if (now - lastCheckRef.current < 5000) return;
    lastCheckRef.current = now;
    checkingRef.current = true;

    try {
      // Extract valid UUIDs from cart items
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const productIds = items
        .map(item => item.product.id)
        .filter(id => uuidRegex.test(id));

      if (productIds.length === 0) return;

      // Check availability using the RPC function
      const { data, error } = await supabase.rpc('check_products_availability', {
        _product_ids: productIds
      });

      if (error) {
        console.error('Availability check error:', error);
        return;
      }

      // Find unavailable products
      const unavailableIds = new Set(
        (data || [])
          .filter((p: { product_id: string; is_available: boolean }) => !p.is_available)
          .map((p: { product_id: string }) => p.product_id)
      );

      if (unavailableIds.size > 0) {
        // Get names of unavailable products for the notification
        const unavailableItems = items.filter(item => unavailableIds.has(item.product.id));
        const names = unavailableItems.map(item => item.product.name);

        // Remove unavailable items from cart
        unavailableItems.forEach(item => {
          removeItem(item.product.id);
        });

        // Notify user
        if (names.length === 1) {
          toast.error(`"${names[0]}" was just sold and removed from your cart.`);
        } else {
          toast.error(`${names.length} items were just sold and removed from your cart.`);
        }
      }
    } catch (err) {
      console.error('Cart availability check failed:', err);
    } finally {
      checkingRef.current = false;
    }
  }, [items, removeItem]);

  // Check on mount and when items change
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Set up periodic checking (every 10 seconds)
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      checkAvailability();
    }, 10000);

    return () => clearInterval(interval);
  }, [items.length, checkAvailability]);

  // Set up real-time subscription for product changes
  useEffect(() => {
    if (items.length === 0) return;

    const productIds = items.map(item => item.product.id);
    
    const channel = supabase
      .channel('cart-products-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          const updatedProduct = payload.new as { id: string; sold_out: boolean; name: string };
          
          // Check if this product is in our cart and is now sold out
          if (productIds.includes(updatedProduct.id) && updatedProduct.sold_out) {
            removeItem(updatedProduct.id);
            toast.error(`"${updatedProduct.name}" was just sold and removed from your cart.`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [items, removeItem]);

  return { checkAvailability };
};
