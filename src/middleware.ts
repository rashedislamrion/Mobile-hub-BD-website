import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware — protects /account/* and /admin/* routes.
 *
 * Since auth tokens are stored in localStorage (not cookies), we cannot
 * verify the token server-side in middleware. Instead, we inject an
 * `x-auth-check` header that the client-side layout uses as a signal,
 * and we check for the presence of the staff/customer token cookies
 * that the API sets via Set-Cookie (httpOnly refresh tokens).
 *
 * For a defense-in-depth approach, the client-side layouts also check
 * for token presence and redirect if missing.
 */

const PROTECTED_CUSTOMER_PATHS = ['/account'];
const PROTECTED_ADMIN_PATHS = ['/admin'];
const ADMIN_LOGIN_PATH = '/admin/login';
const CUSTOMER_LOGIN_PATH = '/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip login pages themselves
  if (pathname === ADMIN_LOGIN_PATH || pathname === CUSTOMER_LOGIN_PATH) {
    return NextResponse.next();
  }

  // Check admin routes — require staff token cookie
  const isAdminRoute = PROTECTED_ADMIN_PATHS.some(p => pathname.startsWith(p));
  if (isAdminRoute) {
    // Check for refresh token cookie (set by API on login)
    const hasStaffRefresh = request.cookies.has('staff_refresh_token');
    // Also check for a manually-set auth indicator cookie
    const hasStaffAuth = request.cookies.has('staff_authenticated');

    if (!hasStaffRefresh && !hasStaffAuth) {
      // No server-side cookie found — add header for client-side check
      const response = NextResponse.next();
      response.headers.set('x-auth-check', 'required');
      return response;
    }
  }

  // Check customer account routes
  const isAccountRoute = PROTECTED_CUSTOMER_PATHS.some(p => pathname.startsWith(p));
  if (isAccountRoute) {
    const hasCustomerRefresh = request.cookies.has('customer_refresh_token');
    const hasCustomerAuth = request.cookies.has('customer_authenticated');

    if (!hasCustomerRefresh && !hasCustomerAuth) {
      return NextResponse.redirect(new URL('/login?redirect=' + pathname, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};
