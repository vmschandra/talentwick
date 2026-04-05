import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  // Session cookie set by client after Firebase auth
  const session = request.cookies.get("session")?.value;

  // Protected routes that require authentication
  const protectedPrefixes = ["/candidate", "/recruiter", "/admin"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  // Setup page is only accessible to admins or when Firebase isn't configured
  if (pathname === "/setup") {
    if (!firebaseConfigured) return NextResponse.next();
    // If Firebase is configured, only allow admins (or redirect to home)
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protected routes: require both Firebase and a session
  if (isProtected) {
    if (!firebaseConfigured || !session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth pages: if Firebase isn't configured, redirect to home (can't auth without it)
  const authPages = ["/login", "/register", "/forgot-password"];
  if (authPages.includes(pathname) && !firebaseConfigured) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect logged-in users away from auth pages
  if (session && authPages.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // All public pages (/, /browse-jobs, /job/[id], /about, etc.) always load
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
