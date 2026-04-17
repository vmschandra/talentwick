import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let _app: App | undefined;

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  // Prefer base64-encoded key (immune to Vercel whitespace/escaping corruption).
  // Fall back to raw key with common escaping fixes.
  let privateKey: string | undefined;
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64) {
    privateKey = Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64, "base64").toString("utf8");
  } else {
    privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ?.replace(/^["']|["']$/g, "")  // strip surrounding quotes
      ?.replace(/\\n/g, "\n");        // convert literal \n to real newlines
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin SDK is not configured. Set FIREBASE_ADMIN_* env vars.");
  }

  _app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return _app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
