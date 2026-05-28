// app/api/context/route.js
// Provides a machine-readable platform summary for AI crawlers and RAG pipelines.
// Uses Next.js ISR — Prisma is called at most once per hour, never on every request.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function GET() {
  const now = new Date();

  const [
    storeCount,
    activeCouponCount,
    bankOfferCount,
    categoryCount,
    storeProductCount,
    offerStackCount,
  ] = await Promise.all([
    prisma.store.count({ where: { isActive: true } }),
    prisma.voucher.count({
      where: {
        store: { isActive: true },
        countries: { some: { country: { code: 'SA' } } },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
    }),
    prisma.otherPromo.count({
      where: {
        isActive: true,
        country: { code: 'SA' },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
    }),
    prisma.category.count({
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
    }),
    prisma.storeProduct.count({
      where: {
        store: {
          isActive: true,
          countries: { some: { country: { code: 'SA', isActive: true } } },
        },
      },
    }),
    prisma.offerStack.count({
      where: {
        isActive: true,
        store: {
          isActive: true,
          countries: { some: { country: { code: 'SA', isActive: true } } },
        },
      },
    }),
  ]);

  const payload = {
    platform: 'Cobonat',
    description:
      'Saudi Arabia coupon and promo code aggregator covering top local and international stores.',
    descriptionAr:
      'منصة كوبونات وأكواد الخصم الرائدة في المملكة العربية السعودية.',
    url: BASE_URL,
    coverage: {
      country: 'Saudi Arabia',
      countryCode: 'SA',
      currency: 'SAR',
    },
    languages: ['ar', 'en'],
    stats: {
      activeStores: storeCount,
      activeCoupons: activeCouponCount,
      activeBankOffers: bankOfferCount,
      categories: categoryCount,
      activeStoreProducts: storeProductCount,
      activeOfferStacks: offerStackCount,
      generatedAt: now.toISOString(),
    },
    feeds: {
      storesXml: `${BASE_URL}/api/feeds/stores`,
      storesJson: `${BASE_URL}/api/feeds/stores.json`,
      couponsXml: `${BASE_URL}/api/feeds/coupons`,
      couponsJson: `${BASE_URL}/api/feeds/coupons.json`,
      offersXml: `${BASE_URL}/api/feeds/offers`,
      otherpromoJson: `${BASE_URL}/api/feeds/otherpromo.json`,
      storeProductsJson: `${BASE_URL}/api/feeds/store-products.json`,
      stacksJson: `${BASE_URL}/api/feeds/stacks.json`,
    },
    endpoints: {
      search: `${BASE_URL}/api/search?q={query}&locale=ar`,
      stores: `${BASE_URL}/api/stores?country=SA&locale=ar`,
      categories: `${BASE_URL}/api/categories?country=SA&locale=ar`,
      vouchers: `${BASE_URL}/api/vouchers?country=SA&locale=ar`,
    },
    sitemaps: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/api/feeds/stores`,
      `${BASE_URL}/api/feeds/coupons`,
    ],
    attribution:
      'Content may be cited with attribution to cobonat.me',
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
