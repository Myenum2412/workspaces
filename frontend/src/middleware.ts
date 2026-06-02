import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const hasAccessToken = request.cookies.has("access_token");
  const url = request.nextUrl.pathname;

  // 1. Unauthenticated users cannot access protected routes
  if (!hasAccessToken && (url.startsWith("/workspace") || url.startsWith("/staff") || url.startsWith("/org-menu"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect authenticated users away from /login
  if (hasAccessToken && url === "/login") {
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  // 3. Role-based route protection (server-side)
  // Only apply to org-menu routes — admin-only section
  if (hasAccessToken && url.startsWith("/org-menu")) {
    // Get admin email from env — this is a server-side check
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

    if (adminEmail) {
      // We can't easily decode JWT in middleware without a library,
      // so we rely on the backend API for role check.
      // The org-menu layout client-side check is a UX optimization;
      // backend APIs enforce actual permissions.
      // Redirect non-admins to workspace
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (apiUrl) {
          const res = await fetch(`${apiUrl}/api/auth/me`, {
            headers: {
              Cookie: `access_token=${request.cookies.get("access_token")?.value || ""}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            const userEmail = data.user?.email?.toLowerCase();
            if (userEmail && userEmail !== adminEmail && url !== "/org-menu/register") {
              return NextResponse.redirect(new URL("/workspace", request.url));
            }
          }
        }
      } catch {
        // If API check fails, let through — backend APIs will enforce
      }
    }
  }

  // 4. Staff role redirect — staff users accessing /workspace should go to /staff
  if (hasAccessToken && url.startsWith("/workspace") && !url.startsWith("/workspace/profile")) {
    // Let the page handle staff/workspace redirect — JWT decode not available here
    // The client-side check in workspace/layout is UX optimization
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workspace/:path*", "/staff/:path*", "/org-menu/:path*", "/login"],
};
