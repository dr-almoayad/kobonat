// lib/intelligence/calculateStoreScore.js
//
// Calculates a 0–10 store score from logistics, savings, and offer quality data.
// Pure function — no DB calls. Called by the monthly cron job.
// Weights are defined in one place (WEIGHTS constant) for easy tuning.

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHTS
// Must sum to 1.0.
//
// codeSuccessRate removed: it measured user competence (failing to apply codes
// correctly, not meeting terms) rather than store quality. All published codes
// are already admin-verified before going live, so failure at the user end
// produces misleading signal.
//
// Replaced with offerQuality (15%): ratio of verified + exclusive offers to
// total active offers. Entirely editorial — no user behavior involved.
// Max stackable savings weight raised from 30% to 35% to reflect its primacy.
//
// Rationale for current weights:
//   maxStackableSavings (35%) — headline number; what shoppers care most about.
//   offerQuality (15%)        — are the offers genuinely good/exclusive or generic?
//   deliverySpeed (15%)       — next-day vs 7-day is a meaningful real difference.
//   returnFlexibility (15%)   — critical in Saudi market; drives purchase confidence.
//   offerFrequency (10%)      — how regularly does this store run promotions?
//   paymentFlexibility (10%)  — Mada, Apple Pay, BNPL coverage matters in SA.
// ─────────────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  maxStackableSavings: 0.35,
  offerQuality:        0.15,
  deliverySpeed:       0.15,
  returnFlexibility:   0.15,
  offerFrequency:      0.10,
  paymentFlexibility:  0.10,
};

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION SCALES
// ─────────────────────────────────────────────────────────────────────────────

// maxStackableSavings: 30%+ compound saving = perfect 10
const SAVINGS_FULL_SCORE_AT = 30;

// offerQuality: ratio of (verified + exclusive) offers to total active offers
// 0% quality ratio → 0, 60%+ quality ratio → 10
// Using 60% as the ceiling rather than 100% because having ALL offers be
// exclusive/verified is unrealistically high — a store with 60% exclusive
// deals is genuinely exceptional.
const QUALITY_FULL_SCORE_AT = 0.60; // 60% ratio = perfect 10

// deliverySpeed: based on averageDeliveryDaysMax (worst-case quoted time)
const DELIVERY_THRESHOLDS = [
  { maxDays: 1,        score: 10  },
  { maxDays: 2,        score: 8.5 },
  { maxDays: 3,        score: 7   },
  { maxDays: 4,        score: 6   },
  { maxDays: 5,        score: 5   },
  { maxDays: 7,        score: 3.5 },
  { maxDays: 10,       score: 2   },
  { maxDays: Infinity, score: 1   },
];

// returnFlexibility: freeReturns (boolean) + window length
const FREE_RETURNS_SCORE  = 4;  // awarded if freeReturns = true
const RETURN_WINDOW_MAX   = 30; // 30+ days → full 6 points on window component
const RETURN_WINDOW_SCORE = 6;  // max points from window length alone

// offerFrequency: lower days = better (weekly > monthly)
const FREQUENCY_THRESHOLDS = [
  { maxDays: 7,        score: 10  },
  { maxDays: 14,       score: 7   },
  { maxDays: 21,       score: 5.5 },
  { maxDays: 30,       score: 4   },
  { maxDays: 60,       score: 2.5 },
  { maxDays: Infinity, score: 1   },
];

// paymentFlexibility: active method count → 0–10
const PAYMENT_FULL_SCORE_AT = 5; // 5+ active methods = perfect score

// ─────────────────────────────────────────────────────────────────────────────
// Sub-scorers
// ─────────────────────────────────────────────────────────────────────────────

function scoreMaxSavings(maxStackableSavingsPercent) {
  if (maxStackableSavingsPercent <= 0) return 0;
  return Math.min((maxStackableSavingsPercent / SAVINGS_FULL_SCORE_AT) * 10, 10);
}

// offerQualityRatio: (verifiedCount + exclusiveCount) / totalActiveOffers
// Capped at 1.0 before scoring (a verified offer can also be exclusive —
// the caller deduplicates before passing the ratio in).
function scoreOfferQuality(offerQualityRatio) {
  if (offerQualityRatio <= 0) return 0;
  return Math.min((offerQualityRatio / QUALITY_FULL_SCORE_AT) * 10, 10);
}

function scoreDeliverySpeed(averageDeliveryDaysMax) {
  if (averageDeliveryDaysMax == null) return 5; // unknown → neutral
  for (const band of DELIVERY_THRESHOLDS) {
    if (averageDeliveryDaysMax <= band.maxDays) return band.score;
  }
  return 1;
}

function scoreReturnFlexibility(returnWindowDays, freeReturns) {
  const freeScore   = freeReturns ? FREE_RETURNS_SCORE : 0;
  const windowScore = returnWindowDays == null
    ? 0
    : Math.min((returnWindowDays / RETURN_WINDOW_MAX) * RETURN_WINDOW_SCORE, RETURN_WINDOW_SCORE);
  return Math.min(freeScore + windowScore, 10);
}

function scoreOfferFrequency(offerFrequencyDays) {
  if (offerFrequencyDays == null) return 5; // unknown → neutral
  for (const band of FREQUENCY_THRESHOLDS) {
    if (offerFrequencyDays <= band.maxDays) return band.score;
  }
  return 1;
}

function scorePaymentFlexibility(activePaymentMethodCount) {
  if (activePaymentMethodCount <= 0) return 0;
  return Math.min((activePaymentMethodCount / PAYMENT_FULL_SCORE_AT) * 10, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateStoreScore (public)
//
// storeData shape:
//   {
//     // From StoreSavingsMetrics / leaderboard snapshot
//     maxStackableSavingsPercent: number,
//
//     // Computed before calling: (verifiedOffers + exclusiveOffers) / totalActiveOffers
//     // Caller deduplicates offers that are both verified AND exclusive.
//     offerQualityRatio:          number,   // 0.0–1.0
//
//     // From Store model
//     averageDeliveryDaysMax:     number|null,
//     returnWindowDays:           number|null,
//     freeReturns:                boolean,
//     offerFrequencyDays:         number|null,
//
//     // Computed before calling
//     activePaymentMethodCount:   number,
//   }
//
// Returns:
//   {
//     total:             number,   // 0–10, rounded to 1 decimal
//     breakdown:         object,   // raw sub-scores (0–10 each, before weighting)
//     weightedBreakdown: object,   // each dimension's contribution to total
//   }
// ─────────────────────────────────────────────────────────────────────────────

export function calculateStoreScore(storeData) {
  const {
    maxStackableSavingsPercent = 0,
    offerQualityRatio          = 0,
    averageDeliveryDaysMax     = null,
    returnWindowDays           = null,
    freeReturns                = false,
    offerFrequencyDays         = null,
    activePaymentMethodCount   = 0,
  } = storeData;

  // Raw sub-scores (0–10 each)
  const breakdown = {
    maxStackableSavings: round1(scoreMaxSavings(maxStackableSavingsPercent)),
    offerQuality:        round1(scoreOfferQuality(offerQualityRatio)),
    deliverySpeed:       round1(scoreDeliverySpeed(averageDeliveryDaysMax)),
    returnFlexibility:   round1(scoreReturnFlexibility(returnWindowDays, freeReturns)),
    offerFrequency:      round1(scoreOfferFrequency(offerFrequencyDays)),
    paymentFlexibility:  round1(scorePaymentFlexibility(activePaymentMethodCount)),
  };

  // Weighted contribution of each dimension
  const weightedBreakdown = {
    maxStackableSavings: round1(breakdown.maxStackableSavings * WEIGHTS.maxStackableSavings),
    offerQuality:        round1(breakdown.offerQuality        * WEIGHTS.offerQuality),
    deliverySpeed:       round1(breakdown.deliverySpeed       * WEIGHTS.deliverySpeed),
    returnFlexibility:   round1(breakdown.returnFlexibility   * WEIGHTS.returnFlexibility),
    offerFrequency:      round1(breakdown.offerFrequency      * WEIGHTS.offerFrequency),
    paymentFlexibility:  round1(breakdown.paymentFlexibility  * WEIGHTS.paymentFlexibility),
  };

  const rawTotal =
    breakdown.maxStackableSavings * WEIGHTS.maxStackableSavings +
    breakdown.offerQuality        * WEIGHTS.offerQuality        +
    breakdown.deliverySpeed       * WEIGHTS.deliverySpeed       +
    breakdown.returnFlexibility   * WEIGHTS.returnFlexibility   +
    breakdown.offerFrequency      * WEIGHTS.offerFrequency      +
    breakdown.paymentFlexibility  * WEIGHTS.paymentFlexibility;

  const total = round1(Math.min(Math.max(rawTotal, 0), 10));

  return { total, breakdown, weightedBreakdown };
}

// ─────────────────────────────────────────────────────────────────────────────
// getCurrentMonthIdentifier — "2026-03"
// ─────────────────────────────────────────────────────────────────────────────

export function getCurrentMonthIdentifier(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function round1(n) {
  return Math.round(n * 10) / 10;
}

// Exported for unit tests
export const _internal = {
  scoreMaxSavings,
  scoreOfferQuality,
  scoreDeliverySpeed,
  scoreReturnFlexibility,
  scoreOfferFrequency,
  scorePaymentFlexibility,
  WEIGHTS,
  SAVINGS_FULL_SCORE_AT,
  QUALITY_FULL_SCORE_AT,
  DELIVERY_THRESHOLDS,
  FREQUENCY_THRESHOLDS,
};
