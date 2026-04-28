'use client';
// components/admin/StackCategoryTagger/StackCategoryTagger.jsx
// Fetches all stacks for a store and renders CategoryTagger per stack.

import { useState, useEffect } from 'react';
import CategoryTagger from '@/components/admin/CategoryTagger/CategoryTagger';

export default function StackCategoryTagger({ storeId, categories = [] }) {
  const [stacks,  setStacks]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState({}); // { [stackId]: bool }

  useEffect(() => {
    if (!storeId) return;
    fetch(`/api/admin/stores/${storeId}/stacks`)
      .then(r => r.ok ? r.json() : { stacks: [] })
      .then(d => setStacks(d.stacks || []))
      .catch(() => setStacks([]))
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
    return <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Loading stacks…</p>;
  }

  if (!stacks.length) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
        No offer stacks yet. Create stacks in the Offer Stacks tab first.
      </p>
    );
  }

  const toggle = (id) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {stacks.map(stack => {
        const label = stack.label
          || [
              stack.codeVoucher?.translations?.[0]?.title,
              stack.dealVoucher?.translations?.[0]?.title,
              stack.promo?.translations?.[0]?.title,
            ].filter(Boolean).join(' + ')
          || `Stack #${stack.id}`;

        return (
          <div
            key={stack.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            {/* Row header */}
            <button
              type="button"
              onClick={() => toggle(stack.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: open[stack.id] ? '#f8fafc' : '#fff',
                border: 'none',
                cursor: 'pointer',
                borderBottom: open[stack.id] ? '1px solid #e2e8f0' : 'none',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: stack.isActive ? 'rgba(63,185,80,0.12)' : '#f1f5f9',
                  color: stack.isActive ? '#16a34a' : '#94a3b8',
                  flexShrink: 0,
                }}
              >
                {stack.isActive ? 'Active' : 'Inactive'}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
              <span
                className="material-symbols-sharp"
                style={{ fontSize: '1rem', color: '#94a3b8', flexShrink: 0 }}
              >
                {open[stack.id] ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* CategoryTagger — shown when expanded */}
            {open[stack.id] && (
              <div style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 0.75rem' }}>
                  Tag this stack to category pages. Toggle <strong>Featured</strong> to
                  show it in the highlighted strip at the top of the category page.
                </p>
                <CategoryTagger
                  itemType="OFFER_STACK"
                  itemId={stack.id}
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
