import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getPlanById } from "@/config/pricing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    const { planId, recruiterId } = await request.json();
    const plan = getPlanById(planId);
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    if (!recruiterId) return NextResponse.json({ error: "Missing recruiterId" }, { status: 400 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price,
      currency: plan.currency,
      metadata: {
        recruiterId,
        planId: plan.id,
        credits: String(plan.credits),
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create payment intent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
