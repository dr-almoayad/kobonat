'use client';
// components/OfferStackBox/OfferStackBox.jsx
import StackCta from './StackCta';
import './OfferStack.css';

const TILE_TYPE = {
  CODE:       { cls: 'code', icon: 'confirmation_number', labelAr: 'كود خصم', labelEn: 'Code' },
  DEAL:       { cls: 'deal', icon: 'bolt',                labelAr: 'خصم تلقائي', labelEn: 'Deal' },
  BANK_OFFER: { cls: 'bank', icon: 'account_balance',     labelAr: 'بنكي', labelEn: 'Bank' },
};

function OfferTile({ item, isAr }) {
  const meta = TILE_TYPE[item.itemType] ?? TILE_TYPE.DEAL;

  return (
    <div className={`os-tile os-tile--${meta.cls}`}>
      {/* Type row: icon + label */}
      <div className="os-tile__type-row">
        <div className="os-tile__icon-wrap">
          {item.itemType === 'BANK_OFFER' && item.bankLogo ? null : (
            <span className="material-symbols-sharp">{meta.icon}</span>
          )}
        </div>
        <span className="os-tile__badge">{isAr ? meta.labelAr : meta.labelEn}</span>
      </div>

      {/* Bank logo OR savings % */}
      {item.itemType === 'BANK_OFFER' && item.bankLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.bankLogo} alt={item.bankName || 'Bank'} className="os-tile__logo" />
      ) : (
        (item.discountPercent != null || item.discount) && (
          <span className="os-tile__pct">
            {item.discount || `${Math.round(item.discountPercent)}%`}
          </span>
        )
      )}

      {/* Code pill */}
      {item.code && (
        <span className="os-tile__code-pill">{item.code}</span>
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
          {store.logo ? (
            <div className="os-store-logo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={store.logo} alt={store.name} className="os-store-logo" />
            </div>
          ) : null}
          <div className="os-store-name-block">
            <span className="os-store-eyebrow">
              {isAr ? 'متجر' : 'store'}
            </span>
            <h3 className="os-store-name">{store.name}</h3>
          </div>
        </div>

        {/* Live indicator */}
        <div className="os-live-badge" aria-label={isAr ? 'عروض نشطة' : 'Active offers'}>
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
          <span className="os-savings-number" aria-label={`${combinedSavingsPercent}%`}>
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
            <div key={idx} className="os-stack-track__item" role="listitem">
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
