import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const url = request.nextUrl.pathname

  // 1. Unauthenticated users cannot access protected routes
  if (!token && (url.startsWith('/workspace') || url.startsWith('/staff'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Decode token payload (basic JWT decoding without verification for edge routing)
  let role = 'member'
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]
      if (payloadBase64) {
        const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')))
        role = payload.role || 'member'
      }
    } catch (e) {
      console.warn("Failed to decode token in middleware")
    }
  }

  // 3. RBAC Enforcements
  // Staff cannot access Workspace (Admin) areas
  if (role === 'staff' && url.startsWith('/workspace')) {
    return NextResponse.redirect(new URL('/staff/dashboard', request.url))
  }

  // Admin/Managers can't access Staff Dashboard natively (optional: maybe they can, but let's redirect them back to workspace if they try)
  // if (role !== 'staff' && url.startsWith('/staff/dashboard')) {
  //   return NextResponse.redirect(new URL('/workspace', request.url))
  // }

  // 4. Redirect authenticated users away from /login
  if (token && url === '/login') {
    return NextResponse.redirect(
      new URL(role === 'staff' ? '/staff/dashboard' : '/workspace', request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/workspace/:path*', '/staff/:path*', '/login'],
}
