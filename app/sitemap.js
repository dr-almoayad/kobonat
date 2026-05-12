// app/sitemap.js
// Sections:
//  1.  Homepages
//  2.  All-stores page
//  3.  Categories listing page
//  4.  Coupons pages (pages 1–9; robots.js disallows 10+)
//  5.  Stacks pages (all pages)
//  6.  Bank & Payment Offers page
//  7.  Static pages
//  8.  Individual category pages   → /categories/[slug]
//  9.  Individual store pages      → /stores/[slug]
//  10. Seasonal pages              → /seasonal/[slug]
//  11. Blog index pages (all pages, non-filtered only)
//  12. Individual blog post pages

import { prisma }         from '@/lib/prisma';
import { allLocaleCodes } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES  = allLocaleCodes; // ['ar-SA', 'en-SA']

// Pagination constants — must match the page components
const COUPONS_PER_PAGE = 60;
const STACKS_PER_PAGE  = 12;
const BLOG_PER_PAGE    = 12;
// robots.js disallows /coupons?page=10 and above
const COUPONS_MAX_PAGE = 9;

export const revalidate = 3600;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMostRecentDate(...dates) {
  const valid = dates.filter(d => d instanceof Date && !isNaN(d));
  return valid.length > 0 ? new Date(Math.max(...valid.map(d => d.getTime()))) : new Date();
}

/**
 * Build hreflang alternates for paths that are identical across every locale.
 * x-default always points to ar-SA.
 */
function allAlternates(path = '') {
  const languages = Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]));
  languages['x-default'] = `${BASE_URL}/ar-SA${path}`;
  return languages;
}

/**
 * Build a validated alternates object from a locale → url map.
 * Returns null when the map is empty.
 */
function buildAlternates(localeUrlMap) {
  if (!localeUrlMap || Object.keys(localeUrlMap).length === 0) return null;
  const xDefault = localeUrlMap['ar-SA'] || Object.values(localeUrlMap)[0];
  return { ...localeUrlMap, 'x-default': xDefault };
}

/** Remove duplicate URLs — first occurrence wins. */
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
    // ── Shared "latest update" timestamps ────────────────────────────────────
    const [
      latestVoucherUpdate,
      latestStoreUpdate,
      latestPostUpdate,
      latestPromoUpdate,   // NEW: for bank-and-payment-offers lastModified
      totalVouchers,
      totalStacks,
      totalBlogPosts,
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
      // Most recently updated bank/payment offer — used as lastModified for
      // the bank-and-payment-offers page instead of the hardcoded new Date()
      prisma.otherPromo.findFirst({
        where:   { isActive: true },
        orderBy: { updatedAt: 'desc' },
        select:  { updatedAt: true },
      }),
      // Total active vouchers → drives coupons page count
      prisma.voucher.count({
        where: {
          store: { isActive: true },
          OR:    [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
        },
      }),
      // Total active stacks → drives stacks page count
      prisma.offerStack.count({ where: { isActive: true } }),
      // Total published blog posts → drives blog index page count
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const voucherDate = latestVoucherUpdate?.updatedAt || new Date();
    const storeDate   = latestStoreUpdate?.updatedAt   || new Date();
    const postDate    = latestPostUpdate?.updatedAt    || new Date();
    const promoDate   = latestPromoUpdate?.updatedAt   || new Date();

    // ── 1. HOMEPAGES ──────────────────────────────────────────────────────────
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}`,
        lastModified:    voucherDate,
        changeFrequency: 'daily',
        priority:        1.0,
        alternates: { languages: allAlternates() },
      });
    });

    // ── 2. ALL-STORES PAGE ────────────────────────────────────────────────────
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/stores`,
        lastModified:    storeDate,
        changeFrequency: 'daily',
        priority:        0.9,
        alternates: { languages: allAlternates('/stores') },
      });
    });

    // ── 3. CATEGORIES LISTING PAGE ────────────────────────────────────────────
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/categories`,
        lastModified:    storeDate,
        changeFrequency: 'weekly',
        priority:        0.9,
        alternates: { languages: allAlternates('/categories') },
      });
    });

    // ── 4. COUPONS PAGES (pages 1 to min(totalPages, COUPONS_MAX_PAGE)) ───────
    // robots.js disallows /coupons?page=10 and above, so we cap at page 9.
    // Each page declares its own canonical in generateMetadata, so including
    // all crawlable pages here gives Googlebot clear discovery paths.
    const couponsTotalPages = Math.ceil(totalVouchers / COUPONS_PER_PAGE);
    const couponsLastPage   = Math.min(couponsTotalPages, COUPONS_MAX_PAGE);

    for (let page = 1; page <= couponsLastPage; page++) {
      const path = page === 1 ? '/coupons' : `/coupons?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      LOCALES.forEach(locale => {
        urls.push({
          url:             `${BASE_URL}/${locale}${path}`,
          lastModified:    voucherDate,
          changeFrequency: page === 1 ? 'hourly' : 'daily',
          priority:        page === 1 ? 0.9 : 0.6,
          alternates:      { languages: alternates },
        });
      });
    }

    // ── 5. STACKS PAGES (all pages) ───────────────────────────────────────────
    // The stacks page has full pagination with its own generateMetadata per page.
    // All pages are indexed and need discovery paths in the sitemap.
    const stacksTotalPages = Math.max(1, Math.ceil(totalStacks / STACKS_PER_PAGE));

    for (let page = 1; page <= stacksTotalPages; page++) {
      const path = page === 1 ? '/stacks' : `/stacks?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      LOCALES.forEach(locale => {
        urls.push({
          url:             `${BASE_URL}/${locale}${path}`,
          lastModified:    storeDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority:        page === 1 ? 0.8 : 0.5,
          alternates:      { languages: alternates },
        });
      });
    }

    // ── 6. BANK & PAYMENT OFFERS PAGE ─────────────────────────────────────────
    // Previously used `new Date()` — always stale on next crawl.
    // Now uses the actual timestamp of the most recently updated active promo.
    const bankOffersAlternates = buildAlternates(
      Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/bank-and-payment-offers`]))
    );
    LOCALES.forEach(locale => {
      urls.push({
        url:             `${BASE_URL}/${locale}/bank-and-payment-offers`,
        lastModified:    promoDate,
        changeFrequency: 'daily',
        priority:        0.8,
        alternates:      { languages: bankOffersAlternates },
      });
    });

    // ── 7. STATIC PAGES ───────────────────────────────────────────────────────
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
          lastModified:    new Date('2025-01-01'),
          changeFrequency: page.changeFreq,
          priority:        page.priority,
          alternates: { languages: allAlternates(`/${page.slug}`) },
        });
      });
    });

    // ── 8. INDIVIDUAL CATEGORY PAGES ─────────────────────────────────────────
    const categories = await prisma.category.findMany({
      include: {
        translations: true,
        stores: {
          where:   { store: { isActive: true } },
          include: {
            store: {
              select: {
                updatedAt: true,
                countries: { select: { country: { select: { code: true } } } },
              },
            },
          },
        },
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    // Collect all category slugs per language to detect store/category collisions
    const categoryTranslations = await prisma.categoryTranslation.findMany({
      select: { slug: true, locale: true },
    });
    const categorySlugsByLocale = new Map();
    for (const ct of categoryTranslations) {
      if (!categorySlugsByLocale.has(ct.locale)) categorySlugsByLocale.set(ct.locale, new Set());
      categorySlugsByLocale.get(ct.locale).add(ct.slug);
    }

    for (const category of categories) {
      if (category.stores.length === 0) continue;

      const storeUpdates = category.stores.map(s => s.store.updatedAt);
      const lastModified = getMostRecentDate(category.updatedAt, ...storeUpdates);

      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [language, region] = locale.split('-');
        const translation = category.translations.find(t => t.locale === language);
        if (!translation?.slug) continue;

        const hasStoreInCountry = category.stores.some(sc =>
          sc.store?.countries?.some(c => c.country.code === region)
        );
        if (!hasStoreInCountry) continue;

        validUrls.set(locale, `${BASE_URL}/${locale}/categories/${translation.slug}`);
      }

      if (validUrls.size === 0) continue;

      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
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

    // ── 9. INDIVIDUAL STORE PAGES ─────────────────────────────────────────────
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

        // Skip if this store slug collides with a category slug in the same locale
        const categorySlugs = categorySlugsByLocale.get(language);
        if (categorySlugs?.has(translation.slug)) continue;

        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }

      if (validUrls.size === 0) continue;

      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
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

    // ── 10. SEASONAL PAGES ────────────────────────────────────────────────────
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
      if (!page.translations.some(t => t.title)) continue;

      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/seasonal/${page.slug}`]))
      );
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

    // ── 11. BLOG INDEX PAGES (all paginated pages) ────────────────────────────
    // blog/page.jsx sets robots:'index,follow' for all non-filtered pages,
    // meaning pages 2, 3, etc. are indexed but were previously absent from
    // the sitemap. We now include every page.
    // Filtered views (?category=X, ?tag=X) are noindex so we exclude them.
    const blogTotalPages = Math.max(1, Math.ceil(totalBlogPosts / BLOG_PER_PAGE));

    for (let page = 1; page <= blogTotalPages; page++) {
      const path = page === 1 ? '/blog' : `/blog?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      LOCALES.forEach(locale => {
        urls.push({
          url:             `${BASE_URL}/${locale}${path}`,
          lastModified:    postDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority:        page === 1 ? 0.85 : 0.55,
          alternates:      { languages: alternates },
        });
      });
    }

    // ── 12. INDIVIDUAL BLOG POST PAGES ────────────────────────────────────────
    const blogPosts = await prisma.blogPost.findMany({
      where:  { status: 'PUBLISHED' },
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
        if (post.translations.some(t => t.locale === language)) {
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

    // ── Deduplicate and log ───────────────────────────────────────────────────
    const deduplicated = deduplicateEntries(urls);
    const uniqueCount  = deduplicated.length;

    console.log(`✅ Sitemap: ${uniqueCount} unique entries (${urls.length - uniqueCount} duplicates removed)`);

    if (uniqueCount > 45_000) {
      console.warn('⚠️  Sitemap approaching 50k limit — split into sitemap index before deploying.');
    }

    return deduplicated;

  } catch (error) {
    console.error('❌ Sitemap generation error:', error);

    // Minimal fallback so Googlebot always receives a valid response
    return LOCALES.map(locale => ({
      url:             `${BASE_URL}/${locale}`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1.0,
      alternates: { languages: allAlternates() },
    }));
  }
       }
