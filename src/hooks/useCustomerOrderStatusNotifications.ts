import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationStore } from "@/store/notificationStore";

type PaymentStatus = "pending" | "verified" | "failed";

export const useCustomerOrderStatusNotifications = () => {
  const {
    customerOrders,
    addNotification,
    setCustomerOrderStatus,
    markCustomerOrderChecked,
  } = useNotificationStore();

  const isRunningRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const checkOnce = async () => {
      if (!mounted) return;
      if (isRunningRef.current) return;
      if (!customerOrders.length) return;

      isRunningRef.current = true;
      try {
        for (const watch of customerOrders) {
          const { data, error } = await (supabase as any).rpc("track_order", {
            _order_id: watch.orderId.trim().toUpperCase(),
            _customer_phone: watch.phone.trim(),
          });

          // If RPC fails, just skip this tick (don’t spam user with errors).
          if (error) continue;

          const row = Array.isArray(data) ? data[0] : null;
          const status = (row?.payment_status as PaymentStatus | undefined) ?? null;

          markCustomerOrderChecked(watch.orderId);

          if (!status) continue;
          if (watch.lastStatus && watch.lastStatus === status) continue;

          // First time we see a status, store it silently.
          if (!watch.lastStatus) {
            setCustomerOrderStatus(watch.orderId, status);
            continue;
          }

          // Status changed → notify customer.
          if (status === "verified") {
            addNotification({
              title: "Order accepted",
              message: `Your order ${watch.orderId} payment has been verified. We’ll dispatch it soon.`,
              type: "payment",
              orderId: watch.orderId,
            });
          }

          if (status === "failed") {
            addNotification({
              title: "Order rejected",
              message: `Your order ${watch.orderId} payment verification failed. Please contact support or place a new order.`,
              type: "payment",
              orderId: watch.orderId,
            });
          }

          setCustomerOrderStatus(watch.orderId, status);
        }
      } finally {
        isRunningRef.current = false;
      }
    };

    const interval = window.setInterval(checkOnce, 30_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") checkOnce();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Initial check
    checkOnce();

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    addNotification,
    customerOrders,
    markCustomerOrderChecked,
    setCustomerOrderStatus,
  ]);
};
