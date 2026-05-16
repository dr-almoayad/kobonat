// app/sitemap.js
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES = ['ar-SA', 'en-SA']; // ✅ both

const COUPONS_PER_PAGE = 60;
const STACKS_PER_PAGE = 12;
const BLOG_PER_PAGE = 12;
const COUPONS_MAX_PAGE = 9;
const STACKS_MAX_PAGE = 9;
const BLOG_MAX_PAGE = 5;
const STATIC_LAST_MODIFIED = new Date('2026-05-16');

export const revalidate = 3600;

function getMostRecentDate(...dates) {
  const valid = dates.filter(d => d instanceof Date && !isNaN(d));
  return valid.length ? new Date(Math.max(...valid.map(d => d.getTime()))) : new Date();
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

export default async function sitemap() {
  const urls = [];

  try {
    const [
      latestVoucherUpdate,
      latestStoreUpdate,
      latestPostUpdate,
      latestPromoUpdate,
      totalVouchers,
      totalStacks,
      totalBlogPosts,
    ] = await Promise.all([
      prisma.voucher.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.store.findFirst({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.blogPost.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.otherPromo.findFirst({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.voucher.count({ where: { store: { isActive: true }, countries: { some: { country: { code: 'SA' } } }, OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] } }),
      prisma.offerStack.count({ where: { isActive: true } }),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const voucherDate = latestVoucherUpdate?.updatedAt || new Date();
    const storeDate = latestStoreUpdate?.updatedAt || new Date();
    const postDate = latestPostUpdate?.updatedAt || new Date();
    const promoDate = latestPromoUpdate?.updatedAt || new Date();

    // Homepages
    for (const locale of LOCALES) {
      urls.push({
        url: `${BASE_URL}/${locale}`,
        lastModified: voucherDate,
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: { languages: allAlternates() },
      });
    }

    // All-stores pages
    for (const locale of LOCALES) {
      urls.push({
        url: `${BASE_URL}/${locale}/stores`,
        lastModified: storeDate,
        changeFrequency: 'daily',
        priority: 0.9,
        alternates: { languages: allAlternates('/stores') },
      });
    }

    // Categories listing
    for (const locale of LOCALES) {
      urls.push({
        url: `${BASE_URL}/${locale}/categories`,
        lastModified: storeDate,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: allAlternates('/categories') },
      });
    }

    // Coupons paginated
    const couponsLastPage = Math.min(Math.ceil(totalVouchers / COUPONS_PER_PAGE), COUPONS_MAX_PAGE);
    for (let page = 1; page <= couponsLastPage; page++) {
      const path = page === 1 ? '/coupons' : `/coupons?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: voucherDate,
          changeFrequency: page === 1 ? 'hourly' : 'daily',
          priority: page === 1 ? 0.9 : 0.6,
          alternates: { languages: alternates },
        });
      }
    }

    // Stacks paginated
    const stacksLastPage = Math.min(Math.ceil(totalStacks / STACKS_PER_PAGE), STACKS_MAX_PAGE);
    for (let page = 1; page <= stacksLastPage; page++) {
      const path = page === 1 ? '/stacks' : `/stacks?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: storeDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.8 : 0.5,
          alternates: { languages: alternates },
        });
      }
    }

    // Bank & payment offers
    for (const locale of LOCALES) {
      urls.push({
        url: `${BASE_URL}/${locale}/bank-and-payment-offers`,
        lastModified: promoDate,
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: { languages: allAlternates('/bank-and-payment-offers') },
      });
    }

    // Static pages
    const staticPages = ['about', 'contact', 'privacy', 'terms', 'cookies', 'help'];
    for (const slug of staticPages) {
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}/${slug}`,
          lastModified: STATIC_LAST_MODIFIED,
          changeFrequency: slug === 'help' ? 'monthly' : 'yearly',
          priority: slug === 'help' ? 0.7 : 0.4,
          alternates: { languages: allAlternates(`/${slug}`) },
        });
      }
    }

    // Categories
    const categories = await prisma.category.findMany({
      include: { translations: true, stores: { where: { store: { isActive: true, countries: { some: { country: { code: 'SA' } } } } } } },
    });
    for (const cat of categories) {
      if (cat.stores.length === 0) continue;
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
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
          lastModified: cat.updatedAt,
          changeFrequency: 'daily',
          priority: 0.8,
          alternates: { languages: alternates },
        });
      }
    }

    // Stores
    const stores = await prisma.store.findMany({
      where: { isActive: true, countries: { some: { country: { code: 'SA' } } } },
      include: { translations: true },
    });
    // Pre-load category slugs to avoid collisions
    const catSlugsByLang = new Map();
    const allCatTrans = await prisma.categoryTranslation.findMany({ select: { slug: true, locale: true } });
    for (const ct of allCatTrans) {
      if (!catSlugsByLang.has(ct.locale)) catSlugsByLang.set(ct.locale, new Set());
      catSlugsByLang.get(ct.locale).add(ct.slug);
    }
    for (const store of stores) {
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
        const translation = store.translations.find(t => t.locale === lang);
        if (!translation?.slug) continue;
        const conflict = catSlugsByLang.get(lang)?.has(translation.slug);
        if (conflict) continue;
        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }
      if (validUrls.size === 0) continue;
      const alternates = buildAlternates(Object.fromEntries(validUrls.entries()));
      for (const [, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified: store.updatedAt,
          changeFrequency: 'daily',
          priority: store.isFeatured ? 0.85 : 0.75,
          alternates: { languages: alternates },
        });
      }
    }

    // Seasonal pages
    const seasonal = await prisma.seasonalPage.findMany({
      where: { isActive: true, countries: { some: { country: { code: 'SA' } } } },
      include: { translations: true },
    });
    for (const sp of seasonal) {
      const validUrls = new Map();
      for (const locale of LOCALES) {
        const [lang] = locale.split('-');
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
          lastModified: sp.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.75,
          alternates: { languages: alternates },
        });
      }
    }

    // Blog index pages
    const blogLastPage = Math.min(Math.ceil(totalBlogPosts / BLOG_PER_PAGE), BLOG_MAX_PAGE);
    for (let page = 1; page <= blogLastPage; page++) {
      const path = page === 1 ? '/blog' : `/blog?page=${page}`;
      const alternates = buildAlternates(
        Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]))
      );
      for (const locale of LOCALES) {
        urls.push({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified: postDate,
          changeFrequency: page === 1 ? 'daily' : 'weekly',
          priority: page === 1 ? 0.85 : 0.55,
          alternates: { languages: alternates },
        });
      }
    }

    // Individual blog posts
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, isFeatured: true, publishedAt: true, updatedAt: true, translations: { select: { locale: true } } },
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
          lastModified: getMostRecentDate(post.updatedAt, post.publishedAt),
          changeFrequency: 'weekly',
          priority: post.isFeatured ? 0.8 : 0.7,
          alternates: { languages: alternates },
        });
      }
    }

    // Defensive filter: remove asset URLs
    const filtered = deduplicateEntries(urls).filter(entry => {
      const lower = entry.url.toLowerCase();
      if (lower.includes('/_next/')) return false;
      if (lower.includes('/store-covers/')) return false;
      if (lower.includes('/public/stores/')) return false;
      if (lower.match(/\.(avif|webp|png|jpg|jpeg|gif|svg|ico|json|js|css|woff2?|ttf|eot|xml|txt)$/)) return false;
      return true;
    });

    console.log(`✅ Sitemap: ${filtered.length} unique entries`);
    return filtered;
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [{
      url: `${BASE_URL}/ar-SA`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    }];
  }
}
