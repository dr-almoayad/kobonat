'use client';
// components/OfferStackBox/OfferStackBox.jsx
import StackCta from './StackCta';
import './OfferStackBox.css';

// ─── Type meta ──────────────────────────────────────────────
const TYPE = {
  CODE:       { cls: 'code', icon: 'confirmation_number', labelAr: 'كود', labelEn: 'Code'       },
  DEAL:       { cls: 'deal', icon: 'local_fire_department', labelAr: 'عرض', labelEn: 'Deal'     },
  BANK_OFFER: { cls: 'bank', icon: 'account_balance', labelAr: 'بنكي', labelEn: 'Bank'          },
};

// ─── Single offer tile ───────────────────────────────────────
function OfferTile({ item, isAr }) {
  const meta = TYPE[item.itemType] ?? TYPE.DEAL;

  return (
    <div className={`sb-item sb-item--${meta.cls}`}>

      {/* Icon / bank logo */}
      {item.itemType === 'BANK_OFFER' && item.bankLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.bankLogo} alt={item.bankName || 'Bank'} className="sb-item__bank-logo" />
      ) : (
        <div className="sb-item__icon-wrap" aria-hidden="true">
          <span className="material-symbols-sharp">{meta.icon}</span>
        </div>
      )}

      {/* Type badge */}
      <span className="sb-item__badge">
        {isAr ? meta.labelAr : meta.labelEn}
      </span>

      {/* Title */}
      <span className="sb-item__title">{item.title}</span>

      {/* Percentage */}
      {(item.discountPercent != null || item.discount) && (
        <span className="sb-item__pct">
          {item.discount || `${Math.round(item.discountPercent)}%`}
        </span>
      )}

      {/* Code pill */}
      {item.code && (
        <span className="sb-item__code">{item.code}</span>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────
export default function OfferStackBox({ stack, locale }) {
  const lang = locale?.split('-')[0] || 'ar';
  const isAr = lang === 'ar';

  const { store, items, combinedSavingsPercent } = stack;

  // Ordered: CODE → DEAL → BANK_OFFER
  const ORDER = { CODE: 0, DEAL: 1, BANK_OFFER: 2 };
  const ordered = [...items].sort((a, b) =>
    (ORDER[a.itemType] ?? 9) - (ORDER[b.itemType] ?? 9)
  );

  return (
    <article
      className="sb-card"
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={`${store.name} — ${isAr ? 'عروض مدمجة' : 'stackable offers'}`}
    >
      {/* ── Row 1: Brand + "كيف؟" ── */}
      <div className="sb-top">
        <div className="sb-brand">
          {store.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo} alt={store.name} className="sb-brand__logo" />
          ) : (
            <span className="sb-brand__name">{store.name}</span>
          )}
        </div>
        <span className="sb-more-label">
          {isAr ? 'عروض مدمجة' : 'Stackable offers'}
        </span>
      </div>

      {/* ── Row 2: Headline ── */}
      <div className="sb-headline">
        <span className="sb-headline__sub">
          {isAr ? 'عروض قابلة للدمج من' : 'Combo savings at'} {store.name}
        </span>
        <div className="sb-headline__main">
          <span className="sb-headline__text">
            {isAr ? 'وفّر حتى' : 'Save up to'}
          </span>
          <span className="sb-headline__amount">
            {combinedSavingsPercent != null && combinedSavingsPercent > 0
              ? `${combinedSavingsPercent}%`
              : (isAr ? 'خصومات مدمجة' : 'stacked discounts')
            }
          </span>
        </div>
      </div>

      {/* ── Row 3: White card with offer tiles ── */}
      <div className="sb-items-card">
        {ordered.map((item, idx) => (
          <div key={idx} style={{ display: 'contents' }}>
            {idx > 0 && <div className="sb-plus">+</div>}
            <OfferTile item={item} isAr={isAr} />
          </div>
        ))}
      </div>

      {/* ── Row 4: Savings equation ── */}
      <div className="sb-equation">
        <span className="sb-equation__eq">=</span>
        {combinedSavingsPercent != null && combinedSavingsPercent > 0 ? (
          <>
            <span className="sb-equation__pct">
              {combinedSavingsPercent}<sup>%</sup>
            </span>
            <span className="sb-equation__label">
              {isAr ? 'توفير إجمالي' : 'total savings'}
            </span>
          </>
        ) : (
          <span className="sb-equation__label" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', paddingBottom: 0 }}>
            {isAr ? 'خصومات متعددة مدمجة' : 'multiple discounts stacked'}
          </span>
        )}
      </div>

      {/* ── Row 5: CTA buttons ── */}
      {/* StackCta is 'use client' — it renders both the ghost + orange button
          so both share the same modal open state */}
      <div className="sb-cta-row">
        <StackCta stack={stack} locale={locale} />
      </div>
    </article>
  );
}
