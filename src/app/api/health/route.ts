import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getConfigStatus } from "@/config/env-check";

export const dynamic = "force-dynamic";

async function isAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
    return snap.exists && snap.data()?.role === "admin";
  } catch {
    return false;
  }
}

// Authenticated admins get full config status.
// Unauthenticated callers get a minimal ok/timestamp with no service details.
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  }

  const config = getConfigStatus();
  return NextResponse.json({
    firebase: config.firebase.configured,
    payments: { enabled: config.payments.configured, provider: config.payments.provider },
    email: { enabled: config.email.configured, provider: config.email.provider },
    timestamp: new Date().toISOString(),
  });
}
