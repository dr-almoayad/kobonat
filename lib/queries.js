// lib/queries.js
// Shared query helpers used across the codebase.
// Uses the singleton PrismaClient from lib/prisma.js.
//
// Previous version referenced prisma.product, prisma.wishlist, prisma.priceAlert —
// none of these models exist in schema.prisma. Every call threw at runtime.
// This version is aligned to the actual schema.

import { prisma } from '@/lib/prisma';

// ============================================================================
// STORES
// ============================================================================

/**
 * Find a store by its localised slug and country.
 * Returns null if not found or inactive.
 */
export async function getStoreBySlug(slug, language, countryCode) {
  const decodedSlug = decodeURIComponent(slug);
  return prisma.store.findFirst({
    where: {
      isActive: true,
      translations: { some: { slug: decodedSlug, locale: language } },
      countries:    { some: { country: { code: countryCode, isActive: true } } },
    },
    include: {
      translations: { where: { locale: language } },
      categories: {
        include: {
          category: { include: { translations: { where: { locale: language } } } },
        },
      },
      countries: {
        where:   { country: { code: countryCode } },
        include: { country: { include: { translations: { where: { locale: language } } } } },
      },
    },
  });
}

/**
 * Get all active stores for a country, ordered featured-first.
 * Optionally filter by categoryId or cap the result set.
 */
export async function getActiveStores({ language, countryCode, categoryId = null, limit = null }) {
  const where = {
    isActive:  true,
    countries: { some: { country: { code: countryCode, isActive: true } } },
    ...(categoryId && { categories: { some: { categoryId } } }),
  };

  const stores = await prisma.store.findMany({
    where,
    include: {
      translations: { where: { locale: language } },
      categories: {
        include: {
          category: { include: { translations: { where: { locale: language } } } },
        },
      },
      _count: {
        select: {
          vouchers: {
            where: {
              OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
              countries: { some: { country: { code: countryCode } } },
            },
          },
        },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
    ...(limit && { take: limit }),
  });

  return stores.map(store => {
    const t = store.translations[0] || {};
    const categories = [];
    const seen = new Set();
    for (const sc of store.categories || []) {
      if (sc.category && !seen.has(sc.category.id)) {
        seen.add(sc.category.id);
        const ct = sc.category.translations[0] || {};
        categories.push({
          id:    sc.category.id,
          name:  ct.name  || '',
          slug:  ct.slug  || '',
          icon:  sc.category.icon,
          color: sc.category.color,
        });
      }
    }
    return {
      ...store,
      name:                t.name        || '',
      slug:                t.slug        || '',
      description:         t.description || null,
      showOffer:           t.showOffer   || null,
      categories,
      activeVouchersCount: store._count.vouchers,
      translations:        undefined,
    };
  });
}

/**
 * Get stores in the same categories as a given store, excluding itself.
 * Used for the "Similar stores" section on store pages.
 */
export async function getRelatedStores({ storeId, categoryIds, countryCode, language, limit = 6 }) {
  if (!categoryIds?.length) return [];

  const stores = await prisma.store.findMany({
    where: {
      id:         { not: storeId },
      isActive:   true,
      countries:  { some: { country: { code: countryCode } } },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    include: {
      translations: { where: { locale: language } },
      _count: {
        select: {
          vouchers: {
            where: {
              OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
              countries: { some: { country: { code: countryCode } } },
            },
          },
        },
      },
    },
    orderBy: { isFeatured: 'desc' },
    take: limit,
  });

  return stores.map(s => ({
    ...s,
    name:        s.translations[0]?.name        || '',
    slug:        s.translations[0]?.slug        || '',
    description: s.translations[0]?.description || null,
    showOffer:   s.translations[0]?.showOffer   || null,
    translations: undefined,
  }));
}

// ============================================================================
// VOUCHERS
// ============================================================================

/**
 * Get active vouchers for a store in a specific country.
 */
export async function getActiveVouchersForStore({ storeId, countryCode, language, limit = 100 }) {
  const vouchers = await prisma.voucher.findMany({
    where: {
      storeId,
      countries: { some: { country: { code: countryCode } } },
      OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
    },
    include: {
      translations: { where: { locale: language } },
      _count: { select: { clicks: true } },
    },
    orderBy: [
      { isExclusive:     'desc' },
      { isVerified:      'desc' },
      { popularityScore: 'desc' },
    ],
    take: limit,
  });

  return vouchers.map(v => ({
    ...v,
    title:        v.translations[0]?.title       || '',
    description:  v.translations[0]?.description || null,
    translations: undefined,
  }));
}

/**
 * Get paginated vouchers for a country with optional category filter.
 * Used by the coupons listing page.
 */
export async function getVouchersForCountry({ countryCode, language, categoryId = null, page = 1, limit = 60 }) {
  const where = {
    store:     { isActive: true },
    countries: { some: { country: { code: countryCode } } },
    OR:        [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
    ...(categoryId && {
      store: { categories: { some: { categoryId } } },
    }),
  };

  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      include: {
        translations: { where: { locale: language } },
        store: {
          include: {
            translations: { where: { locale: language }, select: { name: true, slug: true } },
          },
        },
        _count: { select: { clicks: true } },
      },
      orderBy: [
        { isExclusive:     'desc' },
        { popularityScore: 'desc' },
        { createdAt:       'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.voucher.count({ where }),
  ]);

  const transformed = vouchers.map(v => {
    const vt = v.translations[0]        || {};
    const st = v.store?.translations[0] || {};
    return {
      ...v,
      title:        vt.title       || '',
      description:  vt.description || null,
      store: v.store
        ? { ...v.store, name: st.name || '', slug: st.slug || '', translations: undefined }
        : null,
      translations: undefined,
    };
  });

  return { vouchers: transformed, total, pages: Math.ceil(total / limit) };
}

/**
 * Record a voucher click and increment the popularity score.
 * Accepts the raw Next.js Request object to extract IP / UA / referrer.
 */
export async function trackVoucherClick(voucherId, countryCode, request) {
  const ip        = request?.headers?.get('x-forwarded-for') ?? request?.headers?.get('x-real-ip') ?? 'unknown';
  const userAgent = request?.headers?.get('user-agent') ?? '';
  const referrer  = request?.headers?.get('referer')    ?? '';

  const { createHash } = await import('crypto');
  const ipHash = createHash('sha256').update(ip).digest('hex').substring(0, 16);

  let countryId = null;
  if (countryCode) {
    const country = await prisma.country.findUnique({ where: { code: countryCode }, select: { id: true } });
    countryId = country?.id ?? null;
  }

  await Promise.all([
    prisma.voucherClick.create({
      data: {
        voucherId: parseInt(voucherId),
        ipHash,
        userAgent: userAgent.substring(0, 255),
        referrer:  referrer.substring(0, 500),
        countryId,
        clickedAt: new Date(),
      },
    }),
    prisma.voucher.update({
      where: { id: parseInt(voucherId) },
      data:  { popularityScore: { increment: 1 } },
    }),
  ]);
}

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Find a category translation by slug and locale.
 * Returns the translation joined with its parent category.
 */
export async function getCategoryBySlug(slug, language) {
  const decodedSlug = decodeURIComponent(slug);
  return prisma.categoryTranslation.findFirst({
    where: { slug: decodedSlug, locale: language },
    include: {
      category: { include: { translations: true } },
    },
  });
}

/**
 * Get all categories that have at least one active store in a country.
 */
export async function getCategoriesForCountry(language, countryCode) {
  const categories = await prisma.category.findMany({
    where: {
      stores: {
        some: {
          store: {
            isActive:  true,
            countries: { some: { country: { code: countryCode, isActive: true } } },
          },
        },
      },
    },
    include: {
      translations: { where: { locale: language } },
      _count: {
        select: {
          stores: {
            where: {
              store: {
                isActive:  true,
                countries: { some: { country: { code: countryCode } } },
              },
            },
          },
        },
      },
    },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });

  return categories
    .filter(c => c.translations.length > 0)
    .map(c => ({
      id:          c.id,
      name:        c.translations[0]?.name        || '',
      slug:        c.translations[0]?.slug        || '',
      description: c.translations[0]?.description || null,
      icon:        c.icon,
      image:       c.image,
      color:       c.color,
      storeCount:  c._count.stores,
    }))
    .filter(c => c.name && c.slug && c.storeCount > 0);
}

// ============================================================================
// COUNTRIES
// ============================================================================

/**
 * Get a single country record with its translation.
 * Returns null if inactive or not found.
 */
export async function getCountryByCode(code, language) {
  return prisma.country.findUnique({
    where:   { code, isActive: true },
    include: { translations: { where: { locale: language } } },
  });
}

/**
 * Get all active countries with translations, default country first.
 */
export async function getAllCountries(language) {
  const countries = await prisma.country.findMany({
    where:   { isActive: true },
    include: { translations: { where: { locale: language } } },
    orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
  });

  return countries.map(c => ({
    id:        c.id,
    code:      c.code,
    name:      c.translations[0]?.name || c.code,
    currency:  c.currency,
    flag:      c.flag,
    isDefault: c.isDefault,
  }));
}

// ============================================================================
// FAQs
// ============================================================================

/**
 * Get active FAQs for a store in a specific country, ordered by position.
 */
export async function getStoreFAQs(storeId, countryId, language) {
  const faqs = await prisma.storeFAQ.findMany({
    where:   { storeId, countryId, isActive: true },
    include: { translations: { where: { locale: language } } },
    orderBy: { order: 'asc' },
  });

  return faqs
    .map(f => ({
      id:       f.id,
      question: f.translations[0]?.question || '',
      answer:   f.translations[0]?.answer   || '',
      order:    f.order,
    }))
    .filter(f => f.question && f.answer);
}

// ============================================================================
// BANK & PAYMENT OFFERS
// ============================================================================

/**
 * Get active OtherPromo records for a store in a country.
 * Used by the store page and OtherPromosSection component.
 */
export async function getOtherPromosForStore(storeId, countryId, language) {
  const promos = await prisma.otherPromo.findMany({
    where: {
      storeId,
      countryId,
      isActive: true,
      OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
    },
    include: {
      translations:  { where: { locale: language } },
      bank:          { include: { translations: { where: { locale: language } } } },
      paymentMethod: { include: { translations: { where: { locale: language } } } },
      card:          true,
    },
    orderBy: { order: 'asc' },
  });

  return promos.map(p => ({
    id:                 p.id,
    type:               p.type,
    image:              p.image,
    url:                p.url,
    startDate:          p.startDate,
    expiryDate:         p.expiryDate,
    discountPercent:    p.discountPercent    ?? null,
    verifiedAvgPercent: p.verifiedAvgPercent ?? null,
    voucherCode:        p.voucherCode        ?? null,
    title:              p.translations[0]?.title       || '',
    description:        p.translations[0]?.description || null,
    terms:              p.translations[0]?.terms       || null,
    bank: p.bank ? {
      name: p.bank.translations[0]?.name || '',
      logo: p.bank.logo,
    } : null,
    paymentMethod: p.paymentMethod ? {
      name:   p.paymentMethod.translations[0]?.name || '',
      logo:   p.paymentMethod.logo,
      type:   p.paymentMethod.type,
      isBnpl: p.paymentMethod.isBnpl,
    } : null,
    card: p.card ?? null,
  }));
}

// ============================================================================
// BLOG
// ============================================================================

/**
 * Get published blog posts for a store, ranked by explicit link then tag overlap.
 * Used by RelatedBlogPosts and RelatedPostsSidebar components.
 */
export async function getStoreRelatedPosts(storeId, language, limit = 6) {
  const include = {
    translations: { where: { locale: language } },
    author:       true,
    category:     { include: { translations: { where: { locale: language } } } },
    tags: {
      include: { tag: { include: { translations: { where: { locale: language } } } } },
    },
  };

  // 1. Posts explicitly linked to this store
  const explicit = await prisma.blogPost.findMany({
    where: {
      status:         'PUBLISHED',
      linkedStores:   { some: { storeId } },
    },
    include,
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
  });

  if (explicit.length >= limit) return explicit.slice(0, limit);

  // 2. Fill remaining slots with latest published posts
  const existingIds = explicit.map(p => p.id);
  const fallback = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      id:     { notIn: existingIds.length ? existingIds : [0] },
    },
    include,
    orderBy: { publishedAt: 'desc' },
    take: limit - explicit.length,
  });

  return [...explicit, ...fallback];
      }
