import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES   = ['ar-SA', 'en-SA'];

const COUPONS_PER_PAGE = 60;
const STACKS_PER_PAGE  = 12;
const BLOG_PER_PAGE    = 12;
const COUPONS_MAX_PAGE = 9;
const STACKS_MAX_PAGE  = 9;
const BLOG_MAX_PAGE    = 5;

// Cache dynamic sitemap responses on the edge infrastructure for 1 hour
export const revalidate = 3600; 

// ── SEO & Localization Helpers ────────────────────────────────────────────────

function buildAlternates(localeUrlMap) {
  if (!localeUrlMap || Object.keys(localeUrlMap).length === 0) return null;
  const xDefault = localeUrlMap['ar-SA'] || Object.values(localeUrlMap)[0];
  return { ...localeUrlMap, 'x-default': xDefault };
}

function coreAlternates(path = '') {
  const localeUrlMap = Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]));
  return buildAlternates(localeUrlMap);
}

function deduplicateEntries(entries) {
  const seen = new Set();
  return entries.filter(entry => {
    if (!entry?.url) return false;
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

// ── Main Sitemap Generation Engine ────────────────────────────────────────────

export default async function sitemap() {
  const urls = [];
  const CURRENT_DATE = new Date();

  // Coerces date references cleanly to prevent runtime schema crashes
  const safeDate = (dateVal) => {
    if (!dateVal) return CURRENT_DATE;
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? CURRENT_DATE : parsed;
  };

  // ── 1. Core Static Roots & Navigation Directories ───────────────────────────
  try {
    const [latestVoucher, latestStore, latestPromo] = await Promise.all([
      prisma.voucher.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
      prisma.store.findFirst({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
      prisma.otherPromo.findFirst({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
    ]);

    const voucherDate = safeDate(latestVoucher?.updatedAt);
    const storeDate   = safeDate(latestStore?.updatedAt);
    const promoDate   = safeDate(latestPromo?.updatedAt);

    for (const locale of LOCALES) {
      urls.push({
        url: `${BASE_URL}/${locale}`,
        lastModified: voucherDate,
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: { languages: coreAlternates() },
      });
      urls.push({
        url: `${BASE_URL}/${locale}/stores`,
        lastModified: storeDate,
        changeFrequency: 'daily',
        priority: 0.9,
        alternates: { languages: coreAlternates('/stores') },
      });
      urls.push({
        url: `${BASE_URL}/${locale}/categories`,
        lastModified: storeDate,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: coreAlternates('/categories') },
      });
      urls.push({
        url: `${BASE_URL}/${locale}/bank-and-payment-offers`,
        lastModified: promoDate,
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: { languages: coreAlternates('/bank-and-payment-offers') },
      });
    }

    for (const page of STATIC_PAGES) {
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}/${page.slug}`,
          lastModified: CURRENT_DATE,
          changeFrequency: page.changeFrequency,
          priority: page.priority,
          alternates: { languages: coreAlternates(`/${page.slug}`) },
        });
      }
    }

    // ── 2. Paginated Active Coupons / Vouchers Listing ────────────────────────
    const totalVouchers = await prisma.voucher.count({
      where: {
        store: { isActive: true },
        countries: { some: { country: { code: 'SA' } } },
        OR: [{ expiryDate: null }, { expiryDate: { gte: CURRENT_DATE } }],
      },
    }).catch(() => 0);

    const couponsLastPage = Math.min(Math.ceil(totalVouchers / COUPONS_PER_PAGE), COUPONS_MAX_PAGE);
    for (let page = 1; page <= couponsLastPage; page++) {
      const path = page === 1 ? '/coupons' : `/coupons?page=${page}`;
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: voucherDate, // SEO Optimization: Binds update directly to real data lifecycle
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.9 : 0.6,
          alternates: { languages: coreAlternates(path) },
        });
      }
    }
  } catch (err) {
    console.error('Sitemap Layer Error: Static Core Nodes failed', err);
  }

  // ── 3. Offer Stacks Feed Pages ──────────────────────────────────────────────
  try {
    const [latestStack, totalStacks] = await Promise.all([
      prisma.offerStack.findFirst({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
      prisma.offerStack.count({ where: { isActive: true, countries: { some: { country: { code: 'SA' } } } } }).catch(() => 0)
    ]);

    const stackDate = safeDate(latestStack?.updatedAt);
    const stackLastPage = Math.min(Math.ceil(totalStacks / STACKS_PER_PAGE), STACKS_MAX_PAGE);
    for (let page = 1; page <= stackLastPage; page++) {
      const path = page === 1 ? '/stacks' : `/stacks?page=${page}`;
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: stackDate, 
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.8 : 0.5,
          alternates: { languages: coreAlternates(path) },
        });
      }
    }
  } catch (err) {
    console.error('Sitemap Layer Error: Stack Mapping Engine failed', err);
  }

  // ── 4. Dynamic Category Profile Paths ───────────────────────────────────────
  try {
    // Database Optimization: Filters out categories lacking active Saudi stores directly via SQL index
    const categories = await prisma.category.findMany({
      where: {
        stores: {
          some: {
            store: {
              isActive: true,
              countries: { some: { country: { code: 'SA' } } }
            }
          }
        }
      },
      select: {
        updatedAt: true,
        translations: {
          where: { locale: { in: ['ar', 'en'] } },
          select: { slug: true, locale: true },
        },
      },
    }).catch(() => []);

    for (const cat of categories) {
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        const translation = cat.translations?.find(t => t.locale === lang);
        if (translation?.slug) {
          validUrls.set(locale, `${BASE_URL}/${locale}/categories/${translation.slug}`);
        }
      }
      if (validUrls.size === 0) continue;
      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified: safeDate(cat.updatedAt),
          changeFrequency: 'daily',
          priority: 0.8,
          alternates: { languages: alternates },
        });
      }
    }
  } catch (err) {
    console.error('Sitemap Layer Error: Dynamic Category Generation failed', err);
  }

  // ── 5. Dynamic Store Profile Paths ──────────────────────────────────────────
  try {
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: 'SA' } } },
      },
      select: {
        updatedAt: true,
        isFeatured: true,
        translations: {
          where: { locale: { in: ['ar', 'en'] } },
          select: { slug: true, locale: true },
        },
      },
    }).catch(() => []);

    for (const store of stores) {
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        const translation = store.translations?.find(t => t.locale === lang);
        if (!translation?.slug) continue;
        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }
      if (validUrls.size === 0) continue;

      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified: safeDate(store.updatedAt),
          changeFrequency: 'daily',
          priority: store.isFeatured ? 0.85 : 0.75,
          alternates: { languages: alternates },
        });
      }
    }
  } catch (err) {
    console.error('Sitemap Layer Error: Dynamic Store Generation failed', err);
  }

  // ── 6. Seasonal Special Marketing Landing Targets ───────────────────────────
  try {
    const seasonal = await prisma.seasonalPage.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: 'SA' } } },
      },
      select: {
        slug: true,
        updatedAt: true,
        translations: {
          where: { locale: { in: ['ar', 'en'] } },
          select: { locale: true, title: true },
        },
      },
    }).catch(() => []);

    for (const sp of seasonal) {
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        const hasTranslation = sp.translations?.some(t => t.locale === lang && t.title);
        if (hasTranslation) {
          validUrls.set(locale, `${BASE_URL}/${locale}/seasonal/${sp.slug}`);
        }
      }
      if (validUrls.size === 0) continue;
      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified: safeDate(sp.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.75,
          alternates: { languages: alternates },
        });
      }
    }
  } catch (err) {
    console.error('Sitemap Layer Error: Seasonal Marketing Aggregator failed', err);
  }

  // ── 7. Blog Directory & Content Magazine ────────────────────────────────────
  try {
    const [latestPost, totalBlogPosts] = await Promise.all([
      prisma.blogPost.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }).catch(() => 0)
    ]);

    const blogDate = safeDate(latestPost?.updatedAt);
    const blogLastPage = Math.min(Math.ceil(totalBlogPosts / BLOG_PER_PAGE), BLOG_MAX_PAGE);
    for (let page = 1; page <= blogLastPage; page++) {
      const path = page === 1 ? '/blog' : `/blog?page=${page}`;
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: blogDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.85 : 0.55,
          alternates: { languages: coreAlternates(path) },
        });
      }
    }

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
    }).catch(() => []);

    for (const post of blogPosts) {
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        if (post.translations?.some(t => t.locale === lang)) {
          validUrls.set(locale, `${BASE_URL}/${locale}/blog/${post.slug}`);
        }
      }
      if (validUrls.size === 0) continue;
      
      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      const postUpdate = post.updatedAt ? new Date(post.updatedAt).getTime() : 0;
      const postPublish = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
      const latestDate = new Date(Math.max(postUpdate, postPublish, CURRENT_DATE.getTime()));

      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified: latestDate,
          changeFrequency: 'weekly',
          priority: post.isFeatured ? 0.8 : 0.7,
          alternates: { languages: alternates },
        });
      }
    }
  } catch (err) {
    console.error('Sitemap Layer Error: Blog Publishing Extraction failed', err);
  }

  // ── Final Sanitization, Resource Exclusions & Deduplication ────────────────
  const htmlPages = deduplicateEntries(urls).filter(entry => {
    const lower = entry.url.toLowerCase();
    if (lower.includes('/_next/')) return false;
    if (lower.includes('/store-covers/')) return false;
    if (lower.includes('/public/stores/')) return false;
    return !lower.match(/\.(avif|webp|png|jpg|jpeg|gif|svg|ico|json|js|css|woff2?|ttf|eot|xml|txt)$/);
  });

  // Global safety fallback array if database communication drops out entirely
  if (htmlPages.length === 0) {
    return LOCALES.map(locale => ({
      url: `${BASE_URL}/${locale}`,
      lastModified: CURRENT_DATE,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: { languages: coreAlternates() },
    }));
  }

  return htmlPages;
          }
