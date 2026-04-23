import { getAdminAuth } from "./admin";

/**
 * Extracts and verifies the Firebase ID token from an Authorization: Bearer header.
 * Returns the decoded token (including uid) or null if missing/invalid.
 */
export async function verifyIdToken(request: Request): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
