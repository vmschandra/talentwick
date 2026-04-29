import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { sendEmail } from "@/lib/email";
import {
  welcomeEmail,
  applicationReceivedEmail,
  applicationStatusEmail,
  applicationSubmittedEmail,
  jobPostedEmail,
  newMessageEmail,
  creditsAddedEmail,
} from "@/lib/email/templates";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Require a valid Firebase ID token.
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let decoded: { uid: string };
  try {
    decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(`email:${decoded.uid}`, 30, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  const body = await request.json();
  const { type } = body;

  try {
    const db = getAdminDb();

    if (type === "welcome") {
      const { uid } = body;
      const snap = await db.collection("users").doc(uid).get();
      if (!snap.exists) return NextResponse.json({ ok: true });
      const user = snap.data()!;
      const { subject, html } = welcomeEmail(user.displayName || "there", user.role);
      await sendEmail(user.email, subject, html);

    } else if (type === "application_received") {
      const { jobId, candidateName, jobTitle, recruiterId } = body;
      const snap = await db.collection("users").doc(recruiterId).get();
      if (!snap.exists) return NextResponse.json({ ok: true });
      const recruiter = snap.data()!;
      const { subject, html } = applicationReceivedEmail(
        recruiter.displayName,
        candidateName,
        jobTitle,
        jobId
      );
      await sendEmail(recruiter.email, subject, html);

    } else if (type === "application_status") {
      const { candidateId, jobTitle, companyName, status } = body;
      const snap = await db.collection("users").doc(candidateId).get();
      if (!snap.exists) return NextResponse.json({ ok: true });
      const candidate = snap.data()!;
      const { subject, html } = applicationStatusEmail(
        candidate.displayName,
        jobTitle,
        companyName,
        status
      );
      await sendEmail(candidate.email, subject, html);

    } else if (type === "application_submitted") {
      const { candidateId, jobTitle, companyName } = body;
      const snap = await db.collection("users").doc(candidateId).get();
      if (!snap.exists) return NextResponse.json({ ok: true });
      const candidate = snap.data()!;
      const { subject, html } = applicationSubmittedEmail(
        candidate.displayName,
        jobTitle,
        companyName
      );
      await sendEmail(candidate.email, subject, html);

    } else if (type === "job_posted") {
      const { recruiterId, jobTitle, jobId } = body;
      const snap = await db.collection("users").doc(recruiterId).get();
      if (!snap.exists) return NextResponse.json({ ok: true });
      const recruiter = snap.data()!;
      const { subject, html } = jobPostedEmail(recruiter.displayName, jobTitle, jobId);
      await sendEmail(recruiter.email, subject, html);

    } else if (type === "new_message") {
      const { recipientId, senderName, previewText, conversationId, recipientRole } = body;
      const snap = await db.collection("users").doc(recipientId).get();
      if (!snap.exists) return NextResponse.json({ ok: true });
      const recipient = snap.data()!;
      const { subject, html } = newMessageEmail(
        recipient.displayName,
        senderName,
        previewText || "",
        conversationId,
        recipientRole || "candidate"
      );
      await sendEmail(recipient.email, subject, html);

    } else if (type === "credits_added") {
      const { recruiterId, credits, planName } = body;
      const snap = await db.collection("users").doc(recruiterId).get();
      if (!snap.exists) return NextResponse.json({ ok: true });
      const recruiter = snap.data()!;
      const { subject, html } = creditsAddedEmail(recruiter.displayName, credits, planName);
      await sendEmail(recruiter.email, subject, html);

    } else {
      return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[/api/email]", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
