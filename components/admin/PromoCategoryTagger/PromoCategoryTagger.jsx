'use client';
// components/admin/PromoCategoryTagger/PromoCategoryTagger.jsx
// Fetches all OtherPromos for a store and renders CategoryTagger per promo.

import { useState, useEffect } from 'react';
import CategoryTagger from '@/components/admin/CategoryTagger/CategoryTagger';

const TYPE_LABELS = {
  BANK_OFFER:    'Bank Offer',
  CARD_OFFER:    'Card Offer',
  PAYMENT_OFFER: 'Payment Offer',
  SEASONAL:      'Seasonal',
  BUNDLE:        'Bundle',
  OTHER:         'Other',
};

export default function PromoCategoryTagger({ storeId, categories = [] }) {
  const [promos,  setPromos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState({});

  useEffect(() => {
    if (!storeId) return;
    fetch(`/api/admin/stores/${storeId}/other-promos?locale=en`)
      .then(r => r.ok ? r.json() : { promos: [] })
      .then(d => setPromos(d.promos || []))
      .catch(() => setPromos([]))
      .finally(() => setLoading(false));
  }, [storeId]);

  if (!categories.length) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
        No categories available. Create categories first.
      </p>
    );
  }

  if (loading) {
    return <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Loading promos…</p>;
  }

  if (!promos.length) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
        No bank / card offers yet. Add them in the Other Promos tab first.
      </p>
    );
  }

  const toggle = (id) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {promos.map(promo => {
        const title = promo.title
          || promo.translations?.find(t => t.locale === 'en')?.title
          || `Promo #${promo.id}`;

        const bankName = promo.bank?.translations?.find(t => t.locale === 'en')?.name
          || promo.bank?.translations?.[0]?.name
          || '';

        const typeLabel = TYPE_LABELS[promo.type] || promo.type;

        const isExpired = promo.expiryDate && new Date(promo.expiryDate) < new Date();

        return (
          <div
            key={promo.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              overflow: 'hidden',
              background: '#fff',
              opacity: isExpired ? 0.6 : 1,
            }}
          >
            {/* Row header */}
            <button
              type="button"
              onClick={() => toggle(promo.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: open[promo.id] ? '#f8fafc' : '#fff',
                border: 'none',
                cursor: 'pointer',
                borderBottom: open[promo.id] ? '1px solid #e2e8f0' : 'none',
                textAlign: 'left',
              }}
            >
              {/* Type badge */}
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(245,158,11,0.12)',
                  color: '#b45309',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {typeLabel}
              </span>

              {/* Bank logo if available */}
              {(promo.bank?.logo || promo.bankLogo) && (
                <img
                  src={promo.bank?.logo || promo.bankLogo}
                  alt={bankName}
                  style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
                />
              )}

              {/* Title + bank name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </div>
                {bankName && (
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{bankName}</div>
                )}
              </div>

              {/* Expired badge */}
              {isExpired && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: '#fee2e2',
                    color: '#b91c1c',
                    flexShrink: 0,
                  }}
                >
                  Expired
                </span>
              )}

              {/* Status dot */}
              {!isExpired && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: promo.isActive ? 'rgba(63,185,80,0.12)' : '#f1f5f9',
                    color: promo.isActive ? '#16a34a' : '#94a3b8',
                    flexShrink: 0,
                  }}
                >
                  {promo.isActive ? 'Active' : 'Inactive'}
                </span>
              )}

              <span
                className="material-symbols-sharp"
                style={{ fontSize: '1rem', color: '#94a3b8', flexShrink: 0 }}
              >
                {open[promo.id] ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* CategoryTagger — shown when expanded */}
            {open[promo.id] && (
              <div style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 0.75rem' }}>
                  Tag this bank / card offer to category pages. Toggle{' '}
                  <strong>Featured</strong> to show it in the highlighted strip at the
                  top of the category page.
                </p>
                <CategoryTagger
                  itemType="OTHER_PROMO"
                  itemId={promo.id}
                  availableCategories={categories}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
