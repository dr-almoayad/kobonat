// lib/intelligence/runIntelligenceCron.js
// Monthly cron job — recalculates StoreSavingsMetrics and storeScore for all stores.
// Triggered via /api/cron/intelligence on the 1st of each month at 02:00 UTC.
// Safe to re-run: all writes use upsert on @@unique([storeId, monthIdentifier]).

import { prisma } from '@/lib/prisma';
import { calculateStoreScore, getCurrentMonthIdentifier } from './calculateStoreScore.js';

// ─────────────────────────────────────────────────────────────────────────────
// computeOfferQualityRatio
//
// Returns (uniqueVerifiedOrExclusiveCount) / totalActiveOffers.
// An offer that is both verified AND exclusive counts once — Math.max deduplication
// happens at the query level by counting distinct IDs in each bucket.
//
// "Quality" means: admin has verified the offer works AND/OR it's exclusive
// to this platform. Both signals indicate a genuinely good offer rather than
// a generic sitewide deal scraped from elsewhere.
// ─────────────────────────────────────────────────────────────────────────────

async function computeOfferQualityRatio(storeId, now) {
  const activeWhere = {
    storeId,
    OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
  };

  const [voucherTotal, promoTotal, qualityCount] = await Promise.all([
    prisma.voucher.count({ where: activeWhere }),
    prisma.otherPromo.count({ where: { storeId, isActive: true } }),
    prisma.voucher.count({
      where: { ...activeWhere, OR: [{ isVerified: true }, { isExclusive: true }] },
    }),
  ]);

  const total = voucherTotal + promoTotal;
  if (total === 0) return 0;
  return qualityCount / total;
}

// ─────────────────────────────────────────────────────────────────────────────
// runIntelligenceCron (public)
// ─────────────────────────────────────────────────────────────────────────────

export async function runIntelligenceCron({ storeId } = {}) {
  const monthIdentifier = getCurrentMonthIdentifier();
  const now             = new Date();
  const errors          = [];
  let   processed       = 0;

  // ── 1. All active stores with logistics + payment + leaderboard data ───────
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: {
      id:                      true,
      averageDeliveryDaysMax:  true,
      returnWindowDays:        true,
      freeReturns:             true,
      offerFrequencyDays:      true,
      paymentMethods: {
        where:  { isActive: true },
        select: { id: true },
      },
      // Latest leaderboard snapshot for maxStackableSavings
      savingsSnapshots: {
        orderBy: { calculatedAt: 'desc' },
        take:    1,
        select:  { calculatedMaxSavingsPercent: true, savingsOverridePercent: true },
      },
      // Active vouchers for total count + average discount
      vouchers: {
        where: { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] },
        select: { discountPercent: true },
      },
      // Active promos for total count
      otherPromos: {
        where:  { isActive: true },
        select: { id: true },
      },
    },
  });

  for (const store of stores) {
    try {
      // ── Inputs ──────────────────────────────────────────────────────────
      const latestSnap          = store.savingsSnapshots[0];
      const maxStackable        = latestSnap?.savingsOverridePercent
                                ?? latestSnap?.calculatedMaxSavingsPercent
                                ?? 0;

      const activePaymentCount  = store.paymentMethods.length;
      const totalActiveOffers   = store.vouchers.length + store.otherPromos.length;

      // Average discount across active vouchers that have a numeric discountPercent
      const vouchersWithPct = store.vouchers.filter((v) => v.discountPercent > 0);
      const avgDiscount     = vouchersWithPct.length > 0
        ? vouchersWithPct.reduce((sum, v) => sum + v.discountPercent, 0) / vouchersWithPct.length
        : 0;

      // Offer quality: ratio of verified/exclusive offers to total
      const offerQualityRatio   = await computeOfferQualityRatio(store.id, now);

      // ── Score ────────────────────────────────────────────────────────────
      const scoreResult = calculateStoreScore({
        maxStackableSavingsPercent: maxStackable,
        offerQualityRatio,
        averageDeliveryDaysMax:     store.averageDeliveryDaysMax,
        returnWindowDays:           store.returnWindowDays,
        freeReturns:                store.freeReturns,
        offerFrequencyDays:         store.offerFrequencyDays,
        activePaymentMethodCount:   activePaymentCount,
      });

      // ── Upsert metrics row ───────────────────────────────────────────────
      await prisma.storeSavingsMetrics.upsert({
        where: {
          storeId_monthIdentifier: { storeId: store.id, monthIdentifier },
        },
        create: {
          storeId:                    store.id,
          monthIdentifier,
          averageDiscountPercent:     Math.round(avgDiscount * 10) / 10,
          maxStackableSavingsPercent: maxStackable,
          offerQualityRatio:          Math.round(offerQualityRatio * 1000) / 1000,
          totalActiveOffers,
          storeScore:                 scoreResult.total,
          scoreBreakdown:             JSON.stringify(scoreResult.breakdown),
        },
        update: {
          averageDiscountPercent:     Math.round(avgDiscount * 10) / 10,
          maxStackableSavingsPercent: maxStackable,
          offerQualityRatio:          Math.round(offerQualityRatio * 1000) / 1000,
          totalActiveOffers,
          storeScore:                 scoreResult.total,
          scoreBreakdown:             JSON.stringify(scoreResult.breakdown),
        },
      });

      processed++;
    } catch (err) {
      errors.push(`Store ${store.id}: ${err.message ?? String(err)}`);
    }
  }

  return { processed, errors, monthIdentifier };
}
