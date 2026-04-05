import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if Firebase is configured via cookie or public env var
  const firebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  // If Firebase not configured, redirect everything to /setup
  if (!firebaseConfigured) {
    if (pathname === "/setup" || pathname === "/api/health" || pathname.startsWith("/_next")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  // Session cookie set by client after Firebase auth
  const session = request.cookies.get("session")?.value;

  // Protected routes
  const protectedPrefixes = ["/candidate", "/recruiter", "/admin"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages
  const authPages = ["/login", "/register", "/forgot-password"];
  if (session && authPages.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
