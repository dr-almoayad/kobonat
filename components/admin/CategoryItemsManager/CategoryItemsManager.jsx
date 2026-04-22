'use client';
// components/admin/CategoryItemsManager/CategoryItemsManager.jsx
//
// Used in app/admin/categories/page.jsx when a category is selected for editing.
// Renders a tabbed view of all items directly tagged to this category.
// Allows removing items and toggling their featured / order settings.

import { useState, useEffect, useCallback } from 'react';
import styles from '@/app/admin/admin.module.css';

const TABS = [
  { key: 'vouchers',      label: 'Vouchers' },
  { key: 'offerStacks',   label: 'Offer Stacks' },
  { key: 'storeProducts', label: 'Products' },
  { key: 'otherPromos',   label: 'Bank Offers' },
];

const TYPE_FOR_TAB = {
  vouchers:      'VOUCHER',
  offerStacks:   'OFFER_STACK',
  storeProducts: 'STORE_PRODUCT',
  otherPromos:   'OTHER_PROMO',
};

const ITEM_ID_FIELD = {
  VOUCHER:       'voucherId',
  OFFER_STACK:   'stackId',
  STORE_PRODUCT: 'productId',
  OTHER_PROMO:   'promoId',
};

// Extract a display name from a tagged row (handles all 4 item shapes)
function getItemLabel(row, tab) {
  if (tab === 'vouchers') {
    return row.voucher?.translations?.[0]?.title
        || row.voucher?.code
        || `Voucher #${row.voucherId}`;
  }
  if (tab === 'offerStacks') {
    const store = row.stack?.store?.translations?.[0]?.name || '';
    return row.stack?.label || (store ? `${store} stack` : `Stack #${row.stackId}`);
  }
  if (tab === 'storeProducts') {
    return row.product?.translations?.[0]?.title || `Product #${row.productId}`;
  }
  if (tab === 'otherPromos') {
    return row.promo?.translations?.[0]?.title
        || row.promo?.bank?.translations?.[0]?.name
        || `Promo #${row.promoId}`;
  }
  return '—';
}

function getItemSub(row, tab) {
  if (tab === 'vouchers') {
    const store = row.voucher?.store?.translations?.[0]?.name;
    return store ? `from ${store}` : '';
  }
  if (tab === 'offerStacks') {
    const store = row.stack?.store?.translations?.[0]?.name;
    return store ? `from ${store}` : '';
  }
  if (tab === 'storeProducts') {
    const store = row.product?.store?.translations?.[0]?.name;
    return store ? `from ${store}` : '';
  }
  if (tab === 'otherPromos') {
    const store = row.promo?.store?.translations?.[0]?.name;
    return store ? `from ${store}` : '';
  }
  return '';
}

export default function CategoryItemsManager({ categoryId }) {
  const [tab,     setTab]     = useState('vouchers');
  const [data,    setData]    = useState({ vouchers: [], offerStacks: [], storeProducts: [], otherPromos: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/featured-items?locale=en`);
      if (res.ok) setData(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  async function handleRemove(row) {
    const type    = TYPE_FOR_TAB[tab];
    const idField = ITEM_ID_FIELD[type];
    const itemId  = row[idField];
    if (!confirm('Remove this item from the category?')) return;
    try {
      await fetch(
        `/api/admin/item-categories?type=${type}&itemId=${itemId}&categoryId=${categoryId}`,
        { method: 'DELETE' }
      );
      setData(prev => ({
        ...prev,
        [tab]: prev[tab].filter(r => r[idField] !== itemId),
      }));
    } catch {}
  }

  async function toggleFeatured(row) {
    const type    = TYPE_FOR_TAB[tab];
    const idField = ITEM_ID_FIELD[type];
    const itemId  = row[idField];
    try {
      const res = await fetch('/api/admin/item-categories', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, itemId, categoryId, isFeatured: !row.isFeatured, order: row.order }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setData(prev => ({
        ...prev,
        [tab]: prev[tab].map(r => r[idField] === itemId ? updated : r),
      }));
    } catch {}
  }

  async function updateOrder(row, newOrder) {
    const type    = TYPE_FOR_TAB[tab];
    const idField = ITEM_ID_FIELD[type];
    const itemId  = row[idField];
    try {
      const res = await fetch('/api/admin/item-categories', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, itemId, categoryId, isFeatured: row.isFeatured, order: parseInt(newOrder) || 0 }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setData(prev => ({
        ...prev,
        [tab]: prev[tab].map(r => r[idField] === itemId ? updated : r),
      }));
    } catch {}
  }

  if (!categoryId) {
    return <p className={styles.helpText}>Select a category first.</p>;
  }

  const rows = data[tab] || [];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem' }}>
        {TABS.map(t => {
          const count = data[t.key]?.length ?? 0;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: '0.35rem 0.875rem', borderRadius: 6, border: 'none',
                background: tab === t.key ? 'var(--admin-primary)' : 'transparent',
                color:      tab === t.key ? '#fff' : 'var(--admin-text-muted)',
                fontSize:   '0.8rem', fontWeight: tab === t.key ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {t.label} {count > 0 && <span style={{ opacity: 0.75 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Item list */}
      {loading ? (
        <p className={styles.helpText}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.helpText}>
          No {TABS.find(t => t.key === tab)?.label.toLowerCase()} tagged to this category yet.
          Go to the item's edit page and use the "Category Tags" section.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rows.map((row, idx) => {
            const type    = TYPE_FOR_TAB[tab];
            const idField = ITEM_ID_FIELD[type];
            return (
              <div
                key={`${row[idField]}-${row.categoryId}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                  padding: '0.5rem 0.875rem',
                  background:   row.isFeatured ? '#ede9fe' : 'var(--admin-bg)',
                  border:       `1px solid ${row.isFeatured ? '#c4b5fd' : 'var(--admin-border)'}`,
                  borderRadius: 8,
                }}
              >
                {/* Index */}
                <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', minWidth: 20 }}>
                  {idx + 1}.
                </span>

                {/* Label */}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-text)' }}>
                    {getItemLabel(row, tab)}
                  </div>
                  {getItemSub(row, tab) && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
                      {getItemSub(row, tab)}
                    </div>
                  )}
                </div>

                {/* Featured toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={row.isFeatured}
                    onChange={() => toggleFeatured(row)}
                  />
                  Featured
                </label>

                {/* Order */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
                  Order
                  <input
                    type="number"
                    value={row.order}
                    min="0"
                    onBlur={e => updateOrder(row, e.target.value)}
                    onChange={e => setData(prev => ({
                      ...prev,
                      [tab]: prev[tab].map(r => r[ITEM_ID_FIELD[TYPE_FOR_TAB[tab]]] === row[ITEM_ID_FIELD[TYPE_FOR_TAB[tab]]] ? { ...r, order: parseInt(e.target.value) || 0 } : r),
                    }))}
                    style={{
                      width: 50, padding: '2px 5px',
                      borderRadius: 5, border: '1px solid var(--admin-border)',
                      background: 'var(--admin-surface)', color: 'var(--admin-text)',
                      fontSize: '0.75rem',
                    }}
                  />
                </label>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemove(row)}
                  className={styles.btnDelete}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
