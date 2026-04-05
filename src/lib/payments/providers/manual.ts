import { PaymentProvider, CreateCheckoutParams, CheckoutResult, WebhookEvent } from "../types";

export const manualProvider: PaymentProvider = {
  name: "manual",

  async createCheckoutSession(_params: CreateCheckoutParams): Promise<CheckoutResult> {
    throw new Error(
      "Manual mode does not support online checkout. Credits must be added by an admin."
    );
  },

  async verifyWebhookSignature(_request: Request): Promise<WebhookEvent> {
    throw new Error("Manual mode does not receive webhooks.");
  },

  isConfigured(): boolean {
    return true; // Always available as fallback
  },
};
