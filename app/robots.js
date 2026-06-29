// app/robots.js
// SEO‑optimised robots.txt – allows Googlebot to fetch all public content,
// including API endpoints that power client‑side rendering.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// ── Only these exact paths are disallowed ──────────────────────────────
// All other public API routes (stores, categories, stacks, etc.) are
// allowed so Googlebot can see dynamically‑loaded content.
const DISALLOW_EXACT = [
  '/admin/',
  '/api/admin/',
  '/api/cron/',
  '/api/vouchers/track',
  '/api/store-products/track',
  '/search', // search pages with query params
];

export default function robots() {
  return {
    rules: [
      // ── 1. Main search engines ──────────────────────────────────────
      {
        userAgent: 'Googlebot',
        disallow: DISALLOW_EXACT,
      },
      {
        userAgent: 'Bingbot',
        disallow: DISALLOW_EXACT,
      },

      // ── 2. Google Images – allow all images ─────────────────────────
      {
        userAgent: 'Googlebot-Image',
        disallow: ['/admin/', '/api/admin/'],
      },

      // ── 3. Social link resolvers ────────────────────────────────────
      {
        userAgent: 'FacebookBot',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'Twitterbot',
        disallow: ['/admin/', '/api/admin/'],
      },

      // ── 4. AI / LLM crawlers – restrict to public content ──────────
      // They still get the same disallow list (no admin/cron/track).
      {
        userAgent: 'GPTBot',
        disallow: DISALLOW_EXACT,
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: DISALLOW_EXACT,
      },
      {
        userAgent: 'ClaudeBot',
        disallow: DISALLOW_EXACT,
      },
      {
        userAgent: 'Claude-Web',
        disallow: DISALLOW_EXACT,
      },
      {
        userAgent: 'anthropic-ai',
        disallow: DISALLOW_EXACT,
      },
      {
        userAgent: 'PerplexityBot',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'CCBot',
        disallow: DISALLOW_EXACT,
      },

      // ── 5. Aggressive SEO crawlers – block entirely ────────────────
      { userAgent: 'AhrefsBot',   disallow: '/' },
      { userAgent: 'SemrushBot',  disallow: '/' },
      { userAgent: 'MJ12bot',     disallow: '/' },
      { userAgent: 'DotBot',      disallow: '/' },
      { userAgent: 'YandexBot',   disallow: '/' },
      { userAgent: 'Baiduspider', disallow: '/' },

      // ── 6. Fallback for all other bots ──────────────────────────────
      {
        userAgent: '*',
        disallow: DISALLOW_EXACT,
        crawlDelay: 5,
      },
    ],

    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
