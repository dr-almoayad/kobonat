// app/sitemap.js
// ─────────────────────────────────────────────────────────────────────────────
// Sections:
//  1. Homepage
//  2. All-stores page
//  3. Coupons page  (page 1 only — paginated pages discovered via rel=next/prev)
//  4. Static pages
//  5. Category (store-category) pages
//  6. Individual store pages
//  7. Blog index page
//  8. Individual blog post pages
//
// FIXES APPLIED:
//
// FIX 1 — Blog category filter pages REMOVED from sitemap.
//   The blog page (app/[locale]/blog/page.jsx) already sets
//   `robots: 'noindex, follow'` on filtered views (?category= / ?tag=).
//   Including noindex pages in the sitemap sends contradictory signals and
//   creates "Submitted URL marked noindex" errors in Google Search Console,
//   which wastes crawl budget and suppresses nearby pages. Removed entirely.
//
// FIX 2 — x-default added to every alternates object.
//   Google uses x-default to decide which page to show users whose locale
//   doesn't match any hreflang tag. Without it Google makes its own guess.
//   Arabic (ar-SA) is the primary market, so x-default → ar-SA.
//
// FIX 3 — Store pages changeFrequency changed from 'hourly' → 'daily'.
//   'hourly' was misleading — store-level content (description, logo) rarely
//   changes that often. Vouchers have their own pages. Using 'hourly' across
//   all store pages signals low-quality metadata to crawlers.
//
// FIX 4 — Category and store alternates already only include locales where
//   a real translation exists (existing logic was correct). Added x-default
//   pointing to the ar-SA variant in every case.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma }        from '@/lib/prisma';
import { allLocaleCodes } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES  = allLocaleCodes;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getMostRecentDate(...dates) {
  const valid = dates.filter(d => d instanceof Date && !isNaN(d));
  return valid.length > 0 ? new Date(Math.max(...valid.map(d => d.getTime()))) : new Date();
}

/**
 * Build the full alternates map for a path that exists identically in every
 * locale (e.g. /coupons, /stores, /blog).
 * FIX 2: includes x-default pointing to the ar-SA variant.
 */
function allAlternates(path = '') {
  const languages = Object.fromEntries(
    LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`])
  );
  languages['x-default'] = `${BASE_URL}/ar-SA${path}`;
  return languages;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sitemap
// ─────────────────────────────────────────────────────────────────────────────

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
        changeFrequency: 'hourly',
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
    // 3. COUPONS PAGE  (page 1 only)
    // Paginated pages (/coupons?page=N) are not included here — Google
    // discovers them through the rel="next"/"prev" links in the HTML.
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
    // 4. STATIC PAGES
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
    // 5. STORE CATEGORY PAGES  (path: /locale/stores/[category-slug])
    //
    // Each category may have a different slug per locale (e.g. "إلكترونيات"
    // in Arabic vs "electronics" in English). We build a validUrls map keyed
    // by locale so hreflang alternates only reference URLs that actually exist.
    // FIX 2: x-default added pointing to the ar-SA variant.
    // =========================================================================
    const categories = await prisma.category.findMany({
      include: {
        translations: true,
        stores: {
          where:   { store: { isActive: true } },
          include: { store: { select: { updatedAt: true } } },
        },
      },
    });

    for (const category of categories) {
      if (category.stores.length === 0) continue;

      const storeUpdates = category.stores.map(s => s.store.updatedAt);
      const lastModified = getMostRecentDate(category.updatedAt, ...storeUpdates);

      // Build a URL only for locales where this category has a translation slug
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [language] = locale.split('-');
        const translation = category.translations.find(t => t.locale === language);
        if (translation?.slug) {
          validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
        }
      }

      if (validUrls.size === 0) continue;

      // FIX 2: x-default → ar-SA variant (or first available if ar-SA missing)
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
    // 6. INDIVIDUAL STORE PAGES
    //
    // Each store may have different slugs per locale. Only locales where both
    // a translation AND a matching country-region exist are included.
    // FIX 2: x-default added.
    // FIX 3: changeFrequency changed from 'hourly' to 'daily'.
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

      // FIX 2: x-default → ar-SA variant (or first available)
      const arSAUrl = validUrls.get('ar-SA') || validUrls.values().next().value;
      const languages = {
        ...Object.fromEntries(validUrls.entries()),
        'x-default': arSAUrl,
      };

      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified,
          changeFrequency: 'daily',   // FIX 3: was 'hourly'
          priority:        store.isFeatured ? 0.85 : 0.75,
          alternates: { languages },
        });
      }
    }

    // =========================================================================
    // 7. BLOG INDEX PAGE
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
    // FIX 1: The blog page already sets `robots: 'noindex, follow'` on those
    // filtered views. Including noindex pages in the sitemap creates
    // "Submitted URL marked noindex" errors in Google Search Console,
    // wastes crawl budget, and can suppress coverage of nearby indexable pages.
    // Google discovers the filtered pages through internal links and the
    // category pill navigation on the blog index — no sitemap entry needed.
    // =========================================================================

    // =========================================================================
    // 8. INDIVIDUAL BLOG POST PAGES
    // Both locale variants share the same slug.
    // FIX 2: x-default added pointing to the ar-SA variant.
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
        'x-default': `${BASE_URL}/ar-SA/blog/${post.slug}`, // FIX 2
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

    // =========================================================================
    // Summary log
    // =========================================================================
    const uniqueUrls = new Set(urls.map(u => u.url)).size;
    console.log(`✅ Sitemap: ${urls.length} entries (${uniqueUrls} unique URLs)`);
    if (urls.length > 45000) {
      console.warn('⚠️  Sitemap approaching 50k limit — consider splitting into sitemap index.');
    }

    return urls;

  } catch (error) {
    console.error('❌ Sitemap generation error:', error);

    // Minimal fallback — site is never crawled without a sitemap
    return LOCALES.map(locale => ({
      url:             `${BASE_URL}/${locale}`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1.0,
    }));
  }
}
