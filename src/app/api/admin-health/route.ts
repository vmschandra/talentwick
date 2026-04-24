import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: NextRequest): Promise<boolean> {
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

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Diagnose env vars (show presence + shape, never values)
  const hasBase64Key = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64;
  const hasRawKey = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "(not set)";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    ? process.env.FIREBASE_ADMIN_CLIENT_EMAIL.replace(/^(.{4}).*(@.*)$/, "$1...$2")
    : "(not set)";

  let keyShape = "none";
  if (hasBase64Key) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64!, "base64").toString("utf8");
      keyShape = decoded.startsWith("-----BEGIN") ? "base64→valid PEM" : `base64→unexpected: ${decoded.slice(0, 20)}`;
    } catch {
      keyShape = "base64→decode failed";
    }
  } else if (hasRawKey) {
    const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY!;
    const hasRealNewlines = raw.includes("\n");           // actual newline character
    const hasLiteralNewlines = raw.includes("\\n");       // literal backslash-n string
    const endsCorrectly = raw.trimEnd().endsWith("-----");
    const length = raw.length;
    if (!raw.startsWith("-----BEGIN")) {
      keyShape = `bad start: ${raw.slice(0, 30)}`;
    } else if (!hasRealNewlines && !hasLiteralNewlines) {
      keyShape = `single-line PEM, no newlines (broken), len=${length}`;
    } else if (hasLiteralNewlines && !hasRealNewlines) {
      keyShape = `PEM with literal \\n only (broken), len=${length}`;
    } else {
      keyShape = `PEM ok, realNewlines=${hasRealNewlines}, endsCorrectly=${endsCorrectly}, len=${length}`;
    }
  }

  const envDiag = { projectId, clientEmail, keyShape, hasBase64Key, hasRawKey };

  try {
    const db = getAdminDb();
    const snap = await db.collection("users").limit(1).get();
    return NextResponse.json({ ok: true, firestoreConnected: true, docsFound: snap.size, envDiag });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Admin Health Error]", message);
    return NextResponse.json({ ok: false, error: message, envDiag }, { status: 500 });
  }
}
