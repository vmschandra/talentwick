import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Verify recruiter auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const recruiterId = decoded.uid;

    const { candidateId, candidateName, recruiterName, companyName } = await request.json();
    if (!candidateId) {
      return NextResponse.json({ error: "candidateId required" }, { status: 400 });
    }

    const db = getAdminDb();

    // Check if conversation already exists
    const existing = await db
      .collection("conversations")
      .where("candidateId", "==", candidateId)
      .where("recruiterId", "==", recruiterId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ conversationId: existing.docs[0].id });
    }

    // Create new conversation
    const ref = await db.collection("conversations").add({
      participantIds: [candidateId, recruiterId],
      candidateId,
      recruiterId,
      candidateName: candidateName ?? "Candidate",
      recruiterName: recruiterName ?? "Recruiter",
      companyName: companyName ?? "",
      lastMessage: "",
      lastMessageAt: FieldValue.serverTimestamp(),
      lastSenderId: "",
      unreadCount: { [candidateId]: 0, [recruiterId]: 0 },
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ conversationId: ref.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    console.error("[get-or-create conversation]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
