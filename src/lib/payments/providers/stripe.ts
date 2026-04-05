import { PaymentProvider, CreateCheckoutParams, CheckoutResult, WebhookEvent } from "../types";

// Stub: Install `stripe` package and implement when ready.
// Set NEXT_PUBLIC_PAYMENT_PROVIDER=stripe and add STRIPE_* env vars.

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // TODO: Implement with Stripe SDK
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const session = await stripe.checkout.sessions.create({...});
    // return { checkoutUrl: session.url!, sessionId: session.id };
    throw new Error(
      `Stripe provider not yet implemented. Plan: ${params.plan.id}. ` +
      "Install stripe, then implement this file."
    );
  },

  async verifyWebhookSignature(_request: Request): Promise<WebhookEvent> {
    // TODO: Implement webhook verification with Stripe
    throw new Error("Stripe webhook verification not yet implemented.");
  },

  isConfigured(): boolean {
    return !!(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    );
  },
};
