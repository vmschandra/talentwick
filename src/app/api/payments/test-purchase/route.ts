import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getPlanById } from "@/config/pricing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { planId, recruiterId, cardLast4 } = await request.json();

    const plan = getPlanById(planId);
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    if (!recruiterId) return NextResponse.json({ error: "Missing recruiterId" }, { status: 400 });

    const db = getAdminDb();
    const recruiterRef = db.collection("recruiterProfiles").doc(recruiterId);
    const snap = await recruiterRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Recruiter profile not found" }, { status: 404 });
    }

    const txId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    await db.runTransaction(async (tx) => {
      tx.update(recruiterRef, {
        jobPostCredits: FieldValue.increment(plan.credits),
        totalSpent: FieldValue.increment(plan.price),
      });
    });

    await db.collection("transactions").add({
      recruiterId,
      gateway: "test",
      gatewaySessionId: txId,
      gatewayTransactionId: txId,
      plan: plan.id,
      amount: plan.price,
      currency: plan.currency,
      credits: plan.credits,
      cardLast4: cardLast4 ?? "0000",
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
