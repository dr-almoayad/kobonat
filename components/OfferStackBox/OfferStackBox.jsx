'use client';
// components/OfferStackBox/OfferStackBox.jsx
import StackCta from './StackCta';
import './OfferStack.css';

const TYPE = {
  CODE:       { cls: 'code', icon: 'confirmation_number', labelAr: 'كود', labelEn: 'Code' },
  DEAL:       { cls: 'deal', icon: 'local_fire_department', labelAr: 'عرض', labelEn: 'Deal' },
  BANK_OFFER: { cls: 'bank', icon: 'account_balance', labelAr: 'بنكي', labelEn: 'Bank' },
};

function OfferTile({ item, isAr }) {
  const meta = TYPE[item.itemType] ?? TYPE.DEAL;

  return (
    <div className={`os-tile os-tile--${meta.cls}`}>
      {item.itemType === 'BANK_OFFER' && item.bankLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.bankLogo} alt={item.bankName || 'Bank'} className="os-tile__logo" />
      ) : (
        <span className="material-symbols-sharp os-tile__icon">{meta.icon}</span>
      )}
      
      <div className="os-tile__info">
        <span className="os-tile__badge">{isAr ? meta.labelAr : meta.labelEn}</span>
        {(item.discountPercent != null || item.discount) && (
          <span className="os-tile__pct">
            {item.discount || `${Math.round(item.discountPercent)}%`}
          </span>
        )}
      </div>

      {item.code && <span className="os-tile__code">{item.code}</span>}
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
      <div className="os-card__header">
        {store.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logo} alt={store.name} className="os-store-logo" />
        ) : (
          <h3 className="os-store-name">{store.name}</h3>
        )}
        <span className="os-badge-pulse">
          <span className="os-badge-pulse__dot"></span>
          {isAr ? 'عروض مدمجة' : 'Stackable Offers'}
        </span>
      </div>

      <div className="os-card__body">
        <div className="os-savings-block">
          <p className="os-savings-block__sub">
            {isAr ? 'إجمالي التوفير في' : 'Combo savings at'} <strong>{store.name}</strong>
          </p>
          <div className="os-savings-block__main">
            <span className="os-savings-block__prefix">{isAr ? 'وفّر حتى' : 'Save up to'}</span>
            <span className="os-savings-block__amount">
              {combinedSavingsPercent > 0 ? `${combinedSavingsPercent}%` : (isAr ? 'خصم مضاعف' : 'Stacked')}
            </span>
          </div>
        </div>

        <div className="os-stack-track">
          {ordered.map((item, idx) => (
            <div key={idx} className="os-stack-track__item">
              {idx > 0 && <span className="os-stack-track__plus">+</span>}
              <OfferTile item={item} isAr={isAr} />
            </div>
          ))}
        </div>
      </div>

      <div className="os-card__footer">
        <StackCta stack={stack} locale={locale} />
      </div>
    </article>
  );
}
