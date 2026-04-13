import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { addCreditsToRecruiter } from "@/lib/payments/credit-service";

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

    await addCreditsToRecruiter(recruiterId, credits, {
      plan: plan || "manual",
      amount: amount || 0,
      currency: "USD",
      gateway: "manual",
      gatewaySessionId: `manual-${Date.now()}`,
      gatewayTransactionId: `admin-${admin.uid}-${Date.now()}`,
    });

    return NextResponse.json({ success: true, credits });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add credits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
