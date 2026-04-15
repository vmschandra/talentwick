"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import {
  LayoutDashboard,
  UserCircle,
  Briefcase,
  FileText,
} from "lucide-react";

const candidateLinks = [
  { href: "/candidate/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/candidate/profile", label: "My Profile", icon: <UserCircle className="h-4 w-4" /> },
  { href: "/candidate/jobs", label: "Browse Jobs", icon: <Briefcase className="h-4 w-4" /> },
  { href: "/candidate/applications", label: "My Applications", icon: <FileText className="h-4 w-4" /> },
];

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { userDoc, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && userDoc?.role !== "candidate") {
      router.push(`/login?role=candidate&redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, userDoc, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (userDoc?.role !== "candidate") return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar links={candidateLinks} />
      <div className="flex-1 p-6 lg:p-8">{children}</div>
    </div>
  );
}
