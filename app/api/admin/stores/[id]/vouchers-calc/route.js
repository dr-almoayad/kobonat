// app/api/admin/stores/[id]/vouchers-calc/route.js
// GET — paginated vouchers for a store with all calculator fields.
// Used by the Offers editor page (app/admin/stores/[id]/offers/page.jsx).
//
// Query params:
//   page        (default 1)
//   limit       (default 50, max 200)
//   search      partial title match
//   certainty   EXACT | VERIFIED | TYPICAL | ESTIMATED | UNKNOWN
//   stackGroup  DEAL | CODE | CASHBACK | BUNDLE
//   expired     "true" | "false" (default false)

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

  const { searchParams } = new URL(request.url);
  const page       = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit      = Math.min(200, parseInt(searchParams.get('limit') || '50'));
  const search     = searchParams.get('search')?.trim();
  const certainty  = searchParams.get('certainty')?.trim();
  const stackGroup = searchParams.get('stackGroup')?.trim();
  const expired    = searchParams.get('expired') === 'true';

  const now = new Date();

  const where = {
    storeId,
    ...(certainty  && { discountCertainty: certainty }),
    ...(stackGroup && { stackGroup }),
    ...(!expired   && { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] }),
    ...(search     && {
      translations: { some: { locale: 'en', title: { contains: search, mode: 'insensitive' } } }
    }),
  };

  try {
    const [total, vouchers] = await Promise.all([
      prisma.voucher.count({ where }),
      prisma.voucher.findMany({
        where,
        orderBy: [{ discountCertainty: 'asc' }, { updatedAt: 'desc' }],
        skip:    (page - 1) * limit,
        take:    limit,
        select: {
          id:                 true,
          code:               true,
          type:               true,
          discount:           true,
          discountPercent:    true,
          verifiedAvgPercent: true,
          discountCertainty:  true,
          stackGroup:         true,
          isStackable:        true,
          isCapped:           true,
          maxDiscountAmount:  true,
          minSpendAmount:     true,
          isVerified:         true,
          isExclusive:        true,
          expiryDate:         true,
          translations: { where: { locale: 'en' }, select: { title: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: vouchers,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[vouchers-calc GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
