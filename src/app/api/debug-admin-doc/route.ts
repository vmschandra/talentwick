import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

// Temporary diagnostic endpoint — delete after confirming admin Firestore doc.
// Usage: GET /api/debug-admin-doc?email=talentwick@gmail.com
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email param required" }, { status: 400 });
  }

  try {
    const auth = getAdminAuth();
    const userRecord = await auth.getUserByEmail(email);
    const db = getAdminDb();
    const snap = await db.collection("users").doc(userRecord.uid).get();

    return NextResponse.json({
      uid: userRecord.uid,
      emailVerified: userRecord.emailVerified,
      docExists: snap.exists,
      docData: snap.exists ? snap.data() : null,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
