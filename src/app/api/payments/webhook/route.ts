import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/registry";
import { addCreditsToRecruiter } from "@/lib/payments/credit-service";
import { getPlanById } from "@/config/pricing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const provider = await getPaymentProvider();
    const event = await provider.verifyWebhookSignature(request);

    if (event.type === "payment.success") {
      const plan = getPlanById(event.plan);
      await addCreditsToRecruiter(event.recruiterId, event.credits, {
        plan: event.plan,
        amount: event.amount,
        currency: plan?.currency || "usd",
        gateway: provider.name,
        gatewaySessionId: event.sessionId,
        gatewayTransactionId: event.gatewayTransactionId,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("[Webhook Error]", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
