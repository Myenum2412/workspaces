import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/workspace", "/members", "/org-menu", "/employees"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessToken = request.cookies.has("access_token");

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    if (hasAccessToken && pathname === "/login") {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
    return NextResponse.next();
  }

  // Protect authenticated routes
  if (!hasAccessToken) {
    if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Role-based routing for org-menu — rely on cookie presence only
  // The actual role check happens on the server side via API calls
  // This avoids the expensive HTTP call in middleware
  if (pathname.startsWith("/org-menu") && pathname !== "/org-menu/register") {
    // Let the page handle role-based redirects via server-side data fetching
    // This is more reliable and avoids the double-auth pattern
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/members/:path*",
    "/employees/:path*",
    "/org-menu/:path*",
    "/login",
  ],
};
