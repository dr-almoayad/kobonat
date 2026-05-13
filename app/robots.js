// app/robots.js

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// Shared list of public API endpoints that both Googlebot and Bingbot need for proper rendering
const publicApiPaths = [
  '/api/countries',
  '/api/seasonal',
  '/api/stores/*',
  '/api/vouchers/*',
  '/api/categories/*',
  '/api/other-promos/*',
  '/api/offer-stacks/*',
];

export default function robots() {
  return {
    rules: [
      // ── GOOGLEBOT (specific allowances) ─────────────────────────────────
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/*/coupons',
          '/*/stores',
          '/*/stores/*',
          '/*/categories',
          '/*/categories/*',
          '/*/stacks',
          '/*/blog',
          '/*/blog/*',
          '/*/about',
          '/*/contact',
          '/*/privacy',
          '/*/cookies',
          '/*/terms',
          '/*/help',
          '/*/seasonal/*',
          '/*/bank-and-payment-offers',
          ...publicApiPaths,
        ],
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/auth/',
          '/api/_log',
          '/api/session',
          '/api/track',
          '/api/feedback',
          '/*/search',
          '/*/search?*',
          '/*/auth/',
        ],
        crawlDelay: 0,
      },

      // ── BINGBOT (same allowances as Googlebot) ──────────────────────────
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/*/coupons',
          '/*/stores',
          '/*/stores/*',
          '/*/categories',
          '/*/categories/*',
          '/*/stacks',
          '/*/blog',
          '/*/blog/*',
          '/*/about',
          '/*/contact',
          '/*/privacy',
          '/*/cookies',
          '/*/terms',
          '/*/help',
          '/*/seasonal/*',
          '/*/bank-and-payment-offers',
          ...publicApiPaths,
        ],
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/auth/',
          '/api/_log',
          '/api/session',
          '/api/track',
          '/api/feedback',
          '/*/search',
          '/*/search?*',
          '/*/auth/',
        ],
        crawlDelay: 1,
      },

      // ── DEFAULT FOR ALL OTHER BOTS ─────────────────────────────────────
      {
        userAgent: '*',
        allow: [
          '/',
          '/*/coupons',
          '/*/stores',
          '/*/stores/*',
          '/*/categories',
          '/*/categories/*',
          '/*/stacks',
          '/*/blog',
          '/*/blog/*',
          '/*/about',
          '/*/contact',
          '/*/privacy',
          '/*/cookies',
          '/*/terms',
          '/*/help',
          '/*/seasonal/*',
          '/*/bank-and-payment-offers',
        ],
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/',
          '/*/auth/',
          '/*/search',
          '/*/search?*',
          '/*?ref=*',
          '/*?utm_*',
          '/*?source=*',
          '/*?fbclid=*',
        ],
      },

      // ── AGGRESSIVE CRAWLERS – slow them down ───────────────────────────
      { userAgent: 'AhrefsBot', allow: '/', disallow: ['/admin/', '/api/', '/*/search'], crawlDelay: 10 },
      { userAgent: 'SemrushBot', allow: '/', disallow: ['/admin/', '/api/', '/*/search'], crawlDelay: 10 },
      { userAgent: 'MJ12bot', disallow: '/' },
      { userAgent: 'DotBot', disallow: '/' },

      // ── AI TRAINING CRAWLERS – allowed (no sensitive pages) ─────────────
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'FacebookBot', allow: '/' },
    ],

    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
