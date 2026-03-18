// components/StoreIntelligenceCard/StoreIntelligenceCard.jsx
// Server Component — self-fetching, zero client JS.

import { prisma } from '@/lib/prisma';
import { getCurrentMonthIdentifier } from '@/lib/intelligence/calculateStoreScore.js';
import './StoreIntelligenceCard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const pf = (v) => parseFloat(v);

function toPercent(v) {
  const n = pf(v);
  if (isNaN(n)) return null;
  return Math.abs(n) <= 1.5 ? Math.round(n * 100) : Math.round(n);
}

const scoreToPct = (v) => {
  const n = pf(v);
  return isNaN(n) ? null : Math.min(100, Math.max(0, Math.round(n * 10)));
};

const clamp = (v) => Math.min(100, Math.max(0, v ?? 0));

// Muted, professional semantic colors
function pctToColor(pct) {
  const n = clamp(pct ?? 0);
  if (n >= 80) return '#059669'; // Emerald-600
  if (n >= 60) return '#65a30d'; // Lime-600
  if (n >= 40) return '#d97706'; // Amber-600
  if (n >= 20) return '#ea580c'; // Orange-600
  return '#dc2626';              // Red-600
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
// Pure SVG ring gauge (Sleek & Technical)
// ─────────────────────────────────────────────────────────────────────────────
// Reduced stroke to 4px for a precise instrument feel
function Ring({ pct, size = 80, stroke = 4, color = 'var(--sic-accent)' }) {
  const n      = clamp(pct ?? 0);
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - n / 100);
  const c      = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sic-ring" aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--sic-ring-track)" strokeWidth={stroke} />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${c} ${c})`} />
    </svg>
  );
}

function GaugeCard({ pct, display, label, tooltip, sub, color, size = 80, stroke = 4 }) {
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

function Tip({ text }) {
  return (
    <span className="sic-tip" aria-label={text}>
      <Icon name="info" className="sic-tip__icon" />
      <span className="sic-tip__box" role="tooltip">{text}</span>
    </span>
  );
}

function SecHead({ icon, text, tooltip }) {
  return (
    <div className="sic-sh">
      <div className="sic-sh__group">
        <Icon name={icon} className="sic-sh__icon" />
        <h3 className="sic-sh__text">{text}</h3>
      </div>
      {tooltip && <Tip text={tooltip} />}
    </div>
  );
}

function Row({ label, value, chip }) {
  return (
    <div className="sic-row">
      <span className="sic-row__label">{label}</span>
      <div className="sic-row__value-group">
        {chip && <span className="sic-chip sic-chip--accent">{chip}</span>}
        <span className="sic-row__value">{value}</span>
      </div>
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
      <span className="sic-rank__label">RANK</span>
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

function CountTile({ icon, value, label, tooltip }) {
  return (
    <div className="sic-ct">
      <div className="sic-ct__header">
        <Icon name={icon} className="sic-ct__icon" />
        <span className="sic-ct__val">{value ?? '–'}</span>
      </div>
      <div className="sic-ct__footer">
        <span className="sic-ct__label">{label}</span>
        {tooltip && <Tip text={tooltip} />}
      </div>
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

  const bd = (() => {
    try { return metrics?.scoreBreakdown ? JSON.parse(metrics.scoreBreakdown) : null; }
    catch { return null; }
  })();

  const hasDelivery = store.averageDeliveryDaysMin != null || store.averageDeliveryDaysMax != null;
  const hasRefund   = store.refundProcessingDaysMin != null;
  
  // Enforce a highly professional accent default if none exists
  const accent = store.color || '#0f172a';

  const vv = store.vouchers ?? [];
  const vc = {
    codes:    vv.filter(v => v.type === 'CODE').length,
    deals:    vv.filter(v => v.type === 'DEAL').length,
    shipping: vv.filter(v => v.type === 'FREE_SHIPPING').length,
    bank:     vv.filter(v => v.type === 'BANK_OFFER').length,
  };

  const successPct = toPercent(metrics?.codeSuccessRate);
  const maxSavePct = metrics?.maxStackableSavingsPercent != null ? Math.round(pf(metrics.maxStackableSavingsPercent)) : null;
  const avgDiscPct = metrics?.averageDiscountPercent != null ? Math.round(pf(metrics.averageDiscountPercent)) : null;
  const freqPct    = store.offerFrequencyDays ? clamp(Math.round((1 - (Math.min(store.offerFrequencyDays, 30) - 1) / 29) * 100)) : null;

  const bdPct      = (key) => bd?.[key] != null ? scoreToPct(bd[key]) : null;
  const delivPct   = hasDelivery ? clamp(Math.round((1 - (Math.min(store.averageDeliveryDaysMax ?? store.averageDeliveryDaysMin ?? 14, 14)) / 14) * 100)) : null;
  const returnPct  = store.returnWindowDays != null ? clamp(Math.round((Math.min(store.returnWindowDays, 30) / 30) * (store.freeReturns ? 100 : 80))) : null;

  const L = isRtl ? {
    intelligence:   'تقرير ذكاء المتجر',
    storeScore:     'مؤشر التقييم',
    howScore:       'يُحسب من: التوفير (30٪)، الكوبونات (20٪)، التوصيل (15٪)، الإرجاع (15٪)، العروض (10٪)، الدفع (10٪)',
    codes:          'كوبون',         codesTip:    'كوبونات خصم نشطة',
    deals:          'عرض',           dealsTip:    'عروض مباشرة بدون كود',
    freeShip:       'شحن',           freeShipTip: 'عروض شحن مجاني',
    bankOffers:     'بنكي',          bankTip:     'خصومات بطاقات الائتمان',
    savingsIntel:   'مؤشرات الأداء والتوفير',
    codeSuccess:    'دقة الكوبون',   codeSuccTip: 'نسبة نجاح الكوبونات (أخر 30 يوم)',
    maxSavings:     'أعلى توفير',    maxSaveTip:  'الحد الأقصى للتوفير بدمج العروض',
    avgDiscount:    'متوسط الخصم',   avgDiscTip:  'متوسط الخصم للكوبونات النشطة',
    offerFreq:      'تكرار العروض',  freqTip:     'سرعة طرح المتجر لعروض جديدة',
    logistics:      'سياسات الشحن والإرجاع',
    delivery:       'مدة التوصيل',
    freeShipping:   'شحن مجاني بدءاً من',
    returnWindow:   'مهلة الإرجاع',
    refund:         'استرداد المبلغ',
    freeReturns:    'إرجاع مجاني',
    days:           'أيام',
    sar:            'ر.س',
    always:         'دائمًا',
    payments:       'بوابات الدفع المدعومة',
    bnpl:           'تقسيط',
    upcoming:       'التوقعات المستقبلية', upcomingTip: 'مبني على تحليل البيانات السابقة',
    scoreBreakdown: 'تحليل التقييم التفصيلي',
    savings_w:      'جودة التوفير',  savings_wTip:     'قيمة الخصومات الفعلية المتاحة',
    codeSuccess_w:  'دقة الكوبونات', codeSuccess_wTip: 'موثوقية الأكواد عند الدفع',
    delivery_w:     'سرعة التوصيل', delivery_wTip:    'التقييم مبني على قصر مدة التوصيل',
    returns_w:      'مرونة الإرجاع', returns_wTip:     'فترة الإرجاع والتكاليف',
    frequency_w:    'كثافة العروض',  frequency_wTip:   'مدى استمرارية توفر عروض جديدة',
    payment_w:      'خيارات الدفع',  payment_wTip:     'تنوع بوابات الدفع والتقسيط',
    verified:       'موثق',
  } : {
    intelligence:   'Intelligence Report',
    storeScore:     'Store Index',
    howScore:       'Score = Savings (30%) + Success (20%) + Delivery (15%) + Returns (15%) + Freq (10%) + Payments (10%)',
    codes:          'Codes',        codesTip:    'Active coupon codes',
    deals:          'Deals',        dealsTip:    'Direct promotional deals',
    freeShip:       'Shipping',     freeShipTip: 'Free shipping offers',
    bankOffers:     'Bank',         bankTip:     'Credit card discounts',
    savingsIntel:   'Performance & Savings',
    codeSuccess:    'Code Accuracy',codeSuccTip: 'Success rate of coupons (last 30d)',
    maxSavings:     'Max Savings',  maxSaveTip:  'Highest possible discount by stacking',
    avgDiscount:    'Avg Discount', avgDiscTip:  'Average off across active codes',
    offerFreq:      'Offer Freq.',  freqTip:     'How fast new offers are published',
    logistics:      'Logistics & Policies',
    delivery:       'Delivery Time',
    freeShipping:   'Free Shipping from',
    returnWindow:   'Return Window',
    refund:         'Refund Processing',
    freeReturns:    'Free Returns',
    days:           'days',
    sar:            'SAR',
    always:         'Always',
    payments:       'Supported Gateways',
    bnpl:           'BNPL',
    upcoming:       'Future Projections', upcomingTip: 'Based on historical data analysis',
    scoreBreakdown: 'Detailed Score Analysis',
    savings_w:      'Savings Value', savings_wTip:     'Real discount quality available',
    codeSuccess_w:  'Code Accuracy', codeSuccess_wTip: 'Reliability of codes at checkout',
    delivery_w:     'Delivery Spd.', delivery_wTip:    'Score based on rapid fulfillment',
    returns_w:      'Return Policy', returns_wTip:     'Flexibility and cost of returns',
    frequency_w:    'Offer Density', frequency_wTip:   'Consistency of new promotions',
    payment_w:      'Payment Opts.', payment_wTip:     'Variety of gateways including BNPL',
    verified:       'Verified',
  };

  if (variant === 'compact') {
    return (
      <div className="sic sic--compact" dir={isRtl ? 'rtl' : 'ltr'} style={{ '--sic-accent': accent }}>
        <div className="sic-compact__header">
          <div className="sic-compact__id">
            {store.logo && <img src={store.logo} alt="" className="sic-compact__logo" />}
            <div className="sic-compact__title">
              <span className="sic-eyebrow">{L.intelligence}</span>
              <span className="sic-name">{t.name}</span>
            </div>
          </div>
          {snapshot && <RankBadge rank={snapshot.rank} movement={snapshot.movement} />}
        </div>
        {hasScore && (
          <div className="sic-compact__gauges">
            <GaugeCard pct={rawScore * 10} display={rawScore.toFixed(1)} sub="/10" label={L.storeScore} color={pctToColor(rawScore * 10)} size={64} stroke={3} />
            {successPct != null && <GaugeCard pct={successPct} label={L.codeSuccess} color={pctToColor(successPct)} size={64} stroke={3} />}
            {maxSavePct != null && <GaugeCard pct={maxSavePct} label={L.maxSavings} color={pctToColor(clamp(maxSavePct))} size={64} stroke={3} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sic sic--full" dir={isRtl ? 'rtl' : 'ltr'} style={{ '--sic-accent': accent }}>
      {/* ══ MASTHEAD ═══════════════════════════════════════════════════════ */}
      <div className="sic-masthead">
        <div className="sic-masthead__brand">
          {store.logo && (
            <div className="sic-masthead__logo-box">
              <img src={store.logo} alt={t.name} />
            </div>
          )}
          <div className="sic-masthead__titles">
            <span className="sic-eyebrow">{L.intelligence}</span>
            <h2 className="sic-name">{t.name}</h2>
          </div>
        </div>
        <div className="sic-masthead__actions">
          {store.lastVerifiedAt && (
            <div className="sic-verified-tag">
              <Icon name="verified_user" />
              <span>{new Date(store.lastVerifiedAt).toLocaleDateString(isRtl ? 'ar' : 'en', { month: 'short', year: 'numeric' })}</span>
            </div>
          )}
          {snapshot && <RankBadge rank={snapshot.rank} movement={snapshot.movement} />}
        </div>
      </div>

      {/* ══ EXECUTIVE SUMMARY (SCORE) ═════════════════════════════════════ */}
      {hasScore && (
        <div className="sic-executive">
          <div className="sic-executive__gauge">
            <GaugeCard
              pct={rawScore * 10}
              display={rawScore.toFixed(1)}
              sub="/ 10"
              label={L.storeScore}
              color={pctToColor(rawScore * 10)}
              size={100}
              stroke={5}
            />
          </div>
          <div className="sic-executive__details">
            <div className="sic-executive__metrics">
              <div className="sic-emetric">
                <span className="sic-emetric__val">{metrics.totalActiveOffers ?? 0}</span>
                <span className="sic-emetric__lbl">{isRtl ? 'عروض نشطة' : 'Active Offers'}</span>
              </div>
              <div className="sic-emetric">
                <span className="sic-emetric__val" style={{ color: pctToColor(successPct) }}>{successPct ?? '--'}%</span>
                <span className="sic-emetric__lbl">{L.codeSuccess}</span>
              </div>
            </div>
            <p className="sic-executive__formula">
              <Icon name="functions" />
              {L.howScore}
            </p>
          </div>
        </div>
      )}

      {/* ══ VOUCHER COUNT TILES ════════════════════════════════════════════ */}
      <div className="sic-tiles">
        <CountTile icon="local_activity" value={vc.codes} label={L.codes} tooltip={L.codesTip} />
        <CountTile icon="bolt" value={vc.deals} label={L.deals} tooltip={L.dealsTip} />
        <CountTile icon="local_shipping" value={vc.shipping} label={L.freeShip} tooltip={L.freeShipTip} />
        <CountTile icon="credit_score" value={vc.bank} label={L.bankOffers} tooltip={L.bankTip} />
      </div>

      {/* ══ SAVINGS GAUGES ════════════════════════════════════════════════ */}
      {metrics && (successPct != null || maxSavePct != null || avgDiscPct != null || freqPct != null) && (
        <div className="sic-section">
          <SecHead icon="monitoring" text={L.savingsIntel} />
          <div className="sic-gauges">
            {successPct != null && <GaugeCard pct={successPct} label={L.codeSuccess} tooltip={L.codeSuccTip} color={pctToColor(successPct)} size={72} />}
            {maxSavePct != null && <GaugeCard pct={clamp(maxSavePct)} label={L.maxSavings} tooltip={L.maxSaveTip} color={pctToColor(clamp(maxSavePct))} size={72} />}
            {avgDiscPct != null && <GaugeCard pct={clamp(avgDiscPct)} label={L.avgDiscount} tooltip={L.avgDiscTip} color={pctToColor(clamp(avgDiscPct))} size={72} />}
            {freqPct != null && <GaugeCard pct={freqPct} display={`${store.offerFrequencyDays}d`} label={L.offerFreq} tooltip={L.freqTip} color={pctToColor(freqPct)} size={72} />}
          </div>
        </div>
      )}

      {/* ══ LOGISTICS ════════════════════════════════════════════════════ */}
      {(hasDelivery || store.returnWindowDays != null || store.freeShippingThreshold != null || hasRefund) && (
        <div className="sic-section">
          <SecHead icon="conveyor_belt" text={L.logistics} />
          
          <div className="sic-logistics-grid">
            <div className="sic-logistics-gauges">
              {delivPct != null && <GaugeCard pct={delivPct} display={store.averageDeliveryDaysMin === store.averageDeliveryDaysMax ? `${store.averageDeliveryDaysMin}d` : `${store.averageDeliveryDaysMin ?? '?'}–${store.averageDeliveryDaysMax ?? '?'}d`} label={L.delivery} color={pctToColor(delivPct)} size={64} stroke={3} />}
              {returnPct != null && <GaugeCard pct={returnPct} display={`${store.returnWindowDays}d`} label={L.returnWindow} color={pctToColor(returnPct)} size={64} stroke={3} />}
            </div>
            <div className="sic-rows">
              {store.freeShippingThreshold != null && (
                <Row label={L.freeShipping} value={store.freeShippingThreshold === 0 ? L.always : `${store.freeShippingThreshold} ${L.sar}`} />
              )}
              {store.freeReturns && (
                <Row label={L.returnWindow} value={`${store.returnWindowDays} ${L.days}`} chip={L.freeReturns} />
              )}
              {hasRefund && (
                <Row label={L.refund} value={store.refundProcessingDaysMin === store.refundProcessingDaysMax ? `${store.refundProcessingDaysMin} ${L.days}` : `${store.refundProcessingDaysMin}–${store.refundProcessingDaysMax} ${L.days}`} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ PAYMENT METHODS ══════════════════════════════════════════════ */}
      {store.paymentMethods.length > 0 && (
        <div className="sic-section">
          <SecHead icon="account_balance_wallet" text={L.payments} />
          <div className="sic-payments">
            {store.paymentMethods.map((pm) => {
              const m = pm.paymentMethod;
              const name = m.translations[0]?.name || m.slug;
              return (
                <div key={m.slug} className={`sic-pay${m.isBnpl ? ' sic-pay--bnpl' : ''}`} aria-label={name}>
                  {m.logo ? <img src={m.logo} alt={name} className="sic-pay__logo" loading="lazy" /> : <span className="sic-pay__name">{name}</span>}
                  {m.isBnpl && <Chip text={L.bnpl} variant="neutral" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ UPCOMING EVENTS ══════════════════════════════════════════════ */}
      {store.upcomingEvents.length > 0 && (
        <div className="sic-section">
          <SecHead icon="calendar_month" text={L.upcoming} tooltip={L.upcomingTip} />
          <div className="sic-events">
            {store.upcomingEvents.map((ev, i) => {
              const [yr, mo] = ev.expectedMonth.split('-');
              const moName = new Date(Number(yr), Number(mo) - 1, 1).toLocaleString(isRtl ? 'ar' : 'en', { month: 'long' });
              return (
                <div key={i} className="sic-event">
                  <div className="sic-event__info">
                    <span className="sic-event__name">{ev.eventName}</span>
                    <span className="sic-event__date">{moName} {yr}</span>
                  </div>
                  <div className="sic-event__right">
                    {ev.expectedMaxDiscount && <span className="sic-event__forecast">↑ {ev.expectedMaxDiscount}%</span>}
                    <ConfPips level={ev.confidenceLevel} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ SCORE BREAKDOWN ═════════════════════════════════════════════ */}
      {bd && (
        <div className="sic-section sic-section--last">
          <SecHead icon="data_usage" text={L.scoreBreakdown} />
          <div className="sic-gauges sic-gauges--breakdown">
            {[
              { key: 'maxStackableSavings', label: L.savings_w, w: 30 },
              { key: 'codeSuccessRate', label: L.codeSuccess_w, w: 20 },
              { key: 'deliverySpeed', label: L.delivery_w, w: 15 },
              { key: 'returnFlexibility', label: L.returns_w, w: 15 },
              { key: 'offerFrequency', label: L.frequency_w, w: 10 },
              { key: 'paymentFlexibility', label: L.payment_w, w: 10 },
            ].map(({ key, label, w }) => {
              const pct = bdPct(key);
              if (pct == null) return null;
              return (
                <GaugeCard key={key} pct={pct} display={pf(bd[key]).toFixed(1)} sub={`wt. ${w}%`} label={label} color={pctToColor(pct)} size={64} stroke={3} />
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
