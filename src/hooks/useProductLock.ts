import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LockStatus {
  isAvailable: boolean;
  isLocked: boolean;
}

/**
 * Hook to check if a product is locked by another user's reservation.
 * Returns availability status including temporary locks.
 */
export const useProductLock = (productId: string | undefined) => {
  const [status, setStatus] = useState<LockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkLockStatus = useCallback(async () => {
    if (!productId) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      setStatus({ isAvailable: true, isLocked: false }); // Mock products always available
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_product_availability_with_locks', {
        _product_ids: [productId]
      });

      if (error) {
        console.error('Lock check error:', error);
        setStatus(null);
      } else if (data && data.length > 0) {
        const productStatus = data[0];
        setStatus({
          isAvailable: productStatus.is_available,
          isLocked: productStatus.is_locked
        });
      } else {
        setStatus({ isAvailable: true, isLocked: false });
      }
    } catch (err) {
      console.error('Lock check failed:', err);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  // Initial check
  useEffect(() => {
    checkLockStatus();
  }, [checkLockStatus]);

  // Real-time subscription for product and order changes
  useEffect(() => {
    if (!productId) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) return;

    // Subscribe to product changes
    const productChannel = supabase
      .channel(`product-lock-${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        () => {
          checkLockStatus();
        }
      )
      .subscribe();

    // Subscribe to order changes (for lock/unlock)
    const orderChannel = supabase
      .channel(`orders-lock-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Re-check when any order changes (could affect lock status)
          checkLockStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [productId, checkLockStatus]);

  return { 
    isAvailable: status?.isAvailable ?? null,
    isLocked: status?.isLocked ?? false,
    isLoading, 
    refresh: checkLockStatus 
  };
};
