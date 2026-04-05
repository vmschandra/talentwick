import { NextResponse } from "next/server";
import { addCreditsToRecruiter } from "@/lib/payments/credit-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recruiterId, credits, plan, amount } = body;

    if (!recruiterId || !credits || credits < 1) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await addCreditsToRecruiter(recruiterId, credits, {
      plan: plan || "manual",
      amount: amount || 0,
      currency: "usd",
      gateway: "manual",
      gatewaySessionId: `manual-${Date.now()}`,
      gatewayTransactionId: `admin-${Date.now()}`,
    });

    return NextResponse.json({ success: true, credits });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add credits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
