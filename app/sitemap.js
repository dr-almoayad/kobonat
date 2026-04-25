// app/sitemap.js
// ─────────────────────────────────────────────────────────────────────────────
// Sections:
//  1.  Homepages
//  2.  All-stores page
//  3.  Categories listing page
//  4.  Coupons page (page 1 only — rel="next"/"prev" handles the rest)
//  5.  Stacks page (page 1 only)
//  6.  Bank & Payment Offers page (NEW)
//  7.  Static pages 
//  8.  Individual category pages   → /categories/[slug]
//  9.  Individual store pages      → /stores/[slug]
//  10. Seasonal pages              → /seasonal/[slug]
//  11. Blog index page
//  12. Individual blog post pages
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
    // 6. BANK & PAYMENT OFFERS PAGE (NEW)
    // =========================================================================
    const bankOffersUrlMap = {};
    for (const locale of LOCALES) {
      bankOffersUrlMap[locale] = `${BASE_URL}/${locale}/bank-and-payment-offers`;
    }

    if (Object.keys(bankOffersUrlMap).length > 0) {
      const bankOffersAlternates = buildAlternates(bankOffersUrlMap);
      for (const [, url] of Object.entries(bankOffersUrlMap)) {
        urls.push({
          url,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
          alternates: { languages: bankOffersAlternates },
        });
      }
    }

    // =========================================================================
    // 7. STATIC PAGES
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
    // 8. INDIVIDUAL CATEGORY PAGES  → /categories/[slug]
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

      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [language] = locale.split('-');
        const translation = category.translations.find(t => t.locale === language);
        if (translation?.slug) {
          validUrls.set(locale, `${BASE_URL}/${locale}/categories/${translation.slug}`);
        }
      }

      if (validUrls.size === 0) continue;

      const localeUrlMap = Object.fromEntries(validUrls.entries());
      const alternates   = buildAlternates(localeUrlMap);

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
    // 9. INDIVIDUAL STORE PAGES  → /stores/[slug]
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
    // 10. SEASONAL PAGES  → /seasonal/[slug]
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
      if (page.countries.length === 0) continue;
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
    // 11. BLOG INDEX PAGE
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
    // 12. INDIVIDUAL BLOG POST PAGES
    // =========================================================================
    const blogPosts = await prisma.blogPost.findMany({
      where:   { status: 'PUBLISHED' },
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
