// app/api/admin/bank-niches/[categoryId]/snapshots/route.js
// GET — latest BankNicheSnapshot rows for a given category (niche).
// Returns the most recent week's snapshots, sorted by rank.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { categoryId } = await params;

  // Find the most recent week that has data for this niche
  const latest = await prisma.bankNicheSnapshot.findFirst({
    where:   { categoryId: parseInt(categoryId) },
    orderBy: { weekIdentifier: 'desc' },
    select:  { weekIdentifier: true },
  });

  if (!latest) return NextResponse.json([]);

  const snapshots = await prisma.bankNicheSnapshot.findMany({
    where:   { categoryId: parseInt(categoryId), weekIdentifier: latest.weekIdentifier },
    orderBy: { rank: 'asc' },
    include: {
      bank: {
        select: {
          id: true, slug: true, logo: true,
          translations: { where: { locale: 'en' }, select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(snapshots);
}
