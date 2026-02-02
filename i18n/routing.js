// i18n/routing.js
import { defineRouting } from 'next-intl/routing';
import { allLocaleCodes } from './locales';

export const routing = defineRouting({
  // All locales supported by the application
  locales: allLocaleCodes,
  
  // Used when no locale matches
  defaultLocale: 'ar-SA',
  
  // Always show the locale prefix in the URL
  localePrefix: 'always',
  
  // Pathnames are shared across all locales
  pathnames: {
    '/': '/',
    '/home': '/home',
    '/coupons': '/coupons',
    '/stores': '/stores',
    '/search': '/search',
    '/about': '/about',
    '/contact': '/contact',
    '/privacy': '/privacy',
    '/cookies': '/cookies',
    '/terms': '/terms',
    '/help': '/help',
    // Add dynamic routes
    '/stores/[slug]': '/stores/[slug]',
  }
});
