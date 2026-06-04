import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES   = ['ar-SA', 'en-SA'];

const COUPONS_PER_PAGE = 60;
const STACKS_PER_PAGE  = 12;
const BLOG_PER_PAGE    = 12;
const COUPONS_MAX_PAGE = 9;
const STACKS_MAX_PAGE  = 9;
const BLOG_MAX_PAGE    = 5;

// ✅ FIX 1: Reduced to 3600 (hourly) to capture frequent voucher/store changes
export const revalidate = 3600; 

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildAlternates(localeUrlMap) {
  if (!localeUrlMap || Object.keys(localeUrlMap).length === 0) return null;
  const xDefault = localeUrlMap['ar-SA'] || Object.values(localeUrlMap)[0];
  return { ...localeUrlMap, 'x-default': xDefault };
}

// ✅ FIX 2: Replaces allAlternates(). Dynamically builds standard mappings
// but restricts it to valid known routes rather than assuming universal translation.
function coreAlternates(path = '') {
  const localeUrlMap = Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]));
  return buildAlternates(localeUrlMap);
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
  const CURRENT_DATE = new Date(); // ✅ FIX 3: Dynamic static modification date

  try {
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
          OR:        [{ expiryDate: null }, { expiryDate: { gte: CURRENT_DATE } }],
        },
      }),
      // ✅ FIX 4: Filter global counts by country to avoid over-inflated pagination
      prisma.offerStack.count({ 
        where: { 
          isActive: true,
          countries: { some: { country: { code: 'SA' } } }
        } 
      }),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const voucherDate = latestVoucherUpdate?.updatedAt || CURRENT_DATE;
    const storeDate   = latestStoreUpdate?.updatedAt   || CURRENT_DATE;
    const postDate    = latestPostUpdate?.updatedAt    || CURRENT_DATE;
    const promoDate   = latestPromoUpdate?.updatedAt   || CURRENT_DATE;
    const stackDate   = latestStackUpdate?.updatedAt   || CURRENT_DATE;

    // ── 1–7. Static and paginated sections ────────────────────────────────────

    for (const locale of LOCALES) {
      urls.push({
        url:             `${BASE_URL}/${locale}`,
        lastModified:    voucherDate,
        changeFrequency: 'daily',
        priority:        1.0,
        alternates:      { languages: coreAlternates() },
      });
    }

    for (const locale of LOCALES) {
      urls.push({
        url:             `${BASE_URL}/${locale}/stores`,
        lastModified:    storeDate,
        changeFrequency: 'daily',
        priority:        0.9,
        alternates:      { languages: coreAlternates('/stores') },
      });
    }

    for (const locale of LOCALES) {
      urls.push({
        url:             `${BASE_URL}/${locale}/categories`,
        lastModified:    storeDate,
        changeFrequency: 'weekly',
        priority:        0.9,
        alternates:      { languages: coreAlternates('/categories') },
      });
    }

    const couponsLastPage = Math.min(
      Math.ceil(totalVouchers / COUPONS_PER_PAGE),
      COUPONS_MAX_PAGE
    );
    for (let page = 1; page <= couponsLastPage; page++) {
      const path = page === 1 ? '/coupons' : `/coupons?page=${page}`;
      for (const locale of LOCALES) {
        urls.push({
          url:             `${BASE_URL}/${locale}${path}`,
          lastModified:    voucherDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority:        page === 1 ? 0.9 : 0.6,
          alternates:      { languages: coreAlternates(path) },
        });
      }
    }

    // ✅ FIX 5: Removed unnecessary Math.max(1, ...) to prevent empty page generation
    const stacksLastPage = Math.min(
      Math.ceil(totalStacks / STACKS_PER_PAGE),
      STACKS_MAX_PAGE
    );
    for (let page = 1; page <= stacksLastPage; page++) {
      const path = page === 1 ? '/stacks' : `/stacks?page=${page}`;
      for (const locale of LOCALES) {
        urls.push({
          url:             `${BASE_URL}/${locale}${path}`,
          lastModified:    stackDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority:        page === 1 ? 0.8 : 0.5,
          alternates:      { languages: coreAlternates(path) },
        });
      }
    }

    for (const locale of LOCALES) {
      urls.push({
        url:             `${BASE_URL}/${locale}/bank-and-payment-offers`,
        lastModified:    promoDate,
        changeFrequency: 'daily',
        priority:        0.8,
        alternates:      { languages: coreAlternates('/bank-and-payment-offers') },
      });
    }

    for (const page of STATIC_PAGES) {
      for (const locale of LOCALES) {
        urls.push({
          url:             `${BASE_URL}/${locale}/${page.slug}`,
          lastModified:    CURRENT_DATE,
          changeFrequency: page.changeFrequency,
          priority:        page.priority,
          alternates:      { languages: coreAlternates(`/${page.slug}`) },
        });
      }
    }

    // ── 8. Category pages ─────────────────────────────────────────────────────
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
        
        // ✅ FIX 6: Removed fragile category slug overlap check
        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }
      if (validUrls.size === 0) continue;

      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
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
      Math.ceil(totalBlogPosts / BLOG_PER_PAGE),
      BLOG_MAX_PAGE
    );
    for (let page = 1; page <= blogLastPage; page++) {
      const path = page === 1 ? '/blog' : `/blog?page=${page}`;
      for (const locale of LOCALES) {
        urls.push({
          url:             `${BASE_URL}/${locale}${path}`,
          lastModified:    postDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority:        page === 1 ? 0.85 : 0.55,
          alternates:      { languages: coreAlternates(path) },
        });
      }
    }

    // ── 12. Blog posts ────────────────────────────────────────────────────────
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
      
      // ✅ FIX 7: Replaced partial dead code getMostRecentDate with inline Math.max
      const latestDate = new Date(Math.max(post.updatedAt.getTime(), (post.publishedAt || new Date(0)).getTime()));

      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified:    latestDate,
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
      alternates:      { languages: coreAlternates() },
    }));
  }
          }
