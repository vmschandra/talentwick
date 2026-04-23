import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/registry";
import { getPlanById } from "@/config/pricing";
import { verifyIdToken } from "@/lib/firebase/api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const caller = await verifyIdToken(request);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { planId, recruiterId, email } = body;

    if (caller.uid !== recruiterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plan = getPlanById(planId);
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const provider = await getPaymentProvider();
    if (provider.name === "manual") {
      return NextResponse.json({ error: "Online checkout is not available. Contact admin for credits." }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}` || "http://localhost:3000";

    const result = await provider.createCheckoutSession({
      plan: { id: plan.id, name: plan.name, price: plan.price, credits: plan.credits, currency: plan.currency },
      recruiterId,
      successUrl: `${origin}/recruiter/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/recruiter/pricing`,
      customerEmail: email,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
