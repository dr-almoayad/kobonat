// app/api/vouchers/[id]/route.js - Updated for new schema
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('country') || 'SA';
    const locale = searchParams.get('locale') || 'en';

    const voucher = await prisma.voucher.findUnique({
      where: { id: parseInt(id) },
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
        clicks: {
          orderBy: { clickedAt: 'desc' },
          take: 10
        },
        _count: {
          select: { clicks: true }
        }
      }
    });

    if (!voucher) {
      return NextResponse.json(
        { error: "Voucher not found" },
        { status: 404 }
      );
    }

    // Check if voucher is available in requested country
    const isAvailableInCountry = voucher.countries.some(
      vc => vc.country.code === countryCode
    );

    if (!isAvailableInCountry) {
      return NextResponse.json(
        { 
          error: "Voucher not available in your country",
          availableCountries: voucher.countries.map(vc => ({
            code: vc.country.code,
            name: vc.country.translations[0]?.name || vc.country.code
          }))
        },
        { status: 403 }
      );
    }

    // Get related vouchers from same store in same country
    const relatedVouchers = await prisma.voucher.findMany({
      where: {
        storeId: voucher.storeId,
        id: { not: voucher.id },
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
        }
      },
      take: 6,
      orderBy: { popularityScore: 'desc' }
    });

    // Transform data
    const transformedVoucher = {
      ...voucher,
      title: voucher.translations[0]?.title || '',
      description: voucher.translations[0]?.description || null,
      store: voucher.store ? {
        ...voucher.store,
        name: voucher.store.translations[0]?.name || '',
        slug: voucher.store.translations[0]?.slug || '',
        description: voucher.store.translations[0]?.description || null
      } : null,
      countries: voucher.countries.map(vc => ({
        ...vc,
        country: {
          ...vc.country,
          name: vc.country.translations[0]?.name || vc.country.code
        }
      }))
    };

    const transformedRelatedVouchers = relatedVouchers.map(v => ({
      ...v,
      title: v.translations[0]?.title || '',
      description: v.translations[0]?.description || null,
      store: v.store ? {
        ...v.store,
        name: v.store.translations[0]?.name || '',
        slug: v.store.translations[0]?.slug || '',
        logo: v.store.logo,
        id: v.store.id
      } : null
    }));

    return NextResponse.json({
      voucher: transformedVoucher,
      relatedVouchers: transformedRelatedVouchers,
      isAvailable: true
    });

  } catch (error) {
    console.error("Voucher API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voucher" },
      { status: 500 }
    );
  }
}