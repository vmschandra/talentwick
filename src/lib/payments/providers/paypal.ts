import { PaymentProvider, CreateCheckoutParams, CheckoutResult, WebhookEvent } from "../types";

// Stub: Install `@paypal/checkout-server-sdk` and implement when ready.
// Set NEXT_PUBLIC_PAYMENT_PROVIDER=paypal and add PAYPAL_* env vars.

export const paypalProvider: PaymentProvider = {
  name: "paypal",

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    throw new Error(
      `PayPal provider not yet implemented. Plan: ${params.plan.id}. ` +
      "Install @paypal/checkout-server-sdk, then implement this file."
    );
  },

  async verifyWebhookSignature(_request: Request): Promise<WebhookEvent> {
    throw new Error("PayPal webhook verification not yet implemented.");
  },

  isConfigured(): boolean {
    return !!(
      process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET &&
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    );
  },
};
