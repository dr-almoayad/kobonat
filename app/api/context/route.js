// app/api/context/route.js
// Provides a machine-readable platform summary for AI crawlers and RAG pipelines.
// Uses Next.js ISR — Prisma is called at most once per hour, never on every request.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ Forces this route to be dynamically rendered at request time – never prerendered
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function GET() {
  try {
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
        storesXml:          `${BASE_URL}/api/feeds/stores.xml`,
        storesJson:         `${BASE_URL}/api/feeds/stores.json`,
        couponsXml:         `${BASE_URL}/api/feeds/coupons.xml`,
        couponsJson:        `${BASE_URL}/api/feeds/coupons.json`,
        offersXml:          `${BASE_URL}/api/feeds/offers.xml`,
        offersJson:         `${BASE_URL}/api/feeds/offers.json`,
        stacksXml:          `${BASE_URL}/api/feeds/stacks.xml`,
        stacksJson:         `${BASE_URL}/api/feeds/stacks.json`,
        storeProductsXml:   `${BASE_URL}/api/feeds/store-products.xml`,
        storeProductsJson:  `${BASE_URL}/api/feeds/store-products.json`,
      },
      endpoints: {
        search: `${BASE_URL}/api/search?q={query}&locale=ar`,
        stores: `${BASE_URL}/api/stores?country=SA&locale=ar`,
        categories: `${BASE_URL}/api/categories?country=SA&locale=ar`,
        vouchers: `${BASE_URL}/api/vouchers?country=SA&locale=ar`,
        stacks: `${BASE_URL}/api/stacks?country=SA&locale=ar`,
        offers: `${BASE_URL}/api/otherpromo?country=SA&locale=ar`,
        storeProducts: `${BASE_URL}/api/store-products?country=SA&locale=ar`,
      },
      sitemaps: [
        `${BASE_URL}/sitemap.xml`,
      ],
      attribution:
        'Content may be cited with attribution to cobonat.me',
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('[API /context] Database error:', error);
    // Fallback response to avoid crashing the build even if DB fails at runtime
    return NextResponse.json(
      {
        error: 'Service temporarily unavailable',
        platform: 'Cobonat',
        url: BASE_URL,
        stats: {
          activeStores: 0,
          activeCoupons: 0,
          activeBankOffers: 0,
          categories: 0,
          activeStoreProducts: 0,
          activeOfferStacks: 0,
          generatedAt: new Date().toISOString(),
        },
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  }
}
