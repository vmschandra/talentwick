"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/firebase/auth";
import { getUserNotifications, markNotificationRead } from "@/lib/firebase/firestore";
import { Notification } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Menu, X, Briefcase, LogOut, User, LayoutDashboard, CreditCard, Building } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function Navbar() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      getUserNotifications(user.uid, 10).then(setNotifications).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await logout();
    document.cookie = "session=; path=/; max-age=0";
    router.push("/");
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.read) await markNotificationRead(n.id);
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.link) router.push(n.link);
  };

  const dashboardPath = userDoc?.role === "recruiter" ? "/recruiter/dashboard" : userDoc?.role === "admin" ? "/admin/dashboard" : "/candidate/dashboard";

  const initials = userDoc?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary-foreground">
          <Briefcase className="h-6 w-6" />
          {siteConfig.name}
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/browse-jobs" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Browse Jobs
          </Link>
          {!loading && !user && (
            <>
              <Link href="/login?role=candidate">
                <Button size="sm" className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 border-0">Candidate Login</Button>
              </Link>
              <Link href="/login?role=recruiter">
                <Button size="sm" variant="secondary">Recruiter Login</Button>
              </Link>
            </>
          )}
          {!loading && user && userDoc && (
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 && (
                    <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
                  )}
                  {notifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem key={n.id} onClick={() => handleNotifClick(n)} className="cursor-pointer">
                      <div className={`flex-1 ${n.read ? "opacity-60" : ""}`}>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-primary-foreground/15">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary-foreground text-primary text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{userDoc.displayName}</p>
                    <p className="text-xs text-muted-foreground">{userDoc.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(dashboardPath)}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  {userDoc.role === "candidate" && (
                    <DropdownMenuItem onClick={() => router.push("/candidate/profile")}>
                      <User className="mr-2 h-4 w-4" /> Profile
                    </DropdownMenuItem>
                  )}
                  {userDoc.role === "recruiter" && (
                    <>
                      <DropdownMenuItem onClick={() => router.push("/recruiter/company-profile")}>
                        <Building className="mr-2 h-4 w-4" /> Company
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/recruiter/pricing")}>
                        <CreditCard className="mr-2 h-4 w-4" /> Buy Credits
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-primary-foreground/20 bg-primary p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/browse-jobs" className="text-sm font-medium text-primary-foreground" onClick={() => setMobileOpen(false)}>Browse Jobs</Link>
            {!user ? (
              <>
                <Link href="/login?role=candidate" onClick={() => setMobileOpen(false)}><Button className="w-full bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 border-0">Candidate Login</Button></Link>
                <Link href="/login?role=recruiter" onClick={() => setMobileOpen(false)}><Button variant="secondary" className="w-full">Recruiter Login</Button></Link>
              </>
            ) : (
              <>
                <Link href={dashboardPath} className="text-sm font-medium text-primary-foreground" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="text-sm font-medium text-red-300 text-left">Log out</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
