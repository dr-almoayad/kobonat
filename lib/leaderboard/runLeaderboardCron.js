// lib/leaderboard/runLeaderboardCron.js
// Weekly recalculation job.
// Triggered by Vercel Cron every Monday 00:00 UTC via /api/cron/leaderboard.
// Safe to re-run: all writes use upsert on @@unique([storeId, categoryId, weekIdentifier]).

import { prisma } from '@/lib/prisma';
import { calculateStoreSavings, getCurrentWeekIdentifier } from './calculateStoreSavings.js';

// ─────────────────────────────────────────────────────────────────────────────
// assignRanks
//
// Takes a flat array of store scores, sorts by effective saving descending,
// assigns rank numbers, and determines movement vs previous week.
//
// previousRankMap: Map<"storeId-categoryId|global", rank>
// ─────────────────────────────────────────────────────────────────────────────

function assignRanks(scores, previousRankMap) {
  const sorted = [...scores].sort((a, b) => {
    const aEff = a.savingsOverridePercent ?? a.calculatedMaxSavingsPercent;
    const bEff = b.savingsOverridePercent ?? b.calculatedMaxSavingsPercent;
    return bEff - aEff;
  });

  return sorted.map((store, idx) => {
    const rank         = idx + 1;
    const key          = `${store.storeId}-${store.categoryId ?? 'global'}`;
    const previousRank = previousRankMap.get(key) ?? null;

    let movement;
    if (previousRank === null)      movement = 'NEW';
    else if (rank < previousRank)   movement = 'UP';
    else if (rank > previousRank)   movement = 'DOWN';
    else                            movement = 'SAME';

    return { ...store, rank, previousRank, movement };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// persistSnapshots
//
// Upserts a ranked array into StoreSavingsSnapshot.
// Idempotent: re-running with the same weekIdentifier updates existing rows.
// Wrapped in a transaction so a partial failure doesn't leave a mixed state.
// ─────────────────────────────────────────────────────────────────────────────

async function persistSnapshots(ranked, weekIdentifier, methodologyId) {
  await prisma.$transaction(
    ranked.map((store) =>
      prisma.storeSavingsSnapshot.upsert({
        where: {
          storeId_categoryId_weekIdentifier: {
            storeId:        store.storeId,
            categoryId:     store.categoryId,
            weekIdentifier,
          },
        },
        create: {
          storeId:                     store.storeId,
          categoryId:                  store.categoryId,
          maxDirectDiscountPercent:    store.bestDealPercent,
          maxCouponPercent:            store.bestCodePercent,
          maxBankOfferPercent:         store.bestBankOfferPercent,
          calculatedMaxSavingsPercent: store.calculatedMaxSavingsPercent,
          savingsOverridePercent:      store.savingsOverridePercent ?? null,
          rank:                        store.rank,
          previousRank:                store.previousRank,
          movement:                    store.movement,
          weekIdentifier,
          methodologyId,
        },
        update: {
          maxDirectDiscountPercent:    store.bestDealPercent,
          maxCouponPercent:            store.bestCodePercent,
          maxBankOfferPercent:         store.bestBankOfferPercent,
          calculatedMaxSavingsPercent: store.calculatedMaxSavingsPercent,
          rank:                        store.rank,
          previousRank:                store.previousRank,
          movement:                    store.movement,
          methodologyId,
          calculatedAt:                new Date(),
        },
      })
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// getPreviousWeekIdentifier
// ─────────────────────────────────────────────────────────────────────────────

function getPreviousWeekIdentifier() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return getCurrentWeekIdentifier(d);
}

// ─────────────────────────────────────────────────────────────────────────────
// runLeaderboardCron (public)
//
// Steps:
//   1. Load active methodology (formula config)
//   2. Load all active stores + their category memberships
//   3. Load previous week's ranks for movement calculation
//   4. For each store: calculate savings, get admin override if set
//   5. Assign ranks globally and per category
//   6. Upsert all snapshots
//
// Returns: { processed: number, errors: string[] }
// ─────────────────────────────────────────────────────────────────────────────

export async function runLeaderboardCron() {
  const weekIdentifier = getCurrentWeekIdentifier();
  const errors         = [];
  let   processed      = 0;

  // ── 1. Active methodology ──────────────────────────────────────────────────
  const methodology = await prisma.savingsMethodology.findFirst({
    where:   { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!methodology) {
    throw new Error('No active SavingsMethodology found. Seed one first.');
  }

  const config = {
    maxSavingsCap:       methodology.maxSavingsCap,
    referenceBasketSize: methodology.referenceBasketSize ?? 500,
    // Pass the full methodology row so calculateStoreSavings can read
    // the certainty multipliers (multiplierExact, multiplierEstimated, etc.)
    methodology,
  };

  // ── 2. All active stores with their categories ────────────────────────────
  const stores = await prisma.store.findMany({
    where:  { isActive: true },
    select: {
      id:         true,
      categories: { select: { categoryId: true } },
    },
  });

  // ── 3. Previous week's ranks for movement ─────────────────────────────────
  const prevWeek           = getPreviousWeekIdentifier();
  const previousSnapshots  = await prisma.storeSavingsSnapshot.findMany({
    where:  { weekIdentifier: prevWeek },
    select: { storeId: true, categoryId: true, rank: true },
  });

  const previousRankMap = new Map();
  for (const snap of previousSnapshots) {
    previousRankMap.set(`${snap.storeId}-${snap.categoryId ?? 'global'}`, snap.rank);
  }

  // ── 4. Calculate savings per store ────────────────────────────────────────
  const globalScores    = [];
  const categoryScores  = new Map(); // categoryId → StoreScore[]

  for (const store of stores) {
    try {
      const components = await calculateStoreSavings(store.id, config);

      // Check if an admin has pinned a manual override for this store
      const override = await prisma.storeSavingsSnapshot.findFirst({
        where: {
          storeId:                store.id,
          categoryId:             null,
          savingsOverridePercent: { not: null },
        },
        orderBy: { calculatedAt: 'desc' },
        select:  { savingsOverridePercent: true },
      });

      const baseScore = {
        storeId:                     store.id,
        categoryId:                  null,
        bestDealPercent:             components.bestDealPercent,
        bestCodePercent:             components.bestCodePercent,
        bestBankOfferPercent:        components.bestBankOfferPercent,
        calculatedMaxSavingsPercent: components.calculatedMaxSavingsPercent,
        savingsOverridePercent:      override?.savingsOverridePercent ?? null,
      };

      globalScores.push(baseScore);

      // Also add to each category leaderboard this store belongs to
      for (const { categoryId } of store.categories) {
        if (!categoryScores.has(categoryId)) categoryScores.set(categoryId, []);
        categoryScores.get(categoryId).push({ ...baseScore, categoryId });
      }

      processed++;
    } catch (err) {
      errors.push(`Store ${store.id}: ${err.message ?? String(err)}`);
    }
  }

  // ── 5. Rank and persist ───────────────────────────────────────────────────

  // Global leaderboard (categoryId = null)
  const rankedGlobal = assignRanks(globalScores, previousRankMap);
  await persistSnapshots(rankedGlobal, weekIdentifier, methodology.id);

  // Per-category leaderboards
  for (const [, scores] of categoryScores) {
    const ranked = assignRanks(scores, previousRankMap);
    await persistSnapshots(ranked, weekIdentifier, methodology.id);
  }

  return { processed, errors };
}
