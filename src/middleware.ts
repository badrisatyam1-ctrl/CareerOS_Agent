import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CareerOS Server-Side Security & Authorization Middleware
 * Enforces:
 * 1. CSRF / Origin validation for mutating requests (POST, PUT, PATCH, DELETE)
 * 2. Authenticated owner session checks on protected routes
 * 3. Security headers on all responses
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1. CSRF / Origin Validation on Mutating Requests
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (mutatingMethods.includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse(
            JSON.stringify({ error: "CSRF: Cross-origin mutation forbidden" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: "CSRF: Invalid origin header" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // 2. Server-Side Authentication & Session Authorization
  // CareerOS is single-user for Badri Vishal Pandey.
  const isDemo =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test";

  if (!isDemo && !pathname.startsWith("/api/auth") && pathname !== "/login") {
    const sessionCookie = request.cookies.get("careeros_session");
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
