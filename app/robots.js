// app/robots.js
// SEO‑Optimized robots.txt – Directs crawlers away from raw data paths
// to protect crawl budget and resolve "Crawled - currently not indexed" loops.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

// Paths that should never be crawled or indexed as standalone destination pages
const DISALLOW_PATHS = [
  '/admin/',
  '/api/',                    // ⛔ Prevents standalone crawling of raw JSON data endpoints
  '/_next/data/',             // ⛔ Prevents crawling of internal Next.js JSON prefetch bundles
  '/search',                  // ⛔ Prevents infinite loops from search queries and parameters
];

export default function robots() {
  return {
    rules: [
      // ── 1. Main Search Engines ──────────────────────────────────────
      // Focuses their attention entirely on user-facing HTML pages
      {
        userAgent: 'Googlebot',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'Bingbot',
        disallow: DISALLOW_PATHS,
      },

      // ── 2. Google Images ────────────────────────────────────────────
      // Allows image search bots to access store covers and illustrations
      {
        userAgent: 'Googlebot-Image',
        disallow: ['/admin/', '/api/admin/'],
      },

      // ── 3. Social Media Link Resolvers ──────────────────────────────
      // Allows rich previews on links shared by users
      {
        userAgent: 'FacebookBot',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'Twitterbot',
        disallow: ['/admin/', '/api/admin/'],
      },

      // ── 4. AI / LLM Crawlers ────────────────────────────────────────
      // Protects your data architecture from being scraped out-of-context
      {
        userAgent: 'GPTBot',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'ClaudeBot',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'Claude-Web',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'anthropic-ai',
        disallow: DISALLOW_PATHS,
      },
      {
        userAgent: 'PerplexityBot',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: 'CCBot',
        disallow: DISALLOW_PATHS,
      },

      // ── 5. Aggressive SEO Auditing Crawlers ────────────────────────
      // Completely blocks resource-heavy bad bots from wasting server bandwidth
      { userAgent: 'AhrefsBot',   disallow: '/' },
      { userAgent: 'SemrushBot',  disallow: '/' },
      { userAgent: 'MJ12bot',     disallow: '/' },
      { userAgent: 'DotBot',      disallow: '/' },
      { userAgent: 'YandexBot',   disallow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
