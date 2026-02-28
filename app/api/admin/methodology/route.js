// app/api/admin/methodology/route.js
// GET  — list all methodology versions (ordered newest first)
// POST — create a new version (does NOT auto-activate)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
   const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    };

  const methodologies = await prisma.savingsMethodology.findMany({
    orderBy: { id: 'desc' },
    include: { _count: { select: { snapshots: true } } },
  });

  return NextResponse.json(methodologies);
}

export async function POST(request) {
   const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    };


  const body = await request.json();
  const {
    version,
    description,
    maxSavingsCap       = 75.0,
    referenceBasketSize = 500.0,
    multiplierExact     = 1.00,
    multiplierVerified  = 1.00,
    multiplierTypical   = 0.80,
    multiplierEstimated = 0.35,
  } = body;

  if (!version || !description) {
    return NextResponse.json({ error: 'version and description are required' }, { status: 400 });
  }

  const existing = await prisma.savingsMethodology.findUnique({ where: { version } });
  if (existing) {
    return NextResponse.json({ error: `Version "${version}" already exists` }, { status: 409 });
  }

  const methodology = await prisma.savingsMethodology.create({
    data: {
      version,
      description,
      isActive: false, // Activate explicitly via /activate endpoint
      maxSavingsCap,
      referenceBasketSize,
      multiplierExact,
      multiplierVerified,
      multiplierTypical,
      multiplierEstimated,
    },
  });

  return NextResponse.json(methodology, { status: 201 });
}
