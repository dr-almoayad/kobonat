// app/api/stores/[slug]/route.js - Updated for new schema
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function GET(req, { params }) {
  try {
    const storeSlug = params.slug;
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('country') || 'SA';
    const locale = searchParams.get('locale') || 'en';
    
    if (!storeSlug) {
      return NextResponse.json(
        { error: "Store slug is required" },
        { status: 400 }
      );
    }

    // Check if country exists
    const country = await prisma.country.findUnique({
      where: { code: countryCode, isActive: true },
      include: {
        translations: {
          where: { locale }
        }
      }
    });
    
    if (!country) {
      return NextResponse.json(
        { error: "Country not found or inactive" },
        { status: 404 }
      );
    }

    // Find the store by its translation slug for the specific locale and country
    const storeTranslation = await prisma.storeTranslation.findFirst({
      where: { 
        slug: storeSlug,
        locale,
        store: {
          isActive: true,
          countries: {
            some: {
              country: {
                code: countryCode
              }
            }
          }
        }
      },
      include: {
        store: {
          include: {
            translations: true,
            countries: {
              include: {
                country: {
                  include: {
                    translations: {
                      where: { locale }
                    }
                  }
                }
              }
            },
            categories: {
              include: {
                category: {
                  include: {
                    translations: {
                      where: { locale }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!storeTranslation) {
      return NextResponse.json(
        { error: "Store not found in this country" },
        { status: 404 }
      );
    }

    const store = storeTranslation.store;

    // Get active vouchers for this store in the specified country
    const vouchers = await prisma.voucher.findMany({
      where: {
        storeId: store.id,
        expiryDate: { gte: new Date() },
        countries: {
          some: {
            country: {
              code: countryCode
            }
          }
        }
      },
      include: {
        translations: {
          where: { locale }
        },
        store: {
          include: {
            translations: {
              where: { locale }
            }
          }
        },
        _count: {
          select: { clicks: true }
        }
      },
      orderBy: [
        { isExclusive: 'desc' },
        { isVerified: 'desc' },
        { popularityScore: 'desc' }
      ]
    });

    // Get unique categories for this store
    const categories = store.categories.map(sc => ({
      ...sc.category,
      name: sc.category.translations[0]?.name || '',
      slug: sc.category.translations[0]?.slug || '',
      description: sc.category.translations[0]?.description || null
    }));

    // Get related stores (same categories) in the same country
    const relatedStores = await prisma.store.findMany({
      where: {
        id: { not: store.id },
        isActive: true,
        countries: {
          some: {
            country: {
              code: countryCode
            }
          }
        },
        categories: {
          some: {
            categoryId: {
              in: store.categories.map(sc => sc.categoryId)
            }
          }
        }
      },
      include: {
        translations: {
          where: { locale }
        },
        _count: {
          select: {
            vouchers: {
              where: {
                expiryDate: { gte: new Date() },
                countries: {
                  some: {
                    country: {
                      code: countryCode
                    }
                  }
                }
              }
            }
          }
        }
      },
      take: 6,
      orderBy: { isFeatured: 'desc' }
    });

    // Transform data
    const transformedStore = {
      ...store,
      name: storeTranslation.name,
      slug: storeTranslation.slug,
      description: storeTranslation.description,
      countries: store.countries.map(sc => ({
        ...sc,
        country: {
          ...sc.country,
          name: sc.country.translations[0]?.name || sc.country.code
        }
      }))
    };

    const transformedVouchers = vouchers.map(voucher => ({
      ...voucher,
      title: voucher.translations[0]?.title || '',
      description: voucher.translations[0]?.description || null,
      store: voucher.store ? {
        id: voucher.store.id,
        name: voucher.store.translations[0]?.name || '',
        slug: voucher.store.translations[0]?.slug || '',
        logo: voucher.store.logo
      } : null
    }));

    const transformedRelatedStores = relatedStores.map(store => ({
      ...store,
      name: store.translations[0]?.name || '',
      slug: store.translations[0]?.slug || '',
      description: store.translations[0]?.description || null
    }));

    const responseData = {
      store: transformedStore,
      vouchers: transformedVouchers,
      categories,
      relatedStores: transformedRelatedStores,
      country: {
        ...country,
        name: country.translations[0]?.name || country.code
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("Error fetching store data:", error);
    return NextResponse.json(
      { error: "Failed to fetch store data" },
      { status: 500 }
    );
  }
}