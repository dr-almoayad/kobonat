// app/api/admin/leaderboard/route.js
// GET — paginated leaderboard snapshots
// Query: week, categoryId, page, limit, search
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

function currentWeek() {
  const now  = new Date();
  const d    = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // Thursday of ISO week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week  = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export async function GET(request) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const week       = searchParams.get('week')   || currentWeek();
    const categoryId = searchParams.get('categoryId');
    const page       = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit      = Math.min(200, parseInt(searchParams.get('limit') || '50'));
    const search     = searchParams.get('search')?.trim();

    const catFilter = !categoryId || categoryId === 'global' ? null : parseInt(categoryId);

    const where = {
      weekIdentifier: week,
      categoryId:     catFilter,
      ...(search ? {
        store: {
          translations: { some: { locale: 'en', name: { contains: search, mode: 'insensitive' } } }
        }
      } : {})
    };

    const [total, snapshots, availableWeeksRaw] = await Promise.all([
      prisma.storeSavingsSnapshot.count({ where }),
      prisma.storeSavingsSnapshot.findMany({
        where,
        orderBy: { rank: 'asc' },
        skip:    (page - 1) * limit,
        take:    limit,
        select: {
          id: true, rank: true, previousRank: true, movement: true,
          calculatedMaxSavingsPercent: true, savingsOverridePercent: true,
          maxDirectDiscountPercent: true, maxCouponPercent: true, maxBankOfferPercent: true,
          stackingPath: true, weekIdentifier: true, calculatedAt: true,
          store: {
            select: {
              id: true, logo: true,
              translations: { where: { locale: 'en' }, select: { name: true, slug: true } }
            }
          },
          methodology: { select: { version: true } }
        }
      }),
      prisma.storeSavingsSnapshot.findMany({
        where:    { categoryId: catFilter },
        distinct: ['weekIdentifier'],
        orderBy:  { weekIdentifier: 'desc' },
        take:     12,
        select:   { weekIdentifier: true }
      })
    ]);

    const availableWeeks = availableWeeksRaw.map(w => w.weekIdentifier);

    // Response shape matches what the admin leaderboard page expects:
    //   data?.data          → snapshot rows
    //   data?.meta?.week    → current week string
    //   data?.meta?.availableWeeks → week list for selector
    return NextResponse.json({
      data: snapshots,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        week,
        availableWeeks,
      },
    });
  } catch (error) {
    console.error('[admin/leaderboard GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
