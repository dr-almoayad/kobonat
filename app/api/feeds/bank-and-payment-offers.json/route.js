// app/api/feeds/bank-and-payment-offers.json/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';

export async function GET() {
  const promos = await prisma.otherPromo.findMany({
    where: {
      isActive: true,
      country: { code: 'SA', isActive: true },
    },
    include: {
      translations: { where: { locale: { in: ['ar', 'en'] } } },
      store: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
      bank: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
      card: {
        include: { translations: { where: { locale: { in: ['ar', 'en'] } } } },
      },
    },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });

  const data = promos.map((promo) => {
    const ar = promo.translations.find((t) => t.locale === 'ar') || {};
    const en = promo.translations.find((t) => t.locale === 'en') || {};

    const storeAr = promo.store?.translations.find((t) => t.locale === 'ar') || {};
    const storeEn = promo.store?.translations.find((t) => t.locale === 'en') || {};

    const bankAr = promo.bank?.translations.find((t) => t.locale === 'ar') || {};
    const bankEn = promo.bank?.translations.find((t) => t.locale === 'en') || {};

    const cardAr = promo.card?.translations.find((t) => t.locale === 'ar') || {};
    const cardEn = promo.card?.translations.find((t) => t.locale === 'en') || {};

    return {
      id: promo.id,
      titleAr: ar.title || null,
      titleEn: en.title || null,
      descriptionAr: ar.description || null,
      descriptionEn: en.description || null,
      discountPercent: promo.discountPercent ?? null,   // valid field
      discountCertainty: promo.discountCertainty,        // optional, present in schema
      type: promo.type,
      startDate: promo.startDate?.toISOString() || null,
      expiryDate: promo.expiryDate?.toISOString() || null,
      url: promo.url || null,
      isActive: promo.isActive,
      updatedAt: promo.updatedAt,
      store: promo.store
        ? {
            id: promo.store.id,
            nameAr: storeAr.name || null,
            nameEn: storeEn.name || null,
            slugAr: storeAr.slug || null,
            slugEn: storeEn.slug || null,
            pageUrlAr: storeAr.slug ? `${BASE_URL}/ar-SA/stores/${storeAr.slug}` : null,
            pageUrlEn: storeEn.slug ? `${BASE_URL}/en-SA/stores/${storeEn.slug}` : null,
            logo: promo.store.logo || null,
          }
        : null,
      bank: promo.bank
        ? {
            id: promo.bank.id,
            nameAr: bankAr.name || null,
            nameEn: bankEn.name || null,
          }
        : null,
      card: promo.card
        ? {
            id: promo.card.id,
            nameAr: cardAr.name || null,
            nameEn: cardEn.name || null,
            network: promo.card.network,
          }
        : null,
    };
  });

  return NextResponse.json(
    { count: data.length, generatedAt: new Date().toISOString(), promos: data },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    }
  );
}
