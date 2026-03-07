// app/api/admin/stacks/route.js
// GET — for every store that has ≥2 stackable offers (any mix of CODE/DEAL
//        vouchers + BANK_OFFER promos), returns ALL of those items so the
//        stacks manager page can render them faithfully.
//
// Nothing is computed or filtered here beyond "is this offer stackable and
// active?". The isFeaturedStack flag on vouchers is the only thing this
// endpoint is the authority on writing (via the PATCH below).
//
// Response: { data: StoreStack[], meta: { total, homepageFeatured } }

import { NextResponse }     from 'next/server';
import { prisma }           from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search       = searchParams.get('search')?.trim().toLowerCase() || '';
  const featuredOnly = searchParams.get('featured') === '1';

  const now = new Date();

  const [vouchers, promos] = await Promise.all([
    prisma.voucher.findMany({
      where: {
        isActive:    true,
        isStackable: true,
        stackGroup:  { in: ['CODE', 'DEAL'] },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      select: {
        id:                 true,
        code:               true,
        discount:           true,
        discountPercent:    true,
        verifiedAvgPercent: true,
        stackGroup:         true,
        isFeaturedStack:    true,
        expiryDate:         true,
        storeId:            true,
        translations: { where: { locale: 'en' }, select: { title: true } },
        store: {
          select: {
            id:   true,
            logo: true,
            translations: { where: { locale: 'en' }, select: { name: true, slug: true } },
          },
        },
      },
      orderBy: [{ storeId: 'asc' }, { stackGroup: 'asc' }, { verifiedAvgPercent: 'desc' }],
    }),

    prisma.otherPromo.findMany({
      where: {
        isActive:    true,
        isStackable: true,
        stackGroup:  'BANK_OFFER',
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      select: {
        id:                 true,
        discountPercent:    true,
        verifiedAvgPercent: true,
        storeId:            true,
        translations: { where: { locale: 'en' }, select: { title: true } },
        store: {
          select: {
            id:   true,
            logo: true,
            translations: { where: { locale: 'en' }, select: { name: true, slug: true } },
          },
        },
        bank: { select: { name: true, logo: true } },
      },
      orderBy: [{ storeId: 'asc' }, { verifiedAvgPercent: 'desc' }],
    }),
  ]);

  // ── Group by storeId ───────────────────────────────────────────────────────
  const byStore = new Map();

  const ensureStore = (storeId, storeRel) => {
    if (!byStore.has(storeId)) {
      const t = storeRel?.translations?.[0] || {};
      byStore.set(storeId, {
        storeId,
        storeName: t.name || `Store #${storeId}`,
        storeSlug: t.slug || '',
        storeLogo: storeRel?.logo || null,
        vouchers:  [],
        promos:    [],
      });
    }
    return byStore.get(storeId);
  };

  for (const v of vouchers) {
    ensureStore(v.storeId, v.store).vouchers.push({
      id:              v.id,
      itemType:        v.stackGroup,
      title:           v.translations?.[0]?.title || v.discount || '—',
      discount:        v.discount || null,
      discountPercent: v.verifiedAvgPercent ?? v.discountPercent ?? null,
      code:            v.code || null,
      isFeaturedStack: v.isFeaturedStack,
      expiryDate:      v.expiryDate,
    });
  }

  for (const p of promos) {
    ensureStore(p.storeId, p.store).promos.push({
      id:              p.id,
      itemType:        'BANK_OFFER',
      title:           p.translations?.[0]?.title || p.bank?.name || 'Bank Offer',
      discountPercent: p.verifiedAvgPercent ?? p.discountPercent ?? null,
      bankName:        p.bank?.name || null,
      bankLogo:        p.bank?.logo || null,
    });
  }

  // ── Build final list ───────────────────────────────────────────────────────
  let stacks = [];

  for (const entry of byStore.values()) {
    if (entry.vouchers.length + entry.promos.length < 2) continue;
    if (search && !entry.storeName.toLowerCase().includes(search)) continue;

    const isFeaturedStack = entry.vouchers.some(v => v.isFeaturedStack);
    if (featuredOnly && !isFeaturedStack) continue;

    // Best-case combined savings across all stackable items
    const bestByType = {};
    for (const v of entry.vouchers) {
      const pct = v.discountPercent || 0;
      if (pct > (bestByType[v.itemType] || 0)) bestByType[v.itemType] = pct;
    }
    for (const p of entry.promos) {
      const pct = p.discountPercent || 0;
      if (pct > (bestByType['BANK_OFFER'] || 0)) bestByType['BANK_OFFER'] = pct;
    }
    const percents = Object.values(bestByType).filter(p => p > 0).map(p => p / 100);
    const combinedSavingsPercent =
      percents.length >= 2
        ? Math.round((1 - percents.reduce((acc, p) => acc * (1 - p), 1)) * 100)
        : null;

    stacks.push({ ...entry, isFeaturedStack, combinedSavingsPercent });
  }

  stacks.sort((a, b) => {
    if (a.isFeaturedStack !== b.isFeaturedStack) return a.isFeaturedStack ? -1 : 1;
    return (b.combinedSavingsPercent || 0) - (a.combinedSavingsPercent || 0);
  });

  return NextResponse.json({
    data: stacks,
    meta: {
      total:            stacks.length,
      homepageFeatured: stacks.filter(s => s.isFeaturedStack).length,
    },
  });
}
