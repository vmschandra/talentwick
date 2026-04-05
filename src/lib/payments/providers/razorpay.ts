import { PaymentProvider, CreateCheckoutParams, CheckoutResult, WebhookEvent } from "../types";

// Stub: Install `razorpay` package and implement when ready.
// Set NEXT_PUBLIC_PAYMENT_PROVIDER=razorpay and add RAZORPAY_* env vars.

export const razorpayProvider: PaymentProvider = {
  name: "razorpay",

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    throw new Error(
      `Razorpay provider not yet implemented. Plan: ${params.plan.id}. ` +
      "Install razorpay, then implement this file."
    );
  },

  async verifyWebhookSignature(_request: Request): Promise<WebhookEvent> {
    throw new Error("Razorpay webhook verification not yet implemented.");
  },

  isConfigured(): boolean {
    return !!(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    );
  },
};
