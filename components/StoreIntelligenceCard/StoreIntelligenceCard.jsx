// components/StoreIntelligenceCard/StoreIntelligenceCard.jsx
// Server Component — self-fetching, zero client JS.
// Design: SPL player-card aesthetic, #fafafa bg, fading watermark logo,
//         full-circle SVG gauges, CSS-only info tooltips.

import { prisma } from '@/lib/prisma';
import { getCurrentMonthIdentifier } from '@/lib/intelligence/calculateStoreScore.js';
import './StoreIntelligenceCard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Data fetch
// ─────────────────────────────────────────────────────────────────────────────
async function fetchIntelligence(storeId, lang, countryCode) {
  try {
    return await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true, logo: true, color: true,
        averageDeliveryDaysMin:  true,
        averageDeliveryDaysMax:  true,
        freeShippingThreshold:   true,
        returnWindowDays:        true,
        freeReturns:             true,
        refundProcessingDaysMin: true,
        refundProcessingDaysMax: true,
        offerFrequencyDays:      true,
        lastVerifiedAt:          true,
        translations: {
          where:  { locale: lang },
          select: { name: true, slug: true, description: true },
        },
        // Voucher counts by type (Prisma filtered _count)
        _count: {
          select: {
            vouchers: true,
          },
        },
        // We need per-type counts — add 4 separate aggregates via raw fields below
        paymentMethods: {
          where: { isActive: true, country: { code: countryCode } },
          select: {
            paymentMethod: {
              select: {
                slug: true, logo: true, type: true, isBnpl: true,
                translations: { where: { locale: lang }, select: { name: true } },
              },
            },
          },
        },
        savingsMetrics: {
          orderBy: { monthIdentifier: 'desc' },
          take: 1,
          select: {
            averageDiscountPercent:     true,
            maxStackableSavingsPercent: true,
            codeSuccessRate:            true,
            totalActiveOffers:          true,
            totalCodes:                 true,
            totalDeals:                 true,
            totalFreeShipping:          true,
            totalBankOffers:            true,
            storeScore:                 true,
            scoreBreakdown:             true,
          },
        },
        upcomingEvents: {
          where: { expectedMonth: { gte: getCurrentMonthIdentifier() } },
          orderBy: { expectedMonth: 'asc' },
          take: 3,
          select: {
            eventName: true, expectedMonth: true,
            confidenceLevel: true, expectedMaxDiscount: true,
          },
        },
        savingsSnapshots: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
          select: { rank: true, movement: true, previousRank: true },
        },
      },
    });
  } catch {
    return null;
  }
}

// Fallback: fetch voucher counts directly if metrics don't have them
async function fetchVoucherCounts(storeId) {
  try {
    const [codes, deals, shipping, bank] = await Promise.all([
      prisma.voucher.count({ where: { storeId, type: 'CODE',          OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] } }),
      prisma.voucher.count({ where: { storeId, type: 'DEAL',          OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] } }),
      prisma.voucher.count({ where: { storeId, type: 'FREE_SHIPPING', OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] } }),
      prisma.voucher.count({ where: { storeId, type: 'BANK_OFFER',    OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] } }),
    ]);
    return { codes, deals, shipping, bank };
  } catch {
    return { codes: 0, deals: 0, shipping: 0, bank: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Full-circle SVG ring gauge */
function RingGauge({ pct, color = 'var(--sic-accent)', size = 96, stroke = 8 }) {
  const n   = Math.min(Math.max(parseFloat(pct) || 0, 0), 100);
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - n / 100);
  const cx  = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sic-ring" aria-hidden="true">
      {/* Track */}
      <circle cx={cx} cy={cx} r={r}
        fill="none" stroke="var(--sic-ring-track)"
        strokeWidth={stroke} />
      {/* Fill — starts at top (rotate -90deg) */}
      <circle cx={cx} cy={cx} r={r}
        fill="none" stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
    </svg>
  );
}

/** Circular stat card (gauge + label + tooltip) */
function GaugeStat({ pct, label, tooltip, color }) {
  const n = Math.min(Math.max(parseFloat(pct) || 0, 0), 100);
  return (
    <div className="sic-gauge-stat">
      <div className="sic-gauge-stat__ring-wrap">
        <RingGauge pct={n} color={color} />
        <span className="sic-gauge-stat__value">{Math.round(n)}<span className="sic-gauge-stat__pct">%</span></span>
      </div>
      <div className="sic-gauge-stat__footer">
        <span className="sic-gauge-stat__label">{label}</span>
        {tooltip && (
          <span className="sic-tooltip-wrap" aria-label={tooltip}>
            <span className="sic-tooltip-icon" aria-hidden="true">ℹ</span>
            <span className="sic-tooltip-box" role="tooltip">{tooltip}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/** Quick-count stat tile (for voucher counts) */
function CountTile({ icon, value, label, tooltip }) {
  return (
    <div className="sic-tile">
      <span className="sic-tile__icon" aria-hidden="true">{icon}</span>
      <span className="sic-tile__value">{value ?? '–'}</span>
      <span className="sic-tile__label">
        {label}
        {tooltip && (
          <span className="sic-tooltip-wrap" aria-label={tooltip}>
            <span className="sic-tooltip-icon" aria-hidden="true">ℹ</span>
            <span className="sic-tooltip-box" role="tooltip">{tooltip}</span>
          </span>
        )}
      </span>
    </div>
  );
}

function MovementBadge({ movement, rank }) {
  const dir = movement === 'UP' ? '↑' : movement === 'DOWN' ? '↓' : '–';
  const cls = movement === 'UP' ? 'up' : movement === 'DOWN' ? 'down' : 'same';
  return (
    <div className={`sic-rank sic-rank--${cls}`}>
      <span className="sic-rank__hash">#</span>
      <span className="sic-rank__num">{rank}</span>
      <span className="sic-rank__dir" aria-hidden="true">{dir}</span>
    </div>
  );
}

function ConfidencePips({ level }) {
  const n = { LOW: 1, MEDIUM: 2, HIGH: 3 }[level] ?? 1;
  return (
    <span className="sic-pips" aria-label={`Confidence: ${level}`}>
      {[1, 2, 3].map(i => (
        <span key={i} className={`sic-pip${i <= n ? ' sic-pip--on' : ''}`} />
      ))}
    </span>
  );
}

function ScoreBar({ label, value, weight, tooltip }) {
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  const pct = Math.min(Math.max(n, 0), 10) * 10;
  return (
    <div className="sic-bar">
      <div className="sic-bar__header">
        <span className="sic-bar__label">
          {label}
          {tooltip && (
            <span className="sic-tooltip-wrap" aria-label={tooltip}>
              <span className="sic-tooltip-icon" aria-hidden="true">ℹ</span>
              <span className="sic-tooltip-box sic-tooltip-box--left" role="tooltip">{tooltip}</span>
            </span>
          )}
        </span>
        <span className="sic-bar__meta">
          <span className="sic-bar__score">{n.toFixed(1)}/10</span>
          <span className="sic-bar__weight">{Math.round(weight * 100)}%</span>
        </span>
      </div>
      <div className="sic-bar__track">
        <div className="sic-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SectionTitle({ icon, text, tooltip }) {
  return (
    <div className="sic-sec-title">
      <span className="sic-sec-title__icon" aria-hidden="true">{icon}</span>
      <h3 className="sic-sec-title__text">{text}</h3>
      {tooltip && (
        <span className="sic-tooltip-wrap" aria-label={tooltip}>
          <span className="sic-tooltip-icon" aria-hidden="true">ℹ</span>
          <span className="sic-tooltip-box" role="tooltip">{tooltip}</span>
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default async function StoreIntelligenceCard({
  storeId,
  locale      = 'ar-SA',
  countryCode = 'SA',
  variant     = 'full',
}) {
  const lang  = locale.split('-')[0];
  const isRtl = lang === 'ar';

  const [store, voucherCounts] = await Promise.all([
    fetchIntelligence(storeId, lang, countryCode),
    fetchVoucherCounts(storeId),
  ]);
  if (!store) return null;

  const t        = store.translations[0] || {};
  const metrics  = store.savingsMetrics[0] || null;
  const snapshot = store.savingsSnapshots[0] || null;
  const score    = parseFloat(metrics?.storeScore);
  const hasScore = !isNaN(score);
  const breakdown = (() => {
    try { return metrics?.scoreBreakdown ? JSON.parse(metrics.scoreBreakdown) : null; }
    catch { return null; }
  })();

  const hasDelivery = store.averageDeliveryDaysMin != null || store.averageDeliveryDaysMax != null;
  const accentColor = store.color || '#470ae2';

  // Voucher counts: prefer metrics fields, fall back to live counts
  const counts = {
    codes:    metrics?.totalCodes    ?? voucherCounts.codes,
    deals:    metrics?.totalDeals    ?? voucherCounts.deals,
    shipping: metrics?.totalFreeShipping ?? voucherCounts.shipping,
    bank:     metrics?.totalBankOffers   ?? voucherCounts.bank,
  };

  const lbl = isRtl ? {
    intelligence:    'ذكاء المتجر',
    storeScore:      'تقييم المتجر',
    howScore:        'يُحسب التقييم من: جودة التوفير (30٪) + نجاح الكوبون (20٪) + سرعة التوصيل (15٪) + مرونة الإرجاع (15٪) + تكرار العروض (10٪) + خيارات الدفع (10٪)',
    rank:            'الترتيب الأسبوعي',
    offers:          'الكوبونات والعروض',
    codes:           'كوبون خصم',
    deals:           'عرض مباشر',
    freeShip:        'شحن مجاني',
    bankOffers:      'عروض بنكية',
    bankTip:         'عروض خصم إضافية عند الدفع ببطاقات بنكية محددة',
    savingsIntel:    'مؤشرات التوفير',
    codeSuccess:     'نجاح الكوبون',
    codeSuccessTip:  'نسبة الكوبونات التي نجحت فعلاً عند الاستخدام خلال آخر 30 يوماً',
    maxSavings:      'أعلى توفير',
    maxSavingsTip:   'أعلى نسبة توفير ممكنة بدمج كوبون + عرض بنكي + شحن مجاني',
    avgDiscount:     'متوسط الخصم',
    avgDiscountTip:  'متوسط قيمة الخصم على جميع الكوبونات النشطة',
    offerFreq:       'تكرار العروض',
    offerFreqTip:    'متوسط عدد الأيام بين إطلاق العروض الجديدة',
    logistics:       'الشحن والإرجاع',
    delivery:        'مدة التوصيل',
    freeShipping:    'شحن مجاني من',
    returnWindow:    'مهلة الإرجاع',
    refund:          'استرداد المبلغ',
    freeReturns:     'إرجاع مجاني',
    days:            'أيام',
    sar:             'ر.س',
    payments:        'طرق الدفع',
    bnpl:            'تقسيط',
    upcoming:        'عروض متوقعة',
    scoreBreakdown:  'تفصيل التقييم',
    savings_w:       'جودة التوفير',
    savings_wTip:    'هل يوفر المتجر خصومات حقيقية؟ يُقيَّم بناءً على أعلى توفير قابل للتراكم',
    codeSuccess_w:   'نجاح الكوبونات',
    codeSuccess_wTip:'كم نسبة الكوبونات الناجحة؟ يعكس موثوقية الكوبونات',
    delivery_w:      'سرعة التوصيل',
    delivery_wTip:   'كلما قل عدد أيام التوصيل، ارتفع التقييم',
    returns_w:       'مرونة الإرجاع',
    returns_wTip:    'هل يوجد إرجاع مجاني ومهلة كافية؟',
    frequency_w:     'تكرار العروض',
    frequency_wTip:  'كلما كانت العروض أكثر تكراراً، ارتفع التقييم',
    payment_w:       'خيارات الدفع',
    payment_wTip:    'عدد طرق الدفع المتاحة بما فيها التقسيط',
    noData:          'غير متوفر',
    every:           'كل',
  } : {
    intelligence:    'Store Intelligence',
    storeScore:      'Store Score',
    howScore:        'Calculated from: Savings Quality (30%) + Code Success (20%) + Delivery Speed (15%) + Return Flexibility (15%) + Offer Frequency (10%) + Payment Options (10%)',
    rank:            'Weekly Rank',
    offers:          'Coupons & Offers',
    codes:           'Coupon Codes',
    deals:           'Deals',
    freeShip:        'Free Shipping',
    bankOffers:      'Bank Offers',
    bankTip:         'Extra discounts when paying with specific bank cards',
    savingsIntel:    'Savings Indicators',
    codeSuccess:     'Code Success Rate',
    codeSuccessTip:  'Percentage of coupons that actually worked when used in the last 30 days',
    maxSavings:      'Max Stackable Savings',
    maxSavingsTip:   'Highest saving possible by stacking a coupon + bank offer + free shipping',
    avgDiscount:     'Avg Discount',
    avgDiscountTip:  'Average discount value across all active coupons',
    offerFreq:       'Offer Frequency',
    offerFreqTip:    'Average number of days between new offers being published',
    logistics:       'Shipping & Returns',
    delivery:        'Delivery',
    freeShipping:    'Free shipping from',
    returnWindow:    'Return Window',
    refund:          'Refund Processing',
    freeReturns:     'Free Returns',
    days:            'days',
    sar:             'SAR',
    payments:        'Payment Methods',
    bnpl:            'BNPL',
    upcoming:        'Expected Offers',
    scoreBreakdown:  'Score Breakdown',
    savings_w:       'Savings Quality',
    savings_wTip:    'Does this store offer real discounts? Scored based on maximum stackable savings.',
    codeSuccess_w:   'Code Success',
    codeSuccess_wTip:'What % of coupons actually work? Reflects coupon reliability.',
    delivery_w:      'Delivery Speed',
    delivery_wTip:   'Fewer delivery days = higher score.',
    returns_w:       'Return Flexibility',
    returns_wTip:    'Free returns + generous return window = higher score.',
    frequency_w:     'Offer Frequency',
    frequency_wTip:  'More frequent new offers = higher score.',
    payment_w:       'Payment Options',
    payment_wTip:    'More payment methods including BNPL = higher score.',
    noData:          'N/A',
    every:           'Every',
  };

  // ── COMPACT ────────────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className="sic sic--compact" dir={isRtl ? 'rtl' : 'ltr'} style={{ '--sic-accent': accentColor }}>
        {store.logo && (
          <div className="sic-compact__watermark" aria-hidden="true">
            <img src={store.logo} alt="" />
          </div>
        )}
        <div className="sic-compact__content">
          <div className="sic-compact__top">
            <span className="sic-compact__name">{t.name}</span>
            {snapshot && <MovementBadge rank={snapshot.rank} movement={snapshot.movement} />}
          </div>
          {hasScore && (
            <div className="sic-compact__score-row">
              <div className="sic-compact__score-ring">
                <RingGauge pct={score * 10} color={accentColor} size={64} stroke={6} />
                <span className="sic-compact__score-val">{score.toFixed(1)}</span>
              </div>
              <div className="sic-compact__mini-stats">
                {metrics?.maxStackableSavingsPercent > 0 && (
                  <div className="sic-compact__mini">
                    <span>{metrics.maxStackableSavingsPercent}%</span>
                    <span>{lbl.maxSavings}</span>
                  </div>
                )}
                {metrics?.codeSuccessRate != null && (
                  <div className="sic-compact__mini">
                    <span>{Math.round(parseFloat(metrics.codeSuccessRate))}%</span>
                    <span>{lbl.codeSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── FULL ───────────────────────────────────────────────────────────────────
  return (
    <div className="sic sic--full" dir={isRtl ? 'rtl' : 'ltr'} style={{ '--sic-accent': accentColor }}>

      {/* ── HEADER ── dark band with fading watermark logo */}
      <div className="sic-hero">
        {store.logo && (
          <div className="sic-hero__watermark" aria-hidden="true">
            <img src={store.logo} alt="" />
          </div>
        )}
        <div className="sic-hero__content">
          <div className="sic-hero__title-row">
            <div>
              <p className="sic-hero__eyebrow">{lbl.intelligence}</p>
              <h2 className="sic-hero__name">{t.name}</h2>
            </div>
            {snapshot && <MovementBadge rank={snapshot.rank} movement={snapshot.movement} />}
          </div>

          {hasScore && (
            <div className="sic-hero__score-row">
              <div className="sic-hero__score-ring">
                <RingGauge pct={score * 10} color={accentColor} size={72} stroke={7} />
                <span className="sic-hero__score-val">{score.toFixed(1)}</span>
              </div>
              <div className="sic-hero__score-meta">
                <span className="sic-hero__score-label">
                  {lbl.storeScore}
                  <span className="sic-tooltip-wrap" aria-label={lbl.howScore}>
                    <span className="sic-tooltip-icon sic-tooltip-icon--light" aria-hidden="true">ℹ</span>
                    <span className="sic-tooltip-box sic-tooltip-box--wide" role="tooltip">{lbl.howScore}</span>
                  </span>
                </span>
                {store.lastVerifiedAt && (
                  <span className="sic-hero__verified">
                    ✓ {isRtl ? 'تم التحقق' : 'Verified'}{' '}
                    {new Date(store.lastVerifiedAt).toLocaleDateString(isRtl ? 'ar' : 'en', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── VOUCHER COUNT TILES ── */}
      <div className="sic-tiles">
        <CountTile icon="🏷️" value={counts.codes}    label={lbl.codes}      tooltip={isRtl ? 'كوبونات خصم نشطة يمكن نسخها واستخدامها' : 'Active coupon codes you can copy and apply at checkout'} />
        <CountTile icon="⚡" value={counts.deals}    label={lbl.deals}      tooltip={isRtl ? 'عروض مباشرة بدون كوبون' : 'Direct deals with no code needed — just click and save'} />
        <CountTile icon="📦" value={counts.shipping} label={lbl.freeShip}   tooltip={isRtl ? 'عروض شحن مجاني نشطة' : 'Active free-shipping offers for this store'} />
        <CountTile icon="🏦" value={counts.bank}     label={lbl.bankOffers} tooltip={lbl.bankTip} />
      </div>

      {/* ── SAVINGS GAUGES ── */}
      {metrics && (
        <div className="sic-section">
          <SectionTitle icon="◈" text={lbl.savingsIntel} />
          <div className="sic-gauges-grid">
            <GaugeStat
              pct={parseFloat(metrics.codeSuccessRate) || 0}
              label={lbl.codeSuccess}
              tooltip={lbl.codeSuccessTip}
              color={accentColor}
            />
            <GaugeStat
              pct={parseFloat(metrics.maxStackableSavingsPercent) || 0}
              label={lbl.maxSavings}
              tooltip={lbl.maxSavingsTip}
              color={accentColor}
            />
            <GaugeStat
              pct={parseFloat(metrics.averageDiscountPercent) || 0}
              label={lbl.avgDiscount}
              tooltip={lbl.avgDiscountTip}
              color={accentColor}
            />
            {store.offerFrequencyDays && (
              <div className="sic-gauge-stat">
                <div className="sic-gauge-stat__ring-wrap">
                  <RingGauge pct={Math.min(100, Math.round(30 / store.offerFrequencyDays * 100))} color={accentColor} />
                  <span className="sic-gauge-stat__value" style={{ fontSize: '0.85rem' }}>
                    {lbl.every}<br />{store.offerFrequencyDays}d
                  </span>
                </div>
                <div className="sic-gauge-stat__footer">
                  <span className="sic-gauge-stat__label">{lbl.offerFreq}</span>
                  <span className="sic-tooltip-wrap" aria-label={lbl.offerFreqTip}>
                    <span className="sic-tooltip-icon" aria-hidden="true">ℹ</span>
                    <span className="sic-tooltip-box" role="tooltip">{lbl.offerFreqTip}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOGISTICS ── */}
      {(hasDelivery || store.returnWindowDays != null || store.freeShippingThreshold != null) && (
        <div className="sic-section">
          <SectionTitle icon="⬡" text={lbl.logistics} />
          <div className="sic-rows">
            {hasDelivery && (
              <div className="sic-row">
                <span className="sic-row__icon">🚚</span>
                <span className="sic-row__label">{lbl.delivery}</span>
                <span className="sic-row__value">
                  {store.averageDeliveryDaysMin === store.averageDeliveryDaysMax
                    ? `${store.averageDeliveryDaysMin} ${lbl.days}`
                    : `${store.averageDeliveryDaysMin ?? '?'}–${store.averageDeliveryDaysMax ?? '?'} ${lbl.days}`}
                </span>
              </div>
            )}
            {store.freeShippingThreshold != null && (
              <div className="sic-row">
                <span className="sic-row__icon">📦</span>
                <span className="sic-row__label">{lbl.freeShipping}</span>
                <span className="sic-row__value">
                  {store.freeShippingThreshold === 0
                    ? (isRtl ? 'دائمًا' : 'Always')
                    : `${store.freeShippingThreshold} ${lbl.sar}`}
                </span>
              </div>
            )}
            {store.returnWindowDays != null && (
              <div className="sic-row">
                <span className="sic-row__icon">↩️</span>
                <span className="sic-row__label">{lbl.returnWindow}</span>
                <span className="sic-row__value">
                  {store.returnWindowDays} {lbl.days}
                  {store.freeReturns && <span className="sic-chip sic-chip--green">{lbl.freeReturns}</span>}
                </span>
              </div>
            )}
            {store.refundProcessingDaysMin != null && (
              <div className="sic-row">
                <span className="sic-row__icon">💳</span>
                <span className="sic-row__label">{lbl.refund}</span>
                <span className="sic-row__value">
                  {store.refundProcessingDaysMin === store.refundProcessingDaysMax
                    ? `${store.refundProcessingDaysMin} ${lbl.days}`
                    : `${store.refundProcessingDaysMin}–${store.refundProcessingDaysMax} ${lbl.days}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAYMENT METHODS ── */}
      {store.paymentMethods.length > 0 && (
        <div className="sic-section">
          <SectionTitle icon="◇" text={lbl.payments} />
          <div className="sic-payments">
            {store.paymentMethods.map((pm) => {
              const m = pm.paymentMethod;
              return (
                <div key={m.slug} className={`sic-pay${m.isBnpl ? ' sic-pay--bnpl' : ''}`} aria-label={m.translations[0]?.name || m.slug}>
                  {m.logo
                    ? <img src={m.logo} alt={m.translations[0]?.name || m.slug} className="sic-pay__logo" loading="lazy" />
                    : <span className="sic-pay__name">{m.translations[0]?.name || m.slug}</span>
                  }
                  {m.isBnpl && <span className="sic-chip sic-chip--accent">{lbl.bnpl}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── UPCOMING EVENTS ── */}
      {store.upcomingEvents.length > 0 && (
        <div className="sic-section">
          <SectionTitle icon="◉" text={lbl.upcoming} tooltip={isRtl ? 'توقعات بناءً على بيانات تاريخية وإعلانات المتجر' : 'Predictions based on historical data and store announcements'} />
          <div className="sic-events">
            {store.upcomingEvents.map((ev, i) => {
              const [yr, mo] = ev.expectedMonth.split('-');
              const moName   = new Date(Number(yr), Number(mo) - 1, 1)
                .toLocaleString(isRtl ? 'ar' : 'en', { month: 'long' });
              return (
                <div key={i} className="sic-event">
                  <div className="sic-event__info">
                    <span className="sic-event__name">{ev.eventName}</span>
                    <span className="sic-event__date">{moName} {yr}</span>
                  </div>
                  <div className="sic-event__right">
                    {ev.expectedMaxDiscount && (
                      <span className="sic-chip sic-chip--green">↑ {ev.expectedMaxDiscount}%</span>
                    )}
                    <ConfidencePips level={ev.confidenceLevel} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SCORE BREAKDOWN ── */}
      {breakdown && (
        <div className="sic-section sic-section--last">
          <SectionTitle icon="◫" text={lbl.scoreBreakdown} tooltip={lbl.howScore} />
          <div className="sic-bars">
            <ScoreBar label={lbl.savings_w}      value={breakdown.maxStackableSavings} weight={0.30} tooltip={lbl.savings_wTip} />
            <ScoreBar label={lbl.codeSuccess_w}  value={breakdown.codeSuccessRate}     weight={0.20} tooltip={lbl.codeSuccess_wTip} />
            <ScoreBar label={lbl.delivery_w}     value={breakdown.deliverySpeed}       weight={0.15} tooltip={lbl.delivery_wTip} />
            <ScoreBar label={lbl.returns_w}      value={breakdown.returnFlexibility}   weight={0.15} tooltip={lbl.returns_wTip} />
            <ScoreBar label={lbl.frequency_w}    value={breakdown.offerFrequency}      weight={0.10} tooltip={lbl.frequency_wTip} />
            <ScoreBar label={lbl.payment_w}      value={breakdown.paymentFlexibility}  weight={0.10} tooltip={lbl.payment_wTip} />
          </div>
        </div>
      )}

    </div>
  );
      }
