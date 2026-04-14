import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/registry";
import { addCreditsToRecruiter } from "@/lib/payments/credit-service";
import { getPlanById } from "@/config/pricing";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

export const dynamic = "force-dynamic";

// Stripe (and other gateways) retry webhooks on failure. This guard prevents
// double-crediting a recruiter if the same session ID arrives more than once.
async function isAlreadyProcessed(sessionId: string): Promise<boolean> {
  const snap = await getDocs(
    query(collection(db, "transactions"), where("gatewaySessionId", "==", sessionId))
  );
  return !snap.empty;
}

export async function POST(request: Request) {
  try {
    const provider = await getPaymentProvider();
    const event = await provider.verifyWebhookSignature(request);

    if (event.type === "payment.success") {
      // Idempotency: skip if this session was already credited
      if (await isAlreadyProcessed(event.sessionId)) {
        return NextResponse.json({ received: true, duplicate: true });
      }

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
