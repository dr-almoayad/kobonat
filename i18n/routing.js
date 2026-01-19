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
    '/categories': '/categories',
    '/search': '/search',
    '/about': '/about',
    '/auth/signin': '/auth/signin',
    '/contact': '/contact',
    '/privacy': '/privacy',
    '/terms': '/terms',
    '/help': '/help',
    // Add dynamic routes
    '/categories/[slug]': '/categories/[slug]',
    '/stores/[slug]': '/stores/[slug]',
  }
});