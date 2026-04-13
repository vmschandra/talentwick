"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthChange, getUserDoc, logout } from "@/lib/firebase/auth";
import { UserDoc } from "@/types";
import { firebaseConfigured } from "@/lib/firebase/config";

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

    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const doc = await getUserDoc(firebaseUser.uid);
        if (!doc) {
          // Stale Firebase Auth session with no Firestore doc — sign out
          await logout();
          document.cookie = "session=; path=/; max-age=0";
          setUser(null);
          setUserDoc(null);
        } else {
          setUser(firebaseUser);
          setUserDoc(doc);
        }
      } else {
        setUser(null);
        setUserDoc(null);
      }
      setLoading(false);
    });

    return unsub;
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
