import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { allLocaleCodes } from './i18n/locales';

// Only SA locales are allowed
const SUPPORTED_LOCALES = ['ar-SA', 'en-SA'];
const DEFAULT_LOCALE = 'ar-SA';

const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
});

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Ignore static files and internal paths
  if (
    pathname.startsWith('/_next') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/admin')) ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Admin routes (unchanged)
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminRoute || isAdminApi) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    if (!token || !token.isAdmin) {
      if (isAdminApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // ── LOCALE VALIDATION: redirect unsupported locales to DEFAULT_LOCALE ──
  // Extract the first segment of the pathname.
  const match = pathname.match(/^\/([a-z]{2}-[A-Z]{2})\b/);
  if (match) {
    const localeFromUrl = match[1];
    if (!SUPPORTED_LOCALES.includes(localeFromUrl)) {
      // Replace unsupported locale with default
      const newPathname = pathname.replace(`/${localeFromUrl}`, `/${DEFAULT_LOCALE}`);
      const url = request.nextUrl.clone();
      url.pathname = newPathname;
      return NextResponse.redirect(url, 301); // permanent redirect to correct locale
    }
  }

  // Run next-intl middleware for all other public paths
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
