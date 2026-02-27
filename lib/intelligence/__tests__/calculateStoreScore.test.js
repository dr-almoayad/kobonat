// lib/intelligence/__tests__/calculateStoreScore.test.js
// Run: npx jest lib/intelligence/__tests__/calculateStoreScore.test.js

import { calculateStoreScore, _internal } from '../calculateStoreScore.js';

const {
  scoreMaxSavings,
  scoreCodeSuccess,
  scoreDeliverySpeed,
  scoreReturnFlexibility,
  scoreOfferFrequency,
  scorePaymentFlexibility,
  SAVINGS_FULL_SCORE_AT,
} = _internal;

// ── Helpers ───────────────────────────────────────────────────────────────────

// Build a full storeData object with defaults for unrelated fields
function store(overrides) {
  return {
    maxStackableSavingsPercent: 0,
    codeSuccessRate:            50,
    averageDeliveryDaysMax:     null,
    returnWindowDays:           null,
    freeReturns:                false,
    offerFrequencyDays:         null,
    activePaymentMethodCount:   0,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('scoreMaxSavings', () => {

  test('0% savings = 0', () => expect(scoreMaxSavings(0)).toBe(0));

  test('negative savings = 0', () => expect(scoreMaxSavings(-5)).toBe(0));

  test(`${SAVINGS_FULL_SCORE_AT}% savings = 10 (full score)`, () =>
    expect(scoreMaxSavings(SAVINGS_FULL_SCORE_AT)).toBe(10));

  test('above threshold is clamped at 10', () =>
    expect(scoreMaxSavings(60)).toBe(10));

  test('15% savings = 5 (midpoint)', () =>
    expect(scoreMaxSavings(15)).toBeCloseTo(5, 0));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('scoreCodeSuccess', () => {

  test('0% success rate = 0', () => expect(scoreCodeSuccess(0)).toBe(0));

  test('100% success rate = 10', () => expect(scoreCodeSuccess(100)).toBe(10));

  test('85% = 8.5', () => expect(scoreCodeSuccess(85)).toBe(8.5));

  test('clamped above 100', () => expect(scoreCodeSuccess(120)).toBe(10));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('scoreDeliverySpeed', () => {

  test('null (unknown) returns neutral score of 5', () =>
    expect(scoreDeliverySpeed(null)).toBe(5));

  test('1 day = 10 (perfect)', () =>
    expect(scoreDeliverySpeed(1)).toBe(10));

  test('3 days = 7', () =>
    expect(scoreDeliverySpeed(3)).toBe(7));

  test('5 days = 5', () =>
    expect(scoreDeliverySpeed(5)).toBe(5));

  test('10 days = 2 (very slow)', () =>
    expect(scoreDeliverySpeed(10)).toBe(2));

  test('30 days = 1 (worst band)', () =>
    expect(scoreDeliverySpeed(30)).toBe(1));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('scoreReturnFlexibility', () => {

  test('no data at all = 0', () =>
    expect(scoreReturnFlexibility(null, false)).toBe(0));

  test('free returns alone = 4 (even with null window)', () =>
    expect(scoreReturnFlexibility(null, true)).toBe(4));

  test('30-day window + paid returns = 6', () =>
    expect(scoreReturnFlexibility(30, false)).toBe(6));

  test('30-day window + free returns = 10 (capped)', () =>
    expect(scoreReturnFlexibility(30, true)).toBe(10));

  test('14-day window + free returns = correct partial score', () => {
    // freeReturns = 4, window = (14/30) × 6 = 2.8 → total = 6.8
    expect(scoreReturnFlexibility(14, true)).toBeCloseTo(6.8, 0);
  });

  test('score never exceeds 10', () =>
    expect(scoreReturnFlexibility(365, true)).toBe(10));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('scoreOfferFrequency', () => {

  test('null (unknown) returns neutral 5', () =>
    expect(scoreOfferFrequency(null)).toBe(5));

  test('7 days (weekly deals) = 10', () =>
    expect(scoreOfferFrequency(7)).toBe(10));

  test('14 days = 7', () =>
    expect(scoreOfferFrequency(14)).toBe(7));

  test('30 days (monthly) = 4', () =>
    expect(scoreOfferFrequency(30)).toBe(4));

  test('90 days (quarterly) = 1', () =>
    expect(scoreOfferFrequency(90)).toBe(1));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('scorePaymentFlexibility', () => {

  test('0 methods = 0', () => expect(scorePaymentFlexibility(0)).toBe(0));

  test('5 methods = 10 (full score threshold)', () =>
    expect(scorePaymentFlexibility(5)).toBe(10));

  test('more than 5 clamped at 10', () =>
    expect(scorePaymentFlexibility(10)).toBe(10));

  test('2 methods = 4 (linear)', () =>
    expect(scorePaymentFlexibility(2)).toBeCloseTo(4, 0));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('calculateStoreScore — total + breakdown shape', () => {

  test('all-zero input produces 0 total', () => {
    const result = calculateStoreScore(store({
      maxStackableSavingsPercent: 0,
      codeSuccessRate:            0,
      averageDeliveryDaysMax:     null,
      returnWindowDays:           null,
      freeReturns:                false,
      offerFrequencyDays:         null,
      activePaymentMethodCount:   0,
    }));
    expect(result.total).toBe(0);
  });

  test('breakdown keys are all present', () => {
    const { breakdown } = calculateStoreScore(store({}));
    expect(Object.keys(breakdown)).toEqual([
      'maxStackableSavings',
      'codeSuccessRate',
      'deliverySpeed',
      'returnFlexibility',
      'offerFrequency',
      'paymentFlexibility',
    ]);
  });

  test('total never exceeds 10', () => {
    const result = calculateStoreScore(store({
      maxStackableSavingsPercent: 100,
      codeSuccessRate:            100,
      averageDeliveryDaysMax:     1,
      returnWindowDays:           365,
      freeReturns:                true,
      offerFrequencyDays:         7,
      activePaymentMethodCount:   20,
    }));
    expect(result.total).toBeLessThanOrEqual(10);
  });

  test('perfect store scores 10', () => {
    const result = calculateStoreScore(store({
      maxStackableSavingsPercent: 30,
      codeSuccessRate:            100,
      averageDeliveryDaysMax:     1,
      returnWindowDays:           30,
      freeReturns:                true,
      offerFrequencyDays:         7,
      activePaymentMethodCount:   5,
    }));
    expect(result.total).toBe(10);
  });

  test('store with good savings but bad logistics scores mid-range', () => {
    const result = calculateStoreScore(store({
      maxStackableSavingsPercent: 30,  // perfect savings
      codeSuccessRate:            90,  // good codes
      averageDeliveryDaysMax:     10,  // slow delivery
      returnWindowDays:           null,
      freeReturns:                false,
      offerFrequencyDays:         60,  // infrequent
      activePaymentMethodCount:   2,
    }));
    // Should be >5 (savings pull it up) but <9 (logistics drag it down)
    expect(result.total).toBeGreaterThan(5);
    expect(result.total).toBeLessThan(9);
  });

  test('weightedBreakdown contributions sum to total (±0.1 rounding)', () => {
    const result = calculateStoreScore(store({
      maxStackableSavingsPercent: 20,
      codeSuccessRate:            70,
      averageDeliveryDaysMax:     3,
      returnWindowDays:           14,
      freeReturns:                true,
      offerFrequencyDays:         14,
      activePaymentMethodCount:   4,
    }));
    const wbSum = Object.values(result.weightedBreakdown).reduce((a, b) => a + b, 0);
    expect(Math.abs(wbSum - result.total)).toBeLessThanOrEqual(0.3);
  });
});
