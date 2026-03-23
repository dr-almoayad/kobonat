// app/api/admin/stacks/route.js
// GET — all OfferStack records across all stores (for the global overview page).
// Uses the explicit OfferStack model, NOT the dynamic isStackable approach.

import { NextResponse }     from 'next/server';
import { prisma }           from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

const STACK_INCLUDE = {
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
  codeVoucher: {
    select: {
      id: true, code: true, discount: true, discountPercent: true, verifiedAvgPercent: true,
      translations: { where: { locale: 'en' }, select: { title: true } },
    },
  },
  dealVoucher: {
    select: {
      id: true, code: true, discount: true, discountPercent: true, verifiedAvgPercent: true,
      translations: { where: { locale: 'en' }, select: { title: true } },
    },
  },
  promo: {
    select: {
      id: true, type: true, discountPercent: true, verifiedAvgPercent: true,
      translations: { where: { locale: 'en' }, select: { title: true } },
      bank: {
        select: {
          id: true, logo: true,
          translations: { where: { locale: 'en' }, select: { name: true } },
        },
      },
    },
  },
};

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search       = searchParams.get('search')?.trim().toLowerCase() || '';
  const activeOnly   = searchParams.get('active') === '1';
  const storeId      = searchParams.get('storeId') ? parseInt(searchParams.get('storeId')) : null;

  try {
    const where = {
      ...(activeOnly && { isActive: true }),
      ...(storeId    && { storeId }),
      ...(search && {
        store: {
          translations: {
            some: { locale: 'en', name: { contains: search, mode: 'insensitive' } },
          },
        },
      }),
    };

    const stacks = await prisma.offerStack.findMany({
      where,
      include: STACK_INCLUDE,
      orderBy: [{ storeId: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    });

    // Group by store for the overview display
    const byStore = new Map();
    for (const stack of stacks) {
      const sid = stack.storeId;
      if (!byStore.has(sid)) {
        byStore.set(sid, {
          storeId:   sid,
          storeName: stack.store?.translations?.[0]?.name || `Store #${sid}`,
          storeSlug: stack.store?.translations?.[0]?.slug || '',
          storeLogo: stack.store?.logo || null,
          stacks:    [],
        });
      }
      byStore.get(sid).stacks.push(stack);
    }

    return NextResponse.json({
      data:  [...byStore.values()],
      meta: {
        total:       stacks.length,
        storeCount:  byStore.size,
        activeCount: stacks.filter(s => s.isActive).length,
      },
    });
  } catch (err) {
    console.error('[/api/admin/stacks]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
