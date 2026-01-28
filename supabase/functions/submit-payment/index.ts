// Lovable Cloud backend function: submit-payment
// Handles payment submission with server-side image upload

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SubmitPaymentPayload = {
  order_id: string;
  customer_phone: string;
  payment_reference: string;
  payment_payer_name: string;
  payment_proof_base64?: string;
  payment_proof_mime?: string;
};

function asTrimmedString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return v.trim();
}

function validatePayload(payload: unknown): { ok: true; data: SubmitPaymentPayload } | {
  ok: false;
  error: string;
} {
  if (!payload || typeof payload !== "object") return { ok: false, error: "Invalid JSON" };
  const p = payload as Record<string, unknown>;

  const order_id = asTrimmedString(p.order_id);
  const customer_phone = asTrimmedString(p.customer_phone);
  const payment_reference = asTrimmedString(p.payment_reference);
  const payment_payer_name = asTrimmedString(p.payment_payer_name);
  const payment_proof_base64 = asTrimmedString(p.payment_proof_base64);
  const payment_proof_mime = asTrimmedString(p.payment_proof_mime);

  if (!order_id || order_id.length < 4 || order_id.length > 32) {
    return { ok: false, error: "Invalid order ID" };
  }
  if (!customer_phone || !/^[6-9]\d{9}$/.test(customer_phone)) {
    return { ok: false, error: "Invalid phone number" };
  }
  if (!payment_reference || payment_reference.length < 8 || payment_reference.length > 64) {
    return { ok: false, error: "Invalid payment reference" };
  }
  if (!payment_payer_name || payment_payer_name.length > 120) {
    return { ok: false, error: "Invalid payer name" };
  }

  // Validate base64 image upload (max ~2MB base64 = ~2.7MB string)
  if (payment_proof_base64 && payment_proof_base64.length > 3_000_000) {
    return { ok: false, error: "Payment proof image too large (max 2MB)" };
  }
  if (payment_proof_base64 && !payment_proof_mime) {
    return { ok: false, error: "Missing payment proof MIME type" };
  }
  if (payment_proof_mime && !/^image\/(jpeg|jpg|png|webp|gif)$/i.test(payment_proof_mime)) {
    return { ok: false, error: "Invalid payment proof format (use JPG, PNG, or WebP)" };
  }

  return {
    ok: true,
    data: {
      order_id,
      customer_phone,
      payment_reference,
      payment_payer_name,
      payment_proof_base64: payment_proof_base64 ?? undefined,
      payment_proof_mime: payment_proof_mime ?? undefined,
    },
  };
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const payload = await req.json();
    const validated = validatePayload(payload);
    if (!validated.ok) return jsonResponse(400, { error: validated.error });

    const data = validated.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) {
      return jsonResponse(500, { error: "Server not configured" });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    // Handle payment proof upload server-side if base64 provided
    let paymentProofUrl: string | null = null;
    if (data.payment_proof_base64 && data.payment_proof_mime) {
      try {
        // Decode base64 to binary
        const binaryString = atob(data.payment_proof_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Determine file extension from MIME type
        const extMap: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/gif': 'gif',
        };
        const ext = extMap[data.payment_proof_mime.toLowerCase()] || 'jpg';
        const path = `payments/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, bytes, { 
            contentType: data.payment_proof_mime, 
            upsert: false 
          });
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(path);
          paymentProofUrl = urlData.publicUrl;
        } else {
          console.error('Payment proof upload error:', uploadError);
          // Continue without failing - payment can be verified manually
        }
      } catch (uploadErr) {
        console.error('Payment proof processing error:', uploadErr);
        // Continue without failing
      }
    }

    // Call the submit_order_payment RPC with the uploaded URL
    const { data: result, error } = await supabase.rpc('submit_order_payment', {
      _order_id: data.order_id,
      _customer_phone: data.customer_phone,
      _payment_reference: data.payment_reference,
      _payment_payer_name: data.payment_payer_name,
      _payment_proof_url: paymentProofUrl || '',
    });

    if (error) {
      console.error('RPC error:', error);
      return jsonResponse(500, { error: "Failed to submit payment" });
    }

    const rpcResult = result?.[0];
    if (!rpcResult?.success) {
      return jsonResponse(400, { error: rpcResult?.error_message || "Failed to submit payment" });
    }

    return jsonResponse(200, { success: true });
  } catch (_e) {
    console.error('Unexpected error:', _e);
    return jsonResponse(500, { error: "Unexpected server error" });
  }
});
