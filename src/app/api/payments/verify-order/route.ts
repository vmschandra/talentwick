import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getPlanById } from "@/config/pricing";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const API_BASE =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

async function isAlreadyProcessed(orderId: string): Promise<boolean> {
  const db = getAdminDb();
  const snap = await db
    .collection("transactions")
    .where("gatewaySessionId", "==", orderId)
    .limit(1)
    .get();
  return !snap.empty;
}

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    console.log("[Verify Order] Checking orderId:", orderId);

    // Idempotency — don't double-credit
    if (await isAlreadyProcessed(orderId)) {
      console.log("[Verify Order] Already processed:", orderId);
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    // Fetch order from Cashfree
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2023-08-01",
      },
    });

    const order = await res.json();
    console.log("[Verify Order] Cashfree response status:", res.status, "order_status:", order.order_status);

    if (!res.ok) throw new Error(order.message || "Failed to fetch order from Cashfree");
    if (order.order_status !== "PAID") {
      return NextResponse.json({ success: false, status: order.order_status });
    }

    // Extract recruiter + plan from order tags
    const tags: Record<string, string> = order.order_tags || {};
    const recruiterId = tags.recruiter_id;
    const planId = tags.plan_id;

    console.log("[Verify Order] Tags — recruiterId:", recruiterId, "planId:", planId);

    if (!recruiterId || !planId) {
      return NextResponse.json({ error: "Missing order tags" }, { status: 400 });
    }

    const plan = getPlanById(planId);
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    // Add credits via Admin SDK (bypasses Firestore security rules)
    const db = getAdminDb();
    const recruiterRef = db.collection("recruiterProfiles").doc(recruiterId);

    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(recruiterRef);
      if (!snap.exists) throw new Error("Recruiter profile not found");
      tx.update(recruiterRef, {
        jobPostCredits: FieldValue.increment(plan.credits),
        totalSpent: FieldValue.increment(Math.round(order.order_amount * 100)),
        creditsExpiresAt: expiresAt,
      });
    });

    console.log("[Verify Order] Credits added for recruiter:", recruiterId, "plan:", planId, "credits:", plan.credits);

    await db.collection("transactions").add({
      recruiterId,
      gateway: "cashfree",
      gatewaySessionId: orderId,
      gatewayTransactionId: orderId,
      plan: planId,
      amount: Math.round(order.order_amount * 100),
      currency: plan.currency,
      credits: plan.credits,
      status: "completed",
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection("notifications").add({
      userId: recruiterId,
      type: "credits_added",
      title: "Credits Added",
      message: `${plan.credits} job posting credit${plan.credits > 1 ? "s" : ""} added to your account.`,
      link: "/recruiter/pricing",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, credits: plan.credits });
  } catch (error: unknown) {
    console.error("[Verify Order Error]", error);
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
