// components/StoreIntelligenceCard/StoreIntelligenceCard.jsx
// Server Component — self-fetching, zero client JS.
// Design: full #fafafa, fading watermark logo, material-symbols-sharp,
//         ring gauges for every metric, CSS-only tooltips.

import { prisma } from '@/lib/prisma';
import { getCurrentMonthIdentifier } from '@/lib/intelligence/calculateStoreScore.js';
import './StoreIntelligenceCard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Safely parse a Prisma Decimal/number/string → float, or NaN */
const pf = (v) => parseFloat(v);

/**
 * Normalise a rate value to 0–100.
 * Prisma Decimal fields for rates/percents may be stored as 0–1 OR 0–100.
 * Heuristic: if abs(value) <= 1.5 treat as fraction → multiply by 100.
 */
function toPercent(v) {
  const n = pf(v);
  if (isNaN(n)) return null;
  return Math.abs(n) <= 1.5 ? Math.round(n * 100) : Math.round(n);
}

/** Convert a 0–10 score to a 0–100 gauge percentage */
const scoreToPct = (v) => {
  const n = pf(v);
  return isNaN(n) ? null : Math.min(100, Math.max(0, Math.round(n * 10)));
};

/** Clamp to 0–100 */
const clamp = (v) => Math.min(100, Math.max(0, v ?? 0));

/**
 * Color-code a 0–100 percentage.
 * Red → Orange → Yellow → Lime → Green
 */
function pctToColor(pct) {
  const n = clamp(pct ?? 0);
  if (n >= 80) return '#22c55e'; // green-500
  if (n >= 60) return '#84cc16'; // lime-500
  if (n >= 40) return '#eab308'; // yellow-500
  if (n >= 20) return '#f97316'; // orange-500
  return '#ef4444';              // red-500
}

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
        // Fetch all active vouchers (type only) — counted in JS by type
        vouchers: {
          where: {
            AND: [
              { OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
            ],
          },
          select: { type: true },
        },
      },
    });
  } catch (e) {
    console.error('[StoreIntelligenceCard] fetchIntelligence error:', e.message);
    return null;
  }
}



// ─────────────────────────────────────────────────────────────────────────────
// Pure SVG ring gauge (no JS on client)
// ─────────────────────────────────────────────────────────────────────────────
function Ring({ pct, size = 88, stroke = 7, color = 'var(--sic-accent)' }) {
  const n      = clamp(pct ?? 0);
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - n / 100);
  const c      = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className="sic-ring" aria-hidden="true">
      <circle cx={c} cy={c} r={r}
        fill="none" stroke="var(--sic-ring-track)"
        strokeWidth={stroke} />
      <circle cx={c} cy={c} r={r}
        fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${c} ${c})`} />
    </svg>
  );
}

// Circular gauge card: ring + centred value + label below + optional tooltip
function GaugeCard({ pct, display, label, tooltip, sub, color, size = 88, stroke = 7 }) {
  const safePct = clamp(pct ?? 0);
  return (
    <div className="sic-gc">
      <div className="sic-gc__ring-wrap" style={{ width: size, height: size }}>
        <Ring pct={safePct} size={size} stroke={stroke} color={color} />
        <div className="sic-gc__center">
          <span className="sic-gc__val">{display ?? `${Math.round(safePct)}%`}</span>
          {sub && <span className="sic-gc__sub">{sub}</span>}
        </div>
      </div>
      <div className="sic-gc__footer">
        <span className="sic-gc__label">{label}</span>
        {tooltip && <Tip text={tooltip} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable atoms
// ─────────────────────────────────────────────────────────────────────────────
function Icon({ name, className = '' }) {
  return <span className={`material-symbols-sharp sic-icon ${className}`}>{name}</span>;
}

function Tip({ text, light = false }) {
  return (
    <span className="sic-tip" aria-label={text}>
      <Icon name="info" className={`sic-tip__icon${light ? ' sic-tip__icon--light' : ''}`} />
      <span className="sic-tip__box" role="tooltip">{text}</span>
    </span>
  );
}

function SecHead({ icon, text, tooltip }) {
  return (
    <div className="sic-sh">
      <Icon name={icon} className="sic-sh__icon" />
      <h3 className="sic-sh__text">{text}</h3>
      {tooltip && <Tip text={tooltip} />}
    </div>
  );
}

function Row({ icon, label, value, chip }) {
  return (
    <div className="sic-row">
      <Icon name={icon} className="sic-row__icon" />
      <span className="sic-row__label">{label}</span>
      <span className="sic-row__value">
        {value}
        {chip && <span className="sic-chip sic-chip--green">{chip}</span>}
      </span>
    </div>
  );
}

function Chip({ text, variant = 'accent' }) {
  return <span className={`sic-chip sic-chip--${variant}`}>{text}</span>;
}

function RankBadge({ rank, movement }) {
  const cls = movement === 'UP' ? 'up' : movement === 'DOWN' ? 'down' : 'same';
  const ico = movement === 'UP' ? 'trending_up' : movement === 'DOWN' ? 'trending_down' : 'trending_flat';
  return (
    <div className={`sic-rank sic-rank--${cls}`}>
      <span className="sic-rank__num">#{rank}</span>
      <Icon name={ico} className="sic-rank__ico" />
    </div>
  );
}

function ConfPips({ level }) {
  const n = { LOW: 1, MEDIUM: 2, HIGH: 3 }[level] ?? 1;
  return (
    <span className="sic-pips" aria-label={`Confidence: ${level}`}>
      {[1, 2, 3].map(i => (
        <span key={i} className={`sic-pip${i <= n ? ' sic-pip--on' : ''}`} />
      ))}
    </span>
  );
}

// Counter tile (voucher counts row)
function CountTile({ icon, value, label, tooltip }) {
  return (
    <div className="sic-ct">
      <Icon name={icon} className="sic-ct__icon" />
      <span className="sic-ct__val">{value ?? '–'}</span>
      <span className="sic-ct__label">
        {label}
        {tooltip && <Tip text={tooltip} />}
      </span>
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

  const store = await fetchIntelligence(storeId, lang, countryCode);
  if (!store) return null;

  const t        = store.translations[0] || {};
  const metrics  = store.savingsMetrics[0] || null;
  const snapshot = store.savingsSnapshots[0] || null;
  const rawScore = pf(metrics?.storeScore);
  const hasScore = !isNaN(rawScore);

  // Parse breakdown JSON safely
  const bd = (() => {
    try { return metrics?.scoreBreakdown ? JSON.parse(metrics.scoreBreakdown) : null; }
    catch { return null; }
  })();

  // Logistics flags
  const hasDelivery = store.averageDeliveryDaysMin != null || store.averageDeliveryDaysMax != null;
  const hasRefund   = store.refundProcessingDaysMin != null;
  const accent      = store.color || '#470ae2';

  // Voucher counts — derived from the vouchers already fetched
  const vv = store.vouchers ?? [];
  const vc = {
    codes:    vv.filter(v => v.type === 'CODE').length,
    deals:    vv.filter(v => v.type === 'DEAL').length,
    shipping: vv.filter(v => v.type === 'FREE_SHIPPING').length,
    bank:     vv.filter(v => v.type === 'BANK_OFFER').length,
  };

  // ── Normalised metric values ──────────────────────────────────────────────
  // codeSuccessRate: stored as 0-1 fraction or 0-100 — normalise to 0-100
  const successPct  = toPercent(metrics?.codeSuccessRate);
  // maxStackableSavingsPercent: already a percent (e.g. 35 → 35%)
  const maxSavePct  = metrics?.maxStackableSavingsPercent != null
    ? Math.round(pf(metrics.maxStackableSavingsPercent))
    : null;
  // averageDiscountPercent: already a percent
  const avgDiscPct  = metrics?.averageDiscountPercent != null
    ? Math.round(pf(metrics.averageDiscountPercent))
    : null;

  // offerFrequencyDays → gauge: every 1 day = 100%, every 30+ days ≈ 0%
  const freqPct = store.offerFrequencyDays
    ? clamp(Math.round((1 - (Math.min(store.offerFrequencyDays, 30) - 1) / 29) * 100))
    : null;

  // Score breakdown: 0-10 values → convert to 0-100 for gauge
  const bdPct = (key) => bd?.[key] != null ? scoreToPct(bd[key]) : null;

  // Delivery score for gauge: max 14 days → score = clamp((14 - days) / 14 * 100)
  const delivPct = hasDelivery
    ? clamp(Math.round((1 - (Math.min(store.averageDeliveryDaysMax ?? store.averageDeliveryDaysMin ?? 14, 14)) / 14) * 100))
    : null;

  // Return score: 30-day window = full, 0 = 0%, free returns bonus
  const returnPct = store.returnWindowDays != null
    ? clamp(Math.round(
        (Math.min(store.returnWindowDays, 30) / 30) * (store.freeReturns ? 100 : 80)
      ))
    : null;

  const L = isRtl ? {
    intelligence:   'ذكاء المتجر',
    storeScore:     'تقييم المتجر',
    howScore:       'يُحسب من: جودة التوفير (30٪) + نجاح الكوبون (20٪) + سرعة التوصيل (15٪) + مرونة الإرجاع (15٪) + تكرار العروض (10٪) + خيارات الدفع (10٪)',
    rankLabel:      'الترتيب الأسبوعي',
    codes:          'كوبون',         codesTip:    'كوبونات خصم نشطة يمكن نسخها عند الدفع',
    deals:          'عرض',           dealsTip:    'عروض مباشرة بدون كوبون — اضغط واحفظ',
    freeShip:       'شحن',           freeShipTip: 'عروض شحن مجاني نشطة',
    bankOffers:     'بنكي',          bankTip:     'خصومات إضافية ببطاقات بنكية محددة',
    savingsIntel:   'مؤشرات التوفير',
    codeSuccess:    'نجاح الكوبون',  codeSuccTip: 'نسبة الكوبونات التي نجحت خلال آخر 30 يوماً',
    maxSavings:     'أعلى توفير',    maxSaveTip:  'أعلى توفير ممكن بدمج كوبون + عرض بنكي + شحن مجاني',
    avgDiscount:    'متوسط الخصم',   avgDiscTip:  'متوسط قيمة الخصم على الكوبونات النشطة',
    offerFreq:      'تكرار العروض',  freqTip:     'كلما قلّت الأيام بين العروض، ارتفع التقييم',
    logistics:      'الشحن والإرجاع',
    delivery:       'مدة التوصيل',
    freeShipping:   'شحن مجاني من',
    returnWindow:   'مهلة الإرجاع',
    refund:         'استرداد المبلغ',
    freeReturns:    'مجاني',
    days:           'أيام',
    sar:            'ر.س',
    always:         'دائمًا',
    payments:       'طرق الدفع',
    bnpl:           'تقسيط',
    upcoming:       'عروض متوقعة',   upcomingTip: 'توقعات بناءً على بيانات تاريخية وإعلانات المتجر',
    scoreBreakdown: 'تفصيل التقييم',
    savings_w:      'جودة التوفير',  savings_wTip:     'هل يوفر المتجر خصومات حقيقية؟',
    codeSuccess_w:  'نجاح الكوبون', codeSuccess_wTip: 'موثوقية الكوبونات عند الاستخدام',
    delivery_w:     'سرعة التوصيل', delivery_wTip:    'كلما قل عدد أيام التوصيل، ارتفع التقييم',
    returns_w:      'الإرجاع',       returns_wTip:     'مهلة الإرجاع المجاني',
    frequency_w:    'تكرار العروض',  frequency_wTip:   'كثافة العروض الجديدة',
    payment_w:      'طرق الدفع',     payment_wTip:     'عدد طرق الدفع بما فيها التقسيط',
    verified:       'تم التحقق',
  } : {
    intelligence:   'Store Intelligence',
    storeScore:     'Store Score',
    howScore:       'Score = Savings Quality (30%) + Code Success (20%) + Delivery Speed (15%) + Return Flexibility (15%) + Offer Frequency (10%) + Payment Options (10%)',
    rankLabel:      'Weekly Rank',
    codes:          'Codes',        codesTip:    'Active coupon codes you can copy at checkout',
    deals:          'Deals',        dealsTip:    'Direct deals — no code needed, just click and save',
    freeShip:       'Shipping',     freeShipTip: 'Active free-shipping offers for this store',
    bankOffers:     'Bank',         bankTip:     'Extra discounts when paying with specific bank cards',
    savingsIntel:   'Savings Indicators',
    codeSuccess:    'Code Success', codeSuccTip: '% of coupons that actually worked in the last 30 days',
    maxSavings:     'Max Savings',  maxSaveTip:  'Best saving possible stacking coupon + bank offer + free shipping',
    avgDiscount:    'Avg Discount', avgDiscTip:  'Average discount across all active coupon codes',
    offerFreq:      'Offer Freq.',  freqTip:     'How often new offers are published — more frequent = higher score',
    logistics:      'Shipping & Returns',
    delivery:       'Delivery',
    freeShipping:   'Free shipping from',
    returnWindow:   'Return Window',
    refund:         'Refund Processing',
    freeReturns:    'Free',
    days:           'days',
    sar:            'SAR',
    always:         'Always',
    payments:       'Payment Methods',
    bnpl:           'BNPL',
    upcoming:       'Upcoming Offers', upcomingTip: 'Predictions based on historical data & store announcements',
    scoreBreakdown: 'Score Breakdown',
    savings_w:      'Savings',       savings_wTip:     'Real discount quality — based on max stackable savings',
    codeSuccess_w:  'Code Success',  codeSuccess_wTip: 'Coupon reliability — % of codes that actually work',
    delivery_w:     'Delivery',      delivery_wTip:    'Fewer delivery days = higher score',
    returns_w:      'Returns',       returns_wTip:     'Free returns + generous return window = higher score',
    frequency_w:    'Frequency',     frequency_wTip:   'More frequent new offers = higher score',
    payment_w:      'Payments',      payment_wTip:     'More payment options including BNPL = higher score',
    verified:       'Verified',
  };

  // ── COMPACT ────────────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className="sic sic--compact" dir={isRtl ? 'rtl' : 'ltr'} style={{ '--sic-accent': accent }}>
        {store.logo && (
          <div className="sic-wm" aria-hidden="true">
            <img src={store.logo} alt="" />
          </div>
        )}
        <div className="sic-compact__inner">
          <div className="sic-compact__top">
            <div>
              <p className="sic-compact__eyebrow">{L.intelligence}</p>
              <p className="sic-compact__name">{t.name}</p>
            </div>
            {snapshot && <RankBadge rank={snapshot.rank} movement={snapshot.movement} />}
          </div>
          {hasScore && (
            <div className="sic-compact__gauges">
              <GaugeCard pct={rawScore * 10} display={rawScore.toFixed(1)}
                sub="/10" label={L.storeScore} color={pctToColor(rawScore * 10)} size={72} stroke={6} />
              {successPct != null && (
                <GaugeCard pct={successPct} label={L.codeSuccess} color={pctToColor(successPct)} size={72} stroke={6} />
              )}
              {maxSavePct != null && (
                <GaugeCard pct={maxSavePct} label={L.maxSavings} color={pctToColor(clamp(maxSavePct))} size={72} stroke={6} />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── FULL ───────────────────────────────────────────────────────────────────
  return (
    <div className="sic sic--full" dir={isRtl ? 'rtl' : 'ltr'} style={{ '--sic-accent': accent }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="sic-hero">
        {/* Fading watermark — large logo behind content */}
        {store.logo && (
          <div className="sic-wm" aria-hidden="true">
            <img src={store.logo} alt="" />
          </div>
        )}

        <div className="sic-hero__inner">
          {/* Top row: eyebrow + name + rank */}
          <div className="sic-hero__top">
            <div>
              <p className="sic-hero__eyebrow">{L.intelligence}</p>
              <h2 className="sic-hero__name">{t.name}</h2>
            </div>
            {snapshot && <RankBadge rank={snapshot.rank} movement={snapshot.movement} />}
          </div>

          {/* Score ring + meta */}
          {hasScore && (
            <div className="sic-hero__score">
              <GaugeCard
                pct={rawScore * 10}
                display={rawScore.toFixed(1)}
                sub="/10"
                label={L.storeScore}
                color={pctToColor(rawScore * 10)}
                size={80}
                stroke={7}
              />
              <div className="sic-hero__score-meta">
                <div className="sic-hero__score-tip">
                  <Tip text={L.howScore} />
                  <span className="sic-hero__score-tip-label">{L.howScore.split(' ').slice(0, 3).join(' ')}…</span>
                </div>
                {store.lastVerifiedAt && (
                  <div className="sic-hero__verified">
                    <Icon name="verified" className="sic-hero__verified-icon" />
                    <span>{L.verified} {new Date(store.lastVerifiedAt).toLocaleDateString(
                      isRtl ? 'ar' : 'en', { month: 'short', year: 'numeric' }
                    )}</span>
                  </div>
                )}
                {metrics?.totalActiveOffers != null && (
                  <div className="sic-hero__active">
                    <Icon name="local_offer" />
                    <span>{metrics.totalActiveOffers} {isRtl ? 'عرض نشط' : 'active offers'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ VOUCHER COUNT TILES ════════════════════════════════════════════ */}
      <div className="sic-tiles">
        <CountTile icon="confirmation_number" value={vc.codes}    label={L.codes}      tooltip={L.codesTip} />
        <CountTile icon="sell"                value={vc.deals}    label={L.deals}      tooltip={L.dealsTip} />
        <CountTile icon="local_shipping"      value={vc.shipping} label={L.freeShip}   tooltip={L.freeShipTip} />
        <CountTile icon="account_balance"     value={vc.bank}     label={L.bankOffers} tooltip={L.bankTip} />
      </div>

      {/* ══ SAVINGS GAUGES ════════════════════════════════════════════════ */}
      {metrics && (successPct != null || maxSavePct != null || avgDiscPct != null || freqPct != null) && (
        <div className="sic-section">
          <SecHead icon="insights" text={L.savingsIntel} />
          <div className="sic-gauges">
            {successPct != null && (
              <GaugeCard pct={successPct} label={L.codeSuccess} tooltip={L.codeSuccTip} color={pctToColor(successPct)} />
            )}
            {maxSavePct != null && (
              <GaugeCard pct={clamp(maxSavePct)} label={L.maxSavings} tooltip={L.maxSaveTip} color={pctToColor(clamp(maxSavePct))} />
            )}
            {avgDiscPct != null && (
              <GaugeCard pct={clamp(avgDiscPct)} label={L.avgDiscount} tooltip={L.avgDiscTip} color={pctToColor(clamp(avgDiscPct))} />
            )}
            {freqPct != null && (
              <GaugeCard
                pct={freqPct}
                display={`${store.offerFrequencyDays}d`}
                label={L.offerFreq}
                tooltip={L.freqTip}
                color={pctToColor(freqPct)}
              />
            )}
          </div>
        </div>
      )}

      {/* ══ LOGISTICS ════════════════════════════════════════════════════ */}
      {(hasDelivery || store.returnWindowDays != null || store.freeShippingThreshold != null || hasRefund) && (
        <div className="sic-section">
          <SecHead icon="local_shipping" text={L.logistics} />

          {/* Logistics gauges + rows hybrid */}
          <div className="sic-logi-gauges">
            {delivPct != null && (
              <GaugeCard
                pct={delivPct}
                display={
                  store.averageDeliveryDaysMin === store.averageDeliveryDaysMax
                    ? `${store.averageDeliveryDaysMin}d`
                    : `${store.averageDeliveryDaysMin ?? '?'}–${store.averageDeliveryDaysMax ?? '?'}d`
                }
                label={L.delivery}
                tooltip={isRtl ? 'سرعة التوصيل — أقل أيام = تقييم أعلى' : 'Delivery speed — fewer days = higher score'}
                color={pctToColor(delivPct)}
                size={76}
                stroke={6}
              />
            )}
            {returnPct != null && (
              <GaugeCard
                pct={returnPct}
                display={`${store.returnWindowDays}d`}
                label={L.returnWindow}
                tooltip={isRtl ? 'مهلة الإرجاع — كلما طالت، ارتفع التقييم' : 'Return window — longer = higher score'}
                color={pctToColor(returnPct)}
                size={76}
                stroke={6}
              />
            )}
          </div>

          <div className="sic-rows">
            {store.freeShippingThreshold != null && (
              <Row icon="inventory_2" label={L.freeShipping}
                value={store.freeShippingThreshold === 0
                  ? L.always
                  : `${store.freeShippingThreshold} ${L.sar}`}
              />
            )}
            {store.freeReturns && (
              <Row icon="undo" label={L.returnWindow}
                value={`${store.returnWindowDays} ${L.days}`}
                chip={L.freeReturns}
              />
            )}
            {hasRefund && (
              <Row icon="payments" label={L.refund}
                value={
                  store.refundProcessingDaysMin === store.refundProcessingDaysMax
                    ? `${store.refundProcessingDaysMin} ${L.days}`
                    : `${store.refundProcessingDaysMin}–${store.refundProcessingDaysMax} ${L.days}`
                }
              />
            )}
          </div>
        </div>
      )}

      {/* ══ PAYMENT METHODS ══════════════════════════════════════════════ */}
      {store.paymentMethods.length > 0 && (
        <div className="sic-section">
          <SecHead icon="credit_card" text={L.payments} />
          <div className="sic-payments">
            {store.paymentMethods.map((pm) => {
              const m = pm.paymentMethod;
              const name = m.translations[0]?.name || m.slug;
              return (
                <div key={m.slug} className={`sic-pay${m.isBnpl ? ' sic-pay--bnpl' : ''}`} aria-label={name}>
                  {m.logo
                    ? <img src={m.logo} alt={name} className="sic-pay__logo" loading="lazy" />
                    : <span className="sic-pay__name">{name}</span>
                  }
                  {m.isBnpl && <Chip text={L.bnpl} variant="accent" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ UPCOMING EVENTS ══════════════════════════════════════════════ */}
      {store.upcomingEvents.length > 0 && (
        <div className="sic-section">
          <SecHead icon="event" text={L.upcoming} tooltip={L.upcomingTip} />
          <div className="sic-events">
            {store.upcomingEvents.map((ev, i) => {
              const [yr, mo] = ev.expectedMonth.split('-');
              const moName = new Date(Number(yr), Number(mo) - 1, 1)
                .toLocaleString(isRtl ? 'ar' : 'en', { month: 'long' });
              return (
                <div key={i} className="sic-event">
                  <div className="sic-event__info">
                    <span className="sic-event__name">{ev.eventName}</span>
                    <span className="sic-event__date">{moName} {yr}</span>
                  </div>
                  <div className="sic-event__right">
                    {ev.expectedMaxDiscount && (
                      <Chip text={`↑ ${ev.expectedMaxDiscount}%`} variant="green" />
                    )}
                    <ConfPips level={ev.confidenceLevel} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ SCORE BREAKDOWN — all ring gauges ═══════════════════════════ */}
      {bd && (
        <div className="sic-section sic-section--last">
          <SecHead icon="bar_chart" text={L.scoreBreakdown} tooltip={L.howScore} />
          <div className="sic-gauges sic-gauges--3col">
            {[
              { key: 'maxStackableSavings', label: L.savings_w,      tip: L.savings_wTip,      w: 30 },
              { key: 'codeSuccessRate',     label: L.codeSuccess_w,  tip: L.codeSuccess_wTip,  w: 20 },
              { key: 'deliverySpeed',       label: L.delivery_w,     tip: L.delivery_wTip,     w: 15 },
              { key: 'returnFlexibility',   label: L.returns_w,      tip: L.returns_wTip,      w: 15 },
              { key: 'offerFrequency',      label: L.frequency_w,    tip: L.frequency_wTip,    w: 10 },
              { key: 'paymentFlexibility',  label: L.payment_w,      tip: L.payment_wTip,      w: 10 },
            ].map(({ key, label, tip, w }) => {
              const pct = bdPct(key);
              if (pct == null) return null;
              const score = pf(bd[key]).toFixed(1);
              return (
                <GaugeCard
                  key={key}
                  pct={pct}
                  display={score}
                  sub={`/10 · ${w}%`}
                  label={label}
                  tooltip={tip}
                  color={pctToColor(pct)}
                  size={76}
                  stroke={6}
                />
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
