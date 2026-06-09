// app/api/leaderboard/route.js
export const dynamic = 'force-dynamic'; // ✅ always run fresh (no edge caching)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const week = searchParams.get('week');
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')) : null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const where = {
      ...(week && { weekIdentifier: week }),
      ...(categoryId && { categoryId }),
    };

    const [snapshots, total] = await Promise.all([
      prisma.storeSavingsSnapshot.findMany({
        where,
        orderBy: { rank: 'asc' },
        skip: offset,
        take: limit,
        include: {
          store: {
            select: {
              id: true,
              logo: true,
              translations: {
                where: { locale: 'en' },
                select: { name: true, slug: true },
              },
            },
          },
          methodology: { select: { version: true } },
        },
      }),
      prisma.storeSavingsSnapshot.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      snapshots,
      pagination: {
        current: page,
        total,
        pages: totalPages,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
