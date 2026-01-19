// app/api/vouchers/route.js - Updated for new schema
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('country') || 'SA';
    const locale = searchParams.get('locale') || 'en';
    const language = locale; // Now just 'en' or 'ar'
    
    const storeId = searchParams.get('storeId') ? parseInt(searchParams.get('storeId')) : null;
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')) : null;
    const type = searchParams.get('type');
    const exclusive = searchParams.get('exclusive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Get country with translation
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

    const where = {
      AND: [
        {
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }
          ]
        },
        {
          countries: {
            some: {
              country: {
                code: countryCode
              }
            }
          }
        }
      ]
    };

    if (storeId) {
      where.AND.push({ storeId });
    }

    if (categoryId) {
      where.AND.push({
        store: {
          categories: {
            some: {
              categoryId
            }
          }
        }
      });
    }

    if (type) {
      where.AND.push({ type });
    }

    if (exclusive) {
      where.AND.push({ isExclusive: true });
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: {
          translations: {
            where: { locale }
          },
          store: {
            include: {
              translations: {
                where: { locale }
              },
              countries: {
                where: {
                  country: {
                    code: countryCode
                  }
                },
                include: {
                  country: {
                    include: {
                      translations: {
                        where: { locale }
                      }
                    }
                  }
                }
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
          { popularityScore: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.voucher.count({ where })
    ]);

    // Transform to include translations as main fields
    const transformedVouchers = vouchers.map(voucher => ({
      ...voucher,
      title: voucher.translations[0]?.title || '',
      description: voucher.translations[0]?.description || null,
      store: voucher.store ? {
        ...voucher.store,
        name: voucher.store.translations[0]?.name || '',
        slug: voucher.store.translations[0]?.slug || '',
        description: voucher.store.translations[0]?.description || null
      } : null
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      vouchers: transformedVouchers,
      pagination: {
        current: page,
        total,
        pages: totalPages,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      country: {
        ...country,
        name: country.translations[0]?.name || country.code
      }
    });

  } catch (error) {
    console.error("Vouchers API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}