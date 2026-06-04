// app/robots.js

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Public Pages Matrix ──────────────────────────────────────────────────────
const ALLOW_PAGES = [
  '/',
  '/ar-SA/', '/ar-SA/coupons', '/ar-SA/stores', '/ar-SA/stores/*', '/ar-SA/categories', '/ar-SA/categories/*', '/ar-SA/stacks', '/ar-SA/blog', '/ar-SA/blog/*', '/ar-SA/about', '/ar-SA/contact', '/ar-SA/privacy', '/ar-SA/cookies', '/ar-SA/terms', '/ar-SA/help', '/ar-SA/seasonal/*', '/ar-SA/bank-and-payment-offers',
  '/en-SA/', '/en-SA/coupons', '/en-SA/stores', '/en-SA/stores/*', '/en-SA/categories', '/en-SA/categories/*', '/en-SA/stacks', '/en-SA/blog', '/en-SA/blog/*', '/en-SA/about', '/en-SA/contact', '/en-SA/privacy', '/en-SA/cookies', '/en-SA/terms', '/en-SA/help', '/en-SA/seasonal/*', '/en-SA/bank-and-payment-offers',
];

// ── Public Automated XML/JSON Content Feeds ──────────────────────────────────
const ALLOW_FEEDS = [
  '/api/feeds/stores',
  '/api/feeds/stores.json',
  '/api/feeds/coupons',
  '/api/feeds/coupons.json',
  '/api/feeds/offers',
  '/api/feeds/otherpromo.json',
  '/api/feeds/store-products.json',
  '/api/feeds/store-products.xml',
  '/api/feeds/stacks.json',
  '/api/feeds/stacks.xml',
];

// ── Protected System Enclaves & Query Noise ──────────────────────────────────
const DISALLOW_INTERNAL = [
  '/admin/',
  '/api/admin/',
  '/api/vouchers/track',
  '/api/store-products/track',
  '/api/cron/',
  
  // Internal REST Pipelines
  '/api/stores', '/api/stores/*', '/api/categories', '/api/categories/*', 
  '/api/vouchers', '/api/vouchers/*', '/api/countries', '/api/homepage', 
  '/api/search', '/api/stacks', '/api/blog', '/api/blog/*', 
  '/api/curated-offers', '/api/seasonal/*', '/api/leaderboard', '/api/og', 
  '/api/slug-translate',

  // Dynamic Filtering / Search Noise Redirection
  '/*/search', 
  '/*/search?*',
  
  // Marketing & Analytics Parameters (Saves Crawl Budget)
  '/*?ref=', 
  '/*?utm_', 
  '/*?source=', 
  '/*?fbclid=', 
  '/*?gclid=',
];

export default function robots() {
  return {
    rules: [
      // ── 1. PRIMARY SEARCH ENGINES (Google & Bing) ──────────────────────────
      // Granted access to rendering paths (JS/CSS) to prevent unstyled layout flags
      {
        userAgent: 'Googlebot',
        allow: [
          ...ALLOW_FEEDS, 
          ...ALLOW_PAGES,
          '/_next/static/css/',
          '/_next/static/js/',
          '/_next/static/chunks/',
        ],
        disallow: DISALLOW_INTERNAL,
      },
      {
        userAgent: 'Bingbot',
        allow: [
          ...ALLOW_FEEDS, 
          ...ALLOW_PAGES,
          '/_next/static/css/',
          '/_next/static/js/',
          '/_next/static/chunks/',
        ],
        disallow: DISALLOW_INTERNAL,
      },

      // ── 2. IMAGE INDEXING SEARCH ENGINE ENGINE ─────────────────────────────
      // Reconfigured to fully open up brand logos and visual coupon catalogs
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/store-covers/', 
          '/public/stores/', 
          '/_next/static/media/'
        ],
        disallow: ['/admin/', '/api/'],
      },

      // ── 3. WELCOMED ARTIFICIAL INTELLIGENCE & LLM ENGINE AGENTS ────────────
      // Explicitly allows engines to crawl coupon data structures cleanly
      {
        userAgent: 'GPTBot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, '/_next/static/css/', '/_next/static/js/'],
        disallow: ['/admin/', '/api/admin/', '/api/cron/', '/api/vouchers/track'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ALLOW_PAGES,
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, '/_next/static/css/', '/_next/static/js/'],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, '/_next/static/css/', '/_next/static/js/'],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, '/_next/static/css/', '/_next/static/js/'],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, '/_next/static/css/', '/_next/static/js/'],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES, '/_next/static/css/', '/_next/static/js/'],
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'CCBot',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },

      // ── 4. SOCIAL GRAPH LINK RESOLVERS ─────────────────────────────────────
      {
        userAgent: 'FacebookBot',
        allow: ALLOW_PAGES,
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Twitterbot',
        allow: ALLOW_PAGES,
        disallow: ['/admin/', '/api/'],
      },

      // ── 5. MALICIOUS SCRAPERS & AGGRESSIVE SEO CRAWLERS ────────────────────
      // Blocked completely from hitting internal paths to protect server compute limits
      { userAgent: 'AhrefsBot',   disallow: '/', crawlDelay: 10 },
      { userAgent: 'SemrushBot',  disallow: '/', crawlDelay: 10 },
      { userAgent: 'MJ12bot',     disallow: '/' },
      { userAgent: 'DotBot',      disallow: '/' },
      { userAgent: 'YandexBot',   disallow: '/' },
      { userAgent: 'Baiduspider', disallow: '/' },

      // ── 6. GENERAL FALLBACK USER-AGENT RULE SET ────────────────────────────
      {
        userAgent: '*',
        allow: [...ALLOW_FEEDS, ...ALLOW_PAGES],
        disallow: DISALLOW_INTERNAL,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
