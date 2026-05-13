// app/sitemap.js
// Saudi Arabia only – locales: ar-SA, en-SA
// Includes all public pages, paginated series, respecting robots.txt disallow rules.

import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES = ['ar-SA', 'en-SA']; // Only Saudi Arabia

// Pagination constants – must match page components
const COUPONS_PER_PAGE = 60;
const STACKS_PER_PAGE = 12;
const BLOG_PER_PAGE = 12;

// Robots.txt disallows:
//   - /coupons?page=10 and above
//   - /stacks?page=10 and above
//   - /blog?page=6 through 9 (but pages 10+ are not explicitly disallowed, yet thin)
const COUPONS_MAX_PAGE = 9;
const STACKS_MAX_PAGE = 9;
const BLOG_MAX_PAGE = 5; // stay clear of disallowed range 6-9

// Fixed lastModified for static pages (use a real date, not dynamic)
const STATIC_LAST_MODIFIED = new Date('2026-05-13');

export const revalidate = 3600;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMostRecentDate(...dates) {
  const valid = dates.filter(d => d instanceof Date && !isNaN(d));
  return valid.length > 0 ? new Date(Math.max(...valid.map(d => d.getTime()))) : new Date();
}

function allAlternates(path = '') {
  const languages = {
    'ar-SA': `${BASE_URL}/ar-SA${path}`,
    'en-SA': `${BASE_URL}/en-SA${path}`,
  };
  languages['x-default'] = `${BASE_URL}/ar-SA${path}`;
  return languages;
}

function buildAlternates(localeUrlMap) {
  if (!localeUrlMap || Object.keys(localeUrlMap).length === 0) return null;
  const xDefault = localeUrlMap['ar-SA'] || Object.values(localeUrlMap)[0];
  return { ...localeUrlMap, 'x-default': xDefault };
}

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
    // ── Latest update timestamps (active SA content) ──────────────────────────
    const [
      latestVoucherUpdate,
      latestStoreUpdate,
      latestPostUpdate,
      latestPromoUpdate,
      totalVouchers,
      totalStacks,
      totalBlogPosts,
    ] = await Promise.all([
      prisma.voucher.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.store.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.blogPost.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.otherPromo.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.voucher.count({
        where: {
          store: { isActive: true },
          countries: { some: { country: { code: 'SA' } } },
          OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
        },
      }),
      prisma.offerStack.count({ where: { isActive: true } }),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const voucherDate = latestVoucherUpdate?.updatedAt || new Date();
    const storeDate = latestStoreUpdate?.updatedAt || new Date();
    const postDate = latestPostUpdate?.updatedAt || new Date();
    const promoDate = latestPromoUpdate?.updatedAt || new Date();

    // ── 1. HOMEPAGES ──────────────────────────────────────────────────────────
    LOCALES.forEach(locale => {
      urls.push({
        url: `${BASE_URL}/${locale}`,
        lastModified: voucherDate,
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: { languages: allAlternates() },
      });
    });

    // ── 2. ALL-STORES PAGE ────────────────────────────────────────────────────
    LOCALES.forEach(locale => {
      urls.push({
        url: `${BASE_URL}/${locale}/stores`,
        lastModified: storeDate,
        changeFrequency: 'daily',
        priority: 0.9,
        alternates: { languages: allAlternates('/stores') },
      });
    });

    // ── 3. CATEGORIES LISTING PAGE ────────────────────────────────────────────
    LOCALES.forEach(locale => {
      urls.push({
        url: `${BASE_URL}/${locale}/categories`,
        lastModified: storeDate,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: allAlternates('/categories') },
      });
    });

    // ── 4. COUPONS PAGES (pages 1–9) ──────────────────────────────────────────
    const couponsTotalPages = Math.ceil(totalVouchers / COUPONS_PER_PAGE);
    const couponsLastPage = Math.min(couponsTotalPages, COUPONS_MAX_PAGE);

    for (let page = 1; page <= couponsLastPage; page++) {
      const path = page === 1 ? '/coupons' : `/coupons?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      LOCALES.forEach(locale => {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: voucherDate,
          changeFrequency: page === 1 ? 'hourly' : 'daily',
          priority: page === 1 ? 0.9 : 0.6,
          alternates: { languages: alternates },
        });
      });
    }

    // ── 5. STACKS PAGES (pages 1–9) ───────────────────────────────────────────
    const stacksTotalPages = Math.max(1, Math.ceil(totalStacks / STACKS_PER_PAGE));
    const stacksLastPage = Math.min(stacksTotalPages, STACKS_MAX_PAGE);

    for (let page = 1; page <= stacksLastPage; page++) {
      const path = page === 1 ? '/stacks' : `/stacks?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      LOCALES.forEach(locale => {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: storeDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.8 : 0.5,
          alternates: { languages: alternates },
        });
      });
    }

    // ── 6. BANK & PAYMENT OFFERS PAGE ─────────────────────────────────────────
    const bankOffersAlternates = buildAlternates(
      Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/bank-and-payment-offers`]))
    );
    LOCALES.forEach(locale => {
      urls.push({
        url: `${BASE_URL}/${locale}/bank-and-payment-offers`,
        lastModified: promoDate,
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: { languages: bankOffersAlternates },
      });
    });

    // ── 7. STATIC PAGES ───────────────────────────────────────────────────────
    const staticPages = [
      { slug: 'about', priority: 0.6, changeFreq: 'monthly' },
      { slug: 'contact', priority: 0.6, changeFreq: 'monthly' },
      { slug: 'privacy', priority: 0.4, changeFreq: 'yearly' },
      { slug: 'terms', priority: 0.4, changeFreq: 'yearly' },
      { slug: 'cookies', priority: 0.3, changeFreq: 'yearly' },
      { slug: 'help', priority: 0.7, changeFreq: 'monthly' },
    ];

    staticPages.forEach(page => {
      LOCALES.forEach(locale => {
        urls.push({
          url: `${BASE_URL}/${locale}/${page.slug}`,
          lastModified: STATIC_LAST_MODIFIED,
          changeFrequency: page.changeFreq,
          priority: page.priority,
          alternates: { languages: allAlternates(`/${page.slug}`) },
        });
      });
    });

    // ── 8. INDIVIDUAL CATEGORY PAGES (only those with stores in SA) ───────────
    const categories = await prisma.category.findMany({
      include: {
        translations: true,
        stores: {
          where: {
            store: {
              isActive: true,
              countries: { some: { country: { code: 'SA' } } },
            },
          },
          include: { store: { select: { updatedAt: true } } },
        },
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    // Pre‑load all category slugs to avoid store‑category collisions later
    const categorySlugsByLang = new Map();
    const allCatTranslations = await prisma.categoryTranslation.findMany({
      select: { slug: true, locale: true },
    });
    for (const ct of allCatTranslations) {
      if (!categorySlugsByLang.has(ct.locale)) categorySlugsByLang.set(ct.locale, new Set());
      categorySlugsByLang.get(ct.locale).add(ct.slug);
    }

    for (const category of categories) {
      if (category.stores.length === 0) continue;
      const storeUpdates = category.stores.map(s => s.store.updatedAt);
      const lastModified = getMostRecentDate(category.updatedAt, ...storeUpdates);
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        const translation = category.translations.find(t => t.locale === lang);
        if (!translation?.slug) continue;
        validUrls.set(locale, `${BASE_URL}/${locale}/categories/${translation.slug}`);
      }
      if (validUrls.size === 0) continue;
      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified,
          changeFrequency: 'daily',
          priority: 0.8,
          alternates: { languages: alternates },
        });
      }
    }

    // ── 9. INDIVIDUAL STORE PAGES (only active stores in SA) ──────────────────
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: 'SA' } } },
      },
      include: {
        translations: true,
        vouchers: {
          where: { OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { updatedAt: true },
        },
      },
    });

    for (const store of stores) {
      const lastModified = getMostRecentDate(store.updatedAt, store.vouchers[0]?.updatedAt);
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        const translation = store.translations.find(t => t.locale === lang);
        if (!translation?.slug) continue;
        const categorySlugs = categorySlugsByLang.get(lang);
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
          priority: store.isFeatured ? 0.85 : 0.75,
          alternates: { languages: alternates },
        });
      }
    }

    // ── 10. SEASONAL PAGES (only those active in SA) ──────────────────────────
    const seasonalPages = await prisma.seasonalPage.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: 'SA' } } },
      },
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });

    for (const page of seasonalPages) {
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        const translation = page.translations.find(t => t.locale === lang);
        if (!translation?.title) continue;
        validUrls.set(locale, `${BASE_URL}/${locale}/seasonal/${page.slug}`);
      }
      if (validUrls.size === 0) continue;
      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified: page.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.75,
          alternates: { languages: alternates },
        });
      }
    }

    // ── 11. BLOG INDEX PAGES (pages 1–5) ─────────────────────────────────────
    const blogTotalPages = Math.max(1, Math.ceil(totalBlogPosts / BLOG_PER_PAGE));
    const blogLastPage = Math.min(blogTotalPages, BLOG_MAX_PAGE);

    for (let page = 1; page <= blogLastPage; page++) {
      const path = page === 1 ? '/blog' : `/blog?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      LOCALES.forEach(locale => {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: postDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.85 : 0.55,
          alternates: { languages: alternates },
        });
      });
    }

    // ── 12. INDIVIDUAL BLOG POST PAGES ────────────────────────────────────────
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        isFeatured: true,
        publishedAt: true,
        updatedAt: true,
        translations: { select: { locale: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });

    for (const post of blogPosts) {
      const lastModified = getMostRecentDate(post.updatedAt, post.publishedAt);
      const localeUrlMap = {};
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        if (post.translations.some(t => t.locale === lang)) {
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
          priority: post.isFeatured ? 0.8 : 0.7,
          alternates: { languages: alternates },
        });
      }
    }

    // ── Deduplicate and log ───────────────────────────────────────────────────
    const deduplicated = deduplicateEntries(urls);
    console.log(`✅ Sitemap: ${deduplicated.length} unique entries`);

    return deduplicated;
  } catch (error) {
    console.error('❌ Sitemap generation error:', error);
    // Fallback: only homepage
    return LOCALES.map(locale => ({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: { languages: allAlternates() },
    }));
  }
}
