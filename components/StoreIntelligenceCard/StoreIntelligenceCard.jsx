// components/StoreIntelligenceCard/StoreIntelligenceCard.jsx
// Server Component — fetches all data directly, no client-side requests.
// Renders full or compact variant based on the `variant` prop.
//
// Usage:
//   <StoreIntelligenceCard storeId={store.id} locale="ar-SA" countryCode="SA" variant="full" />
//   <StoreIntelligenceCard storeId={store.id} locale="en-SA" variant="compact" />

import { prisma } from '@/lib/prisma';
import { getCurrentMonthIdentifier } from '@/lib/intelligence/calculateStoreScore.js';
import './StoreIntelligenceCard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Data fetch — one query, all intelligence data
// ─────────────────────────────────────────────────────────────────────────────

async function fetchIntelligence(storeId, lang, countryCode) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id:                      true,
        logo:                    true,
        color:                   true,
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
          take:    1,
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
      },
    });
    return store;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (plain functions — no hooks, Server Component safe)
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBadge({ score, size = 'large' }) {
  const tier =
    score >= 8.5 ? 'excellent' :
    score >= 7   ? 'good'      :
    score >= 5   ? 'average'   : 'low';

  return (
    <div className={`sic-score sic-score--${size} sic-score--${tier}`} aria-label={`Store score: ${score} out of 10`}>
      <span className="sic-score__number">{score.toFixed(1)}</span>
      <span className="sic-score__denom">/10</span>
    </div>
  );
}

function ScoreBar({ label, value, weight }) {
  const pct = Math.min(Math.max(value, 0), 10) * 10;
  return (
    <div className="sic-score-bar">
      <div className="sic-score-bar__header">
        <span className="sic-score-bar__label">{label}</span>
        <span className="sic-score-bar__value">{value.toFixed(1)}</span>
      </div>
      <div className="sic-score-bar__track" aria-hidden="true">
        <div className="sic-score-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="sic-score-bar__weight">{Math.round(weight * 100)}% weight</span>
    </div>
  );
}

function MovementIcon({ movement }) {
  if (movement === 'UP')   return <span className="sic-trend sic-trend--up"   aria-label="Rank improved">↑</span>;
  if (movement === 'DOWN') return <span className="sic-trend sic-trend--down" aria-label="Rank dropped">↓</span>;
  return                          <span className="sic-trend sic-trend--same" aria-label="Rank unchanged">–</span>;
}

function ConfidencePip({ level }) {
  const pips = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  const n    = pips[level] ?? 1;
  return (
    <span className="sic-confidence" aria-label={`Confidence: ${level}`}>
      {[1,2,3].map((i) => (
        <span key={i} className={`sic-confidence__pip ${i <= n ? 'sic-confidence__pip--filled' : ''}`} />
      ))}
    </span>
  );
}

function CodeSuccessGauge({ rate }) {
  const pct  = Math.round(rate);
  const tier = pct >= 85 ? 'high' : pct >= 60 ? 'mid' : 'low';
  return (
    <div className="sic-gauge" aria-label={`Code success rate: ${pct}%`}>
      <svg viewBox="0 0 100 54" fill="none" className="sic-gauge__svg">
        {/* Track arc — half circle */}
        <path d="M5 50 A45 45 0 0 1 95 50" stroke="var(--sic-gauge-track)" strokeWidth="8" strokeLinecap="round" />
        {/* Fill arc — proportional to rate */}
        <path
          d="M5 50 A45 45 0 0 1 95 50"
          stroke={`var(--sic-gauge-fill-${tier})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="141.37"
          strokeDashoffset={141.37 * (1 - pct / 100)}
        />
      </svg>
      <span className="sic-gauge__label">{pct}%</span>
    </div>
  );
}

function PaymentChip({ method }) {
  return (
    <div className={`sic-payment ${method.isBnpl ? 'sic-payment--bnpl' : ''}`} aria-label={method.name}>
      {method.logo ? (
        <img src={method.logo} alt={method.name} className="sic-payment__logo" loading="lazy" />
      ) : (
        <span className="sic-payment__name">{method.name}</span>
      )}
      {method.isBnpl && <span className="sic-payment__bnpl-tag">BNPL</span>}
    </div>
  );
}

function UpcomingEventRow({ event, isRtl }) {
  const [year, month] = event.expectedMonth.split('-');
  const monthName     = new Date(Number(year), Number(month) - 1, 1)
    .toLocaleString(isRtl ? 'ar' : 'en', { month: 'long' });

  return (
    <div className="sic-event">
      <div className="sic-event__info">
        <span className="sic-event__name">{event.eventName}</span>
        <span className="sic-event__date">{monthName} {year}</span>
      </div>
      <div className="sic-event__meta">
        {event.expectedMaxDiscount && (
          <span className="sic-event__discount">↑ {event.expectedMaxDiscount}%</span>
        )}
        <ConfidencePip level={event.confidenceLevel} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
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
  const score    = metrics?.storeScore ?? null;
  const breakdown = metrics?.scoreBreakdown ? JSON.parse(metrics.scoreBreakdown) : null;

  const hasDelivery = store.averageDeliveryDaysMin != null || store.averageDeliveryDaysMax != null;
  const hasRefund   = store.refundProcessingDaysMin != null;

  const labels = isRtl ? {
    storeScore:      'تقييم المتجر',
    rank:            'الترتيب',
    savings:         'توفير ذكي',
    maxSavings:      'أعلى توفير',
    avgDiscount:     'متوسط الخصم',
    successRate:     'معدل نجاح الكوبون',
    activeOffers:    'عروض نشطة',
    logistics:       'الشحن والإرجاع',
    delivery:        'مدة التوصيل',
    freeShipping:    'شحن مجاني',
    returns:         'الإرجاع',
    freeReturns:     'إرجاع مجاني',
    returnWindow:    'مهلة الإرجاع',
    refund:          'استرداد المبلغ',
    days:            'أيام',
    payments:        'طرق الدفع',
    upcoming:        'عروض متوقعة',
    sar:             'ر.س',
    offerFreq:       'تكرار العروض',
    every:           'كل',
    noData:          'غير متوفر',
    scoreBreakdown:  'تفصيل التقييم',
    savings_w:       'جودة التوفير',
    codeSuccess_w:   'نجاح الكوبونات',
    delivery_w:      'سرعة التوصيل',
    returns_w:       'مرونة الإرجاع',
    frequency_w:     'تكرار العروض',
    payment_w:       'خيارات الدفع',
  } : {
    storeScore:      'Store Score',
    rank:            'Rank',
    savings:         'Savings Intelligence',
    maxSavings:      'Max Savings',
    avgDiscount:     'Avg Discount',
    successRate:     'Code Success Rate',
    activeOffers:    'Active Offers',
    logistics:       'Shipping & Returns',
    delivery:        'Delivery',
    freeShipping:    'Free Shipping',
    returns:         'Returns',
    freeReturns:     'Free Returns',
    returnWindow:    'Return Window',
    refund:          'Refund Processing',
    days:            'days',
    payments:        'Payment Methods',
    upcoming:        'Expected Offers',
    sar:             'SAR',
    offerFreq:       'Offer Frequency',
    every:           'Every',
    noData:          'Not available',
    scoreBreakdown:  'Score Breakdown',
    savings_w:       'Savings Quality',
    codeSuccess_w:   'Code Success',
    delivery_w:      'Delivery Speed',
    returns_w:       'Return Flexibility',
    frequency_w:     'Offer Frequency',
    payment_w:       'Payment Options',
  };

  // ── COMPACT VARIANT ────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className="sic sic--compact" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="sic-compact__header">
          {store.logo && <img src={store.logo} alt={t.name} className="sic-compact__logo" />}
          <div className="sic-compact__info">
            <span className="sic-compact__name">{t.name}</span>
            {snapshot && (
              <span className="sic-compact__rank">
                #{snapshot.rank} <MovementIcon movement={snapshot.movement} />
              </span>
            )}
          </div>
          {score != null && <ScoreBadge score={score} size="small" />}
        </div>

        <div className="sic-compact__stats">
          {metrics?.maxStackableSavingsPercent > 0 && (
            <div className="sic-compact__stat">
              <span className="sic-compact__stat-label">{labels.maxSavings}</span>
              <span className="sic-compact__stat-value sic-compact__stat-value--savings">
                {metrics.maxStackableSavingsPercent}%
              </span>
            </div>
          )}
          {metrics && (
            <div className="sic-compact__stat">
              <span className="sic-compact__stat-label">{labels.successRate}</span>
              <span className="sic-compact__stat-value">{Math.round(metrics.codeSuccessRate)}%</span>
            </div>
          )}
          {hasDelivery && (
            <div className="sic-compact__stat">
              <span className="sic-compact__stat-label">{labels.delivery}</span>
              <span className="sic-compact__stat-value">
                {store.averageDeliveryDaysMin}–{store.averageDeliveryDaysMax} {labels.days}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── FULL VARIANT ───────────────────────────────────────────────────────────
  return (
    <div className="sic sic--full" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sic-header" style={store.color ? { '--sic-accent': store.color } : {}}>
        <div className="sic-header__brand">
          {store.logo && (
            <img src={store.logo} alt={t.name} className="sic-header__logo" />
          )}
          <div className="sic-header__text">
            <h2 className="sic-header__name">{t.name}</h2>
            {t.description && (
              <p className="sic-header__desc">{t.description}</p>
            )}
          </div>
        </div>
        <div className="sic-header__score-block">
          {score != null && <ScoreBadge score={score} size="large" />}
          <span className="sic-header__score-label">{labels.storeScore}</span>
          {snapshot && (
            <div className="sic-header__rank">
              <span className="sic-header__rank-label">{labels.rank}</span>
              <span className="sic-header__rank-value">
                #{snapshot.rank} <MovementIcon movement={snapshot.movement} />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="sic-body">

        {/* ── Savings Intelligence ──────────────────────────────────────── */}
        {metrics && (
          <section className="sic-section" aria-label={labels.savings}>
            <h3 className="sic-section__title">
              <span className="sic-section__icon" aria-hidden="true">◈</span>
              {labels.savings}
            </h3>
            <div className="sic-savings-grid">
              <div className="sic-savings-cell">
                <span className="sic-savings-cell__label">{labels.maxSavings}</span>
                <span className="sic-savings-cell__value sic-savings-cell__value--hero">
                  {metrics.maxStackableSavingsPercent > 0 ? `${metrics.maxStackableSavingsPercent}%` : labels.noData}
                </span>
              </div>
              <div className="sic-savings-cell">
                <span className="sic-savings-cell__label">{labels.avgDiscount}</span>
                <span className="sic-savings-cell__value">
                  {metrics.averageDiscountPercent > 0 ? `${metrics.averageDiscountPercent}%` : labels.noData}
                </span>
              </div>
              <div className="sic-savings-cell">
                <span className="sic-savings-cell__label">{labels.activeOffers}</span>
                <span className="sic-savings-cell__value">{metrics.totalActiveOffers}</span>
              </div>
              {store.offerFrequencyDays && (
                <div className="sic-savings-cell">
                  <span className="sic-savings-cell__label">{labels.offerFreq}</span>
                  <span className="sic-savings-cell__value">
                    {labels.every} {store.offerFrequencyDays} {labels.days}
                  </span>
                </div>
              )}
            </div>
            <div className="sic-gauge-wrap">
              <span className="sic-gauge-wrap__label">{labels.successRate}</span>
              <CodeSuccessGauge rate={metrics.codeSuccessRate} />
            </div>
          </section>
        )}

        {/* ── Logistics ────────────────────────────────────────────────── */}
        {(hasDelivery || store.returnWindowDays != null || store.freeShippingThreshold != null) && (
          <section className="sic-section" aria-label={labels.logistics}>
            <h3 className="sic-section__title">
              <span className="sic-section__icon" aria-hidden="true">⬡</span>
              {labels.logistics}
            </h3>
            <div className="sic-logistics">
              {hasDelivery && (
                <div className="sic-logistics__row">
                  <span className="sic-logistics__label">
                    <span className="sic-icon" aria-hidden="true">🚚</span>
                    {labels.delivery}
                  </span>
                  <span className="sic-logistics__value">
                    {store.averageDeliveryDaysMin === store.averageDeliveryDaysMax
                      ? `${store.averageDeliveryDaysMin} ${labels.days}`
                      : `${store.averageDeliveryDaysMin ?? '?'}–${store.averageDeliveryDaysMax ?? '?'} ${labels.days}`}
                  </span>
                </div>
              )}
              {store.freeShippingThreshold != null && (
                <div className="sic-logistics__row">
                  <span className="sic-logistics__label">
                    <span className="sic-icon" aria-hidden="true">📦</span>
                    {labels.freeShipping}
                  </span>
                  <span className="sic-logistics__value">
                    {store.freeShippingThreshold === 0
                      ? (isRtl ? 'دائمًا' : 'Always')
                      : `${isRtl ? 'من' : 'From'} ${store.freeShippingThreshold} ${labels.sar}`}
                  </span>
                </div>
              )}
              {store.returnWindowDays != null && (
                <div className="sic-logistics__row">
                  <span className="sic-logistics__label">
                    <span className="sic-icon" aria-hidden="true">↩</span>
                    {labels.returnWindow}
                  </span>
                  <span className="sic-logistics__value">
                    {store.returnWindowDays} {labels.days}
                    {store.freeReturns && (
                      <span className="sic-badge sic-badge--green">
                        {labels.freeReturns}
                      </span>
                    )}
                  </span>
                </div>
              )}
              {hasRefund && (
                <div className="sic-logistics__row">
                  <span className="sic-logistics__label">
                    <span className="sic-icon" aria-hidden="true">💳</span>
                    {labels.refund}
                  </span>
                  <span className="sic-logistics__value">
                    {store.refundProcessingDaysMin === store.refundProcessingDaysMax
                      ? `${store.refundProcessingDaysMin} ${labels.days}`
                      : `${store.refundProcessingDaysMin}–${store.refundProcessingDaysMax} ${labels.days}`}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Payment Methods ──────────────────────────────────────────── */}
        {store.paymentMethods.length > 0 && (
          <section className="sic-section" aria-label={labels.payments}>
            <h3 className="sic-section__title">
              <span className="sic-section__icon" aria-hidden="true">◇</span>
              {labels.payments}
            </h3>
            <div className="sic-payments">
              {store.paymentMethods.map((pm) => (
                <PaymentChip
                  key={pm.paymentMethod.slug}
                  method={{
                    slug:   pm.paymentMethod.slug,
                    name:   pm.paymentMethod.translations[0]?.name || pm.paymentMethod.slug,
                    logo:   pm.paymentMethod.logo,
                    type:   pm.paymentMethod.type,
                    isBnpl: pm.paymentMethod.isBnpl,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming Events ──────────────────────────────────────────── */}
        {store.upcomingEvents.length > 0 && (
          <section className="sic-section" aria-label={labels.upcoming}>
            <h3 className="sic-section__title">
              <span className="sic-section__icon" aria-hidden="true">◉</span>
              {labels.upcoming}
            </h3>
            <div className="sic-events">
              {store.upcomingEvents.map((event, i) => (
                <UpcomingEventRow key={i} event={event} isRtl={isRtl} />
              ))}
            </div>
          </section>
        )}

        {/* ── Score Breakdown ──────────────────────────────────────────── */}
        {breakdown && (
          <section className="sic-section sic-section--breakdown" aria-label={labels.scoreBreakdown}>
            <h3 className="sic-section__title">
              <span className="sic-section__icon" aria-hidden="true">◫</span>
              {labels.scoreBreakdown}
            </h3>
            <div className="sic-breakdown">
              <ScoreBar label={labels.savings_w}      value={breakdown.maxStackableSavings} weight={0.30} />
              <ScoreBar label={labels.codeSuccess_w}  value={breakdown.codeSuccessRate}     weight={0.20} />
              <ScoreBar label={labels.delivery_w}     value={breakdown.deliverySpeed}       weight={0.15} />
              <ScoreBar label={labels.returns_w}      value={breakdown.returnFlexibility}   weight={0.15} />
              <ScoreBar label={labels.frequency_w}    value={breakdown.offerFrequency}      weight={0.10} />
              <ScoreBar label={labels.payment_w}      value={breakdown.paymentFlexibility}  weight={0.10} />
            </div>
          </section>
        )}

      </div>{/* /sic-body */}
    </div>
  );
}
