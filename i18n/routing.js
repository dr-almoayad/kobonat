// i18n/routing.js
import { defineRouting } from 'next-intl/routing';
import { allLocaleCodes } from './locales';

export const routing = defineRouting({
  locales: allLocaleCodes,
  defaultLocale: 'ar-SA',
  localePrefix: 'always',
  localeDetection: false,

  pathnames: {
    '/': '/',
    '/coupons': '/coupons',
    '/stores': '/stores',
    '/stores/[slug]': '/stores/[slug]',

    // ← NEW: dedicated category routes
    '/categories': '/categories',
    '/categories/[slug]': '/categories/[slug]',

    '/search': '/search',
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    '/about': '/about',
    '/contact': '/contact',
    '/privacy': '/privacy',
    '/cookies': '/cookies',
    '/terms': '/terms',
    '/help': '/help',
  },
});
