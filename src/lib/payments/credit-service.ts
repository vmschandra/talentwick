import {
  doc,
  addDoc,
  collection,
  increment,
  serverTimestamp,
  runTransaction,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function addCreditsToRecruiter(
  recruiterId: string,
  credits: number,
  transactionData: {
    plan: string;
    amount: number;
    currency: string;
    gateway: string;
    gatewaySessionId: string;
    gatewayTransactionId: string;
  }
): Promise<void> {
  const recruiterRef = doc(db, "recruiterProfiles", recruiterId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(recruiterRef);
    if (!snap.exists()) throw new Error("Recruiter profile not found");

    transaction.update(recruiterRef, {
      jobPostCredits: increment(credits),
      totalSpent: increment(transactionData.amount),
    });
  });

  await addDoc(collection(db, "transactions"), {
    recruiterId,
    gateway: transactionData.gateway,
    gatewaySessionId: transactionData.gatewaySessionId,
    gatewayTransactionId: transactionData.gatewayTransactionId,
    plan: transactionData.plan,
    amount: transactionData.amount,
    currency: transactionData.currency,
    credits,
    status: "completed",
    createdAt: serverTimestamp(),
  });

  await addDoc(collection(db, "notifications"), {
    userId: recruiterId,
    type: "credits_added",
    title: "Credits Added",
    message: `${credits} job posting credit${credits > 1 ? "s" : ""} added to your account.`,
    link: "/recruiter/pricing",
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function deductCredit(recruiterId: string): Promise<boolean> {
  const recruiterRef = doc(db, "recruiterProfiles", recruiterId);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(recruiterRef);
      const credits = snap.data()?.jobPostCredits || 0;
      if (credits < 1) throw new Error("No credits");
      transaction.update(recruiterRef, {
        jobPostCredits: increment(-1),
        totalCreditsUsed: increment(1),
      });
    });
    return true;
  } catch {
    return false;
  }
}

export async function getRecruiterCredits(recruiterId: string): Promise<number> {
  const snap = await getDoc(doc(db, "recruiterProfiles", recruiterId));
  return snap.data()?.jobPostCredits || 0;
}
