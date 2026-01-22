// Lovable Cloud backend function: create-order
// Creates an order with server-side validation.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple in-memory rate limiter (best-effort).
// This project intentionally supports guest checkout, so we cannot rely on user auth.
// This limiter helps reduce spam/fake orders without any DB changes.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5; // max requests per IP per window
const ipHits = new Map<string, number[]>();

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const existing = ipHits.get(ip) ?? [];
  const fresh = existing.filter((t) => now - t <= RATE_LIMIT_WINDOW_MS);

  if (fresh.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, fresh);
    return true;
  }

  fresh.push(now);
  ipHits.set(ip, fresh);
  return false;
}

type OrderItem = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type CreateOrderPayload = {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: "UPI";
  payment_reference: string;
};

function isValidProductId(v: string) {
  // Storefront may use non-UUID IDs (e.g., mock catalog), while DB uses UUIDs.
  // Orders store `items` as JSON and do not rely on a FK lookup, so accept both.
  const trimmed = v.trim();
  if (trimmed.length < 1 || trimmed.length > 64) return false;
  const uuidOk =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed,
    );
  const simpleOk = /^[A-Za-z0-9_-]+$/.test(trimmed);
  return uuidOk || simpleOk;
}

function asTrimmedString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return v.trim();
}

function asInt(v: unknown): number | null {
  if (typeof v !== "number") return null;
  if (!Number.isInteger(v)) return null;
  return v;
}

function validatePayload(payload: unknown): { ok: true; data: CreateOrderPayload } | {
  ok: false;
  error: string;
} {
  if (!payload || typeof payload !== "object") return { ok: false, error: "Invalid JSON" };
  const p = payload as Record<string, unknown>;

  const customer_name = asTrimmedString(p.customer_name);
  const customer_phone = asTrimmedString(p.customer_phone);
  const customer_address = asTrimmedString(p.customer_address);
  const payment_reference = asTrimmedString(p.payment_reference);
  const payment_method = asTrimmedString(p.payment_method);
  const subtotal = asInt(p.subtotal);
  const shipping = asInt(p.shipping);
  const total = asInt(p.total);

  if (!customer_name || customer_name.length > 100) return { ok: false, error: "Invalid name" };
  if (!customer_phone || !/^[6-9]\d{9}$/.test(customer_phone)) {
    return { ok: false, error: "Invalid phone" };
  }
  if (!customer_address || customer_address.length < 20 || customer_address.length > 500) {
    return { ok: false, error: "Invalid address" };
  }
  if (!payment_reference || payment_reference.length < 8 || payment_reference.length > 64) {
    return { ok: false, error: "Invalid payment reference" };
  }
  if (payment_method !== "UPI") return { ok: false, error: "Invalid payment method" };
  if (subtotal === null || subtotal < 0 || subtotal > 100_000_000) {
    return { ok: false, error: "Invalid subtotal" };
  }
  if (shipping === null || shipping < 0 || shipping > 100_000) {
    return { ok: false, error: "Invalid shipping" };
  }
  if (total === null || total < 0 || total > 100_000_000) {
    return { ok: false, error: "Invalid total" };
  }

  const itemsRaw = p.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length < 1 || itemsRaw.length > 50) {
    return { ok: false, error: "Invalid items" };
  }

  const items: OrderItem[] = [];
  for (const item of itemsRaw) {
    if (!item || typeof item !== "object") return { ok: false, error: "Invalid item" };
    const it = item as Record<string, unknown>;
    const product_id = asTrimmedString(it.product_id);
    const name = asTrimmedString(it.name);
    const image = asTrimmedString(it.image);
    const price = asInt(it.price);
    const quantity = asInt(it.quantity);

    if (!product_id || !isValidProductId(product_id)) return { ok: false, error: "Invalid product id" };
    if (!name || name.length > 200) return { ok: false, error: "Invalid item name" };
    if (!image || image.length > 2048) return { ok: false, error: "Invalid item image" };
    if (price === null || price < 0 || price > 10_000_000) return { ok: false, error: "Invalid item price" };
    if (quantity === null || quantity < 1 || quantity > 10) return { ok: false, error: "Invalid item quantity" };

    items.push({ product_id, name, image, price, quantity });
  }

  return {
    ok: true,
    data: {
      customer_name,
      customer_phone,
      customer_address,
      items,
      subtotal,
      shipping,
      total,
      payment_method: "UPI",
      payment_reference,
    },
  };
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateOrderId() {
  // Ex: THR-5GZ4K1-8F3A
  const time = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `THR${time}${rand}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return jsonResponse(429, { error: "Too many requests. Please try again later." });
  }

  try {
    const payload = await req.json();
    const validated = validatePayload(payload);
    if (!validated.ok) return jsonResponse(400, { error: validated.error });

    const order = validated.data;
    const computedSubtotal = order.items.reduce((sum: number, it: OrderItem) => {
      return sum + it.price * it.quantity;
    }, 0);
    if (computedSubtotal !== order.subtotal) {
      return jsonResponse(400, { error: "Subtotal mismatch" });
    }
    if (order.subtotal + order.shipping !== order.total) {
      return jsonResponse(400, { error: "Total mismatch" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) {
      return jsonResponse(500, { error: "Server not configured" });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const orderId = generateOrderId();

    const { error } = await supabase.from("orders").insert({
      order_id: orderId,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      payment_method: order.payment_method,
      payment_status: "pending",
      // Stored in existing column used by the UI as UPI reference.
      razorpay_payment_id: order.payment_reference,
    });

    if (error) {
      return jsonResponse(500, { error: "Failed to create order" });
    }

    return jsonResponse(200, { orderId });
  } catch (_e) {
    return jsonResponse(500, { error: "Unexpected server error" });
  }
});
