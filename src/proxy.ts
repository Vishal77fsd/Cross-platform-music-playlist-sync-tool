import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "music-migrate-session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // 1. Check if the user has a valid JWT session token
  let hasValidSession = false;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
      await jwtVerify(token, secret);
      hasValidSession = true;
    } catch (err) {
      hasValidSession = false;
    }
  }

  // 2. Identify public auth pages
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  // Identify protected application pages
  const isProtectedPage = pathname.startsWith("/dashboard") || pathname.startsWith("/app");

  // 3. LOGIC PIPELINE:
  // If the user IS logged in but trying to view login/signup, redirect them to dashboard
  if (hasValidSession && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If the user is NOT logged in but trying to view protected pages, redirect to login
  if (!hasValidSession && isProtectedPage) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Clear out the corrupt cookie if validation failed
    if (token) response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Let everything else through cleanly
  return NextResponse.next();
}

export const config = {
  // Catch all relevant entry points and their sub-folders safely
  matcher: [
    "/dashboard/:path*",
    "/app/:path*",
    "/login/:path*",
    "/signup/:path*",
    "/api/auth/logout"
  ],
};
