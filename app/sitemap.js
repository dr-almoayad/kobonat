// app/sitemap.js
// ─────────────────────────────────────────────────────────────────────────────
// Sections:
//  1.  Homepages
//  2.  All-stores page
//  3.  Categories listing page
//  4.  Coupons page (page 1 only — rel="next"/"prev" handles the rest)
//  5.  Stacks page (page 1 only)
//  6.  Static pages
//  7.  Individual category pages   → /categories/[slug]
//  8.  Individual store pages      → /stores/[slug]
//  9.  Seasonal pages              → /seasonal/[slug]
//  10. Blog index page
//  11. Individual blog post pages
//
// hreflang rules:
//  - A locale is only included in alternates when the URL will actually resolve
//    (translation exists + country region matches for stores).
//  - x-default always points to ar-SA if that locale is present, otherwise the
//    first valid locale found.
//  - Entries are deduplicated before returning to prevent sitemap bloat.
//
// Search pages are intentionally excluded — they are marked noindex in page
// metadata and also blocked in robots.js.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma }         from '@/lib/prisma';
import { allLocaleCodes } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES  = allLocaleCodes; // ['ar-SA', 'en-SA']

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMostRecentDate(...dates) {
  const valid = dates.filter(d => d instanceof Date && !isNaN(d));
  return valid.length > 0
    ? new Date(Math.max(...valid.map(d => d.getTime())))
    : new Date();
}

/**
 * Build alternates for paths that are identical across every locale.
 * Always includes x-default → ar-SA.
 */
function allAlternates(path = '') {
  const languages = Object.fromEntries(
    LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`])
  );
  languages['x-default'] = `${BASE_URL}/ar-SA${path}`;
  return languages;
}

/**
 * Build a validated alternates object from a map of locale → url.
 * Ensures x-default points to ar-SA when available.
 * Returns null if no valid URLs exist.
 */
function buildAlternates(localeUrlMap) {
  if (!localeUrlMap || Object.keys(localeUrlMap).length === 0) return null;

  const xDefault = localeUrlMap['ar-SA'] || Object.values(localeUrlMap)[0];
  return {
    ...localeUrlMap,
    'x-default': xDefault,
  };
}

/**
 * Deduplicate sitemap entries by URL.
 * Later entries for the same URL are discarded (first-wins).
 */
function deduplicateEntries(entries) {
  const seen = new Set();
  return entries.filter(entry => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

// ── Sitemap ───────────────────────────────────────────────────────────────────

export default async function sitemap() {
  const urls = [];

  try {
    // =========================================================================
    // Shared "latest update" timestamps — avoids repeated queries
    // =========================================================================
    const [
      latestVoucherUpdate,
      latestStoreUpdate,
      latestPostUpdate,
    ] = await Promise.all([
      prisma.voucher.findFirst({
        orderBy: { updatedAt: 'desc' },
        select:  { updatedAt: true },
      }),
      prisma.store.findFirst({
        where:   { isActive: true },
        orderBy: { updatedAt: 'desc' },
        select:  { updatedAt: true },
      }),
      prisma.blogPost.findFirst({
        where:   { status: 'PUBLISHED' },
        orderBy: { updatedAt: 'desc' },
        select:  { updatedAt: true },
      }),
    ]);

    const voucherDate = latestVoucherUpdate?.updatedAt || new Date();
    const storeDate   = latestStoreUpdate?.updatedAt   || new Date();
    const postDate    = latestPostUpdate?.updatedAt    || new Date();

    // =========================================================================
    // 1. HOMEPAGES
    // =========================================================================
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}`,
        lastModified:    voucherDate,
        changeFrequency: 'daily',
        priority:        1.0,
        alternates: { languages: allAlternates() },
      });
    });

    // =========================================================================
    // 2. ALL-STORES PAGE
    // =========================================================================
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/stores`,
        lastModified:    storeDate,
        changeFrequency: 'daily',
        priority:        0.9,
        alternates: { languages: allAlternates('/stores') },
      });
    });

    // =========================================================================
    // 3. CATEGORIES LISTING PAGE
    // =========================================================================
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/categories`,
        lastModified:    storeDate,
        changeFrequency: 'weekly',
        priority:        0.9,
        alternates: { languages: allAlternates('/categories') },
      });
    });

    // =========================================================================
    // 4. COUPONS PAGE (page 1 only)
    // Paginated pages are linked via rel="next"/"prev" in the page component.
    // Including them here would create near-duplicate entries that dilute
    // crawl budget without adding indexable value.
    // =========================================================================
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/coupons`,
        lastModified:    voucherDate,
        changeFrequency: 'hourly',
        priority:        0.9,
        alternates: { languages: allAlternates('/coupons') },
      });
    });

    // =========================================================================
    // 5. STACKS PAGE (page 1 only)
    // =========================================================================
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/stacks`,
        lastModified:    storeDate,
        changeFrequency: 'daily',
        priority:        0.8,
        alternates: { languages: allAlternates('/stacks') },
      });
    });

    // =========================================================================
    // 6. STATIC PAGES
    // =========================================================================
    const staticPages = [
      { slug: 'about',   priority: 0.6, changeFreq: 'monthly' },
      { slug: 'contact', priority: 0.6, changeFreq: 'monthly' },
      { slug: 'privacy', priority: 0.4, changeFreq: 'yearly'  },
      { slug: 'terms',   priority: 0.4, changeFreq: 'yearly'  },
      { slug: 'cookies', priority: 0.3, changeFreq: 'yearly'  },
      { slug: 'help',    priority: 0.7, changeFreq: 'monthly' },
    ];

    staticPages.forEach(page => {
      LOCALES.forEach(locale => {
        urls.push({
          url:             `${BASE_URL}/${locale}/${page.slug}`,
          lastModified:    new Date('2024-01-01'),
          changeFrequency: page.changeFreq,
          priority:        page.priority,
          alternates: { languages: allAlternates(`/${page.slug}`) },
        });
      });
    });

    // =========================================================================
    // 7. INDIVIDUAL CATEGORY PAGES  → /categories/[slug]
    //
    // Per-locale slugs differ (e.g. "إلكترونيات" vs "electronics").
    // We only emit a locale entry when a real translation slug exists.
    // The sitemap path is /categories/[slug], not /stores/[slug] —
    // the old /stores/* category URLs redirect here via permanentRedirect().
    // =========================================================================
    const categories = await prisma.category.findMany({
      include: {
        translations: true,
        stores: {
          where:   { store: { isActive: true } },
          include: { store: { select: { updatedAt: true } } },
        },
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    for (const category of categories) {
      // Skip categories with no active stores — they produce empty pages
      if (category.stores.length === 0) continue;

      const storeUpdates = category.stores.map(s => s.store.updatedAt);
      const lastModified = getMostRecentDate(category.updatedAt, ...storeUpdates);

      // Build validated locale → URL map
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [language] = locale.split('-');
        const translation = category.translations.find(t => t.locale === language);

        // Only add this locale if a real slug exists
        if (translation?.slug) {
          validUrls.set(locale, `${BASE_URL}/${locale}/categories/${translation.slug}`);
        }
      }

      if (validUrls.size === 0) continue;

      const localeUrlMap = Object.fromEntries(validUrls.entries());
      const alternates   = buildAlternates(localeUrlMap);

      // Emit one entry per valid locale URL — each needs its own canonical
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified,
          changeFrequency: 'daily',
          priority:        0.8,
          alternates: { languages: alternates },
        });
      }
    }

    // =========================================================================
    // 8. INDIVIDUAL STORE PAGES  → /stores/[slug]
    //
    // A locale is only included when:
    //   a) A translation exists for that language
    //   b) The store is associated with the locale's country region
    //
    // This prevents hreflang pointing to URLs that would return 404
    // (store not available in that country) or empty content (no translation).
    // =========================================================================
    const stores = await prisma.store.findMany({
      where:   { isActive: true },
      include: {
        translations: true,
        countries:    { include: { country: true } },
        vouchers: {
          where:   { OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
          orderBy: { updatedAt: 'desc' },
          take:    1,
          select:  { updatedAt: true },
        },
      },
    });

    for (const store of stores) {
      const countryCodes = store.countries.map(sc => sc.country.code);
      const lastModified = getMostRecentDate(store.updatedAt, store.vouchers[0]?.updatedAt);

      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [language, region] = locale.split('-');

        // Gate 1: store must be available in this locale's country region
        if (!countryCodes.includes(region)) continue;

        // Gate 2: a translation slug must exist for this language
        const translation = store.translations.find(t => t.locale === language);
        if (!translation?.slug) continue;

        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }

      if (validUrls.size === 0) continue;

      const localeUrlMap = Object.fromEntries(validUrls.entries());
      const alternates   = buildAlternates(localeUrlMap);

      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified,
          changeFrequency: 'daily',
          priority:        store.isFeatured ? 0.85 : 0.75,
          alternates: { languages: alternates },
        });
      }
    }

    // =========================================================================
    // 9. SEASONAL PAGES  → /seasonal/[slug]
    //
    // Only active pages that are available in at least one country.
    // Both locales share the same slug (unlike stores/categories).
    // =========================================================================
    const seasonalPages = await prisma.seasonalPage.findMany({
      where:   { isActive: true },
      include: {
        translations: true,
        countries:    { include: { country: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const page of seasonalPages) {
      // Skip if no countries configured — page would return 403
      if (page.countries.length === 0) continue;

      // Only include if at least one translation has a title
      const hasContent = page.translations.some(t => t.title);
      if (!hasContent) continue;

      const localeUrlMap = Object.fromEntries(
        LOCALES.map(locale => [locale, `${BASE_URL}/${locale}/seasonal/${page.slug}`])
      );
      const alternates = buildAlternates(localeUrlMap);

      LOCALES.forEach(locale => {
        urls.push({
          url:             `${BASE_URL}/${locale}/seasonal/${page.slug}`,
          lastModified:    page.updatedAt,
          changeFrequency: 'weekly',
          priority:        0.75,
          alternates: { languages: alternates },
        });
      });
    }

    // =========================================================================
    // 10. BLOG INDEX PAGE
    // =========================================================================
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/blog`,
        lastModified:    postDate,
        changeFrequency: 'daily',
        priority:        0.85,
        alternates: { languages: allAlternates('/blog') },
      });
    });

    // =========================================================================
    // 11. INDIVIDUAL BLOG POST PAGES
    //
    // Both locales share the same slug. We check that the post actually has
    // a published translation for each locale before including it — a post
    // with only an Arabic translation should not get an en-SA hreflang entry
    // pointing to a page with empty content (soft 404 risk).
    // =========================================================================
    const blogPosts = await prisma.blogPost.findMany({
      where:   { status: 'PUBLISHED' },
      include: { translations: { select: { locale: true } } },
      select: {
        slug:         true,
        isFeatured:   true,
        publishedAt:  true,
        updatedAt:    true,
        translations: { select: { locale: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });

    for (const post of blogPosts) {
      const lastModified = getMostRecentDate(post.updatedAt, post.publishedAt);

      // Build validated locale map — only include locales with real content
      const localeUrlMap = {};
      for (const locale of LOCALES) {
        const [language] = locale.split('-');
        const hasTranslation = post.translations.some(t => t.locale === language);
        if (hasTranslation) {
          localeUrlMap[locale] = `${BASE_URL}/${locale}/blog/${post.slug}`;
        }
      }

      if (Object.keys(localeUrlMap).length === 0) continue;

      const alternates = buildAlternates(localeUrlMap);

      // Emit one entry per valid locale
      for (const [, url] of Object.entries(localeUrlMap)) {
        urls.push({
          url,
          lastModified,
          changeFrequency: 'weekly',
          priority:        post.isFeatured ? 0.8 : 0.7,
          alternates: { languages: alternates },
        });
      }
    }

    // =========================================================================
    // Final: deduplicate and log
    // =========================================================================
    const deduplicated = deduplicateEntries(urls);
    const uniqueUrls   = deduplicated.length;

    console.log(`✅ Sitemap: ${uniqueUrls} unique entries (${urls.length - uniqueUrls} duplicates removed)`);

    if (uniqueUrls > 45000) {
      console.warn('⚠️  Sitemap approaching 50k limit — split into sitemap index before deploying.');
    }

    return deduplicated;

  } catch (error) {
    console.error('❌ Sitemap generation error:', error);

    // Minimal fallback so Googlebot always gets something valid
    return LOCALES.map(locale => ({
      url:             `${BASE_URL}/${locale}`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1.0,
      alternates: { languages: allAlternates() },
    }));
  }
}
