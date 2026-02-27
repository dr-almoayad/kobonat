// app/api/leaderboard/route.js
// GET /api/leaderboard?categoryId=3&limit=5&locale=ar
//
// Reads from snapshot table only — zero calculation on the request path.
// Response is cached at the edge for 1 hour (revalidate=3600).

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';

export const revalidate = 3600; // Cache 1 hour — leaderboard data changes weekly

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const categoryId = searchParams.get('categoryId')
      ? parseInt(searchParams.get('categoryId'))
      : null;
    const limit  = Math.min(parseInt(searchParams.get('limit') || '5'), 20);
    const locale = searchParams.get('locale') || 'en';
    const lang   = locale.split('-')[0];
    const week   = getCurrentWeekIdentifier();

    const snapshots = await prisma.storeSavingsSnapshot.findMany({
      where: {
        weekIdentifier: week,
        categoryId: categoryId ?? null,
        // Only include stores that actually have meaningful savings
        calculatedMaxSavingsPercent: { gt: 0 },
      },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        store: {
          select: {
            id: true,
            logo: true,
            translations: {
              where: { locale: lang },
              select: { name: true, slug: true },
            },
          },
        },
      },
    });

    const data = snapshots.map((snap) => {
      const t = snap.store.translations[0] || {};
      return {
        rank:            snap.rank,
        previousRank:    snap.previousRank,
        movement:        snap.movement,
        storeId:         snap.storeId,
        storeName:       t.name  || '',
        storeSlug:       t.slug  || '',
        storeLogo:       snap.store.logo,
        maxSavingsPercent: snap.savingsOverridePercent ?? snap.calculatedMaxSavingsPercent,
        // Breakdown — shown in tooltips / detail views
        breakdown: {
          directDiscount: snap.maxDirectDiscountPercent,
          coupon:         snap.maxCouponPercent,
          bankOffer:      snap.maxBankOfferPercent,
        },
        weekIdentifier: snap.weekIdentifier,
      };
    });

    return NextResponse.json({ week, data }, {
      headers: {
        // Allow CDN caching — leaderboard is public, not user-specific
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('[/api/leaderboard]', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
