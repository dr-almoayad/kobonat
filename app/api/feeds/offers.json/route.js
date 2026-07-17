// app/api/feeds/offers.json/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobonat.me';
const LIMIT = 500;

export async function GET() {
  try {
    const promos = await prisma.otherPromo.findMany({
      where: {
        isActive: true,
        country: { code: 'SA' },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } },
        ],
      },
      include: {
        translations: { where: { locale: { in: ['ar', 'en'] } } },
        bank: { include: { translations: { where: { locale: { in: ['ar', 'en'] } } } } },
        paymentMethod: { include: { translations: { where: { locale: { in: ['ar', 'en'] } } } } },
        card: { include: { translations: { where: { locale: { in: ['ar', 'en'] } } } } },
        store: { include: { translations: { where: { locale: { in: ['ar', 'en'] } } } } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: LIMIT,
    });

    const data = promos.map((promo) => {
      const ar = promo.translations.find((t) => t.locale === 'ar') || {};
      const en = promo.translations.find((t) => t.locale === 'en') || {};

      const bankAr = promo.bank?.translations.find((t) => t.locale === 'ar') || {};
      const bankEn = promo.bank?.translations.find((t) => t.locale === 'en') || {};

      const pmAr = promo.paymentMethod?.translations.find((t) => t.locale === 'ar') || {};
      const pmEn = promo.paymentMethod?.translations.find((t) => t.locale === 'en') || {};

      const cardAr = promo.card?.translations.find((t) => t.locale === 'ar') || {};
      const cardEn = promo.card?.translations.find((t) => t.locale === 'en') || {};

      const storeAr = promo.store?.translations.find((t) => t.locale === 'ar') || {};
      const storeEn = promo.store?.translations.find((t) => t.locale === 'en') || {};

      return {
        id: promo.id,
        type: promo.type,
        titleAr: ar.title || null,
        titleEn: en.title || null,
        descriptionAr: ar.description || null,
        descriptionEn: en.description || null,
        termsAr: ar.terms || null,
        termsEn: en.terms || null,
        discountPercent: promo.discountPercent ?? null,
        verifiedAvgPercent: promo.verifiedAvgPercent ?? null,
        minSpend: promo.minSpendAmount ?? null,
        maxDiscountAmount: promo.maxDiscountAmount ?? null,
        voucherCode: promo.voucherCode || null,
        startDate: promo.startDate?.toISOString() || null,
        expiryDate: promo.expiryDate?.toISOString() || null,
        image: promo.image || null,
        url: promo.url || null,
        isActive: promo.isActive,
        order: promo.order,
        updatedAt: promo.updatedAt,
        bank: promo.bank
          ? {
              id: promo.bank.id,
              nameAr: bankAr.name || null,
              nameEn: bankEn.name || null,
              slug: promo.bank.slug,
              logo: promo.bank.logo || null,
            }
          : null,
        paymentMethod: promo.paymentMethod
          ? {
              id: promo.paymentMethod.id,
              nameAr: pmAr.name || null,
              nameEn: pmEn.name || null,
              slug: promo.paymentMethod.slug,
              type: promo.paymentMethod.type,
              isBnpl: promo.paymentMethod.isBnpl,
              logo: promo.paymentMethod.logo || null,
            }
          : null,
        card: promo.card
          ? {
              id: promo.card.id,
              nameAr: cardAr.name || null,
              nameEn: cardEn.name || null,
              network: promo.card.network || null,
              tier: promo.card.tier || null,
              image: promo.card.image || null,
            }
          : null,
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
      };
    });

    return NextResponse.json(
      { count: data.length, generatedAt: new Date().toISOString(), offers: data },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/feeds/offers.json]', error);
    return NextResponse.json(
      { error: 'Failed to generate offers feed', generatedAt: new Date().toISOString(), offers: [] },
      { status: 503 }
    );
  }
}
