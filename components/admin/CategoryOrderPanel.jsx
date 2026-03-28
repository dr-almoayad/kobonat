// components/admin/CategoryOrderPanel.jsx
// Drop-in panel for the categories admin page.
// Shows all categories as draggable rows; on save, PATCHes their order in bulk.
'use client';

import { useState } from 'react';

export default function CategoryOrderPanel({ categories, onSaved }) {
  const [items, setItems] = useState(
    [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [alert, setAlert] = useState(null);

  function move(from, direction) {
    const to = from + direction;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    setItems(next);
  }

  function onDragStart(idx) { setDragIdx(idx); }
  function onDragOver(e, idx) { e.preventDefault(); setOverIdx(idx); }
  function onDrop(idx) {
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...items];
    const [item] = next.splice(dragIdx, 1);
    next.splice(idx, 0, item);
    setItems(next);
    setDragIdx(null);
    setOverIdx(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = items.map((cat, idx) => ({ id: cat.id, order: idx * 10 }));
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      setAlert({ type: 'success', msg: 'Order saved! Carousel will reflect this immediately.' });
      onSaved?.();
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(null), 4000);
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Carousel Order</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Drag rows or use arrows to reorder. Save when done.</div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: '#470ae2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving…' : 'Save Order'}
        </button>
      </div>

      {alert && (
        <div style={{ padding: '0.65rem 1.25rem', background: alert.type === 'success' ? '#dcfce7' : '#fee2e2', color: alert.type === 'success' ? '#166534' : '#991b1b', fontSize: '0.82rem', borderBottom: '1px solid #e2e8f0' }}>
          {alert.msg}
        </div>
      )}

      <div>
        {items.map((cat, idx) => {
          const en = cat.translations?.find(t => t.locale === 'en') || {};
          const isOver = overIdx === idx && dragIdx !== idx;
          return (
            <div
              key={cat.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={() => onDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 1.25rem',
                borderBottom: '1px solid #f1f5f9',
                background: isOver ? '#f0ebff' : dragIdx === idx ? '#fafafa' : '#fff',
                borderLeft: isOver ? '3px solid #470ae2' : '3px solid transparent',
                cursor: 'grab', transition: 'background 0.15s',
                userSelect: 'none',
              }}
            >
              {/* Drag handle */}
              <span style={{ color: '#cbd5e1', fontSize: '1rem', flexShrink: 0 }}>⠿</span>

              {/* Position badge */}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', minWidth: 20, textAlign: 'right', fontFamily: 'monospace' }}>
                {idx + 1}
              </span>

              {/* Icon / image */}
              <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: cat.color ? `${cat.color}18` : '#f1f5f9', flexShrink: 0 }}>
                {cat.image
                  ? <img src={cat.image} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} />
                  : <span style={{ fontSize: 18 }}>{cat.icon || '📂'}</span>
                }
              </div>

              {/* Name */}
              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: '#1e293b' }}>
                {en.name || `Category #${cat.id}`}
              </span>

              {/* Slug */}
              <code style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '1px 5px', borderRadius: 3 }}>
                {en.slug || ''}
              </code>

              {/* Arrow buttons */}
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                  style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: '0.7rem' }}>
                  ↑
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
                  style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === items.length - 1 ? 0.3 : 1, fontSize: '0.7rem' }}>
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
