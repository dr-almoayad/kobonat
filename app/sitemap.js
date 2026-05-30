// app/sitemap.js
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES   = ['ar-SA', 'en-SA'];

const COUPONS_PER_PAGE = 60;
const STACKS_PER_PAGE  = 12;
const BLOG_PER_PAGE    = 12;
const COUPONS_MAX_PAGE = 9;
const STACKS_MAX_PAGE  = 9;
const BLOG_MAX_PAGE    = 5;

const STATIC_LAST_MODIFIED = new Date('2026-05-16');

// ── Was 3600 (hourly). Changed to 86400 (daily).
// Store/category URLs change at most once a day; sitemaps don't need
// sub-hour freshness and the old interval caused ~12 DB queries every hour.
export const revalidate = 86400;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMostRecentDate(...dates) {
  const valid = dates.filter(d => d instanceof Date && !isNaN(d));
  return valid.length ? new Date(Math.max(...valid.map(d => d.getTime()))) : new Date();
}

function allAlternates(path = '') {
  return {
    'ar-SA':    `${BASE_URL}/ar-SA${path}`,
    'en-SA':    `${BASE_URL}/en-SA${path}`,
    'x-default': `${BASE_URL}/ar-SA${path}`,
  };
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

const STATIC_PAGES = [
  { slug: 'about',   priority: 0.6, changeFrequency: 'monthly' },
  { slug: 'contact', priority: 0.6, changeFrequency: 'monthly' },
  { slug: 'help',    priority: 0.7, changeFrequency: 'monthly' },
  { slug: 'privacy', priority: 0.4, changeFrequency: 'yearly'  },
  { slug: 'terms',   priority: 0.4, changeFrequency: 'yearly'  },
  { slug: 'cookies', priority: 0.3, changeFrequency: 'yearly'  },
];

// ── Sitemap ───────────────────────────────────────────────────────────────────

export default async function sitemap() {
  const urls = [];

  try {
    // ── Parallel block — all lightweight (findFirst with select, or count).
    // These haven't changed; they were already fast.
    const [
      latestVoucherUpdate,
      latestStoreUpdate,
      latestPostUpdate,
      latestPromoUpdate,
      latestStackUpdate,
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
      prisma.otherPromo.findFirst({
        where:   { isActive: true },
        orderBy: { updatedAt: 'desc' },
        select:  { updatedAt: true },
      }),
      prisma.offerStack.findFirst({
        where:   { isActive: true },
        orderBy: { updatedAt: 'desc' },
        select:  { updatedAt: true },
      }),
      prisma.voucher.count({
        where: {
          store:     { isActive: true },
          countries: { some: { country: { code: 'SA' } } },
          OR:        [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
        },
      }),
      prisma.offerStack.count({ where: { isActive: true } }),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const voucherDate = latestVoucherUpdate?.updatedAt || new Date();
    const storeDate   = latestStoreUpdate?.updatedAt   || new Date();
    const postDate    = latestPostUpdate?.updatedAt    || new Date();
    const promoDate   = latestPromoUpdate?.updatedAt   || new Date();
    const stackDate   = latestStackUpdate?.updatedAt   || new Date();

    // ── 1–7. Static and paginated sections — unchanged ────────────────────────

    for (const locale of LOCALES) {
      urls.push({
        url:             `${BASE_URL}/${locale}`,
        lastModified:    voucherDate,
        changeFrequency: 'daily',
        priority:        1.0,
        alternates:      { languages: allAlternates() },
      });
    }

    for (const locale of LOCALES) {
      urls.push({
        url:             `${BASE_URL}/${locale}/stores`,
        lastModified:    storeDate,
        changeFrequency: 'daily',
        priority:        0.9,
        alternates:      { languages: allAlternates('/stores') },
      });
    }

    for (const locale of LOCALES) {
      urls.push({
        url:             `${BASE_URL}/${locale}/categories`,
        lastModified:    storeDate,
        changeFrequency: 'weekly',
        priority:        0.9,
        alternates:      { languages: allAlternates('/categories') },
      });
    }

    const couponsLastPage = Math.min(
      Math.ceil(totalVouchers / COUPONS_PER_PAGE),
      COUPONS_MAX_PAGE
    );
    for (let page = 1; page <= couponsLastPage; page++) {
      const path       = page === 1 ? '/coupons' : `/coupons?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      for (const locale of LOCALES) {
        urls.push({
          url:             `${BASE_URL}/${locale}${path}`,
          lastModified:    voucherDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority:        page === 1 ? 0.9 : 0.6,
          alternates:      { languages: alternates },
        });
      }
    }

    const stacksLastPage = Math.min(
      Math.max(1, Math.ceil(totalStacks / STACKS_PER_PAGE)),
      STACKS_MAX_PAGE
    );
    for (let page = 1; page <= stacksLastPage; page++) {
      const path       = page === 1 ? '/stacks' : `/stacks?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      for (const locale of LOCALES) {
        urls.push({
          url:             `${BASE_URL}/${locale}${path}`,
          lastModified:    stackDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority:        page === 1 ? 0.8 : 0.5,
          alternates:      { languages: alternates },
        });
      }
    }

    for (const locale of LOCALES) {
      urls.push({
        url:             `${BASE_URL}/${locale}/bank-and-payment-offers`,
        lastModified:    promoDate,
        changeFrequency: 'daily',
        priority:        0.8,
        alternates:      { languages: allAlternates('/bank-and-payment-offers') },
      });
    }

    for (const page of STATIC_PAGES) {
      for (const locale of LOCALES) {
        urls.push({
          url:             `${BASE_URL}/${locale}/${page.slug}`,
          lastModified:    STATIC_LAST_MODIFIED,
          changeFrequency: page.changeFrequency,
          priority:        page.priority,
          alternates:      { languages: allAlternates(`/${page.slug}`) },
        });
      }
    }

    // ── 8. Category pages ─────────────────────────────────────────────────────
    // FIX: was `include: { translations: true }` which loaded every locale.
    // Now uses `select` scoped to the two locales we actually need.
    const categories = await prisma.category.findMany({
      select: {
        updatedAt: true,
        translations: {
          where:  { locale: { in: ['ar', 'en'] } },
          select: { slug: true, locale: true },
        },
        stores: {
          where: {
            store: {
              isActive:  true,
              countries: { some: { country: { code: 'SA' } } },
            },
          },
          select: { storeId: true },
        },
      },
    });

    // FIX: the old code ran a separate `prisma.categoryTranslation.findMany`
    // just to build this slug Set. We already have the translation data above,
    // so build it from there — one fewer round-trip to Neon.
    const catSlugsByLang = new Map();
    for (const cat of categories) {
      for (const t of cat.translations) {
        if (!catSlugsByLang.has(t.locale)) catSlugsByLang.set(t.locale, new Set());
        catSlugsByLang.get(t.locale).add(t.slug);
      }
    }

    for (const cat of categories) {
      if (cat.stores.length === 0) continue;
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang]      = locale.split('-');
        const translation = cat.translations.find(t => t.locale === lang);
        if (translation?.slug) {
          validUrls.set(locale, `${BASE_URL}/${locale}/categories/${translation.slug}`);
        }
      }
      if (validUrls.size === 0) continue;
      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified:    cat.updatedAt,
          changeFrequency: 'daily',
          priority:        0.8,
          alternates:      { languages: alternates },
        });
      }
    }

    // ── 9. Store pages ────────────────────────────────────────────────────────
    // FIX 1: was `include: { translations: true }` — loaded all locales.
    //         Now scoped to the two we need via `select`.
    // FIX 2: was `include: { vouchers: { take: 1, orderBy: updatedAt } }` —
    //         a JOIN to the vouchers table on every store just to get one date.
    //         We already have `voucherDate` (the most recent voucher update
    //         across the whole site) from the parallel block above. Using
    //         store.updatedAt is accurate enough for sitemap lastModified
    //         and avoids the per-store voucher join entirely.
    const stores = await prisma.store.findMany({
      where: {
        isActive:  true,
        countries: { some: { country: { code: 'SA' } } },
      },
      select: {
        updatedAt:  true,
        isFeatured: true,
        translations: {
          where:  { locale: { in: ['ar', 'en'] } },
          select: { slug: true, locale: true },
        },
      },
    });

    for (const store of stores) {
      const validUrls = new Map();

      for (const locale of LOCALES) {
        const [lang]      = locale.split('-');
        const translation = store.translations.find(t => t.locale === lang);
        if (!translation?.slug) continue;
        // Skip slugs that belong to a category (would redirect anyway)
        if (catSlugsByLang.get(lang)?.has(translation.slug)) continue;
        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }
      if (validUrls.size === 0) continue;

      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      // Use store.updatedAt — accurate and requires no extra join.
      // The global voucherDate from the parallel block already captures
      // "when did any voucher last change" at the sitemap level.
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified:    store.updatedAt,
          changeFrequency: 'daily',
          priority:        store.isFeatured ? 0.85 : 0.75,
          alternates:      { languages: alternates },
        });
      }
    }

    // ── 10. Seasonal pages ────────────────────────────────────────────────────
    // FIX: was `include: { translations: true }` — loaded all locales.
    const seasonal = await prisma.seasonalPage.findMany({
      where: {
        isActive:  true,
        countries: { some: { country: { code: 'SA' } } },
      },
      select: {
        slug:      true,
        updatedAt: true,
        translations: {
          where:  { locale: { in: ['ar', 'en'] } },
          select: { locale: true, title: true },
        },
      },
    });

    for (const sp of seasonal) {
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang]         = locale.split('-');
        const hasTranslation = sp.translations.some(t => t.locale === lang && t.title);
        if (hasTranslation) {
          validUrls.set(locale, `${BASE_URL}/${locale}/seasonal/${sp.slug}`);
        }
      }
      if (validUrls.size === 0) continue;
      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified:    sp.updatedAt,
          changeFrequency: 'weekly',
          priority:        0.75,
          alternates:      { languages: alternates },
        });
      }
    }

    // ── 11. Blog index (paginated) ────────────────────────────────────────────
    const blogLastPage = Math.min(
      Math.max(1, Math.ceil(totalBlogPosts / BLOG_PER_PAGE)),
      BLOG_MAX_PAGE
    );
    for (let page = 1; page <= blogLastPage; page++) {
      const path       = page === 1 ? '/blog' : `/blog?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      for (const locale of LOCALES) {
        urls.push({
          url:             `${BASE_URL}/${locale}${path}`,
          lastModified:    postDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority:        page === 1 ? 0.85 : 0.55,
          alternates:      { languages: alternates },
        });
      }
    }

    // ── 12. Blog posts — already used `select` correctly, no change needed ───
    const blogPosts = await prisma.blogPost.findMany({
      where:  { status: 'PUBLISHED' },
      select: {
        slug:        true,
        isFeatured:  true,
        publishedAt: true,
        updatedAt:   true,
        translations: { select: { locale: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });

    for (const post of blogPosts) {
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        if (post.translations.some(t => t.locale === lang)) {
          validUrls.set(locale, `${BASE_URL}/${locale}/blog/${post.slug}`);
        }
      }
      if (validUrls.size === 0) continue;
      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified:    getMostRecentDate(post.updatedAt, post.publishedAt),
          changeFrequency: 'weekly',
          priority:        post.isFeatured ? 0.8 : 0.7,
          alternates:      { languages: alternates },
        });
      }
    }

    // ── Filter & deduplicate ──────────────────────────────────────────────────
    const htmlPages = deduplicateEntries(urls).filter(entry => {
      const lower = entry.url.toLowerCase();
      if (lower.includes('/_next/'))         return false;
      if (lower.includes('/store-covers/'))  return false;
      if (lower.includes('/public/stores/')) return false;
      if (lower.match(/\.(avif|webp|png|jpg|jpeg|gif|svg|ico|json|js|css|woff2?|ttf|eot|xml|txt)$/)) {
        return false;
      }
      return true;
    });

    return htmlPages;

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return LOCALES.map(locale => ({
      url:             `${BASE_URL}/${locale}`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1.0,
      alternates:      { languages: allAlternates() },
    }));
  }
}
