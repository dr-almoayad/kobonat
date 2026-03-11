// app/sitemap.js
// ─────────────────────────────────────────────────────────────────────────────
// Sections:
//  1. Homepage
//  2. All-stores page
//  3. Coupons page
//  4. Static pages
//  5. Category (store-category) pages
//  6. Individual store pages
//  7. Blog index page             ← NEW
//  8. Blog category filter pages  ← NEW
//  9. Individual blog post pages  ← NEW
// 10. [commented] Individual coupon/voucher pages
// ─────────────────────────────────────────────────────────────────────────────
import { prisma } from '@/lib/prisma';
import { allLocaleCodes } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LOCALES   = allLocaleCodes;

function getMostRecentDate(...dates) {
  const valid = dates.filter(d => d instanceof Date && !isNaN(d));
  return valid.length > 0 ? new Date(Math.max(...valid.map(d => d.getTime()))) : new Date();
}

/** Build the full alternates map for a path that exists in every locale */
function allAlternates(path = '') {
  return Object.fromEntries(LOCALES.map(loc => [loc, `${BASE_URL}/${loc}${path}`]));
}

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
    // 3. COUPONS PAGE
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
    // =========================================================================
    const categories = await prisma.category.findMany({
      include: {
        translations: true,
        stores: {
          where: { store: { isActive: true } },
          include: { store: { select: { updatedAt: true } } },
        },
      },
    });

    for (const category of categories) {
      if (category.stores.length === 0) continue;

      const storeUpdates = category.stores.map(s => s.store.updatedAt);
      const lastModified = getMostRecentDate(category.updatedAt, ...storeUpdates);
      const validUrls    = new Map();

      for (const locale of LOCALES) {
        const [language] = locale.split('-');
        const translation = category.translations.find(t => t.locale === language);
        if (translation?.slug) {
          validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
        }
      }

      if (validUrls.size === 0) continue;

      for (const [locale, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified,
          changeFrequency: 'daily',
          priority:        0.8,
          alternates: { languages: Object.fromEntries(validUrls.entries()) },
        });
      }
    }

    // =========================================================================
    // 6. INDIVIDUAL STORE PAGES
    // =========================================================================
    const stores = await prisma.store.findMany({
      where:   { isActive: true },
      include: {
        translations: true,
        countries:    { include: { country: true } },
        vouchers: {
          where: { OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
          orderBy: { updatedAt: 'desc' },
          take:    1,
          select:  { updatedAt: true },
        },
      },
    });

    for (const store of stores) {
      const countryCodes = store.countries.map(sc => sc.country.code);
      const lastModified = getMostRecentDate(store.updatedAt, store.vouchers[0]?.updatedAt);
      const validUrls    = new Map();

      for (const locale of LOCALES) {
        const [language, region] = locale.split('-');
        if (!countryCodes.includes(region)) continue;

        const translation = store.translations.find(t => t.locale === language);
        if (!translation?.slug) continue;

        validUrls.set(locale, `${BASE_URL}/${locale}/stores/${translation.slug}`);
      }

      if (validUrls.size === 0) continue;

      for (const [locale, url] of validUrls.entries()) {
        urls.push({
          url,
          lastModified,
          changeFrequency: 'hourly',
          priority:        store.isFeatured ? 0.85 : 0.75,
          alternates: { languages: Object.fromEntries(validUrls.entries()) },
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
    // 8. BLOG CATEGORY FILTER PAGES  (/locale/blog?category=slug)
    //    These use query-string URLs, not path segments.
    //    Google indexes query-param URLs when they're canonicalized correctly.
    //    We include them so Googlebot knows they exist, but at lower priority.
    // =========================================================================
    const blogCategories = await prisma.blogCategory.findMany({
      include: {
        translations: true,
        // Only include categories that have at least one published post
        _count: { select: { posts: { where: { status: 'PUBLISHED' } } } },
      },
    });

    for (const cat of blogCategories) {
      if (cat._count.posts === 0) continue;

      // Same slug for all locales — only the UI label differs
      LOCALES.forEach(locale => {
        urls.push({
          url:             `${BASE_URL}/${locale}/blog?category=${cat.slug}`,
          lastModified:    cat.updatedAt,
          changeFrequency: 'weekly',
          priority:        0.6,
          alternates: {
            languages: Object.fromEntries(
              LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/blog?category=${cat.slug}`])
            ),
          },
        });
      });
    }

    // =========================================================================
    // 9. INDIVIDUAL BLOG POST PAGES
    //    - Both locale variants share the same slug.
    //    - lastModified: use updatedAt so Google re-crawls edited posts.
    //    - priority: featured posts get 0.8, regular posts 0.7.
    //    - changeFrequency: 'weekly' — posts are edited less often than stores.
    // =========================================================================
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
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

      // Both locale variants of a post are alternate versions of each other
      const postAlternates = Object.fromEntries(
        LOCALES.map(loc => [loc, `${BASE_URL}/${loc}/blog/${post.slug}`])
      );

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

    // Minimal fallback so the site is never crawled without a sitemap
    return LOCALES.map(locale => ({
      url:             `${BASE_URL}/${locale}`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1.0,
    }));
  }
}
