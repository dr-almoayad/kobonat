// i18n/routing.js
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar-SA'], // ✅ only Arabic, remove en-SA
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
    '/stacks': '/stacks',
    '/bank-and-payment-offers': '/bank-and-payment-offers',
    '/seasonal/[slug]': '/seasonal/[slug]',
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
