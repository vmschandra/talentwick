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

  // Option 1 (recommended): full service account JSON pasted as one env var.
  // JSON.parse handles the \n escaping in private_key correctly.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    _app = initializeApp({ credential: cert(sa) });
    return _app;
  }

  // Option 2: base64-encoded private key (immune to Vercel escaping issues)
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64) {
    const privateKey = Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64, "base64").toString("utf8");
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID!;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!;
    _app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return _app;
  }

  // Option 3: raw key with common Vercel escaping fixes (fallback)
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ?.replace(/^["']|["']$/g, "")
    ?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin SDK is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_* env vars.");
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
