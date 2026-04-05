import Link from "next/link";
import { Briefcase } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
              <Briefcase className="h-5 w-5" />
              {siteConfig.name}
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              The modern job portal connecting great companies with exceptional talent.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">For Job Seekers</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/browse-jobs" className="text-sm text-muted-foreground hover:text-foreground">Browse Jobs</Link></li>
              <li><Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">Create Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">For Recruiters</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">Post a Job</Link></li>
              <li><Link href="/recruiter/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
