import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendEmail } from "@/lib/email";
import { newMessageEmail } from "@/lib/email/templates";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const callerId = decoded.uid;

    const rl = await checkRateLimit(`messages-notify:${callerId}`, 30, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
      );
    }

    const { conversationId, recipientId, recipientRole, senderName, previewText } =
      await request.json();

    if (!conversationId || !recipientId || !senderName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the caller is actually a participant in this conversation.
    const db = getAdminDb();
    const convSnap = await db.collection("conversations").doc(conversationId).get();
    if (!convSnap.exists) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    const participants: string[] = convSnap.data()?.participantIds ?? [];
    if (!participants.includes(callerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Recipient must also be in the conversation.
    if (!participants.includes(recipientId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const role = recipientRole === "recruiter" ? "recruiter" : "candidate";
    const link = `/${role}/messages?convId=${conversationId}`;

    await db.collection("notifications").add({
      userId: recipientId,
      type: "new_message",
      title: `New message from ${senderName}`,
      message: previewText ? String(previewText).slice(0, 80) : "",
      link,
      conversationId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send email notification to recipient
    const recipientSnap = await db.collection("users").doc(recipientId).get();
    if (recipientSnap.exists) {
      const recipient = recipientSnap.data()!;
      const { subject, html } = newMessageEmail(
        recipient.displayName,
        senderName,
        previewText ? String(previewText).slice(0, 120) : "",
        conversationId,
        role as "candidate" | "recruiter"
      );
      sendEmail(recipient.email, subject, html).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    console.error("[messages/notify]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
