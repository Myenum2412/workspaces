import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

async function getAuthUser(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Cookie: `access_token=${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.user || json.data?.user || null;
  } catch {
    return null;
  }
}

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

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
    const protectedPrefixes = ["/workspace", "/members", "/org-menu", "/employees"];
    if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Authenticated users — single auth check for role-based routing
  if (pathname.startsWith("/org-menu") && pathname !== "/org-menu/register") {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.role !== "ORG_ADMIN") {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workspace/:path*", "/members/:path*", "/employees/:path*", "/org-menu/:path*", "/login"],
};
