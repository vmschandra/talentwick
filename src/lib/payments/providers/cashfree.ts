import crypto from "crypto";
import { PaymentProvider, CreateCheckoutParams, CheckoutResult, WebhookEvent } from "../types";
import { getPlanById } from "@/config/pricing";

const API_BASE =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const API_VERSION = "2023-08-01";

async function cashfreePost(path: string, body: unknown) {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error("Cashfree credentials are not configured (CASHFREE_APP_ID / CASHFREE_SECRET_KEY).");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.type || "Cashfree API error");
  }
  return data;
}

export const cashfreeProvider: PaymentProvider = {
  name: "cashfree",

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const { plan, recruiterId, customerEmail } = params;

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
    ).trim().replace(/\/$/, "");

    // Order ID: max 50 chars, alphanumeric + underscore
    const orderId = `TW_${plan.id}_${recruiterId.slice(0, 12)}_${Date.now()}`;

    const order = await cashfreePost("/orders", {
      order_id: orderId,
      order_amount: plan.price / 100,          // paise → rupees
      order_currency: plan.currency.toUpperCase(),
      customer_details: {
        customer_id: recruiterId,
        customer_email: customerEmail,
        customer_phone: "9999999999",          // placeholder — update to pull from recruiter profile for production
      },
      order_meta: {
        // Cashfree replaces {order_id} with the actual order_id after payment
        return_url: `${appUrl}/recruiter/purchase/success?order_id={order_id}`,
        notify_url: `${appUrl}/api/payments/webhook`,
      },
      order_tags: {
        recruiter_id: recruiterId,
        plan_id: plan.id,
      },
    });

    return {
      checkoutUrl: order.payment_session_id,   // not a URL — used as the Cashfree payment_session_id
      sessionId: order.payment_session_id,
    };
  },

  async verifyWebhookSignature(request: Request): Promise<WebhookEvent> {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      throw new Error("Missing Cashfree webhook headers (x-webhook-signature / x-webhook-timestamp).");
    }

    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!secretKey) throw new Error("CASHFREE_SECRET_KEY is not set.");

    const expected = crypto
      .createHmac("sha256", secretKey)
      .update(`${timestamp}${rawBody}`)
      .digest("base64");

    if (expected !== signature) {
      throw new Error("Invalid Cashfree webhook signature.");
    }

    const payload = JSON.parse(rawBody);
    const order = payload.data?.order || {};
    const payment = payload.data?.payment || {};
    const tags: Record<string, string> = order.order_tags || {};

    const recruiterId = tags.recruiter_id || "";
    const planId = tags.plan_id || "";
    const plan = getPlanById(planId);
    const credits = plan?.credits ?? 0;

    const isSuccess =
      payload.type === "PAYMENT_SUCCESS_WEBHOOK" || payment.payment_status === "SUCCESS";

    return {
      type: isSuccess ? "payment.success" : "payment.failed",
      sessionId: order.order_id || "",
      recruiterId,
      plan: planId,
      credits,
      amount: Math.round((order.order_amount ?? 0) * 100),  // rupees → paise
      gatewayTransactionId: String(payment.cf_payment_id ?? ""),
      rawEvent: payload,
    };
  },

  isConfigured(): boolean {
    return !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
  },
};
