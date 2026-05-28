// app/api/feeds/stacks.json/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function GET() {
  const stacks = await prisma.offerStack.findMany({
    where: {
      isActive: true,
      store: {
        isActive: true,
        countries: { some: { country: { code: 'SA', isActive: true } } },
      },
    },
    include: {
      store: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
      codeVoucher: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
      dealVoucher: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
      promo: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
    },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });

  const data = stacks.map((stack) => {
    const storeAr = stack.store?.translations.find((t) => t.locale === 'ar') || {};
    const storeEn = stack.store?.translations.find((t) => t.locale === 'en') || {};

    const codeAr = stack.codeVoucher?.translations.find((t) => t.locale === 'ar') || {};
    const codeEn = stack.codeVoucher?.translations.find((t) => t.locale === 'en') || {};
    const dealAr = stack.dealVoucher?.translations.find((t) => t.locale === 'ar') || {};
    const dealEn = stack.dealVoucher?.translations.find((t) => t.locale === 'en') || {};
    const promoAr = stack.promo?.translations.find((t) => t.locale === 'ar') || {};
    const promoEn = stack.promo?.translations.find((t) => t.locale === 'en') || {};

    return {
      id: stack.id,
      label: stack.label || null,
      isActive: stack.isActive,
      order: stack.order,
      updatedAt: stack.updatedAt,
      store: stack.store
        ? {
            id: stack.store.id,
            nameAr: storeAr.name || null,
            nameEn: storeEn.name || null,
            slugAr: storeAr.slug || null,
            slugEn: storeEn.slug || null,
            pageUrlAr: storeAr.slug
              ? `${BASE_URL}/ar-SA/stores/${storeAr.slug}`
              : null,
            pageUrlEn: storeEn.slug
              ? `${BASE_URL}/en-SA/stores/${storeEn.slug}`
              : null,
            logo: stack.store.logo || null,
          }
        : null,
      codeVoucher: stack.codeVoucher
        ? {
            id: stack.codeVoucher.id,
            code: stack.codeVoucher.code || null,
            titleAr: codeAr.title || null,
            titleEn: codeEn.title || null,
            type: stack.codeVoucher.type,
          }
        : null,
      dealVoucher: stack.dealVoucher
        ? {
            id: stack.dealVoucher.id,
            code: stack.dealVoucher.code || null,
            titleAr: dealAr.title || null,
            titleEn: dealEn.title || null,
            type: stack.dealVoucher.type,
          }
        : null,
      promo: stack.promo
        ? {
            id: stack.promo.id,
            titleAr: promoAr.title || null,
            titleEn: promoEn.title || null,
            type: stack.promo.type,
          }
        : null,
    };
  });

  return NextResponse.json(
    { count: data.length, generatedAt: new Date().toISOString(), stacks: data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    }
  );
}
