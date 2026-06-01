import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for access_token cookie presence (httpOnly cookie set by backend)
  const hasAccessToken = request.cookies.has("access_token");
  const url = request.nextUrl.pathname;

  // 1. Unauthenticated users cannot access protected routes
  if (!hasAccessToken && (url.startsWith("/workspace") || url.startsWith("/staff") || url.startsWith("/org-menu"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect authenticated users away from /login
  if (hasAccessToken && url === "/login") {
    // Role-based redirect is handled client-side after /api/auth/me fetch
    // Default to /workspace since server will redirect non-staff via API if needed
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  // 3. NOTE: Role-based route protection (staff vs workspace) is enforced
  // server-side in each API route via the `authenticate` middleware on the backend.
  // Client-side role checks are UX-only; the backend is the authority.
  // Attempting to access /workspace as "staff" returns 403 from API.
  // The org-menu admin check is handled client-side in org-menu/layout.tsx
  // after fetching /api/auth/me — acceptable because backend APIs enforce
  // actual permissions regardless of client-side routing.

  return NextResponse.next();
}

export const config = {
  matcher: ["/workspace/:path*", "/staff/:path*", "/org-menu/:path*", "/login"],
};
