// app/robots.js
// Clean, standard robots.txt for SEO best practices.
// No explicit allow lists needed because there is no catch‑all Disallow: /.
// We only disallow internal/admin paths and aggressive crawlers.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Paths that should never be crawled ────────────────────────────────────
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
  // Search pages with query parameters – block via standard wildcard
  '/search',
];

export default function robots() {
  return {
    rules: [
      // ── 1. Main search engines ──────────────────────────────────────
      // No allow list needed – they can crawl everything not disallowed.
      {
        userAgent: 'Googlebot',
        disallow: DISALLOW_INTERNAL,
      },
      {
        userAgent: 'Bingbot',
        disallow: DISALLOW_INTERNAL,
      },

      // ── 2. Google Images ──────────────────────────────────────────────
      // Allow images, disallow admin/API.
      {
        userAgent: 'Googlebot-Image',
        disallow: ['/admin/', '/api/'],
      },

      // ── 3. Social link resolvers ──────────────────────────────────────
      {
        userAgent: 'FacebookBot',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Twitterbot',
        disallow: ['/admin/', '/api/'],
      },

      // ── 4. AI / LLM crawlers – restrict to public content only ───────
      // They get the same disallow list as Google.
      {
        userAgent: 'GPTBot',
        disallow: DISALLOW_INTERNAL,
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: DISALLOW_INTERNAL,
      },
      {
        userAgent: 'ClaudeBot',
        disallow: DISALLOW_INTERNAL,
      },
      {
        userAgent: 'Claude-Web',
        disallow: DISALLOW_INTERNAL,
      },
      {
        userAgent: 'anthropic-ai',
        disallow: DISALLOW_INTERNAL,
      },
      {
        userAgent: 'PerplexityBot',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'CCBot',
        disallow: DISALLOW_INTERNAL,
      },

      // ── 5. Aggressive SEO crawlers – block entirely ────────────────
      { userAgent: 'AhrefsBot',   disallow: '/' },
      { userAgent: 'SemrushBot',  disallow: '/' },
      { userAgent: 'MJ12bot',     disallow: '/' },
      { userAgent: 'DotBot',      disallow: '/' },
      { userAgent: 'YandexBot',   disallow: '/' },
      { userAgent: 'Baiduspider', disallow: '/' },

      // ── 6. Fallback for all other bots ──────────────────────────────
      // crawlDelay throttles unknown bots without affecting Google/Bing.
      {
        userAgent: '*',
        disallow: DISALLOW_INTERNAL,
        crawlDelay: 5,
      },
    ],

    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
