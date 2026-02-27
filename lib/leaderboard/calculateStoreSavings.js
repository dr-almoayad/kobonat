// lib/leaderboard/calculateStoreSavings.js
// Savings calculation engine.
// Handles stack groups, stackability flags, SAR caps,
// discount certainty haircuts, and verified average discounts.
// Called by the cron job only — never on a page request path.

import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// CERTAINTY_MULTIPLIER
//
// Default haircut values. These are overridden at runtime by the values
// stored in SavingsMethodology, so you can tune them without a code deploy.
//
// EXACT:     Bank offers, fixed % codes. The number is literally what you get.
// VERIFIED:  Admin checked real products and entered the true typical saving.
//            Treated the same as EXACT — full trust.
// TYPICAL:   Admin researched the store. Reasonable estimate. Small haircut.
// ESTIMATED: "Up to X% off" marketing headline. Use 35% of the stated figure.
//            e.g. "up to 80% off" → 80 × 0.35 = 28% input to the calculator.
// UNKNOWN:   No reliable number. Excluded from the calculator entirely.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MULTIPLIERS = {
  EXACT:     1.00,
  VERIFIED:  1.00,
  TYPICAL:   0.80,
  ESTIMATED: 0.35,
  UNKNOWN:   0.00,
};

// ─────────────────────────────────────────────────────────────────────────────
// resolveInputPercent
//
// Determines the actual percentage value the calculator uses for one offer.
// Priority order:
//   1. verifiedAvgPercent — admin has manually verified the true average.
//      Used at full face value regardless of discountCertainty.
//   2. discountPercent × certainty multiplier — headline figure adjusted
//      for reliability.
//   3. null → offer is excluded (UNKNOWN certainty or no number set).
//
// Examples:
//   { discountPercent: 80, certainty: ESTIMATED }          → 80 × 0.35 = 28
//   { discountPercent: 80, certainty: ESTIMATED,
//     verifiedAvgPercent: 22 }                             → 22 (verified wins)
//   { discountPercent: 20, certainty: EXACT }              → 20 × 1.00 = 20
//   { discountPercent: 15, certainty: TYPICAL }            → 15 × 0.80 = 12
//   { discountPercent: 30, certainty: UNKNOWN }            → null (excluded)
// ─────────────────────────────────────────────────────────────────────────────

function resolveInputPercent(offer, multipliers) {
  // verifiedAvgPercent always wins — admin has done the work
  if (offer.verifiedAvgPercent != null && offer.verifiedAvgPercent > 0) {
    return offer.verifiedAvgPercent;
  }

  if (offer.discountPercent == null || offer.discountPercent <= 0) return null;

  const certainty   = offer.discountCertainty ?? 'ESTIMATED';
  const multiplier  = multipliers[certainty] ?? 0;

  if (multiplier === 0) return null; // UNKNOWN — excluded

  return offer.discountPercent * multiplier;
}

// ─────────────────────────────────────────────────────────────────────────────
// effectivePercent
//
// Applies a SAR cap at the reference basket size to the resolved input percent.
//
// "28% off (adjusted), max 80 SAR" at 500 SAR basket:
//   raw saving = 500 × 0.28 = 140 SAR → hits cap at 80 → effective = 80/500 = 16%
// "20% off, max 200 SAR" at 500 SAR basket:
//   raw saving = 100 SAR → under cap → effective = 20%
// ─────────────────────────────────────────────────────────────────────────────

function effectivePercent(inputPct, offer, basketSize) {
  if (!offer.isCapped || offer.maxDiscountAmount == null) {
    return inputPct;
  }
  const rawSaving = basketSize * (inputPct / 100);
  if (rawSaving <= offer.maxDiscountAmount) {
    return inputPct; // cap not hit at this basket size
  }
  return (offer.maxDiscountAmount / basketSize) * 100; // cap hit → reduced rate
}

// ─────────────────────────────────────────────────────────────────────────────
// meetsMinSpend
//
// Excludes offers whose minimum basket requirement exceeds the reference size.
// A 500 SAR reference basket cannot realistically use a "min spend 1000 SAR" offer.
// ─────────────────────────────────────────────────────────────────────────────

function meetsMinSpend(offer, basketSize) {
  if (offer.minSpendAmount == null) return true;
  return basketSize >= offer.minSpendAmount;
}

// ─────────────────────────────────────────────────────────────────────────────
// compoundStack
//
// Applies discounts in sequence. Each step reduces the already-discounted price:
//   remaining = 100
//   for each pct: remaining *= (1 - pct/100)
//   saving = 100 - remaining
//
// [20, 15, 10] → 100 × 0.80 × 0.85 × 0.90 = 61.2 → saving = 38.8%
// This is NOT additive (20+15+10 = 45%) — compound is always less.
// ─────────────────────────────────────────────────────────────────────────────

function compoundStack(percentages) {
  let remaining = 100;
  for (const pct of percentages) {
    remaining *= (1 - pct / 100);
  }
  return Math.round((100 - remaining) * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// findBestPath
//
// Finds the combination of stack groups that produces the highest valid saving.
//
// Rules:
//   1. At most one offer per stack group (always — pick best within each group)
//   2. A multi-group combination is valid only if ALL offers have isStackable = true
//   3. A single offer is always a valid path (standalone needs no stackability)
//   4. BUNDLE and CASHBACK excluded (not point-of-sale % savings)
//   5. All valid subsets tried (2^n, n ≤ 4 in practice — exhaustive and correct)
//   6. Final result capped at methodology.maxSavingsCap
//
// byGroup: array of { group, offer, effectivePct }
// config:  { maxSavingsCap }
// returns: { saving, path }
// ─────────────────────────────────────────────────────────────────────────────

function findBestPath(byGroup, config) {
  const eligible = byGroup.filter(
    (b) => b.group !== 'BUNDLE' && b.group !== 'CASHBACK'
  );

  if (eligible.length === 0) {
    return { saving: 0, path: 'no eligible offers' };
  }

  let bestSaving = 0;
  let bestPath   = '';

  const n = eligible.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const selected = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) selected.push(eligible[i]);
    }

    const isValid =
      selected.length === 1 ||
      selected.every((b) => b.offer.isStackable);

    if (!isValid) continue;

    const saving = compoundStack(selected.map((b) => b.effectivePct));
    const capped = Math.min(saving, config.maxSavingsCap);
    const label  = selected
      .map((b) => `${b.group}(${b.effectivePct.toFixed(1)}%)`)
      .join(' + ');

    if (capped > bestSaving) {
      bestSaving = capped;
      bestPath   = label;
    }
  }

  return { saving: bestSaving, path: bestPath };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchStoreOffers
//
// Fetches all active vouchers and promos for a store.
// Includes the new certainty and verifiedAvgPercent fields.
// ─────────────────────────────────────────────────────────────────────────────

async function fetchStoreOffers(storeId, now) {
  const activeExpiry = {
    OR: [
      { expiryDate: null },
      { expiryDate: { gte: now } },
    ],
  };

  const [vouchers, promos] = await Promise.all([
    prisma.voucher.findMany({
      where: {
        storeId,
        stackGroup: { not: 'BUNDLE' },
        // Include rows where either discountPercent or verifiedAvgPercent is set
        OR: [
          { discountPercent:    { not: null, gt: 0 } },
          { verifiedAvgPercent: { not: null, gt: 0 } },
        ],
        ...activeExpiry,
      },
      select: {
        id:                  true,
        stackGroup:          true,
        isStackable:         true,
        discountPercent:     true,
        verifiedAvgPercent:  true,
        discountCertainty:   true,
        isCapped:            true,
        maxDiscountAmount:   true,
        minSpendAmount:      true,
      },
    }),

    prisma.otherPromo.findMany({
      where: {
        storeId,
        isActive: true,
        type:     { in: ['BANK_OFFER', 'CARD_OFFER', 'PAYMENT_OFFER'] },
        OR: [
          { discountPercent:    { not: null, gt: 0 } },
          { verifiedAvgPercent: { not: null, gt: 0 } },
        ],
        ...activeExpiry,
      },
      select: {
        id:                  true,
        stackGroup:          true,
        isStackable:         true,
        discountPercent:     true,
        verifiedAvgPercent:  true,
        discountCertainty:   true,
        isCapped:            true,
        maxDiscountAmount:   true,
        minSpendAmount:      true,
      },
    }),
  ]);

  const normalise = (source) => (item) => ({
    id:                  item.id,
    stackGroup:          item.stackGroup         ?? 'DEAL',
    isStackable:         item.isStackable,
    discountPercent:     item.discountPercent     ?? null,
    verifiedAvgPercent:  item.verifiedAvgPercent  ?? null,
    discountCertainty:   item.discountCertainty   ?? 'ESTIMATED',
    isCapped:            item.isCapped,
    maxDiscountAmount:   item.maxDiscountAmount   ?? null,
    minSpendAmount:      item.minSpendAmount      ?? null,
    source,
  });

  return [
    ...vouchers.map(normalise('voucher')),
    ...promos.map(normalise('promo')),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// buildMultipliers
//
// Reads haircut values from methodology. Falls back to defaults if the
// DB row doesn't have them (e.g. before the migration that added those columns).
// ─────────────────────────────────────────────────────────────────────────────

function buildMultipliers(methodology) {
  return {
    EXACT:     methodology.multiplierExact     ?? DEFAULT_MULTIPLIERS.EXACT,
    VERIFIED:  methodology.multiplierVerified  ?? DEFAULT_MULTIPLIERS.VERIFIED,
    TYPICAL:   methodology.multiplierTypical   ?? DEFAULT_MULTIPLIERS.TYPICAL,
    ESTIMATED: methodology.multiplierEstimated ?? DEFAULT_MULTIPLIERS.ESTIMATED,
    UNKNOWN:   0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateStoreSavings (public)
//
// Main entry point. Called once per store by the cron job.
// Returns the per-group breakdown and final calculated saving.
// ─────────────────────────────────────────────────────────────────────────────

export async function calculateStoreSavings(storeId, config) {
  const now        = new Date();
  const offers     = await fetchStoreOffers(storeId, now);
  const multipliers = buildMultipliers(config.methodology);

  // ── Step 1: resolve input percent for each offer ──────────────────────────
  // This applies the certainty haircut (or uses verifiedAvgPercent directly).
  // Offers that resolve to null are excluded.
  const withInput = offers
    .map((offer) => ({
      offer,
      inputPct: resolveInputPercent(offer, multipliers),
    }))
    .filter((o) => o.inputPct !== null && o.inputPct > 0);

  // ── Step 2: drop offers whose min spend exceeds the reference basket ───────
  const eligible = withInput.filter((o) =>
    meetsMinSpend(o.offer, config.referenceBasketSize)
  );

  if (eligible.length === 0) {
    return {
      bestDealPercent:             0,
      bestCodePercent:             0,
      bestBankOfferPercent:        0,
      calculatedMaxSavingsPercent: 0,
      stackingPath:                'no eligible offers',
    };
  }

  // ── Step 3: group by stackGroup, pick best effective % per group ──────────
  const groupMap = new Map();
  for (const { offer, inputPct } of eligible) {
    const arr = groupMap.get(offer.stackGroup) ?? [];
    arr.push({ offer, inputPct });
    groupMap.set(offer.stackGroup, arr);
  }

  const byGroup = [];
  for (const [group, groupOffers] of groupMap) {
    // Compute effective % (applies SAR cap) for each offer in the group
    const sorted = groupOffers
      .map(({ offer, inputPct }) => ({
        offer,
        effectivePct: effectivePercent(inputPct, offer, config.referenceBasketSize),
      }))
      .sort((a, b) => b.effectivePct - a.effectivePct);

    byGroup.push({
      group,
      offer:        sorted[0].offer,
      effectivePct: sorted[0].effectivePct,
    });
  }

  // ── Step 4: find best valid stacking combination ──────────────────────────
  const best = (g) => byGroup.find((b) => b.group === g)?.effectivePct ?? 0;
  const { saving, path } = findBestPath(byGroup, config);

  return {
    bestDealPercent:             best('DEAL'),
    bestCodePercent:             best('CODE'),
    bestBankOfferPercent:        best('BANK_OFFER'),
    calculatedMaxSavingsPercent: saving,
    stackingPath:                path,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getCurrentWeekIdentifier
// Returns ISO week string: "2026-W10"
// ─────────────────────────────────────────────────────────────────────────────

export function getCurrentWeekIdentifier(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    (((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
