// lib/offerStacks.js
// Builds "offer stacks" for display.
// Priority: explicitly-defined OfferStack records → auto-pick fallback.

import { prisma } from './prisma';

const VOUCHER_SELECT = (language) => ({
  id:              true,
  code:            true,
  type:            true,
  discount:        true,
  discountPercent: true,
  verifiedAvgPercent: true,
  landingUrl:      true,
  isFeaturedStack: true,
  expiryDate:      true,
  translations: { where: { locale: language }, select: { title: true } },
  countries: { select: { country: { select: { code: true } } } },
  store: {
    select: {
      id: true, logo: true,
      translations: { where: { locale: language }, select: { name: true, slug: true } },
    },
  },
});

const PROMO_SELECT = (language) => ({
  id:              true,
  type:            true,
  url:             true,
  image:           true,
  discountPercent: true,
  verifiedAvgPercent: true,
  isActive:        true,
  expiryDate:      true,
  translations: { where: { locale: language }, select: { title: true } },
  country: { select: { code: true } },
  bank: { include: { translations: { where: { locale: language } } } },
  store: {
    select: {
      id: true, logo: true,
      translations: { where: { locale: language }, select: { name: true, slug: true } },
    },
  },
});

export function serializeStack({ store, codeVoucher, dealVoucher, promo, language }) {
  const items = [];

  if (codeVoucher) {
    const t = codeVoucher.translations?.[0] || {};
    items.push({
      id:              codeVoucher.id,
      itemType:        'CODE',
      title:           t.title || codeVoucher.discount || 'Coupon Code',
      discount:        codeVoucher.discount    || null,
      discountPercent: codeVoucher.verifiedAvgPercent ?? codeVoucher.discountPercent ?? null,
      code:            codeVoucher.code        || null,
      landingUrl:      codeVoucher.landingUrl  || null,
    });
  }

  if (dealVoucher) {
    const t = dealVoucher.translations?.[0] || {};
    items.push({
      id:              dealVoucher.id,
      itemType:        'DEAL',
      title:           t.title || dealVoucher.discount || 'Deal',
      discount:        dealVoucher.discount    || null,
      discountPercent: dealVoucher.verifiedAvgPercent ?? dealVoucher.discountPercent ?? null,
      code:            null,
      landingUrl:      dealVoucher.landingUrl  || null,
    });
  }

  if (promo) {
    const t = promo.translations?.[0] || {};
    items.push({
      id:              promo.id,
      itemType:        'BANK_OFFER',
      title:           t.title || 'Bank Offer',
      discount:        null,
      discountPercent: promo.verifiedAvgPercent ?? promo.discountPercent ?? null,
      code:            null,
      landingUrl:      promo.url || null,
      bankName:        promo.bank?.translations?.[0]?.name || null,
      bankLogo:        promo.bank?.logo || promo.image || null,
    });
  }

  if (items.length < 2) return null;

  const percents = items.map(i => (i.discountPercent || 0) / 100).filter(p => p > 0);
  const combinedSavingsPercent = percents.length >= 2
    ? Math.round((1 - percents.reduce((acc, p) => acc * (1 - p), 1)) * 100)
    : null;

  const storeTrans = store?.translations?.[0] || {};
  return {
    storeId: store?.id,
    store: { id: store?.id, name: storeTrans.name || '', slug: storeTrans.slug || '', logo: store?.logo || null },
    items,
    combinedSavingsPercent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
export async function buildOfferStacks({
  storeId      = null,
  countryCode  = 'SA',
  language     = 'ar',
  limit        = 8,
  homepageOnly = false,
} = {}) {
  const now = new Date();

  // ── 1. Read explicitly-defined stacks ────────────────────────────────────
  const definedRows = await prisma.offerStack.findMany({
    where:   { isActive: true, ...(storeId && { storeId }) },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take:    limit * 4,
    include: {
      store: {
        select: {
          id: true, logo: true,
          translations: { where: { locale: language }, select: { name: true, slug: true } },
        },
      },
      codeVoucher: { select: VOUCHER_SELECT(language) },
      dealVoucher: { select: VOUCHER_SELECT(language) },
      promo:       { select: PROMO_SELECT(language)   },
    },
  });

  const stacks = [];

  for (const ds of definedRows) {
    const codeOk = !ds.codeVoucher || (
      (!ds.codeVoucher.expiryDate || ds.codeVoucher.expiryDate >= now) &&
      ds.codeVoucher.countries?.some(c => c.country.code === countryCode)
    );
    const dealOk = !ds.dealVoucher || (
      (!ds.dealVoucher.expiryDate || ds.dealVoucher.expiryDate >= now) &&
      ds.dealVoucher.countries?.some(c => c.country.code === countryCode)
    );
    const promoOk = !ds.promo || (
      ds.promo.isActive &&
      (!ds.promo.expiryDate || ds.promo.expiryDate >= now) &&
      ds.promo.country?.code === countryCode
    );

    if (homepageOnly) {
      const hasFeatured = ds.codeVoucher?.isFeaturedStack || ds.dealVoucher?.isFeaturedStack;
      if (!hasFeatured) continue;
    }

    const serialized = serializeStack({
      store:       ds.store,
      codeVoucher: codeOk ? ds.codeVoucher : null,
      dealVoucher: dealOk ? ds.dealVoucher : null,
      promo:       promoOk ? ds.promo      : null,
      language,
    });
    if (serialized) stacks.push(serialized);
    if (stacks.length >= limit) break;
  }

  if (stacks.length > 0) return stacks;

  // ── 2. Auto-pick fallback ─────────────────────────────────────────────────
  console.log('[offerStacks] No defined stacks — using auto-pick fallback.');

  const [vouchers, promos] = await Promise.all([
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
        store: { include: { translations: { where: { locale: language } } } },
      },
      orderBy: [{ isFeaturedStack: 'desc' }, { isVerified: 'desc' }, { popularityScore: 'desc' }],
      take: storeId ? 30 : 150,
    }),

    prisma.otherPromo.findMany({
      where: {
        isActive: true, isStackable: true, stackGroup: 'BANK_OFFER',
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
        ...(storeId && { storeId }),
        country: { code: countryCode },
      },
      include: {
        translations: { where: { locale: language } },
        store:        { include: { translations: { where: { locale: language } } } },
        bank:         { include: { translations: { where: { locale: language } } } },
      },
      take: storeId ? 15 : 75,
    }),
  ]);

  if (promos.length > 0) {
    const s = promos[0];
    console.log('[offerStacks] sample promo bank:', JSON.stringify({
      promoId: s.id, bankId: s.bankId,
      bank: s.bank ? { logo: s.bank.logo, name: s.bank.translations?.[0]?.name } : null,
      promoImage: s.image,
    }));
  }

  const byStore = new Map();
  for (const v of vouchers) {
    if (!byStore.has(v.storeId)) byStore.set(v.storeId, { store: v.store, code: null, deal: null, bankOffer: null });
    const e = byStore.get(v.storeId);
    if (v.stackGroup === 'CODE' && !e.code) e.code = v;
    if (v.stackGroup === 'DEAL' && !e.deal) e.deal = v;
  }
  for (const p of promos) {
    if (homepageOnly && !byStore.has(p.storeId)) continue;
    if (!byStore.has(p.storeId)) byStore.set(p.storeId, { store: p.store, code: null, deal: null, bankOffer: null });
    const e = byStore.get(p.storeId);
    if (!e.bankOffer) e.bankOffer = p;
  }

  const autoStacks = [];
  for (const [, data] of byStore) {
    const serialized = serializeStack({
      store: data.store, codeVoucher: data.code, dealVoucher: data.deal, promo: data.bankOffer, language,
    });
    if (serialized) autoStacks.push(serialized);
  }
  autoStacks.sort((a, b) => (b.combinedSavingsPercent || 0) - (a.combinedSavingsPercent || 0));
  return autoStacks.slice(0, limit);
}
