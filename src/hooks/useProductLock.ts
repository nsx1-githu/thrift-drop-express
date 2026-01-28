import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductLockStatus {
  productId: string;
  isAvailable: boolean;
  isLocked: boolean;
}

/**
 * Hook to check if products are available or locked by another order.
 */
export const useProductLock = (productIds: string[]) => {
  const [statuses, setStatuses] = useState<ProductLockStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkLocks = useCallback(async () => {
    if (productIds.length === 0) {
      setStatuses([]);
      setIsLoading(false);
      return;
    }

    // Filter to valid UUIDs only
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const validIds = productIds.filter(id => uuidRegex.test(id));

    if (validIds.length === 0) {
      // Mock products - assume available
      setStatuses(productIds.map(id => ({ productId: id, isAvailable: true, isLocked: false })));
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_product_availability_with_locks', {
        _product_ids: validIds
      });

      if (error) {
        console.error('Lock check error:', error);
        return;
      }

      setStatuses((data || []).map((item: { product_id: string; is_available: boolean; is_locked: boolean }) => ({
        productId: item.product_id,
        isAvailable: item.is_available,
        isLocked: item.is_locked
      })));
    } catch (err) {
      console.error('Lock check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productIds.join(',')]);

  useEffect(() => {
    checkLocks();
  }, [checkLocks]);

  // Set up real-time subscription for order changes
  useEffect(() => {
    if (productIds.length === 0) return;

    const channel = supabase
      .channel('product-locks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Re-check locks when orders change
          checkLocks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productIds.join(','), checkLocks]);

  const hasLockedProducts = statuses.some(s => s.isLocked);
  const hasUnavailableProducts = statuses.some(s => !s.isAvailable);

  return {
    statuses,
    isLoading,
    hasLockedProducts,
    hasUnavailableProducts,
    refresh: checkLocks
  };
};

/**
 * Hook to check if a single product is locked.
 */
export const useSingleProductLock = (productId: string | undefined) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkLock = useCallback(async () => {
    if (!productId) {
      setIsLocked(false);
      setIsLoading(false);
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      setIsLocked(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_product_locked', {
        _product_id: productId
      });

      if (error) {
        console.error('Lock check error:', error);
        return;
      }

      setIsLocked(data === true);
    } catch (err) {
      console.error('Lock check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    checkLock();
  }, [checkLock]);

  // Set up real-time subscription
  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`product-lock-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          checkLock();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, checkLock]);

  return { isLocked, isLoading, refresh: checkLock };
};
