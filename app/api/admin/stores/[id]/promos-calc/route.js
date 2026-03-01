// app/api/admin/stores/[id]/promos-calc/route.js
// GET — all OtherPromos for a store with calculator fields.
// Used by the Offers editor page (app/admin/stores/[id]/offers/page.jsx) PromosTab.
// Returns { data: promos[] } — no pagination (promos per store are typically < 20).

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
  const storeId = Number(id);

  if (!storeId) return NextResponse.json({ error: 'Invalid store id' }, { status: 400 });

  try {
    const promos = await prisma.otherPromo.findMany({
      where:   { storeId },
      orderBy: [{ discountCertainty: 'asc' }, { updatedAt: 'desc' }],
      select: {
        id:                 true,
        type:               true,
        discountPercent:    true,
        verifiedAvgPercent: true,
        discountCertainty:  true,
        stackGroup:         true,
        isStackable:        true,
        isCapped:           true,
        maxDiscountAmount:  true,
        minSpendAmount:     true,
        translations: { where: { locale: 'en' }, select: { title: true } },
      },
    });

    return NextResponse.json({ data: promos });
  } catch (error) {
    console.error('[promos-calc GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
