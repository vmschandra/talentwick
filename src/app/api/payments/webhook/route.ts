import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/registry";
import { getPlanById } from "@/config/pricing";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { sendEmail } from "@/lib/email";
import { creditsAddedEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

async function isAlreadyProcessed(sessionId: string): Promise<boolean> {
  const db = getAdminDb();
  const snap = await db
    .collection("transactions")
    .where("gatewaySessionId", "==", sessionId)
    .limit(1)
    .get();
  return !snap.empty;
}

async function addCreditsToRecruiter(
  recruiterId: string,
  credits: number,
  data: {
    plan: string;
    amount: number;
    currency: string;
    gateway: string;
    gatewaySessionId: string;
    gatewayTransactionId: string;
  }
) {
  const db = getAdminDb();
  const recruiterRef = db.collection("recruiterProfiles").doc(recruiterId);
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(recruiterRef);
    if (!snap.exists) throw new Error("Recruiter profile not found");
    tx.update(recruiterRef, {
      jobPostCredits: FieldValue.increment(credits),
      totalSpent: FieldValue.increment(data.amount),
      creditsExpiresAt: expiresAt,
    });
  });

  await db.collection("transactions").add({
    recruiterId,
    gateway: data.gateway,
    gatewaySessionId: data.gatewaySessionId,
    gatewayTransactionId: data.gatewayTransactionId,
    plan: data.plan,
    amount: data.amount,
    currency: data.currency,
    credits,
    status: "completed",
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection("notifications").add({
    userId: recruiterId,
    type: "credits_added",
    title: "Credits Added",
    message: `${credits} job posting credit${credits > 1 ? "s" : ""} added to your account.`,
    link: "/recruiter/pricing",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Send confirmation email (fire-and-forget)
  const userSnap = await db.collection("users").doc(recruiterId).get();
  if (userSnap.exists) {
    const plan = getPlanById(data.plan);
    const { subject, html } = creditsAddedEmail(
      userSnap.data()!.displayName,
      credits,
      plan?.name ?? "Credit"
    );
    await sendEmail(userSnap.data()!.email, subject, html);
  }
}

export async function POST(request: Request) {
  try {
    const provider = await getPaymentProvider();
    const event = await provider.verifyWebhookSignature(request);

    if (event.type === "payment.success") {
      if (await isAlreadyProcessed(event.sessionId)) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      const plan = getPlanById(event.plan);
      await addCreditsToRecruiter(event.recruiterId, event.credits, {
        plan: event.plan,
        amount: event.amount,
        currency: plan?.currency || "inr",
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
