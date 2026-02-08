// app/api/stores/route.js - FIXED for Mobile Footer
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('country') || 'SA';
    const locale = searchParams.get('locale') || 'en';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    console.log('🏪 Stores API Request:', { countryCode, locale, limit, page });
    
    // Check if country exists and is active
    const country = await prisma.country.findUnique({
      where: { code: countryCode, isActive: true },
      include: {
        translations: {
          where: { locale }
        }
      }
    });
    
    if (!country) {
      console.log('❌ Country not found or inactive:', countryCode);
      return NextResponse.json(
        { 
          error: "Country not found or inactive",
          stores: [],
          pagination: {
            current: page,
            total: 0,
            pages: 0,
            limit,
            hasNext: false,
            hasPrev: false
          }
        },
        { status: 404 }
      );
    }
    
    console.log('✅ Country found:', country.code, country.translations[0]?.name);
    
    const where = {
      isActive: true,
      countries: {
        some: {
          country: {
            code: countryCode
          }
        }
      }
    };
    
    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: {
          translations: {
            where: { locale }
          },
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
        orderBy: [
          { isFeatured: 'desc' },
          { id: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.store.count({ where })
    ]);
    
    console.log('📊 Found stores:', stores.length, 'Total:', total);
    
    const totalPages = Math.ceil(total / limit);
    
    // Transform stores to include translations
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
        _count: {
          vouchers: store._count?.vouchers || 0
        }
      };
    });
    
    console.log('✅ Transformed stores sample:', transformedStores[0]);
    
    return NextResponse.json({
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
    }, { status: 200 });
    
  } catch (error) {
    console.error("❌ Error fetching stores:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch stores",
        details: error.message,
        stores: []
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      name_en, 
      name_ar, 
      slug_en,
      slug_ar,
      description_en,
      description_ar,
      logo, 
      websiteUrl, 
      affiliateNetwork, 
      trackingUrl,
      isActive = true,
      isFeatured = false,
      countryCodes = ['SA']
    } = body;

    if (!name_en || !name_ar || !slug_en || !slug_ar) {
      return NextResponse.json(
        { error: "Store name and slug in both languages are required" },
        { status: 400 }
      );
    }

    // Check if slugs already exist
    const existingStoreEN = await prisma.storeTranslation.findFirst({
      where: { slug: slug_en, locale: 'en' }
    });
    
    const existingStoreAR = await prisma.storeTranslation.findFirst({
      where: { slug: slug_ar, locale: 'ar' }
    });
    
    if (existingStoreEN || existingStoreAR) {
      return NextResponse.json(
        { error: "A store with this slug already exists" },
        { status: 409 }
      );
    }

    // Get country IDs
    const countries = await prisma.country.findMany({
      where: {
        code: { in: countryCodes },
        isActive: true
      }
    });
    
    if (countries.length === 0) {
      return NextResponse.json(
        { error: "No valid countries provided" },
        { status: 400 }
      );
    }

    const newStore = await prisma.store.create({
      data: { 
        logo, 
        websiteUrl, 
        affiliateNetwork, 
        trackingUrl,
        isActive,
        isFeatured,
        translations: {
          create: [
            {
              locale: 'en',
              name: name_en,
              slug: slug_en,
              description: description_en
            },
            {
              locale: 'ar',
              name: name_ar,
              slug: slug_ar,
              description: description_ar
            }
          ]
        },
        countries: {
          create: countries.map(country => ({
            country: { connect: { id: country.id } }
          }))
        }
      },
      include: {
        translations: true,
        countries: {
          include: {
            country: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Store created successfully",
      store: newStore
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 }
    );
  }
}
