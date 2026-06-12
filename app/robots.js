// app/robots.js

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Public page paths ──────────────────────────────────────────────────────
const ALLOW_PAGES = [
  '/',
  '/ar-SA/', '/ar-SA/coupons', '/ar-SA/stores', '/ar-SA/stores/*',
  '/ar-SA/categories', '/ar-SA/categories/*', '/ar-SA/stacks',
  '/ar-SA/blog', '/ar-SA/blog/*', '/ar-SA/about', '/ar-SA/contact',
  '/ar-SA/privacy', '/ar-SA/cookies', '/ar-SA/terms', '/ar-SA/help',
  '/ar-SA/seasonal/*', '/ar-SA/bank-and-payment-offers',
  '/en-SA/', '/en-SA/coupons', '/en-SA/stores', '/en-SA/stores/*',
  '/en-SA/categories', '/en-SA/categories/*', '/en-SA/stacks',
  '/en-SA/blog', '/en-SA/blog/*', '/en-SA/about', '/en-SA/contact',
  '/en-SA/privacy', '/en-SA/cookies', '/en-SA/terms', '/en-SA/help',
  '/en-SA/seasonal/*', '/en-SA/bank-and-payment-offers',
];

// ── Data feeds (public, machine-readable) ──────────────────────────────────
// FIX: corrected to match actual route filenames (.xml / .json suffixes)
const ALLOW_FEEDS = [
  '/api/feeds/stores.xml',
  '/api/feeds/stores.json',
  '/api/feeds/coupons.xml',
  '/api/feeds/coupons.json',
  '/api/feeds/offers.xml',
  '/api/feeds/offers.json',
  '/api/feeds/stacks.xml',
  '/api/feeds/stacks.json',
  '/api/feeds/store-products.xml',
  '/api/feeds/store-products.json',
  '/api/context',
];

// ── Static assets — needed for Google to render JS/CSS ────────────────────
const STATIC_ASSETS = [
  '/_next/static/css/',
  '/_next/static/js/',
  '/_next/static/chunks/',
  '/_next/static/media/',
  '/_next/image/',
];

// ── Internal routes to block ───────────────────────────────────────────────
// FIX: removed redundant /*-suffixed duplicates (the base path covers them)
// FIX: removed query-param disallows (/*?utm_ etc.) — unreliable in robots.txt;
//      canonical tags handle parameterised URL deduplication correctly.
const DISALLOW_INTERNAL = [
  '/admin/',
  '/api/admin/',
  '/api/vouchers/track',
  '/api/store-products/track',
  '/api/cron/',
  '/api/stores',
  '/api/categories',
  '/api/vouchers',
  '/api/countries',
  '/api/homepage',
  '/api/search',
  '/api/stacks',
  '/api/blog',
  '/api/curated-offers',
  '/api/seasonal/',
  '/api/leaderboard',
  '/api/og',
  '/api/slug-translate',
  '/*/search',
];

export default function robots() {
  return {
    rules: [
      // ── 1. Google ──────────────────────────────────────────────────────
      {
        userAgent: 'Googlebot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: DISALLOW_INTERNAL,
      },

      // ── 2. Bing ────────────────────────────────────────────────────────
      {
        userAgent: 'Bingbot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: DISALLOW_INTERNAL,
      },

      // ── 3. Google Images ───────────────────────────────────────────────
      {
        userAgent: 'Googlebot-Image',
        allow: ['/store-covers/', '/public/stores/', '/_next/static/media/', '/_next/image/'],
        disallow: ['/admin/', '/api/'],
      },

      // ── 4. AI / LLM crawlers ───────────────────────────────────────────
      {
        userAgent: 'GPTBot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: ['/admin/', '/api/admin/', '/api/cron/', '/api/vouchers/track'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'CCBot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },

      // ── 5. Social link resolvers ───────────────────────────────────────
      {
        userAgent: 'FacebookBot',
        allow: [...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Twitterbot',
        allow: [...ALLOW_PAGES, ...STATIC_ASSETS],
        disallow: ['/admin/', '/api/'],
      },

      // ── 6. Aggressive SEO crawlers ─────────────────────────────────────
      { userAgent: 'AhrefsBot',   disallow: '/' },
      { userAgent: 'SemrushBot',  disallow: '/' },
      { userAgent: 'MJ12bot',     disallow: '/' },
      { userAgent: 'DotBot',      disallow: '/' },
      { userAgent: 'YandexBot',   disallow: '/' },
      { userAgent: 'Baiduspider', disallow: '/' },

      // ── 7. Fallback ────────────────────────────────────────────────────
      // crawlDelay throttles unknown bots without affecting Google/Bing
      // (both ignore crawlDelay and use their own rate controls)
      {
        userAgent: '*',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow: DISALLOW_INTERNAL,
        crawlDelay: 5,
      },
    ],

    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
