"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthChange } from "@/lib/firebase/auth";
import { db, firebaseConfigured } from "@/lib/firebase/config";
import { UserDoc } from "@/types";

interface AuthContextValue {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userDoc: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }

    // Track the active Firestore listener so we can clean it up when the
    // auth user changes or the component unmounts.
    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthChange((firebaseUser) => {
      // Tear down the previous doc listener whenever auth state changes.
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        // Subscribe to the user doc so updates (onboarding complete, role
        // change, etc.) are reflected immediately without a page reload.
        unsubDoc = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            setUserDoc(snap.exists() ? (snap.data() as UserDoc) : null);
            setLoading(false);
          },
          (error) => {
            // permission-denied means the session is invalid — sign the user out.
            // Any other code (unavailable, network errors) is transient; keep
            // the current userDoc so the UI doesn't flash logged-out mid-session.
            if (error.code === "permission-denied") {
              setUserDoc(null);
            }
            setLoading(false);
          }
        );
      } else {
        setUserDoc(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userDoc, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
