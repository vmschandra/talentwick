import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    await getAdminAuth().verifyIdToken(token);

    const { conversationId, recipientId, recipientRole, senderName, previewText } =
      await request.json();

    if (!conversationId || !recipientId || !senderName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const role = recipientRole === "recruiter" ? "recruiter" : "candidate";
    const link = `/${role}/messages?convId=${conversationId}`;

    await getAdminDb()
      .collection("notifications")
      .add({
        userId: recipientId,
        type: "new_message",
        title: `New message from ${senderName}`,
        message: previewText ? previewText.slice(0, 80) : "",
        link,
        conversationId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    console.error("[messages/notify]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
