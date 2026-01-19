// app/api/homepage/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Get top 25 vouchers (most used, active, and relevant)
    const topVouchers = await prisma.voucher.findMany({
      where: {
        isActive: true,
        expiryDate: {
          gte: new Date()
        }
      },
      include: {
        store: {
          select: {
            id: true,
            name_en: true,
            name_ar: true,
            slug: true,
            logo: true,
            websiteUrl: true
          }
        },
        _count: {
          select: {
            clicks: true
          }
        }
      },
      orderBy: [
        { _count: { clicks: 'desc' } },
        { createdAt: 'desc' }
      ],
      take: 25
    });

    // Get top 10 stores (most vouchers, active)
    const topStores = await prisma.store.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: {
            vouchers: {
              where: {
                isActive: true,
                expiryDate: {
                  gte: new Date()
                }
              }
            }
          }
        }
      },
      orderBy: [
        { _count: { vouchers: 'desc' } },
        { name_en: 'asc' }
      ],
      take: 10
    });

    // Format the data for the frontend
    const formattedVouchers = topVouchers.map(voucher => ({
      id: voucher.id,
      title: locale === 'ar' ? voucher.title_ar : voucher.title_en,
      description: locale === 'ar' ? voucher.description_ar : voucher.description_en,
      code: voucher.code,
      discount: voucher.discount,
      discountType: voucher.discountType,
      type: voucher.type,
      expiryDate: voucher.expiryDate,
      minPurchase: voucher.minPurchase,
      landingUrl: voucher.landingUrl,
      store: voucher.store,
      clicks: voucher._count.clicks,
      isVerified: voucher.isVerified,
      isFeatured: voucher.isFeatured
    }));

    const formattedStores = topStores.map(store => ({
      id: store.id,
      name: locale === 'ar' ? store.name_ar : store.name_en,
      slug: store.slug,
      logo: store.logo,
      websiteUrl: store.websiteUrl,
      description: locale === 'ar' ? store.description_ar : store.description_en,
      voucherCount: store._count.vouchers,
      isVerified: store.isVerified,
      isFeatured: store.isFeatured
    }));

    return NextResponse.json({
      vouchers: formattedVouchers,
      stores: formattedStores,
      totalVouchers: formattedVouchers.length,
      totalStores: formattedStores.length
    });

  } catch (error) {
    console.error('Homepage data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}