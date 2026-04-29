import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds until the window resets
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const db = getAdminDb();
  const docRef = db.collection("rateLimits").doc(key);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);

    if (!snap.exists) {
      const windowStart = Timestamp.fromMillis(now);
      const expireAt = Timestamp.fromMillis(now + windowMs);
      tx.set(docRef, { count: 1, windowStart, expireAt });
      return { allowed: true };
    }

    const data = snap.data()!;
    const windowStart = (data.windowStart as Timestamp).toMillis();

    if (now - windowStart >= windowMs) {
      // Window expired — reset
      const newWindowStart = Timestamp.fromMillis(now);
      const expireAt = Timestamp.fromMillis(now + windowMs);
      tx.set(docRef, { count: 1, windowStart: newWindowStart, expireAt });
      return { allowed: true };
    }

    if (data.count >= limit) {
      const retryAfter = Math.ceil((windowStart + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    tx.update(docRef, { count: FieldValue.increment(1) });
    return { allowed: true };
  });
}
