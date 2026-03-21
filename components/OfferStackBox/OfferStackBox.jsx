'use client';
// components/OfferStackBox/OfferStackBox.jsx
import StackCta from './StackCta';
import './OfferStack.css';

const TILE_TYPE = {
  CODE:       { cls: 'code', icon: 'confirmation_number', labelAr: 'كود خصم', labelEn: 'Code' },
  DEAL:       { cls: 'deal', icon: 'bolt',                labelAr: 'خصم تلقائي', labelEn: 'Deal' },
  BANK_OFFER: { cls: 'bank', icon: 'account_balance',     labelAr: 'عرض بنكي',   labelEn: 'Bank Offer' },
};

function OfferTile({ item, isAr }) {
  const meta = TILE_TYPE[item.itemType] ?? TILE_TYPE.DEAL;

  // For BANK_OFFER, show logo on the left if available (no wrapper, no filter)
  const showBankLogo = item.itemType === 'BANK_OFFER' && item.bankLogo;

  // Savings percent — always show for all types including bank
  const pct =
    item.discountPercent != null ? `${Math.round(item.discountPercent)}%`
    : item.discount             ? item.discount
    : null;

  return (
    <div className={`os-tile os-tile--${meta.cls}`}>
      {/* Left: icon or bank logo */}
      {showBankLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.bankLogo}
          alt={item.bankName || 'Bank'}
          className="os-tile__logo"
        />
      ) : (
        <div className="os-tile__icon-wrap">
          <span className="material-symbols-sharp">{meta.icon}</span>
        </div>
      )}

      {/* Middle: label + title + code */}
      <div className="os-tile__body">
        <span className="os-tile__badge">{isAr ? meta.labelAr : meta.labelEn}</span>
        {item.title && (
          <span className="os-tile__title">{item.title}</span>
        )}
        {item.code && (
          <span className="os-tile__code-pill">{item.code}</span>
        )}
      </div>

      {/* Right: savings percent */}
      {pct && (
        <span className="os-tile__pct">{pct}</span>
      )}
    </div>
  );
}

export default function OfferStackBox({ stack, locale }) {
  const isAr = (locale?.split('-')[0] || 'ar') === 'ar';
  const { store, items, combinedSavingsPercent } = stack;

  const ORDER = { CODE: 0, DEAL: 1, BANK_OFFER: 2 };
  const ordered = [...items].sort((a, b) => (ORDER[a.itemType] ?? 9) - (ORDER[b.itemType] ?? 9));

  return (
    <article
      className="os-card"
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={`${store.name} — ${isAr ? 'عروض مدمجة' : 'stackable offers'}`}
    >
      {/* Top colour strip */}
      <div className="os-top-strip" aria-hidden="true" />

      {/* ── Header ── */}
      <div className="os-card__header">
        <div className="os-header-left">
          {/* Store logo — bare, no wrapper, no filter */}
          {store.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo} alt={store.name} className="os-store-logo" />
          ) : (
            <div className="os-store-name-block">
              <span className="os-store-name">{store.name}</span>
            </div>
          )}
          {/* Show name alongside logo only if logo present */}
          {store.logo && (
            <div className="os-store-name-block">
              <span className="os-store-eyebrow">{isAr ? 'متجر' : 'store'}</span>
              <span className="os-store-name">{store.name}</span>
            </div>
          )}
        </div>

        <div className="os-live-badge">
          <span className="os-live-dot" aria-hidden="true" />
          <span className="os-live-label">{isAr ? 'نشط' : 'Live'}</span>
        </div>
      </div>

      {/* ── Savings hero ── */}
      <div className="os-savings-hero">
        <p className="os-savings-label">
          {isAr ? 'أقصى توفير بالتراكم' : 'max stacked savings'}
        </p>
        <div className="os-savings-amount-row">
          <span className="os-savings-prefix">{isAr ? 'وفّر حتى' : 'save up to'}</span>
          <span className="os-savings-number">
            {combinedSavingsPercent > 0 ? `${combinedSavingsPercent}%` : '—'}
          </span>
        </div>
        <p className="os-savings-stacked-label">
          {isAr
            ? <>بتطبيق <strong>{ordered.length} عروض</strong> في آنٍ واحد</>
            : <>by stacking <strong>{ordered.length} offers</strong> together</>
          }
        </p>
      </div>

      <div className="os-divider" aria-hidden="true" />

      {/* ── Stack track ── */}
      <div className="os-stack-track-wrap">
        <p className="os-stack-track-label">
          {isAr ? 'تركيبة العروض' : 'offer stack'}
        </p>
        <div className="os-stack-track" role="list">
          {ordered.map((item, idx) => (
            <div key={idx} role="listitem">
              <OfferTile item={item} isAr={isAr} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer buttons ── */}
      <div className="os-card__footer">
        <StackCta stack={stack} locale={locale} />
      </div>
    </article>
  );
}
