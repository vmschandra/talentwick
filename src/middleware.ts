import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  // Setup page is only accessible when Firebase isn't configured
  if (pathname === "/setup") {
    if (!firebaseConfigured) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Auth pages are inaccessible when Firebase isn't configured
  const authPages = ["/login", "/register", "/forgot-password"];
  if (authPages.includes(pathname) && !firebaseConfigured) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // All other routing (auth checks, role guards) is handled in each layout.
  // Real access control is enforced by Firestore security rules server-side.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
