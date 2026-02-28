// app/api/admin/leaderboard/route.js
// GET — paginated leaderboard snapshots
// Query params:
//   week        — ISO week string, e.g. "2026-W10" (defaults to current)
//   categoryId  — filter to category leaderboard; "global" or omit for global
//   page        — 1-based page number (default 1)
//   limit       — rows per page (default 50, max 200)
//   search      — filter by store name (en translation)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getCurrentWeekIdentifier } from '@/lib/intelligence/calculateStoreScore';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const week       = searchParams.get('week')       || getCurrentWeekIdentifier();
  const categoryId = searchParams.get('categoryId');
  const page       = Math.max(1, Number(searchParams.get('page')  || 1));
  const limit      = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 50)));
  const search     = searchParams.get('search')?.trim();

  const categoryFilter = !categoryId || categoryId === 'global'
    ? null
    : Number(categoryId);

  const where = {
    weekIdentifier: week,
    categoryId:     categoryFilter,
    ...(search ? {
      store: {
        translations: {
          some: { locale: 'en', name: { contains: search, mode: 'insensitive' } },
        },
      },
    } : {}),
  };

  const [total, snapshots] = await Promise.all([
    prisma.storeSavingsSnapshot.count({ where }),
    prisma.storeSavingsSnapshot.findMany({
      where,
      orderBy: { rank: 'asc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id:                          true,
        rank:                        true,
        previousRank:                true,
        movement:                    true,
        calculatedMaxSavingsPercent: true,
        savingsOverridePercent:      true,
        stackingPath:                true,
        maxDirectDiscountPercent:    true,
        maxCouponPercent:            true,
        maxBankOfferPercent:         true,
        weekIdentifier:              true,
        calculatedAt:                true,
        store: {
          select: {
            id:   true,
            logo: true,
            translations: {
              where:  { locale: 'en' },
              select: { name: true, slug: true },
            },
          },
        },
        category: {
          select: {
            id:           true,
            translations: { where: { locale: 'en' }, select: { name: true } },
          },
        },
        methodology: { select: { version: true } },
      },
    }),
  ]);

  // Available weeks for the week-selector dropdown (last 12 weeks)
  const availableWeeks = await prisma.storeSavingsSnapshot.findMany({
    where:    { categoryId: categoryFilter },
    distinct: ['weekIdentifier'],
    orderBy:  { weekIdentifier: 'desc' },
    take:     12,
    select:   { weekIdentifier: true },
  });

  return NextResponse.json({
    data: snapshots,
    meta: {
      total,
      page,
      limit,
      pages:          Math.ceil(total / limit),
      week,
      availableWeeks: availableWeeks.map((w) => w.weekIdentifier),
    },
  });
}
