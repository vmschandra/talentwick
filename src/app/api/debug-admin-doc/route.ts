import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

// Temporary diagnostic + fix endpoint — delete after confirming admin works.
// GET  /api/debug-admin-doc?email=talentwick@gmail.com   → inspect doc
// POST /api/debug-admin-doc?email=talentwick@gmail.com   → set role="admin"
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email param required" }, { status: 400 });

  try {
    const auth = getAdminAuth();
    const userRecord = await auth.getUserByEmail(email);
    const db = getAdminDb();
    const snap = await db.collection("users").doc(userRecord.uid).get();
    return NextResponse.json({
      uid: userRecord.uid,
      docExists: snap.exists,
      docData: snap.exists ? snap.data() : null,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email param required" }, { status: 400 });

  try {
    const auth = getAdminAuth();
    const userRecord = await auth.getUserByEmail(email);
    const db = getAdminDb();
    await db.collection("users").doc(userRecord.uid).update({
      role: "admin",
      displayName: userRecord.displayName || "Admin",
    });
    const snap = await db.collection("users").doc(userRecord.uid).get();
    return NextResponse.json({ ok: true, updated: snap.data() });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
