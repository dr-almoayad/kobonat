// app/sitemap.js
// FULLY CORRECTED VERSION
// Changes:
// 1. Store inclusion now checks ALL content types: vouchers, FAQs, promos, products, description.
// 2. Prisma query for stores includes _count for FAQs, promos, products.
// 3. Filtering logic matches the "hasSubstantialContent" used in generateMetadata.
// 4. No other changes – pagination, alternates, static pages remain the same.

import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES = ['ar-SA', 'en-SA'];

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
  const map = Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]));
  return buildAlternates(map);
}

function slugAlternates(arSlug, enSlug, prefix = '') {
  const map = {};
  if (arSlug) map['ar-SA'] = `${BASE_URL}/ar-SA${prefix}/${arSlug}`;
  if (enSlug) map['en-SA'] = `${BASE_URL}/en-SA${prefix}/${enSlug}`;
  return buildAlternates(map);
}

function safeDate(date) {
  if (!date) return new Date().toISOString();
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
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

// ── Main ───────────────────────────────────────────────────────────────────
export default async function sitemap() {
  const urls = [];
  const NOW = new Date();

  try {
    const [
      latestVoucher,
      latestStore,
      latestPromo,
      totalVouchers,
      totalStacks,
      totalBlogPosts,
      categories,
      stores,
      seasonal,
      blogPosts,
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
      prisma.otherPromo.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.voucher.count({
        where: {
          store: { isActive: true },
          countries: { some: { country: { code: 'SA' } } },
          OR: [{ expiryDate: null }, { expiryDate: { gte: NOW } }],
        },
      }),
      prisma.offerStack.count({
        where: {
          isActive: true,
          store: { countries: { some: { country: { code: 'SA' } } } },
        },
      }),
      prisma.blogPost.count({
        where: { status: 'PUBLISHED' },
      }),
      prisma.category.findMany({
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
            where: { locale: { in: ['ar', 'en'] } },
            select: { slug: true, locale: true },
          },
        },
      }),
      // ── ✅ Expanded store query to include all content counts ──
      prisma.store.findMany({
        where: {
          isActive: true,
          countries: { some: { country: { code: 'SA' } } },
        },
        select: {
          id: true,
          updatedAt: true,
          isFeatured: true,
          translations: {
            where: { locale: { in: ['ar', 'en'] } },
            select: { slug: true, locale: true, description: true },
          },
          _count: {
            select: {
              vouchers: {
                where: {
                  OR: [{ expiryDate: null }, { expiryDate: { gte: NOW } }],
                },
              },
              faqs: {
                where: { isActive: true },
              },
              otherPromos: {
                where: { isActive: true },
              },
              products: true,
            },
          },
        },
      }),
      prisma.seasonalPage.findMany({
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
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          slug: true,
          isFeatured: true,
          publishedAt: true,
          updatedAt: true,
          translations: { select: { locale: true } },
        },
      }),
    ]);

    const voucherDate = safeDate(latestVoucher?.updatedAt);
    const storeDate   = safeDate(latestStore?.updatedAt);
    const promoDate   = safeDate(latestPromo?.updatedAt);

    // ── 1. Homepages ───────────────────────────────────────────────────────
    for (const locale of LOCALES) {
      urls.push({
        url: `${BASE_URL}/${locale}`,
        lastModified: voucherDate,
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: { languages: coreAlternates() },
      });
    }

    // ── 2. Stores listing ──────────────────────────────────────────────────
    for (const locale of LOCALES) {
      urls.push({
        url: `${BASE_URL}/${locale}/stores`,
        lastModified: storeDate,
        changeFrequency: 'daily',
        priority: 0.9,
        alternates: { languages: coreAlternates('/stores') },
      });
    }

    // ── 3. Categories listing ──────────────────────────────────────────────
    for (const locale of LOCALES) {
      urls.push({
        url: `${BASE_URL}/${locale}/categories`,
        lastModified: storeDate,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: coreAlternates('/categories') },
      });
    }

    // ── 4. Bank & payment offers ───────────────────────────────────────────
    for (const locale of LOCALES) {
      urls.push({
        url: `${BASE_URL}/${locale}/bank-and-payment-offers`,
        lastModified: promoDate,
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: { languages: coreAlternates('/bank-and-payment-offers') },
      });
    }

    // ── 5. Static pages ────────────────────────────────────────────────────
    for (const page of STATIC_PAGES) {
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}/${page.slug}`,
          lastModified: NOW.toISOString(),
          changeFrequency: page.changeFrequency,
          priority: page.priority,
          alternates: { languages: coreAlternates(`/${page.slug}`) },
        });
      }
    }

    // ── 6. Coupons paginated ───────────────────────────────────────────────
    const couponsLastPage = Math.min(Math.ceil(totalVouchers / COUPONS_PER_PAGE), COUPONS_MAX_PAGE);
    for (let page = 1; page <= couponsLastPage; page++) {
      const path = page === 1 ? '/coupons' : `/coupons?page=${page}`;
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: voucherDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.9 : 0.6,
          alternates: { languages: coreAlternates(path) },
        });
      }
    }

    // ── 7. Stacks paginated ────────────────────────────────────────────────
    const stacksLastPage = Math.min(Math.ceil(totalStacks / STACKS_PER_PAGE), STACKS_MAX_PAGE);
    for (let page = 1; page <= stacksLastPage; page++) {
      const path = page === 1 ? '/stacks' : `/stacks?page=${page}`;
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: voucherDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.8 : 0.5,
          alternates: { languages: coreAlternates(path) },
        });
      }
    }

    // ── 8. Category pages ──────────────────────────────────────────────────
    for (const cat of categories) {
      const arSlug = cat.translations?.find(t => t.locale === 'ar')?.slug;
      const enSlug = cat.translations?.find(t => t.locale === 'en')?.slug;
      const alternates = slugAlternates(arSlug, enSlug, '/categories');
      if (arSlug) {
        urls.push({
          url: `${BASE_URL}/ar-SA/categories/${arSlug}`,
          lastModified: safeDate(cat.updatedAt),
          changeFrequency: 'daily',
          priority: 0.8,
          alternates: { languages: alternates },
        });
      }
      if (enSlug) {
        urls.push({
          url: `${BASE_URL}/en-SA/categories/${enSlug}`,
          lastModified: safeDate(cat.updatedAt),
          changeFrequency: 'daily',
          priority: 0.8,
          alternates: { languages: alternates },
        });
      }
    }

    // ── 9. Store pages (using the expanded content check) ─────────────────
    for (const store of stores) {
      const arTranslation = store.translations?.find(t => t.locale === 'ar');
      const enTranslation = store.translations?.find(t => t.locale === 'en');
      
      const arSlug = arTranslation?.slug;
      const enSlug = enTranslation?.slug;
      
      const alternates = slugAlternates(arSlug, enSlug, '/stores');
      const lastModified = safeDate(store.updatedAt);

      // ── ✅ Check ALL content types before adding to sitemap ──
      const activeVouchers = store._count?.vouchers || 0;
      const faqCount       = store._count?.faqs || 0;
      const promoCount     = store._count?.otherPromos || 0;
      const productCount   = store._count?.products || 0;
      const hasArDescription = !!arTranslation?.description?.trim();
      const hasEnDescription = !!enTranslation?.description?.trim();

      const hasArSubstantial = activeVouchers > 0 || faqCount > 0 || promoCount > 0 || productCount > 0 || hasArDescription;
      const hasEnSubstantial = activeVouchers > 0 || faqCount > 0 || promoCount > 0 || productCount > 0 || hasEnDescription;

      if (arSlug && hasArSubstantial) {
        urls.push({
          url: `${BASE_URL}/ar-SA/stores/${arSlug}`,
          lastModified,
          changeFrequency: 'daily',
          priority: store.isFeatured ? 0.85 : 0.75,
          alternates: { languages: alternates },
        });
      }

      if (enSlug && hasEnSubstantial) {
        urls.push({
          url: `${BASE_URL}/en-SA/stores/${enSlug}`,
          lastModified,
          changeFrequency: 'daily',
          priority: store.isFeatured ? 0.85 : 0.75,
          alternates: { languages: alternates },
        });
      }
    }

    // ── 10. Seasonal pages ─────────────────────────────────────────────────
    for (const sp of seasonal) {
      const arTitle = sp.translations?.find(t => t.locale === 'ar')?.title;
      const enTitle = sp.translations?.find(t => t.locale === 'en')?.title;
      if (arTitle) {
        urls.push({
          url: `${BASE_URL}/ar-SA/seasonal/${sp.slug}`,
          lastModified: safeDate(sp.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.75,
          alternates: { languages: slugAlternates(sp.slug, enTitle ? sp.slug : null, '/seasonal') },
        });
      }
      if (enTitle) {
        urls.push({
          url: `${BASE_URL}/en-SA/seasonal/${sp.slug}`,
          lastModified: safeDate(sp.updatedAt),
          changeFrequency: 'weekly',
          priority: 0.75,
          alternates: { languages: slugAlternates(arTitle ? sp.slug : null, sp.slug, '/seasonal') },
        });
      }
    }

    // ── 11. Blog index ─────────────────────────────────────────────────────
    const blogLastPage = Math.min(Math.ceil(totalBlogPosts / BLOG_PER_PAGE), BLOG_MAX_PAGE);
    for (let page = 1; page <= blogLastPage; page++) {
      const path = page === 1 ? '/blog' : `/blog?page=${page}`;
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: voucherDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.85 : 0.55,
          alternates: { languages: coreAlternates(path) },
        });
      }
    }

    // ── 12. Blog posts ─────────────────────────────────────────────────────
    for (const post of blogPosts) {
      const hasAr = post.translations?.some(t => t.locale === 'ar');
      const hasEn = post.translations?.some(t => t.locale === 'en');
      const lastModified = safeDate(post.updatedAt || post.publishedAt);
      if (hasAr) {
        urls.push({
          url: `${BASE_URL}/ar-SA/blog/${post.slug}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: post.isFeatured ? 0.8 : 0.7,
          alternates: { languages: slugAlternates(post.slug, hasEn ? post.slug : null, '/blog') },
        });
      }
      if (hasEn) {
        urls.push({
          url: `${BASE_URL}/en-SA/blog/${post.slug}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: post.isFeatured ? 0.8 : 0.7,
          alternates: { languages: slugAlternates(hasAr ? post.slug : null, post.slug, '/blog') },
        });
      }
    }

    // ── Sanitise ───────────────────────────────────────────────────────────
    return deduplicateEntries(urls).filter(entry => {
      const lower = entry.url.toLowerCase();
      if (lower.includes('/_next/')) return false;
      if (lower.includes('/store-covers/')) return false;
      if (lower.includes('/public/stores/')) return false;
      return !lower.match(/\.(avif|webp|png|jpg|jpeg|gif|svg|ico|json|js|css|woff2?|ttf|eot|xml|txt)$/);
    });

  } catch (error) {
    console.error('[sitemap] generation error:', error);
    throw new Error(`Sitemap generation failed: ${error.message}`);
  }
}
