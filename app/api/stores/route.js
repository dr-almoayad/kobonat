// app/api/stores/route.js
import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { unstable_cache, revalidateTag } from 'next/cache';

const getCachedStoresData = unstable_cache(
  async (countryCode, locale, limit, page, offset) => {
    const country = await prisma.country.findUnique({
      where: { code: countryCode, isActive: true },
      include: { translations: { where: { locale } } }
    });

    if (!country) return null;

    const where = {
      isActive: true,
      countries: { some: { country: { code: countryCode } } }
    };

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: {
          translations: { where: { locale } },
          countries: {
            include: {
              country: { include: { translations: { where: { locale } } } }
            }
          },
          categories: {
            include: {
              category: { include: { translations: { where: { locale } } } }
            }
          },
          _count: {
            select: {
              vouchers: {
                where: {
                  expiryDate: { gte: new Date() },
                  countries: { some: { country: { code: countryCode } } }
                }
              }
            }
          }
        },
        orderBy: [{ isFeatured: 'desc' }, { id: 'asc' }],
        skip: offset,
        take: limit
      }),
      prisma.store.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    const transformedStores = stores.map(store => {
      const storeTranslation = store.translations[0] || {};
      return {
        id: store.id,
        name: storeTranslation.name || '',
        slug: storeTranslation.slug || '',
        description: storeTranslation.description || null,
        showOffer: storeTranslation.showOffer || null,
        logo: store.logo,
        color: store.color,
        websiteUrl: store.websiteUrl,
        isActive: store.isActive,
        isFeatured: store.isFeatured,
        categories: store.categories.map(sc => ({
          id: sc.category.id,
          name: sc.category.translations[0]?.name || '',
          slug: sc.category.translations[0]?.slug || '',
          description: sc.category.translations[0]?.description || null,
          icon: sc.category.icon,
          color: sc.category.color
        })),
        _count: { vouchers: store._count?.vouchers || 0 }
      };
    });

    return {
      stores: transformedStores,
      pagination: {
        current: page,
        total,
        pages: totalPages,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      country: {
        code: country.code,
        name: country.translations[0]?.name || country.code,
        currency: country.currency,
        flag: country.flag
      }
    };
  },
  ['stores-api-query'],
  // 1 hour. new Date() inside the function is evaluated at cache-creation time,
  // so a 1-year TTL (the previous value) would serve stale voucher counts for
  // up to a year between invalidations. 1 hour is a safe balance between
  // freshness and query reduction. The revalidateTag('stores') call in POST
  // handles on-demand purging when stores are created via this endpoint.
  { tags: ['stores'], revalidate: 3600 }
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('country') || 'SA';
    const locale = searchParams.get('locale') || 'en';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const data = await getCachedStoresData(countryCode, locale, limit, page, offset);

    if (!data) {
      return NextResponse.json(
        {
          error: "Country not found or inactive",
          stores: [],
          pagination: { current: page, total: 0, pages: 0, limit, hasNext: false, hasPrev: false }
        },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stores", details: error.message, stores: [] },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name_en, name_ar, slug_en, slug_ar,
      description_en, description_ar,
      logo, websiteUrl, affiliateNetwork, trackingUrl,
      isActive = true, isFeatured = false, countryCodes = ['SA']
    } = body;

    if (!name_en || !name_ar || !slug_en || !slug_ar) {
      return NextResponse.json(
        { error: "Store name and slug in both languages are required" },
        { status: 400 }
      );
    }

    const [existingStoreEN, existingStoreAR] = await Promise.all([
      prisma.storeTranslation.findFirst({ where: { slug: slug_en, locale: 'en' } }),
      prisma.storeTranslation.findFirst({ where: { slug: slug_ar, locale: 'ar' } })
    ]);

    if (existingStoreEN || existingStoreAR) {
      return NextResponse.json(
        { error: "A store with this slug already exists" },
        { status: 409 }
      );
    }

    const countries = await prisma.country.findMany({
      where: { code: { in: countryCodes }, isActive: true }
    });

    if (countries.length === 0) {
      return NextResponse.json({ error: "No valid countries provided" }, { status: 400 });
    }

    const newStore = await prisma.store.create({
      data: {
        logo, websiteUrl, affiliateNetwork, trackingUrl, isActive, isFeatured,
        translations: {
          create: [
            { locale: 'en', name: name_en, slug: slug_en, description: description_en },
            { locale: 'ar', name: name_ar, slug: slug_ar, description: description_ar }
          ]
        },
        countries: {
          create: countries.map(country => ({ country: { connect: { id: country.id } } }))
        }
      },
      include: {
        translations: true,
        countries: { include: { country: true } }
      }
    });

    revalidateTag('stores');

    return NextResponse.json({ message: "Store created successfully", store: newStore }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
  }
}
