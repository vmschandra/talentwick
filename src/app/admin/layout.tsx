"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { LayoutDashboard, Users, Briefcase, DollarSign, Settings } from "lucide-react";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/jobs", label: "Jobs", icon: <Briefcase className="h-4 w-4" /> },
  { href: "/admin/revenue", label: "Revenue", icon: <DollarSign className="h-4 w-4" /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userDoc, loading } = useAuth();
  const router = useRouter();

  const pathname = usePathname();

  useEffect(() => {
    if (!loading && userDoc?.role !== "admin") {
      router.push(`/login?role=admin&redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, userDoc, router, pathname]);

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (userDoc?.role !== "admin") return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar links={adminLinks} />
      <div className="flex-1 p-6 lg:p-8">{children}</div>
    </div>
  );
}
