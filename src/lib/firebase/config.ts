import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: skip init when env vars are absent (Vercel static generation).
// All consumer code runs client-side at runtime when vars are available.
const isNewApp = firebaseConfig.apiKey && getApps().length === 0;
const app: FirebaseApp | undefined = firebaseConfig.apiKey
  ? isNewApp
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : undefined;

// initializeFirestore must run before any getFirestore() call for this app.
// ignoreUndefinedProperties lets us pass optional fields without crashing.
const firestore: Firestore | undefined = app
  ? isNewApp
    ? initializeFirestore(app, { ignoreUndefinedProperties: true })
    : getFirestore(app)
  : undefined;

export const auth = (app ? getAuth(app) : undefined) as Auth;
export const db = firestore as Firestore;
export const storage = (app ? getStorage(app) : undefined) as FirebaseStorage;
export const firebaseConfigured = !!app;
export default app;
