// app/robots.js
// ─────────────────────────────────────────────────────────────────────────────
// Changes vs previous version
// ────────────────────────────
// 1. FEED ENDPOINTS ADDED TO ALLOW
//    /api/feeds/stores, /api/feeds/coupons, /api/feeds/offers are public data
//    feeds that aggregators, Google Merchant Center, and partner sites need to
//    crawl.  They are added to the allow list of every major bot rule.
//
// 2. BLANKET '/api/' DISALLOW REPLACED WITH SPECIFIC ROUTES
//    The old '/api/' entry blocked the feeds even when they appeared in allow,
//    because robots.txt disallow takes priority over allow when both paths are
//    equal in specificity.  The fix is to enumerate the internal routes we
//    actually want blocked and leave '/api/feeds/' absent from disallow entirely.
//    (For Googlebot specifically, longest-match-wins so '/api/feeds/stores' in
//    allow would beat '/api/' in disallow — but many other crawlers use
//    first-match, so removing the blanket is the only safe approach.)
//
// 3. SITEMAP DIRECTIVE IS NOW AN ARRAY
//    Points to both the HTML sitemap and the three XML data feeds so Google
//    Search Console discovers all indexable content automatically.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Reusable building blocks ──────────────────────────────────────────────────

// Pages that every legitimate crawler should be allowed to read.
const ALLOW_PAGES = [
  // Root
  '/',
  // Arabic — Saudi Arabia
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
];

// Public XML data feeds — must be reachable by aggregators and Google Merchant.
const ALLOW_FEEDS = [
  '/api/feeds/stores',
  '/api/feeds/coupons',
  '/api/feeds/offers',
];

// Internal API routes, admin area, tracking endpoints, and static asset
// directories — none of these should be in any search index.
const DISALLOW_INTERNAL = [
  // Admin
  '/admin/',
  '/api/admin/',

  // Tracking / write endpoints (POST only, but block GET discovery too)
  '/api/vouchers/track',
  '/api/store-products/track',

  // Scheduled jobs
  '/api/cron/',

  // Internal data APIs — not intended as public pages
  '/api/stores',
  '/api/stores/*',
  '/api/categories',
  '/api/categories/*',
  '/api/vouchers',
  '/api/vouchers/*',
  '/api/countries',
  '/api/homepage',
  '/api/search',
  '/api/stacks',
  '/api/blog',
  '/api/blog/*',
  '/api/curated-offers',
  '/api/seasonal/*',
  '/api/leaderboard',
  '/api/og',
  '/api/slug-translate',
  '/api/translate-slug',

  // Search result pages (dynamic, low-value for indexing)
  '/*/search',
  '/*/search?*',

  // Static asset directories
  '/_next/',
  '/store-covers/',
  '/public/stores/',
  '/favicon.ico',

  // Dead / unsupported locale prefixes
  '/ar-KW/', '/en-AE/', '/ar-AE/', '/en-KW/',
  '/ar-EG/', '/en-EG/', '/ar-BH/', '/en-BH/',
  '/ar-OM/', '/en-OM/', '/ar-QA/', '/en-QA/',
  '/ar-JO/', '/en-JO/', '/ar-LB/', '/en-LB/',

  // Binary / source file extensions
  '/*.json$',
  '/*.js$',
  '/*.css$',
  '/*.avif$',
  '/*.webp$',
  '/*.png$',
  '/*.jpg$',
  '/*.jpeg$',
  '/*.woff$',
  '/*.woff2$',
  '/*.ttf$',

  // Tracking query-string parameters
  '/*?ref=*',
  '/*?utm_*',
  '/*?source=*',
  '/*?fbclid=*',
  '/*?gclid=*',
];

// ── Main export ───────────────────────────────────────────────────────────────

export default function robots() {
  return {
    rules: [

      // ──────────────────────────────────────────────────────────────────────
      // 1. GOOGLEBOT
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent:  'Googlebot',
        allow:      [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:   DISALLOW_INTERNAL,
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
        userAgent:  'Bingbot',
        allow:      [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:   DISALLOW_INTERNAL,
        crawlDelay: 0,
      },

      // ──────────────────────────────────────────────────────────────────────
      // 4. DEFAULT FOR ALL OTHER BOTS
      // ──────────────────────────────────────────────────────────────────────
      {
        userAgent: '*',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  DISALLOW_INTERNAL,
      },

      // ── Aggressive SEO crawlers — full block ─────────────────────────────
      { userAgent: 'AhrefsBot',   disallow: '/', crawlDelay: 10 },
      { userAgent: 'SemrushBot',  disallow: '/', crawlDelay: 10 },
      { userAgent: 'MJ12bot',     disallow: '/' },
      { userAgent: 'DotBot',      disallow: '/' },
      { userAgent: 'YandexBot',   disallow: '/' },
      { userAgent: 'Baiduspider', disallow: '/' },

      // ── AI training / LLM crawlers — allow content, block admin & APIs ───
      {
        userAgent: 'GPTBot',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/', '/api/vouchers/track', '/api/store-products/track'],
      },
      {
        userAgent: 'CCBot',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'Claude-Web',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'Google-Extended',
        allow:     [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow:  ['/admin/', '/api/admin/', '/api/cron/'],
      },

      // ── Social media preview bots — allow public pages only ──────────────
      {
        userAgent: 'FacebookBot',
        allow:     ALLOW_PAGES,
        disallow:  ['/admin/', '/api/'],
      },
      {
        userAgent: 'Twitterbot',
        allow:     ALLOW_PAGES,
        disallow:  ['/admin/', '/api/'],
      },
    ],

    // ── Sitemap discovery ──────────────────────────────────────────────────
    // Array form: Next.js robots.js supports string | string[]
    // Listing the three XML feeds here tells Google Search Console about them
    // automatically — no manual submission needed.
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/api/feeds/stores`,
      `${BASE_URL}/api/feeds/coupons`,
      `${BASE_URL}/api/feeds/offers`,
    ],

    host: BASE_URL,
  };
}
