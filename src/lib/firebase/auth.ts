import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./config";
import { UserDoc, UserRole } from "@/types";

const googleProvider = new GoogleAuthProvider();

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await createUserDoc(cred.user, role, displayName);
  return cred.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export function startGoogleLogin(role?: UserRole): void {
  // Store the intended role so we can use it after redirect
  if (role) {
    sessionStorage.setItem("googleLoginRole", role);
  }
  signInWithRedirect(auth, googleProvider);
}

export async function handleGoogleRedirectResult(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  if (!result) return null;

  const role = sessionStorage.getItem("googleLoginRole") as UserRole | null;
  sessionStorage.removeItem("googleLoginRole");

  const existing = await getDoc(doc(db, "users", result.user.uid));
  if (!existing.exists() && role) {
    await createUserDoc(result.user, role, result.user.displayName || "User");
  }
  return result.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

async function createUserDoc(user: User, role: UserRole, displayName: string) {
  const userData: Omit<UserDoc, "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid: user.uid,
    email: user.email!,
    displayName,
    role,
    photoURL: user.photoURL || undefined,
    isActive: true,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", user.uid), userData);
}
