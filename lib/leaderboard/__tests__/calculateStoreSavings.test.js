// lib/leaderboard/__tests__/calculateStoreSavings.test.js
// Run: npx jest lib/leaderboard/__tests__/calculateStoreSavings.test.js
//
// Tests pure formula functions only — no DB, no mocking required.
// All functions are inlined here so the file is fully self-contained.

// ── Pure functions under test ─────────────────────────────────────────────────

const DEFAULT_MULTIPLIERS = {
  EXACT:     1.00,
  VERIFIED:  1.00,
  TYPICAL:   0.80,
  ESTIMATED: 0.35,
  UNKNOWN:   0.00,
};

function resolveInputPercent(offer, multipliers = DEFAULT_MULTIPLIERS) {
  if (offer.verifiedAvgPercent != null && offer.verifiedAvgPercent > 0) {
    return offer.verifiedAvgPercent;
  }
  if (offer.discountPercent == null || offer.discountPercent <= 0) return null;
  const certainty  = offer.discountCertainty ?? 'ESTIMATED';
  const multiplier = multipliers[certainty] ?? 0;
  if (multiplier === 0) return null;
  return offer.discountPercent * multiplier;
}

function effectivePercent(inputPct, offer, basketSize) {
  if (!offer.isCapped || offer.maxDiscountAmount == null) return inputPct;
  const rawSaving = basketSize * (inputPct / 100);
  if (rawSaving <= offer.maxDiscountAmount) return inputPct;
  return (offer.maxDiscountAmount / basketSize) * 100;
}

function meetsMinSpend(offer, basketSize) {
  if (offer.minSpendAmount == null) return true;
  return basketSize >= offer.minSpendAmount;
}

function compoundStack(percentages) {
  let remaining = 100;
  for (const pct of percentages) remaining *= (1 - pct / 100);
  return Math.round((100 - remaining) * 10) / 10;
}

// ── Helpers for building test offer objects ───────────────────────────────────

function offer(overrides) {
  return {
    discountPercent:    null,
    verifiedAvgPercent: null,
    discountCertainty:  'EXACT',
    isCapped:           false,
    maxDiscountAmount:  null,
    minSpendAmount:     null,
    isStackable:        false,
    stackGroup:         'DEAL',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('resolveInputPercent — certainty haircuts', () => {

  test('EXACT: returns full figure', () => {
    expect(resolveInputPercent(offer({ discountPercent: 10, discountCertainty: 'EXACT' }))).toBe(10);
  });

  test('VERIFIED: returns full figure (same multiplier as EXACT)', () => {
    expect(resolveInputPercent(offer({ discountPercent: 18, discountCertainty: 'VERIFIED' }))).toBe(18);
  });

  test('TYPICAL: returns 80% of figure', () => {
    expect(resolveInputPercent(offer({ discountPercent: 20, discountCertainty: 'TYPICAL' }))).toBe(16);
  });

  test('ESTIMATED: returns 35% of figure', () => {
    // "up to 80% off" → 80 × 0.35 = 28
    expect(resolveInputPercent(offer({ discountPercent: 80, discountCertainty: 'ESTIMATED' }))).toBe(28);
  });

  test('UNKNOWN: returns null (excluded from calculator)', () => {
    expect(resolveInputPercent(offer({ discountPercent: 50, discountCertainty: 'UNKNOWN' }))).toBeNull();
  });

  test('null discountPercent with no verifiedAvgPercent returns null', () => {
    expect(resolveInputPercent(offer({ discountPercent: null }))).toBeNull();
  });

  test('zero discountPercent returns null', () => {
    expect(resolveInputPercent(offer({ discountPercent: 0, discountCertainty: 'EXACT' }))).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('resolveInputPercent — verifiedAvgPercent takes priority', () => {

  test('verifiedAvgPercent overrides discountPercent regardless of certainty', () => {
    // Headline says 80%, admin verified true average is 22% — use 22
    const o = offer({ discountPercent: 80, discountCertainty: 'ESTIMATED', verifiedAvgPercent: 22 });
    expect(resolveInputPercent(o)).toBe(22);
  });

  test('verifiedAvgPercent overrides even when certainty is EXACT', () => {
    // Unusual but allowed — admin wants to override a previously-set figure
    const o = offer({ discountPercent: 20, discountCertainty: 'EXACT', verifiedAvgPercent: 17 });
    expect(resolveInputPercent(o)).toBe(17);
  });

  test('verifiedAvgPercent of 0 is ignored — falls back to discountPercent', () => {
    const o = offer({ discountPercent: 20, discountCertainty: 'EXACT', verifiedAvgPercent: 0 });
    expect(resolveInputPercent(o)).toBe(20);
  });

  test('verifiedAvgPercent with UNKNOWN certainty still resolves', () => {
    // Admin verified the average even though certainty would otherwise exclude it
    const o = offer({ discountPercent: 50, discountCertainty: 'UNKNOWN', verifiedAvgPercent: 15 });
    expect(resolveInputPercent(o)).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('resolveInputPercent — custom multipliers', () => {

  test('respects custom multiplier from methodology', () => {
    const customMultipliers = { ...DEFAULT_MULTIPLIERS, ESTIMATED: 0.25 };
    const o = offer({ discountPercent: 80, discountCertainty: 'ESTIMATED' });
    expect(resolveInputPercent(o, customMultipliers)).toBe(20); // 80 × 0.25
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('effectivePercent — SAR cap logic', () => {

  test('uncapped offer: returns inputPct unchanged', () => {
    expect(effectivePercent(20, offer({ isCapped: false }), 500)).toBe(20);
  });

  test('capped but cap not hit: returns full inputPct', () => {
    // 20% of 500 = 100 SAR; cap = 200 SAR → not hit
    expect(effectivePercent(20, offer({ isCapped: true, maxDiscountAmount: 200 }), 500)).toBe(20);
  });

  test('capped exactly at boundary: returns full inputPct', () => {
    // 20% of 500 = 100 SAR; cap = 100 SAR → exactly at limit, no reduction
    expect(effectivePercent(20, offer({ isCapped: true, maxDiscountAmount: 100 }), 500)).toBe(20);
  });

  test('cap hit: reduces to realistic rate', () => {
    // 20% of 500 = 100 SAR; cap = 80 SAR → effective = 80/500 = 16%
    expect(effectivePercent(20, offer({ isCapped: true, maxDiscountAmount: 80 }), 500)).toBe(16);
  });

  test('tight cap on high claim: drastically reduces rate', () => {
    // ESTIMATED "up to 80%" → inputPct = 28; cap = 50 SAR on 500 basket
    // 28% of 500 = 140 SAR > cap 50 → effective = 50/500 = 10%
    expect(effectivePercent(28, offer({ isCapped: true, maxDiscountAmount: 50 }), 500)).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('meetsMinSpend', () => {

  test('no minimum: always passes', () => {
    expect(meetsMinSpend(offer({ minSpendAmount: null }), 500)).toBe(true);
  });

  test('basket meets minimum: passes', () => {
    expect(meetsMinSpend(offer({ minSpendAmount: 200 }), 500)).toBe(true);
  });

  test('basket equals minimum exactly: passes', () => {
    expect(meetsMinSpend(offer({ minSpendAmount: 500 }), 500)).toBe(true);
  });

  test('basket under minimum: excluded', () => {
    expect(meetsMinSpend(offer({ minSpendAmount: 1000 }), 500)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('compoundStack', () => {

  test('single offer: equals its own rate', () => {
    expect(compoundStack([20])).toBe(20);
  });

  test('two offers: compounds correctly', () => {
    // 100 × 0.80 × 0.90 = 72 → saving = 28
    expect(compoundStack([20, 10])).toBe(28);
  });

  test('three offers: compounds correctly', () => {
    // 100 × 0.80 × 0.85 × 0.90 = 61.2 → saving = 38.8
    expect(compoundStack([20, 15, 10])).toBe(38.8);
  });

  test('compound saving is less than additive sum', () => {
    expect(compoundStack([20, 15, 10])).toBeLessThan(45);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('end-to-end scenarios — full pipeline', () => {

  // Helper: run the full resolution pipeline for one offer
  function pipeline(offerData, basketSize = 500, multipliers = DEFAULT_MULTIPLIERS) {
    const o          = offer(offerData);
    const inputPct   = resolveInputPercent(o, multipliers);
    if (inputPct === null) return null;
    if (!meetsMinSpend(o, basketSize)) return null;
    return effectivePercent(inputPct, o, basketSize);
  }

  test('Bank offer EXACT, uncapped → passes through unchanged', () => {
    expect(pipeline({ discountPercent: 10, discountCertainty: 'EXACT', stackGroup: 'BANK_OFFER' })).toBe(10);
  });

  test('"Up to 80% off" ESTIMATED, uncapped → 28%', () => {
    expect(pipeline({ discountPercent: 80, discountCertainty: 'ESTIMATED' })).toBe(28);
  });

  test('"Up to 80% off" ESTIMATED, cap 50 SAR → 10%', () => {
    // inputPct = 28; 28% of 500 = 140 > cap 50 → effective = 50/500 = 10
    expect(pipeline({
      discountPercent:   80,
      discountCertainty: 'ESTIMATED',
      isCapped:          true,
      maxDiscountAmount: 50,
    })).toBe(10);
  });

  test('verifiedAvgPercent overrides ESTIMATED claim', () => {
    // Admin verified true average is 22% despite "up to 80% off" headline
    expect(pipeline({
      discountPercent:    80,
      discountCertainty:  'ESTIMATED',
      verifiedAvgPercent: 22,
    })).toBe(22);
  });

  test('UNKNOWN certainty with no verifiedAvgPercent → excluded (null)', () => {
    expect(pipeline({ discountPercent: 50, discountCertainty: 'UNKNOWN' })).toBeNull();
  });

  test('min spend not met → excluded (null)', () => {
    expect(pipeline({
      discountPercent:   20,
      discountCertainty: 'EXACT',
      minSpendAmount:    1000,
    })).toBeNull();
  });

  test('bank 10% EXACT + code 20% EXACT stacked → 28% compound', () => {
    const bankPct = pipeline({ discountPercent: 10, discountCertainty: 'EXACT', stackGroup: 'BANK_OFFER' });
    const codePct = pipeline({ discountPercent: 20, discountCertainty: 'EXACT', stackGroup: 'CODE' });
    expect(compoundStack([codePct, bankPct])).toBe(28);
  });

  test('"up to 80%" ESTIMATED vs bank 10% EXACT — ESTIMATED still loses after haircut when stacking', () => {
    // ESTIMATED deal: 28% (after haircut)
    // bank 10% EXACT: 10%
    // Stacked (both stackable): compoundStack([28, 10]) = 35.2
    // Deal standalone: 28
    // Bank standalone: 10
    // Best = stacked at 35.2 — both offers are worth including
    const dealPct = pipeline({ discountPercent: 80, discountCertainty: 'ESTIMATED' }); // 28
    const bankPct = pipeline({ discountPercent: 10, discountCertainty: 'EXACT', stackGroup: 'BANK_OFFER' }); // 10
    expect(compoundStack([dealPct, bankPct])).toBe(35.2);
    expect(compoundStack([dealPct, bankPct])).toBeGreaterThan(dealPct);
  });
});
