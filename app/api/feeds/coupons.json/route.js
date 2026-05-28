// app/api/feeds/coupons.json/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const revalidate = 1800;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function GET() {
  const now = new Date();

  const vouchers = await prisma.voucher.findMany({
    where: {
      OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      countries: { some: { country: { code: 'SA' } } },
      store: { isActive: true },
    },
    include: {
      translations: { where: { locale: { in: ['ar', 'en'] } } },
      store: {
        include: {
          translations: { where: { locale: { in: ['ar', 'en'] } } },
        },
      },
    },
    orderBy: [
      { isExclusive: 'desc' },
      { isVerified: 'desc' },
      { popularityScore: 'desc' },
    ],
    take: 1000,
  });

  const data = vouchers.map((v) => {
    const vAr = v.translations.find((t) => t.locale === 'ar') || {};
    const vEn = v.translations.find((t) => t.locale === 'en') || {};
    const sAr = v.store?.translations.find((t) => t.locale === 'ar') || {};
    const sEn = v.store?.translations.find((t) => t.locale === 'en') || {};

    return {
      id: v.id,
      type: v.type,
      code: v.code || null,
      titleAr: vAr.title || null,
      titleEn: vEn.title || null,
      discount: v.discount || null,
      discountPercent: v.verifiedAvgPercent ?? v.discountPercent ?? null,
      isExclusive: v.isExclusive,
      isVerified: v.isVerified,
      expiryDate: v.expiryDate || null,
      startDate: v.startDate || null,
      offerUrl: v.landingUrl || null,
      store: {
        id: v.store?.id || null,
        nameAr: sAr.name || null,
        nameEn: sEn.name || null,
        pageUrlAr: sAr.slug
          ? `${BASE_URL}/ar-SA/stores/${sAr.slug}`
          : null,
        pageUrlEn: sEn.slug
          ? `${BASE_URL}/en-SA/stores/${sEn.slug}`
          : null,
        logo: v.store?.logo || null,
      },
      updatedAt: v.updatedAt,
    };
  });

  return NextResponse.json(
    { count: data.length, generatedAt: now.toISOString(), coupons: data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    }
  );
}
