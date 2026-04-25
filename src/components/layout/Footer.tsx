import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
          <Link href="/refund" className="text-sm text-muted-foreground hover:text-foreground">Refund Policy</Link>
          <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact Us</Link>
        </div>
        <div className="mt-10 border-t pt-6 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
