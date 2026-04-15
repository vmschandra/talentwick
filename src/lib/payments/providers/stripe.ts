import Stripe from "stripe";
import { PaymentProvider, CreateCheckoutParams, CheckoutResult, WebhookEvent } from "../types";

function getClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const stripe = getClient();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: params.customerEmail,
      metadata: {
        recruiterId: params.recruiterId,
        planId: params.plan.id,
        credits: String(params.plan.credits),
      },
      line_items: [
        {
          price_data: {
            currency: params.plan.currency,
            product_data: {
              name: `${params.plan.name} Plan – TalentWick`,
              description: `${params.plan.credits} job posting credit${params.plan.credits !== 1 ? "s" : ""} (30-day listing each)`,
            },
            unit_amount: params.plan.price, // already in cents
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    return {
      checkoutUrl: session.url!,
      sessionId: session.id,
    };
  },

  async verifyWebhookSignature(request: Request): Promise<WebhookEvent> {
    const stripe = getClient();
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) throw new Error("Missing Stripe-Signature header");

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Embedded Payment Element flow
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const { recruiterId, planId, credits } = pi.metadata ?? {};

      if (!recruiterId || !planId || !credits) {
        throw new Error("PaymentIntent is missing required metadata fields");
      }

      return {
        type: "payment.success",
        sessionId: pi.id,
        recruiterId,
        plan: planId,
        credits: parseInt(credits, 10),
        amount: pi.amount,
        gatewayTransactionId: pi.id,
        rawEvent: event,
      };
    }

    // Hosted Checkout flow
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { recruiterId, planId, credits } = session.metadata ?? {};

      if (!recruiterId || !planId || !credits) {
        throw new Error("Stripe session is missing required metadata fields");
      }

      return {
        type: "payment.success",
        sessionId: session.id,
        recruiterId,
        plan: planId,
        credits: parseInt(credits, 10),
        amount: session.amount_total ?? 0,
        gatewayTransactionId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? session.id,
        rawEvent: event,
      };
    }

    // Payment failed / refunded — surface as failure so caller can handle
    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        type: "payment.failed",
        sessionId: session.id ?? "",
        recruiterId: session.metadata?.recruiterId ?? "",
        plan: session.metadata?.planId ?? "",
        credits: 0,
        amount: 0,
        gatewayTransactionId: session.id ?? "",
        rawEvent: event,
      };
    }

    // Silently ignore other event types (e.g. payment_intent.created)
    throw new Error(`Unhandled Stripe event: ${event.type}`);
  },

  isConfigured(): boolean {
    return !!(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    );
  },
};
