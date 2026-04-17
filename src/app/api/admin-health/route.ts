import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin-health
 * Quick smoke-test: verifies Firebase Admin can initialize and reach Firestore.
 * Does a single harmless read — no writes, no side effects.
 */
export async function GET() {
  try {
    const db = getAdminDb();
    // Just list the first doc in any collection — proves connectivity
    const snap = await db.collection("users").limit(1).get();
    return NextResponse.json({
      ok: true,
      firestoreConnected: true,
      docsFound: snap.size,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Admin Health Error]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
