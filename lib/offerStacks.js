// lib/offerStacks.js
// Builds "offer stacks" — combinations of 2–3 stackable offers for a store.
// A stack is any combination of: CODE voucher + DEAL voucher + BANK_OFFER promo.
// Returns serializable plain objects (no Prisma model instances).

import { prisma } from './prisma';

/**
 * @param {object} opts
 * @param {number|null}  opts.storeId      - filter to one store (store page); null = all stores
 * @param {string}       opts.countryCode  - e.g. 'SA'
 * @param {string}       opts.language     - 'ar' | 'en'
 * @param {number}       opts.limit        - max stacks to return
 * @param {boolean}      opts.homepageOnly - true = only vouchers with isFeaturedStack=true
 *                                           (used by homepage section; store page passes false)
 */
export async function buildOfferStacks({
  storeId      = null,
  countryCode  = 'SA',
  language     = 'ar',
  limit        = 8,
  homepageOnly = false,
} = {}) {
  const now = new Date();

  const [vouchers, promos] = await Promise.all([
    // ── Stackable CODE / DEAL vouchers ────────────────────────────────────
    prisma.voucher.findMany({
      where: {
        isStackable: true,
        stackGroup:  { in: ['CODE', 'DEAL'] },
        ...(homepageOnly && { isFeaturedStack: true }),
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
        ...(storeId && { storeId }),
        countries: { some: { country: { code: countryCode } } },
      },
      include: {
        translations: { where: { locale: language } },
        store: {
          include: {
            translations: { where: { locale: language } },
          },
        },
      },
      orderBy: [{ isFeaturedStack: 'desc' }, { isVerified: 'desc' }, { popularityScore: 'desc' }],
      take: storeId ? 30 : 150,
    }),

    // ── Stackable BANK_OFFER promos ───────────────────────────────────────
    prisma.otherPromo.findMany({
      where: {
        isActive:    true,
        isStackable: true,
        stackGroup:  'BANK_OFFER',
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
        ...(storeId && { storeId }),
        country: { code: countryCode },
      },
      include: {
        translations: { where: { locale: language } },
        store: {
          include: {
            translations: { where: { locale: language } },
          },
        },
        bank: {
        select: {
          id:   true,
          logo: true,
          translations: { where: { locale: language }, select: { name: true } },
        },
      },
      },
      take: storeId ? 15 : 75,
    }),
  ]);

  // ── Group by storeId (take first of each type) ───────────────────────────
  const byStore = new Map();

  for (const v of vouchers) {
    if (!byStore.has(v.storeId)) {
      byStore.set(v.storeId, { store: v.store, code: null, deal: null, bankOffer: null });
    }
    const entry = byStore.get(v.storeId);
    if (v.stackGroup === 'CODE' && !entry.code) entry.code = v;
    if (v.stackGroup === 'DEAL' && !entry.deal) entry.deal = v;
  }

  for (const p of promos) {
    // In homepage mode, only include a bank offer if the store already has
    // a qualifying (isFeaturedStack) voucher in the map.
    if (homepageOnly && !byStore.has(p.storeId)) continue;

    if (!byStore.has(p.storeId)) {
      byStore.set(p.storeId, { store: p.store, code: null, deal: null, bankOffer: null });
    }
    const entry = byStore.get(p.storeId);
    if (!entry.bankOffer) entry.bankOffer = p;
  }

  // ── Build serialisable stacks ─────────────────────────────────────────────
  const stacks = [];

  for (const [sid, data] of byStore) {
    const items = [];

    if (data.code) {
      const t = data.code.translations?.[0] || {};
      items.push({
        id:              data.code.id,
        itemType:        'CODE',
        title:           t.title || data.code.discount || 'Coupon Code',
        discount:        data.code.discount    || null,
        discountPercent: data.code.verifiedAvgPercent ?? data.code.discountPercent ?? null,
        code:            data.code.code        || null,
        landingUrl:      data.code.landingUrl  || null,
      });
    }

    if (data.deal) {
      const t = data.deal.translations?.[0] || {};
      items.push({
        id:              data.deal.id,
        itemType:        'DEAL',
        title:           t.title || data.deal.discount || 'Deal',
        discount:        data.deal.discount    || null,
        discountPercent: data.deal.verifiedAvgPercent ?? data.deal.discountPercent ?? null,
        code:            null,
        landingUrl:      data.deal.landingUrl  || null,
      });
    }

    if (data.bankOffer) {
      const t = data.bankOffer.translations?.[0] || {};
      items.push({
        id:              data.bankOffer.id,
        itemType:        'BANK_OFFER',
        title:           t.title || 'Bank Offer',
        discount:        null,
        discountPercent: data.bankOffer.verifiedAvgPercent ?? data.bankOffer.discountPercent ?? null,
        code:            null,
        landingUrl:      data.bankOffer.url    || null,
        bankName:        data.bankOffer.bank?.translations?.[0]?.name || null,
        bankLogo:        data.bankOffer.bank?.logo || null,
      });
    }

    if (items.length < 2) continue;

    // ── Combined savings estimate ─────────────────────────────────────────
    const percents = items
      .map(i => (i.discountPercent || 0) / 100)
      .filter(p => p > 0);

    const combinedSavingsPercent =
      percents.length >= 2
        ? Math.round((1 - percents.reduce((acc, p) => acc * (1 - p), 1)) * 100)
        : null;

    const storeTrans = data.store?.translations?.[0] || {};

    stacks.push({
      storeId:  sid,
      store: {
        id:   data.store?.id   || sid,
        name: storeTrans.name  || '',
        slug: storeTrans.slug  || '',
        logo: data.store?.logo || null,
      },
      items,
      combinedSavingsPercent,
    });
  }

  // ── Sort by combined savings, highest first ───────────────────────────────
  stacks.sort((a, b) => (b.combinedSavingsPercent || 0) - (a.combinedSavingsPercent || 0));

  return stacks.slice(0, limit);
}
