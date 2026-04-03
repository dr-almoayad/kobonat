// app/sitemap.js
// ─────────────────────────────────────────────────────────────────────────────
// Sections:
//  1. Homepage
//  2. All-stores page
//  3. Categories listing page      ← NEW
//  4. Coupons page
//  5. Static pages
//  6. Individual category pages    ← now at /categories/[slug]
//  7. Individual store pages
//  8. Blog index page
//  9. Individual blog post pages
//
// KEY CHANGE: Category pages are now at /categories/[slug], not /stores/[slug].
// The old /stores/[slug] URLs for categories 301-redirect to /categories/[slug]
// via permanentRedirect() in the stores/[slug]/page.jsx.
// The sitemap reflects the new canonical URL so Googlebot discovers the right
// destination directly rather than following a redirect chain.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma }        from '@/lib/prisma';
import { allLocaleCodes } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES  = allLocaleCodes;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMostRecentDate(...dates) {
  const valid = dates.filter(d => d instanceof Date && !isNaN(d));
  return valid.length > 0 ? new Date(Math.max(...valid.map(d => d.getTime()))) : new Date();
}

/**
 * Alternates for paths that are identical across every locale.
 * Always includes x-default → ar-SA (primary market).
 */
function allAlternates(path = '') {
  const languages = Object.fromEntries(
    LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`])
  );
  languages['x-default'] = `${BASE_URL}/ar-SA${path}`;
  return languages;
}

// ── Sitemap ───────────────────────────────────────────────────────────────────

export default async function sitemap() {
  const urls = [];

  try {

    // =========================================================================
    // 1. HOMEPAGE
    // =========================================================================
    const latestVoucherUpdate = await prisma.voucher.findFirst({
      orderBy: { updatedAt: 'desc' },
      select:  { updatedAt: true },
    });

    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}`,
        lastModified:    latestVoucherUpdate?.updatedAt || new Date(),
        changeFrequency: 'daily',   // was 'hourly' — misleading and harms trust
        priority:        1.0,
        alternates: { languages: allAlternates() },
      });
    });

    // =========================================================================
    // 2. ALL STORES PAGE
    // =========================================================================
    const latestStoreUpdate = await prisma.store.findFirst({
      where:   { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select:  { updatedAt: true },
    });

    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/stores`,
        lastModified:    latestStoreUpdate?.updatedAt || new Date(),
        changeFrequency: 'daily',
        priority:        0.9,
        alternates: { languages: allAlternates('/stores') },
      });
    });

    // =========================================================================
    // 3. CATEGORIES LISTING PAGE  ← NEW
    // =========================================================================
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/categories`,
        lastModified:    latestStoreUpdate?.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority:        0.9,
        alternates: { languages: allAlternates('/categories') },
      });
    });

    // =========================================================================
    // 4. COUPONS PAGE  (page 1 only — paginated pages use rel=next/prev)
    // =========================================================================
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/coupons`,
        lastModified:    latestVoucherUpdate?.updatedAt || new Date(),
        changeFrequency: 'hourly',
        priority:        0.9,
        alternates: { languages: allAlternates('/coupons') },
      });
    });

    // =========================================================================
    // 5. STATIC PAGES
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
    // 6. INDIVIDUAL CATEGORY PAGES  (now at /categories/[slug])
    //
    // Each category has different slugs per locale (e.g. "إلكترونيات" vs
    // "electronics"). We only include locales where a real translation exists.
    // x-default points to the ar-SA slug.
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
      if (category.stores.length === 0) continue;

      const storeUpdates = category.stores.map(s => s.store.updatedAt);
      const lastModified = getMostRecentDate(category.updatedAt, ...storeUpdates);

      // Build URL only for locales where a real slug exists
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [language] = locale.split('-');
        const translation = category.translations.find(t => t.locale === language);
        if (translation?.slug) {
          // NOTE: path is now /categories/[slug] not /stores/[slug]
          validUrls.set(locale, `${BASE_URL}/${locale}/categories/${translation.slug}`);
        }
      }

      if (validUrls.size === 0) continue;

      const arSAUrl = validUrls.get('ar-SA') || validUrls.values().next().value;
      const languages = {
        ...Object.fromEntries(validUrls.entries()),
        'x-default': arSAUrl,
      };

      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified,
          changeFrequency: 'daily',
          priority:        0.8,
          alternates: { languages },
        });
      }
    }

    // =========================================================================
    // 7. INDIVIDUAL STORE PAGES
    //
    // Only locales where both a translation AND a country-region match exist.
    // x-default → ar-SA. changeFrequency 'daily' (not 'hourly').
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
        if (!countryCodes.includes(region)) continue;

        const translation = store.translations.find(t => t.locale === language);
        if (!translation?.slug) continue;

        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }

      if (validUrls.size === 0) continue;

      const arSAUrl = validUrls.get('ar-SA') || validUrls.values().next().value;
      const languages = {
        ...Object.fromEntries(validUrls.entries()),
        'x-default': arSAUrl,
      };

      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified,
          changeFrequency: 'daily',
          priority:        store.isFeatured ? 0.85 : 0.75,
          alternates: { languages },
        });
      }
    }

    // =========================================================================
    // 8. BLOG INDEX PAGE
    // =========================================================================
    const latestPostUpdate = await prisma.blogPost.findFirst({
      where:   { status: 'PUBLISHED' },
      orderBy: { updatedAt: 'desc' },
      select:  { updatedAt: true },
    });

    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/blog`,
        lastModified:    latestPostUpdate?.updatedAt || new Date(),
        changeFrequency: 'daily',
        priority:        0.85,
        alternates: { languages: allAlternates('/blog') },
      });
    });

    // =========================================================================
    // NOTE — Blog category filter pages (?category=slug) intentionally omitted.
    //
    // The blog page sets `robots: 'noindex, follow'` on filtered views.
    // Including noindex pages in a sitemap creates "Submitted URL marked noindex"
    // errors in Search Console and wastes crawl budget.
    // =========================================================================

    // =========================================================================
    // 9. INDIVIDUAL BLOG POST PAGES
    // Both locale variants share the same slug.
    // x-default → ar-SA.
    // =========================================================================
    const blogPosts = await prisma.blogPost.findMany({
      where:   { status: 'PUBLISHED' },
      select: {
        slug:        true,
        isFeatured:  true,
        publishedAt: true,
        updatedAt:   true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    for (const post of blogPosts) {
      const lastModified = getMostRecentDate(post.updatedAt, post.publishedAt);

      const postAlternates = {
        ...Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/blog/${post.slug}`])),
        'x-default': `${BASE_URL}/ar-SA/blog/${post.slug}`,
      };

      LOCALES.forEach(locale => {
        urls.push({
          url:             `${BASE_URL}/${locale}/blog/${post.slug}`,
          lastModified,
          changeFrequency: 'weekly',
          priority:        post.isFeatured ? 0.8 : 0.7,
          alternates: { languages: postAlternates },
        });
      });
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const uniqueUrls = new Set(urls.map(u => u.url)).size;
    console.log(`✅ Sitemap: ${urls.length} entries (${uniqueUrls} unique URLs)`);
    if (urls.length > 45000) {
      console.warn('⚠️  Sitemap approaching 50k limit — consider splitting into sitemap index.');
    }

    return urls;

  } catch (error) {
    console.error('❌ Sitemap generation error:', error);
    return LOCALES.map(locale => ({
      url:             `${BASE_URL}/${locale}`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1.0,
    }));
  }
}
