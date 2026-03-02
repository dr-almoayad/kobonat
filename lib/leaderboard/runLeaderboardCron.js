// lib/leaderboard/runLeaderboardCron.js
// Weekly recalculation job.
// Triggered by Vercel Cron every Monday 00:00 UTC via /api/cron/leaderboard.

import { prisma } from '@/lib/prisma';
import { calculateStoreSavings, getCurrentWeekIdentifier } from './calculateStoreSavings.js';

// ─────────────────────────────────────────────────────────────────────────────
// assignRanks
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
// persistSnapshots (fixed — no upsert with nullable unique key)
// ─────────────────────────────────────────────────────────────────────────────
async function persistSnapshots(ranked, weekIdentifier, methodologyId) {
  const operations = [];

  for (const store of ranked) {
    const data = {
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
      calculatedAt:                new Date(),
    };

    const op = prisma.storeSavingsSnapshot
      .findFirst({
        where: {
          storeId:        store.storeId,
          categoryId:     store.categoryId,
          weekIdentifier,
        },
      })
      .then((existing) => {
        if (existing) {
          return prisma.storeSavingsSnapshot.update({
            where: { id: existing.id },
            data,
          });
        } else {
          return prisma.storeSavingsSnapshot.create({ data });
        }
      });

    operations.push(op);
  }

  await prisma.$transaction(operations);
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
// ─────────────────────────────────────────────────────────────────────────────
export async function runLeaderboardCron() {
  const weekIdentifier = getCurrentWeekIdentifier();
  const errors         = [];
  let   processed      = 0;

  // 1. Active methodology
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
    methodology,
  };

  // 2. All active stores with categories
  const stores = await prisma.store.findMany({
    where:  { isActive: true },
    select: {
      id:         true,
      categories: { select: { categoryId: true } },
    },
  });

  // 3. Previous week's ranks for movement
  const prevWeek           = getPreviousWeekIdentifier();
  const previousSnapshots  = await prisma.storeSavingsSnapshot.findMany({
    where:  { weekIdentifier: prevWeek },
    select: { storeId: true, categoryId: true, rank: true },
  });

  const previousRankMap = new Map();
  for (const snap of previousSnapshots) {
    previousRankMap.set(`${snap.storeId}-${snap.categoryId ?? 'global'}`, snap.rank);
  }

  // 4. Calculate savings per store
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

      for (const { categoryId } of store.categories) {
        if (!categoryScores.has(categoryId)) categoryScores.set(categoryId, []);
        categoryScores.get(categoryId).push({ ...baseScore, categoryId });
      }

      processed++;
    } catch (err) {
      errors.push(`Store ${store.id}: ${err.message ?? String(err)}`);
    }
  }

  // 5. Rank and persist
  const rankedGlobal = assignRanks(globalScores, previousRankMap);
  await persistSnapshots(rankedGlobal, weekIdentifier, methodology.id);

  for (const [, scores] of categoryScores) {
    const ranked = assignRanks(scores, previousRankMap);
    await persistSnapshots(ranked, weekIdentifier, methodology.id);
  }

  return { processed, errors };
}
