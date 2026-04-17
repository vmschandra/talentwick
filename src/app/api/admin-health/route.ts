import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
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
    if (raw.startsWith("-----BEGIN")) keyShape = "raw PEM (ok)";
    else if (raw.startsWith('"-----BEGIN')) keyShape = "raw PEM with leading quote (broken)";
    else if (raw.includes("\\n")) keyShape = "raw with literal \\n (needs replace)";
    else keyShape = `raw unknown: ${raw.slice(0, 30)}`;
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
