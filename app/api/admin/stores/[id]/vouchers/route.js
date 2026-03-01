// app/api/admin/stores/[id]/vouchers/route.js
// GET — paginated vouchers for a store, includes all calculator fields
// Query params: page, limit, certainty (filter), stackGroup (filter), search

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

  const { searchParams } = new URL(request.url);
  const page       = Math.max(1, Number(searchParams.get('page')  || 1));
  const limit      = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
  const certainty  = searchParams.get('certainty');
  const stackGroup = searchParams.get('stackGroup');
  const search     = searchParams.get('search')?.trim();
  const expired    = searchParams.get('expired') === 'true';

  const now = new Date();
  const where = {
    storeId,
    ...(certainty  && { discountCertainty: certainty }),
    ...(stackGroup && { stackGroup }),
    ...(!expired   && { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] }),
    ...(search && {
      translations: { some: { locale: 'en', title: { contains: search, mode: 'insensitive' } } },
    }),
  };

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

  return NextResponse.json({ data: vouchers, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}
