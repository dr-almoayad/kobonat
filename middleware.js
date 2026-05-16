// middleware.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

// ✅ Support both Arabic and English
const SUPPORTED_LOCALES = ['ar-SA', 'en-SA'];
const DEFAULT_LOCALE = 'ar-SA';

// ✅ Remove /^\/en-SA(\/|$)/ from dead patterns – English is now allowed
const DEAD_LOCALE_PATTERNS = [
  /^\/ar-KW\//,
  /^\/en-AE\//,
  /^\/ar-AE\//,
  /^\/en-KW\//,
  /^\/ar-EG\//,
  /^\/en-EG\//,
  /^\/ar-BH\//,
  /^\/en-BH\//,
  /^\/ar-OM\//,
  /^\/en-OM\//,
  /^\/ar-QA\//,
  /^\/en-QA\//,
  /^\/ar-JO\//,
  /^\/en-JO\//,
  /^\/ar-LB\//,
  /^\/en-LB\//,
];

const isStaticAsset = (pathname) => {
  const staticPatterns = [
    '/_next/',
    '/store-covers/',
    '/public/stores/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    /\.(avif|webp|png|jpg|jpeg|gif|svg|ico)$/i,
    /\.(woff2?|ttf|eot|otf)$/i,
    /\.(json|xml|txt)$/i,
  ];
  return staticPatterns.some(pattern => {
    if (pattern instanceof RegExp) return pattern.test(pathname);
    return pathname.startsWith(pattern);
  });
};

const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
});

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return new NextResponse(null, { status: 404, statusText: 'Not Found' });
  }

  if (
    pathname.startsWith('/_next') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/admin')) ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

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

  // Block dead locales (excluding en-SA)
  for (const pattern of DEAD_LOCALE_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }
  }

  // Redirect any other unsupported locale to ar-SA (safety)
  const match = pathname.match(/^\/([a-z]{2}-[A-Z]{2})\b/);
  if (match) {
    const localeFromUrl = match[1];
    if (!SUPPORTED_LOCALES.includes(localeFromUrl)) {
      const newPathname = pathname.replace(`/${localeFromUrl}`, `/${DEFAULT_LOCALE}`);
      const url = request.nextUrl.clone();
      url.pathname = newPathname;
      return NextResponse.redirect(url, 301);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
