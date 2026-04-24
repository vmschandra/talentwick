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
    const decoded = await getAdminAuth().verifyIdToken(token);
    const recruiterId = decoded.uid;

    // Verify the caller is actually a recruiter.
    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(recruiterId).get();
    if (!userSnap.exists || userSnap.data()?.role !== "recruiter") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { candidateId, candidateName, recruiterName, companyName } = await request.json();
    if (!candidateId) {
      return NextResponse.json({ error: "candidateId required" }, { status: 400 });
    }

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
