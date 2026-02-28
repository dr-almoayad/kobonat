// app/api/admin/leaderboard/route.js
// GET — paginated leaderboard snapshots
// Query: week, categoryId, page, limit, search
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function currentWeek() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export async function GET(request) {
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
          calculatedMaxSavingsPercent: true, savingsOverridePercent: true, stackingPath: true,
          maxDirectDiscountPercent: true, maxCouponPercent: true, maxBankOfferPercent: true,
          weekIdentifier: true, calculatedAt: true,
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

    return NextResponse.json({
      snapshots,
      availableWeeks: availableWeeksRaw.map(w => w.weekIdentifier),
      meta: { total, page, limit, pages: Math.ceil(total / limit), week }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
