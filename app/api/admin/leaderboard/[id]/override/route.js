// app/api/admin/leaderboard/[id]/override/route.js
// PATCH — set or clear a manual override on a snapshot
//
// Body:
//   { savingsOverridePercent: 35.5 }  — set override
//   { savingsOverridePercent: null }  — clear override (revert to calculated)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]';


export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const id   = Number(params.id);
  const body = await request.json();

  const override = body.savingsOverridePercent;

  if (override !== null && override !== undefined) {
    if (typeof override !== 'number' || override < 0 || override > 100) {
      return NextResponse.json(
        { error: 'savingsOverridePercent must be a number between 0 and 100, or null to clear' },
        { status: 400 }
      );
    }
  }

  const snapshot = await prisma.storeSavingsSnapshot.update({
    where: { id },
    data:  { savingsOverridePercent: override ?? null },
    select: {
      id:                          true,
      calculatedMaxSavingsPercent: true,
      savingsOverridePercent:      true,
      store: {
        select: {
          translations: { where: { locale: 'en' }, select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(snapshot);
}
