// app/api/feeds/store-products.json/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function GET() {
  const products = await prisma.storeProduct.findMany({
    where: {
      store: {
        isActive: true,
        countries: { some: { country: { code: 'SA', isActive: true } } },
      },
      // Optionally restrict to products linked to SA – uncomment if you want
      // countries: { some: { country: { code: 'SA', isActive: true } } },
    },
    include: {
      translations: { where: { locale: { in: ['ar', 'en'] } } },
      store: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
      linkedVoucher: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
      linkedPromo: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { id: 'asc' }],
  });

  const data = products.map((product) => {
    const ar = product.translations.find((t) => t.locale === 'ar') || {};
    const en = product.translations.find((t) => t.locale === 'en') || {};

    const storeAr = product.store?.translations.find((t) => t.locale === 'ar') || {};
    const storeEn = product.store?.translations.find((t) => t.locale === 'en') || {};

    const voucherAr = product.linkedVoucher?.translations.find((t) => t.locale === 'ar') || {};
    const voucherEn = product.linkedVoucher?.translations.find((t) => t.locale === 'en') || {};

    const promoAr = product.linkedPromo?.translations.find((t) => t.locale === 'ar') || {};
    const promoEn = product.linkedPromo?.translations.find((t) => t.locale === 'en') || {};

    return {
      id: product.id,
      titleAr: ar.title || null,
      titleEn: en.title || null,
      descriptionAr: ar.description || null,
      descriptionEn: en.description || null,
      image: product.image || null,
      originalPrice: product.originalPrice ?? null,
      currentPrice: product.currentPrice ?? null,
      discountValue: product.discountValue ?? null,
      discountType: product.discountType,
      productUrl: product.productUrl || null,
      isFeatured: product.isFeatured,
      order: product.order,
      clickCount: product.clickCount,
      updatedAt: product.updatedAt,
      store: product.store
        ? {
            id: product.store.id,
            nameAr: storeAr.name || null,
            nameEn: storeEn.name || null,
            slugAr: storeAr.slug || null,
            slugEn: storeEn.slug || null,
            pageUrlAr: storeAr.slug ? `${BASE_URL}/ar-SA/stores/${storeAr.slug}` : null,
            pageUrlEn: storeEn.slug ? `${BASE_URL}/en-SA/stores/${storeEn.slug}` : null,
            logo: product.store.logo || null,
          }
        : null,
      linkedVoucher: product.linkedVoucher
        ? {
            id: product.linkedVoucher.id,
            code: product.linkedVoucher.code || null,
            titleAr: voucherAr.title || null,
            titleEn: voucherEn.title || null,
            type: product.linkedVoucher.type,
          }
        : null,
      linkedPromo: product.linkedPromo
        ? {
            id: product.linkedPromo.id,
            titleAr: promoAr.title || null,
            titleEn: promoEn.title || null,
            type: product.linkedPromo.type,
          }
        : null,
    };
  });

  return NextResponse.json(
    { count: data.length, generatedAt: new Date().toISOString(), products: data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    }
  );
}
