import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationStore } from "@/store/notificationStore";

type PaymentStatus = "pending" | "verified" | "failed" | "paid" | "cancelled" | "expired" | "locked" | "payment_submitted";

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
      if (!mounted || isRunningRef.current || !customerOrders.length) return;

      isRunningRef.current = true;
      try {
        for (const watch of customerOrders) {
          const { data, error } = await (supabase as any).rpc("track_order", {
            _order_id: watch.orderId.trim().toUpperCase(),
            _customer_phone: watch.phone.trim(),
          });

          if (error) continue;

          const row = Array.isArray(data) ? data[0] : null;
          const status = (row?.payment_status as PaymentStatus | undefined) ?? null;
          const shippingStatus = (row?.shipping_status as string | undefined) ?? null;

          markCustomerOrderChecked(watch.orderId);

          if (!status) continue;

          const combinedStatus = shippingStatus && shippingStatus !== 'none'
            ? `${status}:${shippingStatus}`
            : status;

          if (watch.lastStatus && watch.lastStatus === combinedStatus) continue;

          // First time we see a status, store it silently.
          if (!watch.lastStatus) {
            setCustomerOrderStatus(watch.orderId, combinedStatus);
            continue;
          }

          // Status changed → notify customer.
          if (status === "verified" || status === "paid") {
            if (shippingStatus === 'dispatched') {
              addNotification({
                title: "Order Dispatched! 🚚",
                message: `Your order ${watch.orderId} has been dispatched${row?.courier_name ? ` via ${row.courier_name}` : ''}.${row?.tracking_url ? ' Tap to track.' : ''}`,
                type: "payment",
                orderId: watch.orderId,
              });
            } else if (shippingStatus === 'out_for_delivery') {
              addNotification({
                title: "Out for Delivery! 🎉",
                message: `Your order ${watch.orderId} is out for delivery. Please be available.`,
                type: "payment",
                orderId: watch.orderId,
              });
            } else if (shippingStatus === 'delivered') {
              addNotification({
                title: "Order Delivered! ✅",
                message: `Your order ${watch.orderId} has been delivered. Thank you!`,
                type: "payment",
                orderId: watch.orderId,
              });
            } else if (!watch.lastStatus.startsWith('paid') && !watch.lastStatus.startsWith('verified')) {
              addNotification({
                title: "Order Accepted",
                message: `Your order ${watch.orderId} payment has been verified. We'll dispatch it soon.`,
                type: "payment",
                orderId: watch.orderId,
              });
            }
          }

          if (status === "failed" || status === "cancelled") {
            addNotification({
              title: "Order Rejected",
              message: `Your order ${watch.orderId} payment verification failed. Please contact support or place a new order.`,
              type: "payment",
              orderId: watch.orderId,
            });
          }

          setCustomerOrderStatus(watch.orderId, combinedStatus);
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
    checkOnce();

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [addNotification, customerOrders, markCustomerOrderChecked, setCustomerOrderStatus]);
};
