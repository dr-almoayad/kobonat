// app/api/admin/stores/[id]/peak-seasons/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const seasons = await prisma.storePeakSeason.findMany({
    where:   { storeId: Number(id) },
    orderBy: { seasonKey: 'asc' },
  });
  return NextResponse.json(seasons);
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const storeId = Number(id);
  const { seasonKey, nameEn, nameAr } = await request.json();

  if (!seasonKey || !nameEn || !nameAr) {
    return NextResponse.json(
      { error: 'seasonKey, nameEn, and nameAr are required' },
      { status: 400 }
    );
  }

  // Must upsert — @@unique([storeId, seasonKey]) means a plain create throws
  // P2002 if this season already exists for the store.
  const season = await prisma.storePeakSeason.upsert({
    where:  { storeId_seasonKey: { storeId, seasonKey } },
    create: { storeId, seasonKey, nameEn, nameAr },
    update: { nameEn, nameAr },
  });

  return NextResponse.json(season, { status: 201 });
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const seasonId = Number(searchParams.get('seasonId'));

  if (!seasonId) {
    return NextResponse.json({ error: 'seasonId query param required' }, { status: 400 });
  }

  await prisma.storePeakSeason.delete({
    where: { id: seasonId, storeId: Number(id) },
  });

  return NextResponse.json({ success: true });
}
