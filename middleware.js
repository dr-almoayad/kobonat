import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { allLocaleCodes } from './i18n/locales';

const intlMiddleware = createMiddleware({
  locales: allLocaleCodes,
  defaultLocale: 'ar-SA',
  localePrefix: 'always',
});

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Define admin paths
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  // 2. BYPASS i18n for admin routes
  if (isAdminRoute || isAdminApi) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Allow access to login page without token
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token || !token.isAdmin) {
      if (isAdminApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // 3. APPLY i18n for everything else
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)', '/admin/:path*', '/api/admin/:path*']
};