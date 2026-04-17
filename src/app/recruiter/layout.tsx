"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { getRecruiterProfile } from "@/lib/firebase/firestore";
import { RecruiterProfile } from "@/types";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Briefcase,
  CreditCard,
  Users,
  Receipt,
} from "lucide-react";

const recruiterLinks = [
  { href: "/recruiter/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/recruiter/company-profile", label: "Company Profile", icon: <Building2 className="h-4 w-4" /> },
  { href: "/recruiter/post-job", label: "Post a Job", icon: <PlusCircle className="h-4 w-4" /> },
  { href: "/recruiter/my-jobs", label: "My Jobs", icon: <Briefcase className="h-4 w-4" /> },
  { href: "/recruiter/browse-candidates", label: "Browse Candidates", icon: <Users className="h-4 w-4" /> },
  { href: "/recruiter/pricing", label: "Buy Credits", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/recruiter/transactions", label: "Transaction History", icon: <Receipt className="h-4 w-4" /> },
];

function isPro(profile: RecruiterProfile | null): boolean {
  if (!profile || profile.jobPostCredits <= 0) return false;
  // No expiry set = legacy purchase before expiry tracking — treat as valid
  if (!profile.creditsExpiresAt) return true;
  return (profile.creditsExpiresAt as any).toDate() > new Date();
}

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);

  useEffect(() => {
    if (!loading && userDoc?.role !== "recruiter") {
      router.push(`/login?role=recruiter&redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, userDoc, router, pathname]);

  useEffect(() => {
    if (user) getRecruiterProfile(user.uid).then(setRecruiterProfile).catch(() => {});
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (userDoc?.role !== "recruiter") return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar links={recruiterLinks} isPro={isPro(recruiterProfile)} />
      <div className="flex-1 p-6 lg:p-8">{children}</div>
    </div>
  );
}
