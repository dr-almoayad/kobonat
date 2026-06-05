import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
// ✅ Only Arabic – English pages are noindex, so exclude them from sitemap
const LOCALES = ['ar-SA'];

const COUPONS_PER_PAGE = 60;
const STACKS_PER_PAGE  = 12;
const BLOG_PER_PAGE    = 12;
const COUPONS_MAX_PAGE = 9;
const STACKS_MAX_PAGE  = 9;
const BLOG_MAX_PAGE    = 5;

export const revalidate = 3600;

// ── Helpers ────────────────────────────────────────────────────────────────
function buildAlternates(localeUrlMap) {
  if (!localeUrlMap || Object.keys(localeUrlMap).length === 0) return null;
  const xDefault = localeUrlMap['ar-SA'] || Object.values(localeUrlMap)[0];
  return { ...localeUrlMap, 'x-default': xDefault };
}

function coreAlternates(path = '') {
  const localeUrlMap = { 'ar-SA': `${BASE_URL}/ar-SA${path}` };
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

// ── Main Sitemap Generation ────────────────────────────────────────────────
export default async function sitemap() {
  const urls = [];
  const CURRENT_DATE = new Date();

  const safeDate = (dateVal) => {
    if (!dateVal) return CURRENT_DATE;
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? CURRENT_DATE : parsed;
  };

  try {
    const [latestVoucher, latestStore, latestPromo] = await Promise.all([
      prisma.voucher.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
      prisma.store.findFirst({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
      prisma.otherPromo.findFirst({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
    ]);

    const voucherDate = safeDate(latestVoucher?.updatedAt);
    const storeDate   = safeDate(latestStore?.updatedAt);
    const promoDate   = safeDate(latestPromo?.updatedAt);

    // Homepage
    urls.push({
      url: `${BASE_URL}/ar-SA`,
      lastModified: voucherDate,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: { languages: coreAlternates() },
    });

    // Stores listing
    urls.push({
      url: `${BASE_URL}/ar-SA/stores`,
      lastModified: storeDate,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: { languages: coreAlternates('/stores') },
    });

    // Categories listing
    urls.push({
      url: `${BASE_URL}/ar-SA/categories`,
      lastModified: storeDate,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages: coreAlternates('/categories') },
    });

    // Bank & payment offers
    urls.push({
      url: `${BASE_URL}/ar-SA/bank-and-payment-offers`,
      lastModified: promoDate,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: { languages: coreAlternates('/bank-and-payment-offers') },
    });

    // Static pages
    for (const page of STATIC_PAGES) {
      urls.push({
        url: `${BASE_URL}/ar-SA/${page.slug}`,
        lastModified: CURRENT_DATE,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: coreAlternates(`/${page.slug}`) },
      });
    }

    // Coupons paginated (max 9 pages)
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
      urls.push({
        url: `${BASE_URL}/ar-SA${path}`,
        lastModified: voucherDate,
        changeFrequency: page === 1 ? 'daily' : 'weekly',
        priority: page === 1 ? 0.9 : 0.6,
        alternates: { languages: coreAlternates(path) },
      });
    }

    // Stacks paginated (max 9 pages)
    const totalStacks = await prisma.offerStack.count({ where: { isActive: true, countries: { some: { country: { code: 'SA' } } } } }).catch(() => 0);
    const stacksLastPage = Math.min(Math.ceil(totalStacks / STACKS_PER_PAGE), STACKS_MAX_PAGE);
    for (let page = 1; page <= stacksLastPage; page++) {
      const path = page === 1 ? '/stacks' : `/stacks?page=${page}`;
      urls.push({
        url: `${BASE_URL}/ar-SA${path}`,
        lastModified: safeDate(latestVoucher?.updatedAt),
        changeFrequency: page === 1 ? 'daily' : 'weekly',
        priority: page === 1 ? 0.8 : 0.5,
        alternates: { languages: coreAlternates(path) },
      });
    }

    // Categories (dynamic)
    const categories = await prisma.category.findMany({
      where: {
        stores: {
          some: {
            store: {
              isActive: true,
              countries: { some: { country: { code: 'SA' } } },
            },
          },
        },
      },
      select: {
        updatedAt: true,
        translations: {
          where: { locale: 'ar' },
          select: { slug: true },
        },
      },
    }).catch(() => []);

    for (const cat of categories) {
      const translation = cat.translations?.[0];
      if (!translation?.slug) continue;
      const url = `${BASE_URL}/ar-SA/categories/${translation.slug}`;
      urls.push({
        url,
        lastModified: safeDate(cat.updatedAt),
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: { languages: coreAlternates(`/categories/${translation.slug}`) },
      });
    }

    // Stores (dynamic)
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: 'SA' } } },
      },
      select: {
        updatedAt: true,
        isFeatured: true,
        translations: {
          where: { locale: 'ar' },
          select: { slug: true },
        },
      },
    }).catch(() => []);

    for (const store of stores) {
      const translation = store.translations?.[0];
      if (!translation?.slug) continue;
      const url = `${BASE_URL}/ar-SA/stores/${translation.slug}`;
      urls.push({
        url,
        lastModified: safeDate(store.updatedAt),
        changeFrequency: 'daily',
        priority: store.isFeatured ? 0.85 : 0.75,
        alternates: { languages: coreAlternates(`/stores/${translation.slug}`) },
      });
    }

    // Seasonal pages
    const seasonal = await prisma.seasonalPage.findMany({
      where: {
        isActive: true,
        countries: { some: { country: { code: 'SA' } } },
      },
      select: {
        slug: true,
        updatedAt: true,
        translations: { where: { locale: 'ar' }, select: { title: true } },
      },
    }).catch(() => []);

    for (const sp of seasonal) {
      const hasTranslation = sp.translations?.some(t => t.title);
      if (!hasTranslation) continue;
      urls.push({
        url: `${BASE_URL}/ar-SA/seasonal/${sp.slug}`,
        lastModified: safeDate(sp.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.75,
        alternates: { languages: coreAlternates(`/seasonal/${sp.slug}`) },
      });
    }

    // Blog index (max 5 pages)
    const totalBlogPosts = await prisma.blogPost.count({ where: { status: 'PUBLISHED' } }).catch(() => 0);
    const blogLastPage = Math.min(Math.ceil(totalBlogPosts / BLOG_PER_PAGE), BLOG_MAX_PAGE);
    for (let page = 1; page <= blogLastPage; page++) {
      const path = page === 1 ? '/blog' : `/blog?page=${page}`;
      urls.push({
        url: `${BASE_URL}/ar-SA${path}`,
        lastModified: safeDate(latestVoucher?.updatedAt),
        changeFrequency: page === 1 ? 'daily' : 'weekly',
        priority: page === 1 ? 0.85 : 0.55,
        alternates: { languages: coreAlternates(path) },
      });
    }

    // Individual blog posts
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        isFeatured: true,
        publishedAt: true,
        updatedAt: true,
        translations: { select: { locale: true } },
      },
    }).catch(() => []);

    for (const post of blogPosts) {
      const hasArabic = post.translations?.some(t => t.locale === 'ar');
      if (!hasArabic) continue;
      const url = `${BASE_URL}/ar-SA/blog/${post.slug}`;
      const postUpdate = post.updatedAt ? new Date(post.updatedAt).getTime() : 0;
      const postPublish = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
      const latestDate = new Date(Math.max(postUpdate, postPublish, CURRENT_DATE.getTime()));
      urls.push({
        url,
        lastModified: latestDate,
        changeFrequency: 'weekly',
        priority: post.isFeatured ? 0.8 : 0.7,
        alternates: { languages: coreAlternates(`/blog/${post.slug}`) },
      });
    }
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Fallback to homepage only
    return [{
      url: `${BASE_URL}/ar-SA`,
      lastModified: CURRENT_DATE,
      changeFrequency: 'daily',
      priority: 1.0,
    }];
  }

  // Final sanitisation
  const filtered = deduplicateEntries(urls).filter(entry => {
    const lower = entry.url.toLowerCase();
    if (lower.includes('/_next/')) return false;
    if (lower.includes('/store-covers/')) return false;
    if (lower.includes('/public/stores/')) return false;
    return !lower.match(/\.(avif|webp|png|jpg|jpeg|gif|svg|ico|json|js|css|woff2?|ttf|eot|xml|txt)$/);
  });

  return filtered;
}
