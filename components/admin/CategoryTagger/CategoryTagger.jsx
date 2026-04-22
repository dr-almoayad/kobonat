'use client';
// components/admin/CategoryTagger/CategoryTagger.jsx
//
// Drop this into any item's edit form to allow direct category tagging.
//
// Usage:
//   <CategoryTagger
//     itemType="VOUCHER"          // or OFFER_STACK | STORE_PRODUCT | OTHER_PROMO
//     itemId={42}                 // pass null/undefined when creating a new item
//     availableCategories={cats}  // array from /api/admin/categories?locale=en
//   />
//
// The component manages its own state and calls /api/admin/item-categories
// directly — no parent state wiring needed.

import { useState, useEffect, useCallback } from 'react';
import styles from '@/app/admin/admin.module.css';

const ITEM_ID_FIELD = {
  VOUCHER:       'voucherId',
  OFFER_STACK:   'stackId',
  STORE_PRODUCT: 'productId',
  OTHER_PROMO:   'promoId',
};

const TYPE_LABELS = {
  VOUCHER:       'voucher',
  OFFER_STACK:   'offer stack',
  STORE_PRODUCT: 'product',
  OTHER_PROMO:   'promo',
};

export default function CategoryTagger({ itemType, itemId, availableCategories = [] }) {
  const [associations, setAssociations] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [addCatId,     setAddCatId]     = useState('');
  const [addFeatured,  setAddFeatured]  = useState(false);
  const [addOrder,     setAddOrder]     = useState(0);
  const [error,        setError]        = useState('');

  const taggedIds  = new Set(associations.map(a => a.categoryId));
  const untagged   = availableCategories.filter(c => !taggedIds.has(c.id));
  const idField    = ITEM_ID_FIELD[itemType];

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/item-categories?type=${itemType}&itemId=${itemId}`);
      if (res.ok) setAssociations(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [itemType, itemId]);

  useEffect(() => { load(); }, [load]);

  // ── Add ───────────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!addCatId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/item-categories', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       itemType,
          itemId:     parseInt(itemId),
          categoryId: parseInt(addCatId),
          isFeatured: addFeatured,
          order:      addOrder,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      const row = await res.json();
      setAssociations(prev => [...prev, row]);
      setAddCatId('');
      setAddFeatured(false);
      setAddOrder(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Update isFeatured ─────────────────────────────────────────────────────
  async function toggleFeatured(assoc) {
    try {
      const res = await fetch('/api/admin/item-categories', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       itemType,
          itemId:     assoc[idField],
          categoryId: assoc.categoryId,
          isFeatured: !assoc.isFeatured,
          order:      assoc.order,
        }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setAssociations(prev => prev.map(a => a.categoryId === assoc.categoryId ? updated : a));
    } catch {}
  }

  // ── Update order ──────────────────────────────────────────────────────────
  async function updateOrder(assoc, newOrder) {
    try {
      const res = await fetch('/api/admin/item-categories', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       itemType,
          itemId:     assoc[idField],
          categoryId: assoc.categoryId,
          isFeatured: assoc.isFeatured,
          order:      parseInt(newOrder) || 0,
        }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setAssociations(prev => prev.map(a => a.categoryId === assoc.categoryId ? updated : a));
    } catch {}
  }

  // ── Remove ────────────────────────────────────────────────────────────────
  async function handleRemove(assoc) {
    if (!confirm('Remove from this category?')) return;
    try {
      await fetch(
        `/api/admin/item-categories?type=${itemType}&itemId=${assoc[idField]}&categoryId=${assoc.categoryId}`,
        { method: 'DELETE' }
      );
      setAssociations(prev => prev.filter(a => a.categoryId !== assoc.categoryId));
    } catch {}
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!itemId) {
    return (
      <p className={styles.helpText} style={{ margin: 0 }}>
        Save the {TYPE_LABELS[itemType]} first to enable category tagging.
      </p>
    );
  }

  return (
    <div>
      {/* Current tags */}
      {loading ? (
        <p className={styles.helpText} style={{ margin: '0 0 0.5rem' }}>Loading…</p>
      ) : associations.length === 0 ? (
        <p className={styles.helpText} style={{ margin: '0 0 0.75rem' }}>
          Not tagged to any category yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {associations.map(assoc => {
            const catName = assoc.category?.translations?.[0]?.name || `#${assoc.categoryId}`;
            return (
              <div
                key={assoc.categoryId}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
                  padding: '0.4rem 0.75rem',
                  background:   assoc.isFeatured ? '#ede9fe' : 'var(--admin-bg)',
                  border:       `1px solid ${assoc.isFeatured ? '#c4b5fd' : 'var(--admin-border)'}`,
                  borderRadius: 8,
                }}
              >
                {/* Featured star */}
                <span
                  onClick={() => toggleFeatured(assoc)}
                  style={{
                    cursor:  'pointer',
                    fontSize: '0.9rem',
                    color:    assoc.isFeatured ? '#7c3aed' : '#aaa',
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                  title={assoc.isFeatured ? 'Featured (click to unfeature)' : 'Click to mark as featured'}
                >
                  {assoc.isFeatured ? '★' : '☆'}
                </span>

                {/* Category name */}
                <span style={{
                  flex: 1,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: assoc.isFeatured ? '#4c1d95' : 'var(--admin-text)',
                  minWidth: 80,
                }}>
                  {catName}
                </span>

                {/* Order */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
                  Order
                  <input
                    type="number"
                    value={assoc.order}
                    min="0"
                    onBlur={e => updateOrder(assoc, e.target.value)}
                    onChange={e => setAssociations(prev =>
                      prev.map(a => a.categoryId === assoc.categoryId ? { ...a, order: parseInt(e.target.value) || 0 } : a)
                    )}
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
                  onClick={() => handleRemove(assoc)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#ef4444', cursor: 'pointer',
                    fontSize: '0.85rem', lineHeight: 1,
                    padding: '0 0.2rem', flexShrink: 0,
                  }}
                  title="Remove from this category"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add row */}
      {untagged.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={addCatId}
            onChange={e => setAddCatId(e.target.value)}
            className={styles.formSelect}
            style={{ flex: '1 1 160px', minWidth: 0, fontSize: '0.82rem' }}
          >
            <option value="">— Add to category —</option>
            {untagged.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.translations?.[0]?.name || `Category #${cat.id}`}
              </option>
            ))}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'var(--admin-text)' }}>
            <input
              type="checkbox"
              checked={addFeatured}
              onChange={e => setAddFeatured(e.target.checked)}
              style={{ margin: 0 }}
            />
            Featured
          </label>

          <input
            type="number"
            value={addOrder}
            min="0"
            onChange={e => setAddOrder(parseInt(e.target.value) || 0)}
            placeholder="Order"
            title="Display order (0 = first)"
            style={{
              width: 64, padding: '0.35rem 0.5rem',
              borderRadius: 6, border: '1px solid var(--admin-border)',
              background: 'var(--admin-surface)', color: 'var(--admin-text)',
              fontSize: '0.8rem',
            }}
          />

          <button
            type="button"
            onClick={handleAdd}
            className={styles.btnPrimary}
            disabled={!addCatId || saving}
            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            {saving ? 'Adding…' : '+ Tag'}
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>{error}</p>
      )}
    </div>
  );
}
