// components/blog/SectionBlockRenderer/SectionBlockRenderer.jsx
// Renders a single SectionBlock in the public blog post view.
// Handles: TEXT, VOUCHER, PROMO, STORE, PRODUCT, POST, TABLE, BANK, CARD

import Link from 'next/link';
import Image from 'next/image';

// ─────────────────────────────────────────────────────────────────────────────
// Voucher card
// ─────────────────────────────────────────────────────────────────────────────

function VoucherBlock({ voucher, locale }) {
  if (!voucher) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = voucher.translations?.[0] || {};
  const store   = voucher.store;
  const storeName = store?.translations?.[0]?.name || '';
  const storeSlug = store?.translations?.[0]?.slug || String(store?.id || '');

  const isCode = ['CODE'].includes(voucher.type);
  const label  = isRTL
    ? (isCode ? 'كود الخصم' : 'عرض')
    : (isCode ? 'Coupon Code' : 'Deal');

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff',
      marginBottom: '1rem',
      display: 'flex',
      gap: 0,
    }}>
      {/* Left accent stripe */}
      <div style={{ width: 4, flexShrink: 0, background: isCode ? '#7c3aed' : '#059669' }} />

      <div style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            {storeName && (
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: '0.2rem' }}>
                {storeName}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', lineHeight: 1.35 }}>
              {t.title || (isRTL ? 'عرض' : 'Offer')}
            </div>
            {t.description && (
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {t.description}
              </div>
            )}
          </div>
          {voucher.discount && (
            <div style={{ flexShrink: 0, background: '#f0fdf4', color: '#065f46', padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: 800, border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
              {voucher.discount}
            </div>
          )}
        </div>

        {/* Code box */}
        {voucher.code && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#faf5ff', border: '1px dashed #c4b5fd', borderRadius: 6, padding: '0.4rem 0.75rem', width: 'fit-content' }}>
            <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <code style={{ fontWeight: 800, color: '#4c1d95', letterSpacing: '0.1em', fontSize: '0.9rem' }}>{voucher.code}</code>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
          {voucher.landingUrl && (
            <a
              href={voucher.landingUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              style={{ padding: '0.4rem 1rem', background: '#4f46e5', color: '#fff', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
            >
              {isRTL ? 'تسوق الآن' : 'Shop Now'}
            </a>
          )}
          {storeSlug && (
            <Link
              href={`/${locale}/stores/${storeSlug}`}
              style={{ fontSize: '0.75rem', color: '#6b7280', textDecoration: 'none' }}
            >
              {isRTL ? `← كل عروض ${storeName}` : `All ${storeName} deals →`}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bank offer / OtherPromo card
// ─────────────────────────────────────────────────────────────────────────────

function PromoBlock({ promo, locale }) {
  if (!promo) return null;
  const lang    = locale.split('-')[0];
  const isRTL   = lang === 'ar';
  const t       = promo.translations?.[0] || {};
  const bank    = promo.bank;
  const store   = promo.store;
  const bankName  = bank?.translations?.[0]?.name  || '';
  const storeName = store?.translations?.[0]?.name || '';

  // Badge colour by type
  const typeColor = {
    BANK_OFFER:    '#b45309',
    CARD_OFFER:    '#7c3aed',
    PAYMENT_OFFER: '#0369a1',
    SEASONAL:      '#065f46',
  };
  const color = typeColor[promo.type] || '#6b7280';

  return (
    <div style={{
      border: `1px solid ${color}30`,
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff',
      marginBottom: '1rem',
      display: 'flex',
      gap: 0,
    }}>
      {/* Left accent */}
      <div style={{ width: 4, flexShrink: 0, background: color }} />

      <div style={{ flex: 1, padding: '1rem 1.25rem' }}>
        {/* Bank + type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {bank?.logo && (
            <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
              <img src={bank.logo} alt={bankName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          )}
          {bankName && <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151' }}>{bankName}</span>}
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: `${color}15`, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {promo.type?.replace('_', ' ')}
          </span>
        </div>

        {/* Title + description */}
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '0.25rem', lineHeight: 1.35 }}>
          {t.title || (isRTL ? 'عرض بنكي' : 'Bank Offer')}
        </div>
        {t.description && (
          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            {t.description}
          </div>
        )}

        {/* Discount */}
        {(promo.discountPercent || promo.verifiedAvgPercent) && (
          <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.65rem', borderRadius: 16, fontSize: '0.82rem', fontWeight: 700, border: '1px solid #fde68a', marginBottom: '0.5rem' }}>
            {isRTL ? `خصم ${promo.verifiedAvgPercent ?? promo.discountPercent}٪` : `${promo.verifiedAvgPercent ?? promo.discountPercent}% off`}
          </div>
        )}

        {/* Terms */}
        {t.terms && (
          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.5rem', lineHeight: 1.5 }}>
            {t.terms}
          </div>
        )}

        {/* CTA */}
        {(promo.url || (store && store.translations?.[0]?.slug)) && (
          <a
            href={promo.url || `/${locale}/stores/${store.translations?.[0]?.slug}`}
            target="_blank"
            rel="nofollow noopener noreferrer"
            style={{ display: 'inline-block', padding: '0.35rem 0.9rem', background: color, color: '#fff', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}
          >
            {isRTL ? 'احصل على العرض' : 'Get Offer'}
          </a>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text block
// ─────────────────────────────────────────────────────────────────────────────

function TextBlock({ block, locale }) {
  const lang  = locale.split('-')[0];
  const isRTL = lang === 'ar';
  const text  = isRTL ? (block.textAr || block.textEn) : (block.textEn || block.textAr);
  if (!text) return null;
  return (
    <div
      className="blog-content"
      dir={isRTL ? 'rtl' : 'ltr'}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main renderer
// ─────────────────────────────────────────────────────────────────────────────

export default function SectionBlockRenderer({ block, locale }) {
  switch (block.type) {
    case 'TEXT':
      return <TextBlock block={block} locale={locale} />;

    case 'VOUCHER':
      return <VoucherBlock voucher={block.voucher} locale={locale} />;

    case 'PROMO':
      return <PromoBlock promo={block.promo} locale={locale} />;

    // Remaining types — these should already be handled by your existing renderer.
    // If not yet built, they gracefully return null.
    case 'STORE':
    case 'PRODUCT':
    case 'POST':
    case 'TABLE':
    case 'BANK':
    case 'CARD':
    default:
      // Your existing SectionBlockRenderer logic goes here,
      // or import the relevant sub-components (ComparisonTable, EmbeddedPostCard, etc.)
      return null;
  }
}
