// i18n/routing.js
import { defineRouting } from 'next-intl/routing';
import { allLocaleCodes } from './locales';

export const routing = defineRouting({
  locales: allLocaleCodes, // only ar-SA, en-SA
  defaultLocale: 'ar-SA',
  localePrefix: 'always',
  localeDetection: false,
  pathnames: {
    '/': '/',
    '/coupons': '/coupons',
    '/stores': '/stores',
    '/stores/[slug]': '/stores/[slug]',
    '/categories': '/categories',
    '/categories/[slug]': '/categories/[slug]',
    '/stacks': '/stacks',                           // ✅ added
    '/bank-and-payment-offers': '/bank-and-payment-offers', // ✅ added
    '/seasonal/[slug]': '/seasonal/[slug]',         // ✅ added
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
