// app/api/admin/stores/[id]/peak-seasons/route.js
// GET  — list all peak seasons for a store
// POST — add a peak season

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const storeId = Number(params.id);
  const seasons = await prisma.storePeakSeason.findMany({
    where:   { storeId },
    orderBy: { seasonKey: 'asc' },
  });
  return NextResponse.json(seasons);
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const storeId = Number(params.id);
  const { seasonKey, nameEn, nameAr } = await request.json();

  if (!seasonKey || !nameEn || !nameAr) {
    return NextResponse.json({ error: 'seasonKey, nameEn, and nameAr are required' }, { status: 400 });
  }

  const season = await prisma.storePeakSeason.create({
    data: { storeId, seasonKey, nameEn, nameAr },
  });

  return NextResponse.json(season, { status: 201 });
}

// ─────────────────────────────────────────────────────────────────────────────

// app/api/admin/stores/[id]/peak-seasons/[seasonId]/route.js
// DELETE — remove a peak season from a store
