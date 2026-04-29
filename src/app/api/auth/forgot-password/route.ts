import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const rl = await checkRateLimit(`forgot-password:${ip}`, 5, 900);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 900) } }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate the Firebase password reset link server-side
    const resetLink = await getAdminAuth().generatePasswordResetLink(email);

    // Send via Resend with TalentWick branding
    const { subject, html } = passwordResetEmail(resetLink);
    await sendEmail(email, subject, html);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    // Don't reveal whether the email exists — return ok for any auth error
    if (code === "auth/user-not-found" || code === "auth/invalid-email") {
      return NextResponse.json({ ok: true });
    }
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
