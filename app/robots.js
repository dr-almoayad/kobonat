// app/robots.js
// Both ar-SA and en-SA are active locales.
// en-SA is allowed for all crawlers — mirroring the ar-SA allow rules.
// Search pages and admin/API remain disallowed for all bots.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export default function robots() {
  return {
    rules: [
      // ──────────────────────────────────────────────────────────────────────
      // 1. GOOGLEBOT
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: 'Googlebot',
        allow: [
          // Arabic — Saudi Arabia
          '/',
          '/ar-SA/',
          '/ar-SA/coupons',
          '/ar-SA/stores',
          '/ar-SA/stores/*',
          '/ar-SA/categories',
          '/ar-SA/categories/*',
          '/ar-SA/stacks',
          '/ar-SA/blog',
          '/ar-SA/blog/*',
          '/ar-SA/about',
          '/ar-SA/contact',
          '/ar-SA/privacy',
          '/ar-SA/cookies',
          '/ar-SA/terms',
          '/ar-SA/help',
          '/ar-SA/seasonal/*',
          '/ar-SA/bank-and-payment-offers',
          // English — Saudi Arabia
          '/en-SA/',
          '/en-SA/coupons',
          '/en-SA/stores',
          '/en-SA/stores/*',
          '/en-SA/categories',
          '/en-SA/categories/*',
          '/en-SA/stacks',
          '/en-SA/blog',
          '/en-SA/blog/*',
          '/en-SA/about',
          '/en-SA/contact',
          '/en-SA/privacy',
          '/en-SA/cookies',
          '/en-SA/terms',
          '/en-SA/help',
          '/en-SA/seasonal/*',
          '/en-SA/bank-and-payment-offers',
        ],
        disallow: [
          // Admin & API
          '/admin/',
          '/api/',
          // Search (noindex handled in page metadata, also blocked here)
          '/*/search',
          '/*/search?*',
          // Static asset directories
          '/_next/',
          '/store-covers/',
          '/public/stores/',
          '/favicon.ico',
          // Dead locales (non-SA)
          '/ar-KW/', '/en-AE/', '/ar-AE/', '/en-KW/',
          '/ar-EG/', '/en-EG/', '/ar-BH/', '/en-BH/',
          '/ar-OM/', '/en-OM/', '/ar-QA/', '/en-QA/',
          '/ar-JO/', '/en-JO/', '/ar-LB/', '/en-LB/',
          // File extensions
          '/*.json$', '/*.js$', '/*.css$',
          '/*.avif$', '/*.webp$', '/*.png$', '/*.jpg$', '/*.jpeg$',
          '/*.woff$', '/*.woff2$', '/*.ttf$',
          // Tracking query parameters
          '/*?ref=*', '/*?utm_*', '/*?source=*', '/*?fbclid=*', '/*?gclid=*',
        ],
        crawlDelay: 0,
      },

      // ──────────────────────────────────────────────────────────────────────
      // 2. GOOGLEBOT-IMAGE — prevent standalone image crawling
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: 'Googlebot-Image',
        disallow: [
          '/',
          '/store-covers/',
          '/public/stores/',
          '/_next/static/',
        ],
      },

      // ──────────────────────────────────────────────────────────────────────
      // 3. BINGBOT
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/ar-SA/',
          '/ar-SA/coupons',
          '/ar-SA/stores',
          '/ar-SA/stores/*',
          '/ar-SA/categories',
          '/ar-SA/categories/*',
          '/ar-SA/stacks',
          '/ar-SA/blog',
          '/ar-SA/blog/*',
          '/ar-SA/about',
          '/ar-SA/contact',
          '/ar-SA/privacy',
          '/ar-SA/cookies',
          '/ar-SA/terms',
          '/ar-SA/help',
          '/ar-SA/seasonal/*',
          '/ar-SA/bank-and-payment-offers',
          '/en-SA/',
          '/en-SA/coupons',
          '/en-SA/stores',
          '/en-SA/stores/*',
          '/en-SA/categories',
          '/en-SA/categories/*',
          '/en-SA/stacks',
          '/en-SA/blog',
          '/en-SA/blog/*',
          '/en-SA/about',
          '/en-SA/contact',
          '/en-SA/privacy',
          '/en-SA/cookies',
          '/en-SA/terms',
          '/en-SA/help',
          '/en-SA/seasonal/*',
          '/en-SA/bank-and-payment-offers',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/*/search',
          '/_next/',
          '/store-covers/',
          '/public/stores/',
          '/ar-KW/', '/en-AE/', '/ar-AE/', '/en-KW/',
          '/ar-EG/', '/en-EG/', '/ar-BH/', '/en-BH/',
          '/ar-OM/', '/en-OM/', '/ar-QA/', '/en-QA/',
          '/*.json$', '/*.js$', '/*.css$',
          '/*.avif$', '/*.webp$', '/*.png$', '/*.jpg$',
          '/*.woff$', '/*.woff2$',
        ],
        crawlDelay: 0,
      },

      // ──────────────────────────────────────────────────────────────────────
      // 4. DEFAULT FOR ALL OTHER BOTS
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: '*',
        allow: [
          '/',
          '/ar-SA/',
          '/ar-SA/coupons',
          '/ar-SA/stores',
          '/ar-SA/stores/*',
          '/ar-SA/categories',
          '/ar-SA/categories/*',
          '/ar-SA/stacks',
          '/ar-SA/blog',
          '/ar-SA/blog/*',
          '/ar-SA/about',
          '/ar-SA/contact',
          '/ar-SA/privacy',
          '/ar-SA/cookies',
          '/ar-SA/terms',
          '/ar-SA/help',
          '/ar-SA/seasonal/*',
          '/ar-SA/bank-and-payment-offers',
          '/en-SA/',
          '/en-SA/coupons',
          '/en-SA/stores',
          '/en-SA/stores/*',
          '/en-SA/categories',
          '/en-SA/categories/*',
          '/en-SA/stacks',
          '/en-SA/blog',
          '/en-SA/blog/*',
          '/en-SA/about',
          '/en-SA/contact',
          '/en-SA/privacy',
          '/en-SA/cookies',
          '/en-SA/terms',
          '/en-SA/help',
          '/en-SA/seasonal/*',
          '/en-SA/bank-and-payment-offers',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/*/search',
          '/_next/',
          '/store-covers/',
          '/public/stores/',
          '/ar-KW/', '/en-AE/', '/ar-AE/', '/en-KW/',
          '/ar-EG/', '/en-EG/', '/ar-BH/', '/en-BH/',
          '/ar-OM/', '/en-OM/', '/ar-QA/', '/en-QA/',
          '/*.json$', '/*.js$', '/*.css$',
          '/*.avif$', '/*.webp$', '/*.png$', '/*.jpg$',
          '/*.woff$', '/*.woff2$',
        ],
      },

      // ── Aggressive crawlers ──────────────────────────────────────────────
      { userAgent: 'AhrefsBot',  disallow: '/', crawlDelay: 10 },
      { userAgent: 'SemrushBot', disallow: '/', crawlDelay: 10 },
      { userAgent: 'MJ12bot',    disallow: '/' },
      { userAgent: 'DotBot',     disallow: '/' },
      { userAgent: 'YandexBot',  disallow: '/' },
      { userAgent: 'Baiduspider',disallow: '/' },

      // ── AI training crawlers ─────────────────────────────────────────────
      { userAgent: 'GPTBot',         allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'CCBot',          allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'anthropic-ai',   allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'Claude-Web',     allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'Google-Extended',allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'FacebookBot',    allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'Twitterbot',     allow: '/', disallow: ['/admin/', '/api/'] },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
