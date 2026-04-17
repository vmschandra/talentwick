"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  links: SidebarLink[];
  isPro?: boolean;
}

export default function Sidebar({ links, isPro }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 lg:flex lg:flex-col">
      <nav className="flex flex-col gap-1 p-4 flex-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {isPro && (
        <div className="m-4 mt-0 flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-yellow-600" />
          <div>
            <p className="text-xs font-semibold text-yellow-800">Pro Account</p>
            <p className="text-[11px] text-yellow-700 leading-tight">Active credits</p>
          </div>
        </div>
      )}
    </aside>
  );
}
