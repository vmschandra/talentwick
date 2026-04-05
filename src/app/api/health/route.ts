import { NextResponse } from "next/server";
import { getConfigStatus } from "@/config/env-check";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getConfigStatus();
  return NextResponse.json({
    firebase: config.firebase.configured,
    payments: { enabled: config.payments.configured, provider: config.payments.provider },
    email: { enabled: config.email.configured, provider: config.email.provider },
    timestamp: new Date().toISOString(),
  });
}
