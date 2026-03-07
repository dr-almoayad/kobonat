// lib/banks/calculateBankNicheScores.js
// Uses Category rows where bankScoringWeights IS NOT NULL as the niche definitions.
// No separate BankNiche model needed.

import { prisma } from '@/lib/prisma';

export function getCurrentWeekIdentifier() {
  const now  = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ─── Raw criterion extractors ─────────────────────────────────────────────────
function extractCriteria(bank, card, activeOfferCount) {
  return {
    travelCashback:     card?.cashbackTravel    ?? card?.cashbackGeneral ?? 0,
    shoppingCashback:   card?.cashbackShopping  ?? card?.cashbackGeneral ?? 0,
    onlineCashback:     card?.cashbackOnline    ?? card?.cashbackGeneral ?? 0,
    diningCashback:     card?.cashbackDining    ?? card?.cashbackGeneral ?? 0,
    fuelCashback:       card?.cashbackFuel      ?? card?.cashbackGeneral ?? 0,
    gamingCashback:     card?.cashbackGaming    ?? card?.cashbackOnline  ?? card?.cashbackGeneral ?? 0,
    groceryCashback:    card?.cashbackGroceries ?? card?.cashbackGeneral ?? 0,
    healthcareCashback: card?.cashbackHealthcare ?? card?.cashbackGeneral ?? 0,
    generalCashback:    card?.cashbackGeneral   ?? 0,
    loungeAccess:       card?.loungeAccessPerYear  ?? 0,
    travelInsurance:    card?.hasTravelInsurance   ? 1 : 0,
    foreignTxFee:       card?.foreignTxFeePercent  ?? 3,   // lower is better
    purchaseProtection: card?.hasPurchaseProtection ? 1 : 0,
    installmentMonths:  card?.maxInstallmentMonths  ?? 0,
    annualFee:          card?.annualFee             ?? 0,   // lower is better
    activeOfferBonus:   activeOfferCount,
    appRating:          bank?.appRating             ?? 3.0,
  };
}

// ─── Scale ceiling per criterion ──────────────────────────────────────────────
const MAX = {
  travelCashback: 10, shoppingCashback: 10, onlineCashback: 10, diningCashback: 10,
  fuelCashback: 10, gamingCashback: 10, groceryCashback: 10, healthcareCashback: 10,
  generalCashback: 10,
  loungeAccess: 10, travelInsurance: 1, foreignTxFee: 3, purchaseProtection: 1,
  installmentMonths: 36, annualFee: 1000, activeOfferBonus: 10, appRating: 5,
};
const INVERTED = new Set(['foreignTxFee', 'annualFee']); // lower raw = higher score

function scoreCriterion(key, raw) {
  const max = MAX[key] ?? 10;
  if (INVERTED.has(key)) return Math.max(0, Math.min(10, (1 - raw / max) * 10));
  return Math.max(0, Math.min(10, (raw / max) * 10));
}

// ─── Score one bank vs one niche category ────────────────────────────────────
function scoreBankForNiche(bank, weights, activeOfferCount) {
  let bestScore     = 0;
  let bestCardId    = null;
  let bestBreakdown = {};

  const cards = bank.cards?.length ? bank.cards : [null];

  for (const card of cards) {
    const raw = extractCriteria(bank, card, activeOfferCount);
    const breakdown = {};
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [criterion, weight] of Object.entries(weights)) {
      const score10 = scoreCriterion(criterion, raw[criterion] ?? 0);
      breakdown[criterion] = Math.round(score10 * 10) / 10;
      weightedSum  += score10 * weight;
      totalWeight  += weight;
    }

    const normalised = totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 10 * 10) / 10  // 0–100
      : 0;

    if (normalised > bestScore) {
      bestScore     = normalised;
      bestCardId    = card?.id ?? null;
      bestBreakdown = breakdown;
    }
  }

  return { score: bestScore, scoreBreakdown: bestBreakdown, bestCardId };
}

function assignRanks(scored, previousRankMap) {
  return [...scored]
    .sort((a, b) => b.score - a.score)
    .map((entry, idx) => {
      const rank = idx + 1;
      const prev = previousRankMap.get(`${entry.bankId}-${entry.categoryId}`) ?? null;
      const movement = prev === null ? 'NEW' : rank < prev ? 'UP' : rank > prev ? 'DOWN' : 'SAME';
      return { ...entry, rank, previousRank: prev, movement };
    });
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function calculateBankNicheScores(weekIdentifier) {
  const week = weekIdentifier ?? getCurrentWeekIdentifier();
  const now  = new Date();

  // Load active banks with their cards
  const banks = await prisma.bank.findMany({
    where:   { isActive: true },
    include: {
      cards: {
        select: {
          id: true,
          cashbackGeneral: true, cashbackTravel: true, cashbackDining: true,
          cashbackShopping: true, cashbackFuel: true, cashbackGaming: true,
          cashbackGroceries: true, cashbackOnline: true, cashbackHealthcare: true,
          annualFee: true, foreignTxFeePercent: true, loungeAccessPerYear: true,
          hasTravelInsurance: true, hasPurchaseProtection: true, maxInstallmentMonths: true,
        },
      },
    },
  });

  // Load categories that have scoring weights — these ARE the niches
  const nicheCategories = await prisma.category.findMany({
    where:   { bankScoringWeights: { not: null } },
    select:  { id: true, bankScoringWeights: true },
  });

  // Active offer count per bank
  const offerCounts = await prisma.otherPromo.groupBy({
    by:    ['bankId'],
    where: {
      bankId:   { not: null },
      isActive: true,
      OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
    },
    _count: { id: true },
  });
  const offerCountMap = new Map(offerCounts.map(r => [r.bankId, r._count.id]));

  // Previous ranks for movement detection
  const prevSnaps = await prisma.bankNicheSnapshot.findMany({
    where:   { weekIdentifier: { not: week }, bank: { isActive: true } },
    orderBy: { calculatedAt: 'desc' },
    select:  { bankId: true, categoryId: true, rank: true },
  });
  const previousRankMap = new Map();
  for (const s of prevSnaps) {
    const key = `${s.bankId}-${s.categoryId}`;
    if (!previousRankMap.has(key)) previousRankMap.set(key, s.rank);
  }

  let snapshotsUpserted = 0;

  for (const niche of nicheCategories) {
    const weights = niche.bankScoringWeights;

    const scored = banks.map(bank => ({
      bankId:     bank.id,
      categoryId: niche.id,
      ...scoreBankForNiche(bank, weights, offerCountMap.get(bank.id) ?? 0),
    }));

    const ranked = assignRanks(scored, previousRankMap);

    for (const entry of ranked) {
      const data = {
        bankId: entry.bankId, categoryId: entry.categoryId,
        weekIdentifier: week, score: entry.score, rank: entry.rank,
        previousRank: entry.previousRank, movement: entry.movement,
        scoreBreakdown: entry.scoreBreakdown, bestCardId: entry.bestCardId,
        calculatedAt: new Date(),
      };

      await prisma.bankNicheSnapshot.upsert({
        where:  { bankId_categoryId_weekIdentifier: { bankId: entry.bankId, categoryId: entry.categoryId, weekIdentifier: week } },
        update: data,
        create: data,
      });
      snapshotsUpserted++;
    }
  }

  return {
    week,
    banksProcessed:    banks.length,
    nichesProcessed:   nicheCategories.length,
    snapshotsUpserted,
  };
}
