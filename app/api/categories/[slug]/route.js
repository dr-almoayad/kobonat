// app/api/categories/[slug]/route.js - Updated for new schema
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function GET(req, { params }) {
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  const countryCode = searchParams.get('country') || 'SA';

  try {
    // Find category by slug in specified locale
    const categoryTranslation = await prisma.categoryTranslation.findUnique({
      where: { 
        locale_slug: { 
          locale, 
          slug 
        } 
      },
      include: {
        category: {
          include: {
            translations: {
              where: { locale }
            }
          }
        }
      }
    });

    if (!categoryTranslation) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const category = categoryTranslation.category;

    // Get stores in this category for the specified country
    const stores = await prisma.store.findMany({
      where: { 
        isActive: true,
        categories: {
          some: {
            categoryId: category.id
          }
        },
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
      orderBy: { isFeatured: 'desc' }
    });

    // Transform stores
    const transformedStores = stores.map(store => ({
      ...store,
      name: store.translations[0]?.name || '',
      slug: store.translations[0]?.slug || '',
      description: store.translations[0]?.description || null
    }));

    // Get vouchers in stores of this category for the specified country
    const vouchers = await prisma.voucher.findMany({
      where: {
        expiryDate: { gte: new Date() },
        store: {
          categories: {
            some: {
              categoryId: category.id
            }
          }
        },
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
      orderBy: { popularityScore: 'desc' },
      take: 20
    });

    // Transform vouchers
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

    return NextResponse.json({ 
      category: {
        id: category.id,
        name: categoryTranslation.name,
        slug: categoryTranslation.slug,
        description: categoryTranslation.description,
        icon: category.icon,
        color: category.color
      },
      stores: transformedStores,
      vouchers: transformedVouchers,
      counts: {
        stores: stores.length,
        vouchers: vouchers.length
      }
    });

  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category", details: error.message },
      { status: 500 }
    );
  }
}