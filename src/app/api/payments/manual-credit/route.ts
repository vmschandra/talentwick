import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { sendEmail } from "@/lib/email";
import { creditsAddedEmail } from "@/lib/email/templates";
import { pricingPlans } from "@/config/pricing";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: Request): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const idToken = authHeader.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const userDoc = await getAdminDb().collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") return null;
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recruiterId, credits, plan, amount } = body;

    if (!recruiterId || typeof recruiterId !== "string" || !credits || credits < 1) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Use Admin SDK so server-side writes bypass client Firestore security rules.
    const db = getAdminDb();
    const recruiterRef = db.collection("recruiterProfiles").doc(recruiterId);
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(recruiterRef);
      if (!snap.exists) throw new Error("Recruiter profile not found");
      tx.update(recruiterRef, {
        jobPostCredits: FieldValue.increment(credits),
        totalSpent: FieldValue.increment(amount || 0),
        creditsExpiresAt: expiresAt,
      });
    });

    await db.collection("transactions").add({
      recruiterId,
      gateway: "manual",
      gatewaySessionId: `manual-${Date.now()}`,
      gatewayTransactionId: `admin-${admin.uid}-${Date.now()}`,
      plan: plan || "manual",
      amount: amount || 0,
      currency: "INR",
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
      const planObj = pricingPlans.find((p) => p.id === plan) ?? null;
      const { subject, html } = creditsAddedEmail(
        userSnap.data()!.displayName,
        credits,
        planObj?.name ?? "Manual"
      );
      await sendEmail(userSnap.data()!.email, subject, html);
    }

    return NextResponse.json({ success: true, credits });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add credits";
    console.error("[manual-credit]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
