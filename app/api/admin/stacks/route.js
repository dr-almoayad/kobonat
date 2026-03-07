// app/api/admin/stacks/route.js
// GET — Returns all stores that have ≥2 stackable offers (any combination of
//        CODE/DEAL voucher + DEAL voucher + BANK_OFFER promo).
//        Used by the /admin/stacks manager page.
//
// Response shape:
//   { data: StackEntry[], meta: { total, homepageFeatured } }
//
// StackEntry:
//   {
//     storeId, storeName, storeSlug, storeLogo,
//     items: [ { id, source:'voucher'|'promo', itemType, title, discount,
//                discountPercent, code, isFeaturedStack } ],
//     combinedSavingsPercent,
//     anyFeaturedStack,   // true if ANY item.isFeaturedStack = true
//   }

import { NextResponse } from 'next/server';
import { prisma }       from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions }  from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search       = searchParams.get('search')?.trim().toLowerCase() || '';
  const featuredOnly = searchParams.get('featured') === '1';

  const now = new Date();

  // ── Fetch stackable vouchers + promos in parallel ──────────────────────────
  const [vouchers, promos] = await Promise.all([
    prisma.voucher.findMany({
      where: {
        isStackable: true,
        stackGroup:  { in: ['CODE', 'DEAL'] },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      select: {
        id:                 true,
        code:               true,
        type:               true,
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
            id:    true,
            logo:  true,
            translations: { where: { locale: 'en' }, select: { name: true, slug: true } },
          },
        },
      },
      orderBy: [{ isFeaturedStack: 'desc' }, { storeId: 'asc' }],
    }),

    prisma.otherPromo.findMany({
      where: {
        isStackable: true,
        stackGroup:  'BANK_OFFER',
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      select: {
        id:                 true,
        type:               true,
        discountPercent:    true,
        verifiedAvgPercent: true,
        stackGroup:         true,
        storeId:            true,
        translations: { where: { locale: 'en' }, select: { title: true } },
        store: {
          select: {
            id:    true,
            logo:  true,
            translations: { where: { locale: 'en' }, select: { name: true, slug: true } },
          },
        },
        bank: { select: { name: true } },
      },
    }),
  ]);

  // ── Group by storeId ───────────────────────────────────────────────────────
  const byStore = new Map(); // storeId → { store, code, deal, bankOffer }

  for (const v of vouchers) {
    if (!byStore.has(v.storeId)) {
      byStore.set(v.storeId, { store: v.store, code: null, deal: null, bankOffer: null });
    }
    const entry = byStore.get(v.storeId);
    if (v.stackGroup === 'CODE' && !entry.code) entry.code = v;
    if (v.stackGroup === 'DEAL' && !entry.deal) entry.deal = v;
  }

  for (const p of promos) {
    if (!byStore.has(p.storeId)) {
      byStore.set(p.storeId, { store: p.store, code: null, deal: null, bankOffer: null });
    }
    const entry = byStore.get(p.storeId);
    if (!entry.bankOffer) entry.bankOffer = p;
  }

  // ── Build stack entries ────────────────────────────────────────────────────
  let stacks = [];

  for (const [storeId, data] of byStore) {
    const storeTrans = data.store?.translations?.[0] || {};
    const storeName  = storeTrans.name || `Store #${storeId}`;
    const storeSlug  = storeTrans.slug || '';

    // Search filter
    if (search && !storeName.toLowerCase().includes(search)) continue;

    const items = [];

    if (data.code) {
      const t    = data.code.translations?.[0] || {};
      const pct  = data.code.verifiedAvgPercent ?? data.code.discountPercent ?? null;
      items.push({
        id:              data.code.id,
        source:          'voucher',
        itemType:        'CODE',
        title:           t.title || data.code.discount || 'Coupon Code',
        discount:        data.code.discount || null,
        discountPercent: pct,
        code:            data.code.code || null,
        isFeaturedStack: data.code.isFeaturedStack,
        expiryDate:      data.code.expiryDate,
      });
    }

    if (data.deal) {
      const t   = data.deal.translations?.[0] || {};
      const pct = data.deal.verifiedAvgPercent ?? data.deal.discountPercent ?? null;
      items.push({
        id:              data.deal.id,
        source:          'voucher',
        itemType:        'DEAL',
        title:           t.title || data.deal.discount || 'Deal',
        discount:        data.deal.discount || null,
        discountPercent: pct,
        code:            null,
        isFeaturedStack: data.deal.isFeaturedStack,
        expiryDate:      data.deal.expiryDate,
      });
    }

    if (data.bankOffer) {
      const t   = data.bankOffer.translations?.[0] || {};
      const pct = data.bankOffer.verifiedAvgPercent ?? data.bankOffer.discountPercent ?? null;
      items.push({
        id:              data.bankOffer.id,
        source:          'promo',
        itemType:        'BANK_OFFER',
        title:           t.title || data.bankOffer.bank?.name || 'Bank Offer',
        discount:        null,
        discountPercent: pct,
        code:            null,
        isFeaturedStack: false, // promos don't have this field
        expiryDate:      null,
      });
    }

    if (items.length < 2) continue;

    const percents = items
      .map(i => (i.discountPercent || 0) / 100)
      .filter(p => p > 0);

    const combinedSavingsPercent =
      percents.length >= 2
        ? Math.round((1 - percents.reduce((acc, p) => acc * (1 - p), 1)) * 100)
        : null;

    // A stack is "homepage featured" if any CODE or DEAL voucher in it is isFeaturedStack
    const anyFeaturedStack = items
      .filter(i => i.source === 'voucher')
      .some(i => i.isFeaturedStack);

    if (featuredOnly && !anyFeaturedStack) continue;

    stacks.push({
      storeId,
      storeName,
      storeSlug,
      storeLogo: data.store?.logo || null,
      items,
      combinedSavingsPercent,
      anyFeaturedStack,
    });
  }

  // Sort: homepage-featured first, then by combined savings
  stacks.sort((a, b) => {
    if (a.anyFeaturedStack !== b.anyFeaturedStack)
      return a.anyFeaturedStack ? -1 : 1;
    return (b.combinedSavingsPercent || 0) - (a.combinedSavingsPercent || 0);
  });

  const homepageFeatured = stacks.filter(s => s.anyFeaturedStack).length;

  return NextResponse.json({
    data: stacks,
    meta: { total: stacks.length, homepageFeatured },
  });
}
