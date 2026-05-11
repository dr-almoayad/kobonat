// app/api/homepage/route.js
// Returns top vouchers and stores for the homepage.
// Uses the translation-based schema (StoreTranslation / VoucherTranslation).
// The previous version referenced name_en, name_ar, title_en, etc. which do
// not exist in the Prisma schema, causing runtime errors.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale   = searchParams.get('locale') || 'ar';
    const language = locale.split('-')[0]; // 'ar-SA' → 'ar'

    // ── Top 25 vouchers ───────────────────────────────────────────────────────
    const topVouchers = await prisma.voucher.findMany({
      where: {
        store:    { isActive: true },
        OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
      },
      include: {
        translations: {
          where:  { locale: language },
          select: { title: true, description: true },
        },
        store: {
          select: {
            id:   true,
            logo: true,
            websiteUrl: true,
            translations: {
              where:  { locale: language },
              select: { name: true, slug: true },
            },
          },
        },
        _count: { select: { clicks: true } },
      },
      orderBy: [
        { popularityScore: 'desc' },
        { createdAt:       'desc' },
      ],
      take: 25,
    });

    // ── Top 10 stores ─────────────────────────────────────────────────────────
    const topStores = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        translations: {
          where:  { locale: language },
          select: { name: true, slug: true, description: true, showOffer: true },
        },
        _count: {
          select: {
            vouchers: {
              where: {
                OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
              },
            },
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { id:         'asc'  },
      ],
      take: 10,
    });

    // ── Transform ─────────────────────────────────────────────────────────────
    const formattedVouchers = topVouchers.map(voucher => {
      const vt = voucher.translations[0] || {};
      const st = voucher.store?.translations[0] || {};
      return {
        id:           voucher.id,
        title:        vt.title       || '',
        description:  vt.description || null,
        code:         voucher.code,
        discount:     voucher.discount,
        discountType: voucher.discountType ?? null,
        type:         voucher.type,
        expiryDate:   voucher.expiryDate,
        landingUrl:   voucher.landingUrl,
        isVerified:   voucher.isVerified,
        isExclusive:  voucher.isExclusive,
        clicks:       voucher._count.clicks,
        store: voucher.store ? {
          id:         voucher.store.id,
          name:       st.name || '',
          slug:       st.slug || '',
          logo:       voucher.store.logo,
          websiteUrl: voucher.store.websiteUrl,
        } : null,
      };
    });

    const formattedStores = topStores.map(store => {
      const t = store.translations[0] || {};
      return {
        id:           store.id,
        name:         t.name        || '',
        slug:         t.slug        || '',
        description:  t.description || null,
        showOffer:    t.showOffer   || null,
        logo:         store.logo,
        websiteUrl:   store.websiteUrl,
        isVerified:   store.isVerified  ?? false,
        isFeatured:   store.isFeatured,
        voucherCount: store._count.vouchers,
      };
    });

    return NextResponse.json({
      vouchers:      formattedVouchers,
      stores:        formattedStores,
      totalVouchers: formattedVouchers.length,
      totalStores:   formattedStores.length,
    });

  } catch (error) {
    console.error('[/api/homepage] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}
