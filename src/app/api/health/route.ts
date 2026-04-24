import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Public health check — intentionally minimal to avoid infrastructure disclosure.
export async function GET() {
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
