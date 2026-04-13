import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
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

export interface RegisterProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  companyName?: string;
  designation?: string;
}

export async function registerWithEmail(
  email: string,
  password: string,
  role: UserRole,
  profile: RegisterProfileData
): Promise<User> {
  const displayName = `${profile.firstName} ${profile.lastName}`.trim();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await createUserDoc(cred.user, role, displayName, profile.phone);
  await createRoleProfile(cred.user.uid, role, profile);
  return cred.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle(role?: UserRole): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  const existing = await getDoc(doc(db, "users", cred.user.uid));
  if (!existing.exists() && role) {
    await createUserDoc(cred.user, role, cred.user.displayName || "User");
  }
  return cred.user;
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

async function createUserDoc(user: User, role: UserRole, displayName: string, phone?: string) {
  const userData: Omit<UserDoc, "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid: user.uid,
    email: user.email!,
    displayName,
    role,
    photoURL: user.photoURL || undefined,
    phone: phone || undefined,
    isActive: true,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", user.uid), userData);
}

async function createRoleProfile(uid: string, role: UserRole, profile: RegisterProfileData) {
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  if (role === "recruiter") {
    await setDoc(
      doc(db, "recruiterProfiles", uid),
      {
        uid,
        companyName: profile.companyName || "",
        designation: profile.designation || "",
        location,
        jobPostCredits: 0,
        totalCreditsUsed: 0,
        totalSpent: 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else if (role === "candidate") {
    await setDoc(
      doc(db, "candidateProfiles", uid),
      {
        uid,
        location,
        skills: [],
        experience: [],
        education: [],
        openToWork: true,
        profileCompleteness: 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
