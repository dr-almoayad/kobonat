// components/StoreIntelligenceCard/StoreIntelligenceCard.jsx
// Server Component — self-fetching, zero client JS.
// Editorial / magazine layout — descriptive, user-first.

import { prisma } from '@/lib/prisma';
import { getCurrentMonthIdentifier } from '@/lib/intelligence/calculateStoreScore.js';
import './StoreIntelligenceCard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const pf = (v) => parseFloat(v ?? 0);
const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v ?? 0));

function fmt(v, unit = '') {
  if (v == null || isNaN(pf(v))) return '—';
  return `${Math.round(pf(v))}${unit}`;
}

// Range display: "2–5 days" or "3 days"
function fmtRange(min, max, unit = '') {
  if (min == null && max == null) return '—';
  if (min == null) return `${max}${unit}`;
  if (max == null || min === max) return `${min}${unit}`;
  return `${min}–${max}${unit}`;
}

// Season descriptions — editorial copy per seasonKey
const SEASON_DESCS = {
  en: {
    ramadan:        'The biggest shopping season in Saudi Arabia. Expect major sitewide discounts — often 20–50% — especially on fashion, electronics, and home goods.',
    white_friday:   'The Saudi equivalent of Black Friday. Deep cross-category discounts often exceeding 50%, typically on the last Friday of November.',
    national_day:   'Held around September 23rd, stores roll out patriotic promotions with strong sitewide codes and cashback bundles.',
    back_to_school: 'Late summer sales targeting electronics, stationery, and fashion. Look for bundle deals and free-shipping codes.',
    summer_sale:    'Month-long clearance event across fashion, home, and appliances with rotating daily deals.',
    year_end:       'December and January bring end-of-season clearance across all categories, with stacked bank offers.',
  },
  ar: {
    ramadan:        'أكبر موسم تسوق في السعودية. توقع خصومات واسعة على الموقع تتراوح بين 20–50٪، خاصةً على الأزياء والإلكترونيات ومستلزمات المنزل.',
    white_friday:   'أكبر يوم تخفيضات في السعودية. خصومات عميقة عبر جميع الفئات تتجاوز 50٪، وتقع عادةً آخر جمعة من نوفمبر.',
    national_day:   'حول 23 سبتمبر، تطلق المتاجر عروضاً وطنية مع أكواد خصم للموقع كله وباقات استرداد نقدي.',
    back_to_school: 'عروض نهاية الصيف تستهدف الإلكترونيات والقرطاسية والأزياء. ابحث عن صفقات الباقات وأكواد الشحن المجاني.',
    summer_sale:    'تخفيضات تصفية تمتد شهراً عبر الأزياء والمنزل والأجهزة مع عروض يومية متجددة.',
    year_end:       'ديسمبر ويناير يشهدان تصفية نهاية الموسم عبر جميع الفئات مع عروض بنكية مدمجة.',
  },
};

// Fallback description if key not in map
function getSeasonDesc(seasonKey, nameEn, nameAr, isAr) {
  const key = seasonKey.toLowerCase();
  const map = isAr ? SEASON_DESCS.ar : SEASON_DESCS.en;
  if (map[key]) return map[key];
  // Generic fallback
  return isAr
    ? `موسم تسوق ${nameAr || nameEn}. تحقق من المتجر لمعرفة آخر العروض والأكواد الخاصة بهذا الموسم.`
    : `${nameEn} shopping season. Check the store page for the latest deals and exclusive codes for this event.`;
}

// Season icon per key
function getSeasonIcon(seasonKey) {
  const map = {
    ramadan:        'prayer_times',
    white_friday:   'local_offer',
    national_day:   'flag',
    back_to_school: 'school',
    summer_sale:    'wb_sunny',
    year_end:       'celebration',
  };
  return map[seasonKey?.toLowerCase()] || 'event';
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
                slug: true, logo: true, isBnpl: true,
                translations: { where: { locale: lang }, select: { name: true } },
              },
            },
          },
        },
        savingsMetrics: {
          orderBy: { monthIdentifier: 'desc' },
          take: 1,
          select: {
            averageDiscountPercent:      true,
            maxStackableSavingsPercent:  true,
            codeSuccessRate:             true,
            totalActiveOffers:           true,
            storeScore:                  true,
          },
        },
        upcomingEvents: {
          where: { expectedMonth: { gte: getCurrentMonthIdentifier() } },
          orderBy: { expectedMonth: 'asc' },
          take: 4,
          select: {
            eventName:           true,
            expectedMonth:       true,
            confidenceLevel:     true,
            expectedMaxDiscount: true,
          },
        },
        peakSeasons: {
          orderBy: { seasonKey: 'asc' },
          select: { seasonKey: true, nameEn: true, nameAr: true },
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
          select: { type: true, isExclusive: true },
        },
      },
    });
  } catch (e) {
    console.error('[StoreIntelligenceCard] fetch error:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Micro components (all pure HTML/CSS — no client JS)
// ─────────────────────────────────────────────────────────────────────────────
function ConfPips({ level }) {
  const n = { LOW: 1, MEDIUM: 2, HIGH: 3 }[level] ?? 1;
  return (
    <span className="sic-event__conf" aria-label={`Confidence: ${level}`}>
      {[1, 2, 3].map(i => (
        <span key={i} className={`sic-conf-pip${i <= n ? ' sic-conf-pip--on' : ''}`} />
      ))}
    </span>
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
  const isAr  = isRtl;

  const store = await fetchIntelligence(storeId, lang, countryCode);
  if (!store) return null;

  const t        = store.translations[0] || {};
  const metrics  = store.savingsMetrics[0] || null;
  const snapshot = store.savingsSnapshots[0] || null;

  const storeName = t.name || '';

  // Voucher counts
  const vouchers    = store.vouchers ?? [];
  const codeCount   = vouchers.filter(v => v.type === 'CODE').length;
  const dealCount   = vouchers.filter(v => v.type === 'DEAL').length;
  const shipCount   = vouchers.filter(v => v.type === 'FREE_SHIPPING').length;
  const exclCount   = vouchers.filter(v => v.isExclusive).length;
  const totalActive = metrics?.totalActiveOffers ?? vouchers.length;

  // Key metrics
  const successPct = metrics?.codeSuccessRate != null
    ? Math.abs(pf(metrics.codeSuccessRate)) <= 1.5
      ? Math.round(pf(metrics.codeSuccessRate) * 100)
      : Math.round(pf(metrics.codeSuccessRate))
    : null;

  const maxSavePct = metrics?.maxStackableSavingsPercent != null
    ? Math.round(pf(metrics.maxStackableSavingsPercent))
    : null;

  const avgDiscPct = metrics?.averageDiscountPercent != null
    ? Math.round(pf(metrics.averageDiscountPercent))
    : null;

  const storeScore = metrics?.storeScore != null
    ? pf(metrics.storeScore).toFixed(1)
    : null;

  // Delivery text
  const delivText = store.averageDeliveryDaysMin != null || store.averageDeliveryDaysMax != null
    ? fmtRange(store.averageDeliveryDaysMin, store.averageDeliveryDaysMax, isAr ? ' أيام' : ' days')
    : null;

  // Strings
  const L = isAr ? {
    expect:       `ايش نعرف عن`,
    storeTitle:   storeName,
    eyebrow:      'دليل التوفير',
    intro_prefix: 'تقدم',
    intro_suffix: `مجموعة واسعة من العروض والأكواد. يُحدَّث هذا الدليل باستمرار بناءً على بيانات حقيقية وأداء العروض وأكواد الخصم السابقة.`,
    offers:       'عرض نشط',
    exclusive:    'حصري',
    maxSave:      'أعلى توفير',
    avgDisc:      'متوسط الخصم',
    score:        'تقييم المتجر',
    outOf10:      '/ 10',
    savingsTitle: `كيف توفر في ${storeName}؟`,
    s1h: 'أنواع العروض المتاحة',
    s1p: `يقدم ${storeName} مزيجاً من${codeCount > 0 ? ` أكواد الخصم (${codeCount})` : ''}${dealCount > 0 ? `، والعروض المباشرة (${dealCount})` : ''}${shipCount > 0 ? `، وعروض الشحن المجاني (${shipCount})` : ''}. ${exclCount > 0 ? `من بينها **${exclCount} عرضاً حصرياً** لا تجدها في أي مكان آخر.` : ''}`,
    s2h: 'أقصى توفير ممكن',
    s2p: maxSavePct != null
      ? `بدمج الكود مع العرض والعرض البنكي، يمكن الوصول لتوفير يصل إلى **${maxSavePct}٪**.`
      : `تتيح المنصة عروضاً قابلة للتراكم عند دمجها مع بطاقات بنكية مختارة. تحقق من العروض البنكية في الأسفل.`,
    s3h: 'فعالية أكواد الخصم',
    s3p: successPct != null
      ? `معدل نجاح الأكواد عند الدفع يبلغ **${successPct}٪**. يتم التحقق من صلاحية كل كوبون باستمرار لضمان تجربة تسوق سلسة.`
      : 'يتم التحقق من صلاحية الكوبونات بشكل دوري. إذا لم يعمل الكود، تأكد من انطباق الشروط على منتجاتك.',
    logistics:    'الشحن والإرجاع',
    delivery:     'مدة التوصيل',
    freeShip:     'شحن مجاني من',
    freeShipAlways: 'دائمًا مجاني',
    returns:      'مهلة الإرجاع',
    refund:       'استرداد الدفع',
    freeRet:      'مجاني',
    days:         'أيام',
    sar:          'ر.س',
    payments:     'طرق الدفع المدعومة',
    seasons:      'أفضل مواسم التسوق',
    seasonsDesc:  `مواسم التسوق الرئيسية في ${storeName} مع توقعات الخصم والتوصيات.`,
    upcoming:     'عروض متوقعة قريباً',
    upcomingDesc: 'مبنية على تحليل البيانات السابقة. الثقة بالتوقع: منخفض / متوسط / مرتفع.',
    expectedDisc: 'خصم متوقع حتى',
    verified:     'بيانات موثقة',
    noData:       'لا تتوفر بيانات كافية بعد',
    bnpl:         'تقسيط',
  } : {
    expect:       `What to Expect from`,
    storeTitle:   `${storeName} Coupon Codes`,
    eyebrow:      'Store Intelligence Report',
    intro_prefix: '',
    intro_suffix: `runs a mix of coupon codes, sitewide deals, and bank card offers. This guide is updated continuously based on real coupon performance and historical data.`,
    offers:       'Active Offers',
    exclusive:    'Exclusive',
    maxSave:      'Max Savings',
    avgDisc:      'Avg. Discount',
    score:        'Store Score',
    outOf10:      '/ 10',
    savingsTitle: 'Your Savings Guide',
    s1h: 'Types of discounts available',
    s1p: `${storeName} offers a mix of${codeCount > 0 ? ` coupon codes (${codeCount})` : ''}${dealCount > 0 ? `, sitewide deals (${dealCount})` : ''}${shipCount > 0 ? `, and free shipping offers (${shipCount})` : ''}. ${exclCount > 0 ? `This includes **${exclCount} exclusive offer${exclCount > 1 ? 's' : ''}** you won't find elsewhere.` : ''}`,
    s2h: 'Maximum savings potential',
    s2p: maxSavePct != null
      ? `By stacking a code on top of a deal and adding a bank card offer, savings can reach up to **${maxSavePct}%**. Check the "Stackable Offers" section on this page to maximise your discount.`
      : `${storeName} supports stackable offers when combined with select bank cards. Check the "Bank & Card Offers" section below for current promotions.`,
    s3h: 'Coupon code success rate',
    s3p: successPct != null
      ? `Codes at ${storeName} have a **${successPct}% success rate** at checkout. We continuously verify each coupon's validity to ensure a smooth shopping experience.`
      : 'We regularly verify coupon validity. If a code fails, check that your cart meets minimum spend or product eligibility requirements.',
    logistics:    'Shipping & Returns',
    delivery:     'Delivery Time',
    freeShip:     'Free Shipping from',
    freeShipAlways: 'Always free',
    returns:      'Return Window',
    refund:       'Refund Processing',
    freeRet:      'Free',
    days:         'days',
    sar:          'SAR',
    payments:     'Supported Payment Methods',
    seasons:      'Best Times to Shop',
    seasonsDesc:  `Key shopping seasons at ${storeName} with discount expectations and tips.`,
    upcoming:     'Upcoming Promotions',
    upcomingDesc: 'Based on historical data analysis. Confidence: low / medium / high.',
    expectedDisc: 'Expected up to',
    verified:     'Data verified',
    noData:       'Not enough data yet',
    bnpl:         'BNPL',
  };

  // Helper: parse bold markdown in editorial text (**word** → <strong>)
  function parseBold(text) {
    if (!text) return null;
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  }

  const hasLogistics = delivText || store.freeShippingThreshold != null || store.returnWindowDays != null;
  const hasPayments  = store.paymentMethods.length > 0;
  const hasSeasons   = store.peakSeasons.length > 0;
  const hasEvents    = store.upcomingEvents.length > 0;

  return (
    <div className="sic" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <div className="sic-hero">
        <div className="sic-hero__left">
          <p className="sic-hero__eyebrow">
            <span className="material-symbols-sharp" style={{ fontSize: '0.7rem' }}>auto_awesome</span>
            {L.eyebrow}
          </p>
          <h2 className="sic-hero__title">
            {isAr ? (
              <>{L.expect} <span>{L.storeTitle}</span></>
            ) : (
              <>{L.expect} <span>{L.storeTitle}</span></>
            )}
          </h2>
          <p className="sic-hero__intro">
            {isAr
              ? `${L.intro_prefix} ${storeName} ${L.intro_suffix}`
              : `${storeName} ${L.intro_suffix}`
            }
          </p>
        </div>

        <div className="sic-hero__brand">
          {store.logo && (
            <div className="sic-hero__logo-wrap">
              <div className="sic-hero__logo-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={store.logo} alt={storeName} width={72} height={72} />
              </div>
            </div>
          )}
          {snapshot && (
            <div className="sic-hero__rank">
              <span className="material-symbols-sharp">leaderboard</span>
              #{snapshot.rank}
            </div>
          )}
        </div>
      </div>

      {/* ══ QUICK STATS BAR ═══════════════════════════════════════════════ */}
      <div className="sic-statsbar">
        <div className="sic-stat">
          <span className="material-symbols-sharp sic-stat__icon">local_offer</span>
          <span className="sic-stat__num sic-stat__num--accent">{totalActive}</span>
          <span className="sic-stat__label">{L.offers}</span>
        </div>

        {exclCount > 0 && (
          <div className="sic-stat">
            <span className="material-symbols-sharp sic-stat__icon">star</span>
            <span className="sic-stat__num sic-stat__num--amber">{exclCount}</span>
            <span className="sic-stat__label">{L.exclusive}</span>
          </div>
        )}

        {maxSavePct != null && (
          <div className="sic-stat">
            <span className="material-symbols-sharp sic-stat__icon">percent_discount</span>
            <span className="sic-stat__num sic-stat__num--green">{maxSavePct}%</span>
            <span className="sic-stat__label">{L.maxSave}</span>
          </div>
        )}

        {storeScore && (
          <div className="sic-stat">
            <span className="material-symbols-sharp sic-stat__icon">grade</span>
            <span className="sic-stat__num">{storeScore}<small style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--sic-muted)' }}>{L.outOf10}</small></span>
            <span className="sic-stat__label">{L.score}</span>
          </div>
        )}

        {avgDiscPct != null && !storeScore && (
          <div className="sic-stat">
            <span className="material-symbols-sharp sic-stat__icon">percent</span>
            <span className="sic-stat__num">{avgDiscPct}%</span>
            <span className="sic-stat__label">{L.avgDisc}</span>
          </div>
        )}
      </div>

      {/* ══ SAVINGS GUIDE ═════════════════════════════════════════════════ */}
      <div className="sic-section">
        <div className="sic-section__head">
          <div className="sic-section__icon">
            <span className="material-symbols-sharp">tips_and_updates</span>
          </div>
          <h3 className="sic-section__title">{L.savingsTitle}</h3>
        </div>

        <div className="sic-editorial">
          <div className="sic-item">
            <div className="sic-item__num">1</div>
            <div className="sic-item__body">
              <h4 className="sic-item__heading">{L.s1h}</h4>
              <p className="sic-item__text">{parseBold(L.s1p)}</p>
              <div className="sic-chips">
                {codeCount > 0 && (
                  <span className="sic-chip sic-chip--accent">
                    <span className="material-symbols-sharp">confirmation_number</span>
                    {codeCount} {isAr ? 'كود' : 'code'}{codeCount > 1 && !isAr ? 's' : ''}
                  </span>
                )}
                {dealCount > 0 && (
                  <span className="sic-chip sic-chip--green">
                    <span className="material-symbols-sharp">bolt</span>
                    {dealCount} {isAr ? 'صفقة' : 'deal'}{dealCount > 1 && !isAr ? 's' : ''}
                  </span>
                )}
                {shipCount > 0 && (
                  <span className="sic-chip sic-chip--neutral">
                    <span className="material-symbols-sharp">local_shipping</span>
                    {isAr ? 'شحن مجاني' : 'Free shipping'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="sic-item">
            <div className="sic-item__num">2</div>
            <div className="sic-item__body">
              <h4 className="sic-item__heading">{L.s2h}</h4>
              <p className="sic-item__text">{parseBold(L.s2p)}</p>
            </div>
          </div>

          <div className="sic-item">
            <div className="sic-item__num">3</div>
            <div className="sic-item__body">
              <h4 className="sic-item__heading">{L.s3h}</h4>
              <p className="sic-item__text">{parseBold(L.s3p)}</p>
              {successPct != null && (
                <div className="sic-chips">
                  <span className={`sic-chip ${successPct >= 70 ? 'sic-chip--green' : successPct >= 45 ? 'sic-chip--amber' : 'sic-chip--neutral'}`}>
                    <span className="material-symbols-sharp">check_circle</span>
                    {successPct}% {isAr ? 'معدل نجاح' : 'success rate'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ BEST TIMES TO SHOP (SEASONS) ══════════════════════════════════ */}
      {hasSeasons && (
        <div className="sic-section">
          <div className="sic-section__head">
            <div className="sic-section__icon">
              <span className="material-symbols-sharp">event_available</span>
            </div>
            <h3 className="sic-section__title">{L.seasons}</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--sic-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
            {L.seasonsDesc}
          </p>
          <div className="sic-seasons">
            {store.peakSeasons.map(season => (
              <div key={season.seasonKey} className="sic-season">
                <div className="sic-season__header">
                  <span className="sic-season__name">
                    {isAr ? season.nameAr : season.nameEn}
                  </span>
                  <div className="sic-season__icon">
                    <span className="material-symbols-sharp">{getSeasonIcon(season.seasonKey)}</span>
                  </div>
                </div>
                <p className="sic-season__desc">
                  {getSeasonDesc(season.seasonKey, season.nameEn, season.nameAr, isAr)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ UPCOMING EVENTS ═══════════════════════════════════════════════ */}
      {hasEvents && (
        <div className="sic-section">
          <div className="sic-section__head">
            <div className="sic-section__icon">
              <span className="material-symbols-sharp">calendar_month</span>
            </div>
            <h3 className="sic-section__title">{L.upcoming}</h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--sic-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
            {L.upcomingDesc}
          </p>
          <div className="sic-events">
            {store.upcomingEvents.map((ev, i) => {
              const [yr, mo] = ev.expectedMonth.split('-');
              const moName = new Date(Number(yr), Number(mo) - 1, 1).toLocaleString(isAr ? 'ar-SA' : 'en', { month: 'short' });
              return (
                <div key={i} className="sic-event">
                  <div className="sic-event__cal">
                    <span className="sic-event__cal-month">{moName}</span>
                    <span className="sic-event__cal-year">{yr}</span>
                  </div>
                  <div className="sic-event__body">
                    <h4 className="sic-event__name">{ev.eventName}</h4>
                    <p className="sic-event__desc">
                      {isAr
                        ? `توقع خصومات خلال ${moName} ${yr}. ${ev.expectedMaxDiscount ? `الخصم المتوقع: حتى ${ev.expectedMaxDiscount}٪.` : ''}`
                        : `Expect discounts during ${moName} ${yr}. ${ev.expectedMaxDiscount ? `Expected discount: up to ${ev.expectedMaxDiscount}%.` : ''}`
                      }
                    </p>
                  </div>
                  <div className="sic-event__right">
                    {ev.expectedMaxDiscount && (
                      <span className="sic-event__forecast">↑ {ev.expectedMaxDiscount}%</span>
                    )}
                    <ConfPips level={ev.confidenceLevel} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ LOGISTICS ═════════════════════════════════════════════════════ */}
      {hasLogistics && (
        <div className="sic-section">
          <div className="sic-section__head">
            <div className="sic-section__icon">
              <span className="material-symbols-sharp">local_shipping</span>
            </div>
            <h3 className="sic-section__title">{L.logistics}</h3>
          </div>
          <div className="sic-logistics">
            {delivText && (
              <div className="sic-logrow">
                <div className="sic-logrow__left">
                  <span className="material-symbols-sharp">speed</span>
                  <span className="sic-logrow__label">{L.delivery}</span>
                </div>
                <span className="sic-logrow__value">{delivText}</span>
              </div>
            )}
            {store.freeShippingThreshold != null && (
              <div className="sic-logrow">
                <div className="sic-logrow__left">
                  <span className="material-symbols-sharp">local_shipping</span>
                  <span className="sic-logrow__label">{L.freeShip}</span>
                </div>
                <span className="sic-logrow__value">
                  {store.freeShippingThreshold === 0
                    ? L.freeShipAlways
                    : `${store.freeShippingThreshold} ${L.sar}`}
                </span>
              </div>
            )}
            {store.returnWindowDays != null && (
              <div className="sic-logrow">
                <div className="sic-logrow__left">
                  <span className="material-symbols-sharp">undo</span>
                  <span className="sic-logrow__label">{L.returns}</span>
                </div>
                <span className="sic-logrow__value">
                  {store.returnWindowDays} {L.days}
                  {store.freeReturns && (
                    <span className="sic-logrow__badge">{L.freeRet}</span>
                  )}
                </span>
              </div>
            )}
            {(store.refundProcessingDaysMin != null || store.refundProcessingDaysMax != null) && (
              <div className="sic-logrow">
                <div className="sic-logrow__left">
                  <span className="material-symbols-sharp">payments</span>
                  <span className="sic-logrow__label">{L.refund}</span>
                </div>
                <span className="sic-logrow__value">
                  {fmtRange(store.refundProcessingDaysMin, store.refundProcessingDaysMax, ` ${L.days}`)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ PAYMENTS ══════════════════════════════════════════════════════ */}
      {hasPayments && (
        <div className="sic-section">
          <div className="sic-section__head">
            <div className="sic-section__icon">
              <span className="material-symbols-sharp">credit_card</span>
            </div>
            <h3 className="sic-section__title">{L.payments}</h3>
          </div>
          <div className="sic-payments">
            {store.paymentMethods.map(pm => {
              const m    = pm.paymentMethod;
              const name = m.translations[0]?.name || m.slug;
              return (
                <div key={m.slug} className={`sic-pay${m.isBnpl ? ' sic-pay--bnpl' : ''}`}>
                  {m.logo
                    ? <img src={m.logo} alt={name} className="sic-pay__logo" loading="lazy" />
                    : <span className="sic-pay__name">{name}</span>
                  }
                  {m.logo && <span className="sic-pay__name">{name}</span>}
                  {m.isBnpl && <span className="sic-pay__bnpl-tag">{L.bnpl}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      {store.lastVerifiedAt && (
        <div className="sic-footer">
          <div className="sic-footer__verified">
            <span className="material-symbols-sharp">verified_user</span>
            {L.verified}
          </div>
          <span className="sic-footer__date">
            {new Date(store.lastVerifiedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  );
}
