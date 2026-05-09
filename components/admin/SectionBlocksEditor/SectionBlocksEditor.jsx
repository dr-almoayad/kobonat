'use client';
// components/admin/SectionBlocksEditor/SectionBlocksEditor.jsx
// Inline block editor for a single BlogPostSection.
// Supports: TEXT, POST, TABLE, PRODUCT, STORE, BANK, CARD, VOUCHER, PROMO

import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { value: 'TEXT',    label: '📝 Text',        desc: 'Rich text (EN + AR)' },
  { value: 'VOUCHER', label: '🎟 Voucher',      desc: 'Embed a coupon code or deal' },
  { value: 'PROMO',   label: '🏦 Bank Offer',   desc: 'Embed a bank/payment promo' },
  { value: 'STORE',   label: '🏪 Store',        desc: 'Showcase a store' },
  { value: 'PRODUCT', label: '📦 Product',      desc: 'Feature a store product' },
  { value: 'POST',    label: '📰 Blog Post',    desc: 'Embed another post card' },
  { value: 'TABLE',   label: '📊 Table',        desc: 'Comparison table' },
  { value: 'BANK',    label: '🏛 Bank',         desc: 'Feature a bank' },
  { value: 'CARD',    label: '💳 Credit Card',  desc: 'Feature a credit card' },
];

const TYPE_COLOR = {
  TEXT:    '#6b7280',
  VOUCHER: '#7c3aed',
  PROMO:   '#b45309',
  STORE:   '#0369a1',
  PRODUCT: '#047857',
  POST:    '#be185d',
  TABLE:   '#1d4ed8',
  BANK:    '#9f1239',
  CARD:    '#7c3aed',
};

// ─────────────────────────────────────────────────────────────────────────────
// Tiny reusable field wrapper
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{hint}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add-block form
// ─────────────────────────────────────────────────────────────────────────────

function AddBlockForm({ sectionId, onAdded, onCancel }) {
  const [type,      setType]      = useState('VOUCHER');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  // Entity search
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected,  setSelected]  = useState(null);   // { id, label, sublabel }

  // TEXT fields
  const [textEn, setTextEn] = useState('');
  const [textAr, setTextAr] = useState('');

  // Reset when type changes
  useEffect(() => {
    setQuery(''); setResults([]); setSelected(null); setError('');
  }, [type]);

  // Search endpoint per type
  function searchEndpoint(q) {
    const enc = encodeURIComponent(q);
    switch (type) {
      case 'VOUCHER':  return `/api/admin/vouchers?locale=en&search=${enc}&limit=10`;
      case 'PROMO':    return `/api/admin/vouchers?locale=en&search=${enc}&limit=10`;  // reuse; filtered below
      case 'STORE':    return `/api/admin/stores?locale=en&search=${enc}&limit=10`;
      case 'PRODUCT':  return `/api/admin/stores?locale=en&search=${enc}&limit=10`;   // just shows stores to pick from
      case 'POST':     return `/api/admin/blog?locale=en`;
      case 'BANK':     return `/api/admin/banks?locale=en`;
      case 'CARD':     return `/api/admin/banks?locale=en`;
      default:         return null;
    }
  }

  function transformResults(data) {
    switch (type) {
      case 'VOUCHER':
        // filter to CODE/DEAL types
        return (data?.data || [])
          .filter(v => ['CODE', 'DEAL', 'FREE_SHIPPING'].includes(v.type))
          .map(v => ({
            id: v.id,
            label: v.translations?.[0]?.title || v.code || `Voucher #${v.id}`,
            sublabel: `${v.type}${v.code ? ` · ${v.code}` : ''} · ${v.store?.translations?.[0]?.name || ''}`,
          }));

      case 'PROMO':
        // OtherPromo search — use a different endpoint
        return (data?.data || data || []).map(p => ({
          id: p.id,
          label: p.translations?.[0]?.title || `Promo #${p.id}`,
          sublabel: p.type || '',
        }));

      case 'STORE':
        return (Array.isArray(data) ? data : []).map(s => ({
          id: s.id,
          label: s.translations?.[0]?.name || `Store #${s.id}`,
          sublabel: s.translations?.[0]?.slug || '',
        }));

      case 'POST':
        return (Array.isArray(data) ? data : []).slice(0, 10).map(p => ({
          id: p.id,
          label: p.translations?.[0]?.title || p.slug,
          sublabel: p.slug,
        }));

      case 'BANK':
        return (Array.isArray(data) ? data : []).map(b => ({
          id: b.id,
          label: b.translations?.[0]?.name || `Bank #${b.id}`,
          sublabel: b.slug,
        }));

      default:
        return [];
    }
  }

  // Promo search uses a different endpoint
  async function doSearch(q) {
    setSearching(true);
    try {
      let url;
      if (type === 'PROMO') {
        // Search across all promos via a store-agnostic endpoint
        url = `/api/admin/vouchers?locale=en&search=${encodeURIComponent(q)}&limit=20`;
        // Actually we should use a promos endpoint — fall back to all-stores promo list
        // For now, instruct user to enter a promo ID directly
        setResults([]);
        setSearching(false);
        return;
      }
      url = searchEndpoint(q);
      if (!url) return;
      const res  = await fetch(url);
      const data = res.ok ? await res.json() : [];
      setResults(transformResults(data));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (type === 'TEXT') return;
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, type]);

  async function handleSave() {
    setError('');
    if (type === 'TEXT' && !textEn && !textAr) {
      setError('Enter at least one text field.');
      return;
    }
    if (type !== 'TEXT' && !selected) {
      setError('Select an item to embed.');
      return;
    }

    setSaving(true);
    try {
      const body = { type, order: 999 };

      if (type === 'TEXT')    { body.textEn = textEn; body.textAr = textAr; }
      if (type === 'VOUCHER') body.voucherId = selected.id;
      if (type === 'PROMO')   body.promoId   = selected.id;
      if (type === 'STORE')   body.storeId   = selected.id;
      if (type === 'PRODUCT') body.productId = selected.id;
      if (type === 'POST')    body.postId    = selected.id;
      if (type === 'TABLE')   body.tableId   = selected.id;
      if (type === 'BANK')    body.bankId    = selected.id;
      if (type === 'CARD')    body.cardId    = selected.id;

      const res = await fetch(`/api/admin/sections/${sectionId}/blocks`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add block');
      onAdded(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // For PROMO type, allow direct ID entry since search is complex
  const [promoId, setPromoId] = useState('');

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem',
      background: '#f9fafb', marginBottom: '0.75rem',
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.75rem', color: '#374151' }}>
        Add Content Block
      </div>

      {error && (
        <div style={{ padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, marginBottom: '0.75rem', fontSize: '0.78rem', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Type selector */}
      <Field label="Block Type">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {BLOCK_TYPES.map(bt => (
            <button
              key={bt.value}
              type="button"
              onClick={() => setType(bt.value)}
              title={bt.desc}
              style={{
                padding: '0.3rem 0.65rem', borderRadius: 6, fontSize: '0.75rem',
                fontWeight: type === bt.value ? 700 : 400,
                border: `1px solid ${type === bt.value ? (TYPE_COLOR[bt.value] || '#6366f1') : '#e5e7eb'}`,
                background: type === bt.value ? `${TYPE_COLOR[bt.value] || '#6366f1'}15` : '#fff',
                color: type === bt.value ? (TYPE_COLOR[bt.value] || '#6366f1') : '#374151',
                cursor: 'pointer',
              }}
            >
              {bt.label}
            </button>
          ))}
        </div>
      </Field>

      {/* TEXT fields */}
      {type === 'TEXT' && (
        <>
          <Field label="Text (English)">
            <textarea
              value={textEn}
              onChange={e => setTextEn(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.82rem', resize: 'vertical' }}
              placeholder="English content…"
            />
          </Field>
          <Field label="Text (Arabic)">
            <textarea
              value={textAr}
              onChange={e => setTextAr(e.target.value)}
              rows={3}
              dir="rtl"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.82rem', resize: 'vertical' }}
              placeholder="المحتوى بالعربية…"
            />
          </Field>
        </>
      )}

      {/* PROMO: direct ID entry (promos are store-scoped, hard to search globally) */}
      {type === 'PROMO' && (
        <div>
          <Field label="Bank Offer / Promo ID" hint="Enter the numeric ID from the Other Promos tab of any store">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                value={promoId}
                onChange={e => setPromoId(e.target.value)}
                placeholder="e.g. 42"
                style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.82rem' }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!promoId) return;
                  try {
                    const res  = await fetch(`/api/admin/promos/${promoId}/calculator`);
                    const data = res.ok ? await res.json() : null;
                    if (data) {
                      setSelected({
                        id: data.id,
                        label: data.translations?.[0]?.title || `Promo #${data.id}`,
                        sublabel: data.type || '',
                      });
                    } else {
                      setError(`Promo #${promoId} not found`);
                    }
                  } catch {
                    setError('Failed to look up promo');
                  }
                }}
                style={{ padding: '0.4rem 0.75rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Look up
              </button>
            </div>
          </Field>
          {selected && (
            <div style={{ padding: '0.5rem 0.75rem', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 4, fontSize: '0.78rem', color: '#4c1d95' }}>
              ✓ {selected.label} <span style={{ opacity: 0.7 }}>— {selected.sublabel}</span>
            </div>
          )}
        </div>
      )}

      {/* VOUCHER: direct ID entry OR search */}
      {type === 'VOUCHER' && (
        <div>
          <Field label="Search Vouchers" hint="Search by title or code">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search vouchers…"
              style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.82rem' }}
            />
            {searching && <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.25rem' }}>Searching…</div>}
            {results.length > 0 && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, maxHeight: 200, overflowY: 'auto', background: '#fff', marginTop: '0.25rem' }}>
                {results.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setSelected(r); setQuery(''); setResults([]); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    <div style={{ fontWeight: 600 }}>{r.label}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>{r.sublabel}</div>
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label="— or enter Voucher ID directly —">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                placeholder="Voucher ID"
                style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.82rem' }}
                onBlur={async e => {
                  const vid = e.target.value;
                  if (!vid) return;
                  const res  = await fetch(`/api/admin/vouchers/${vid}/calculator`);
                  const data = res.ok ? await res.json() : null;
                  if (data) setSelected({ id: data.id, label: data.translations?.[0]?.title || `Voucher #${data.id}`, sublabel: data.type || '' });
                }}
              />
            </div>
          </Field>
          {selected && (
            <div style={{ padding: '0.5rem 0.75rem', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 4, fontSize: '0.78rem', color: '#4c1d95', marginTop: '0.25rem' }}>
              ✓ {selected.label} <span style={{ opacity: 0.7 }}>— {selected.sublabel}</span>
            </div>
          )}
        </div>
      )}

      {/* All other searchable types */}
      {!['TEXT', 'VOUCHER', 'PROMO', 'CARD', 'TABLE'].includes(type) && (
        <div>
          <Field label={`Search ${type.toLowerCase()}s`}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${type.toLowerCase()}s…`}
              style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.82rem' }}
            />
            {searching && <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.25rem' }}>Searching…</div>}
            {results.length > 0 && !selected && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, maxHeight: 200, overflowY: 'auto', background: '#fff', marginTop: '0.25rem' }}>
                {results.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setSelected(r); setQuery(''); setResults([]); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    <div style={{ fontWeight: 600 }}>{r.label}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>{r.sublabel}</div>
                  </button>
                ))}
              </div>
            )}
          </Field>
          {selected && (
            <div style={{ padding: '0.5rem 0.75rem', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 4, fontSize: '0.78rem', color: '#4c1d95' }}>
              ✓ {selected.label}
              <button type="button" onClick={() => setSelected(null)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed' }}>✕ clear</button>
            </div>
          )}
        </div>
      )}

      {/* CARD and TABLE: direct ID entry */}
      {(type === 'CARD' || type === 'TABLE') && (
        <Field label={`${type === 'CARD' ? 'Card' : 'Table'} ID`} hint={`Enter the numeric ID`}>
          <input
            type="number"
            placeholder="ID…"
            style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.82rem' }}
            onChange={e => {
              const v = e.target.value;
              setSelected(v ? { id: parseInt(v), label: `${type} #${v}`, sublabel: '' } : null);
            }}
          />
        </Field>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '0.45rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Adding…' : 'Add Block'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '0.45rem 0.75rem', background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single block row
// ─────────────────────────────────────────────────────────────────────────────

function BlockRow({ block, onDelete }) {
  const color = TYPE_COLOR[block.type] || '#6b7280';

  function getLabel() {
    switch (block.type) {
      case 'TEXT':
        return block.textEn ? block.textEn.slice(0, 60) + (block.textEn.length > 60 ? '…' : '') : '(empty text)';
      case 'VOUCHER': {
        const t = block.voucher?.translations?.[0];
        const store = block.voucher?.store?.translations?.[0]?.name;
        return `${t?.title || `Voucher #${block.voucherId}`}${store ? ` · ${store}` : ''}`;
      }
      case 'PROMO': {
        const t = block.promo?.translations?.[0];
        const store = block.promo?.store?.translations?.[0]?.name;
        const bank  = block.promo?.bank?.translations?.[0]?.name;
        return `${t?.title || `Promo #${block.promoId}`}${bank ? ` · ${bank}` : ''}${store ? ` · ${store}` : ''}`;
      }
      case 'STORE':
        return block.store?.translations?.[0]?.name || `Store #${block.storeId}`;
      case 'PRODUCT':
        return block.product?.translations?.[0]?.title || `Product #${block.productId}`;
      case 'POST':
        return block.post?.translations?.[0]?.title || `Post #${block.postId}`;
      case 'TABLE':
        return block.table?.translations?.[0]?.title || `Table #${block.tableId}`;
      case 'BANK':
        return block.bank?.translations?.[0]?.name || `Bank #${block.bankId}`;
      case 'CARD':
        return block.card?.translations?.[0]?.name || `Card #${block.cardId}`;
      default:
        return `#${block.id}`;
    }
  }

  const typeInfo = BLOCK_TYPES.find(b => b.value === block.type);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: '0.375rem' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: `${color}15`, color, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {typeInfo?.label || block.type}
      </span>
      <span style={{ fontSize: '0.78rem', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {getLabel()}
      </span>
      <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontFamily: 'monospace', flexShrink: 0 }}>
        #{block.id}
      </span>
      <button
        type="button"
        onClick={() => onDelete(block.id)}
        style={{ flexShrink: 0, padding: '0.2rem 0.5rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, fontSize: '0.72rem', cursor: 'pointer' }}
      >
        Remove
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function SectionBlocksEditor({ postId, sectionId }) {
  const [blocks,   setBlocks]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/sections/${sectionId}/blocks`);
      const data = res.ok ? await res.json() : [];
      setBlocks(Array.isArray(data) ? data : []);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(blockId) {
    if (!confirm('Remove this block?')) return;
    await fetch(`/api/admin/sections/${sectionId}/blocks/${blockId}`, { method: 'DELETE' });
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  }

  return (
    <div>
      {loading ? (
        <div style={{ fontSize: '0.78rem', color: '#9ca3af', padding: '0.5rem 0' }}>Loading blocks…</div>
      ) : (
        <>
          {blocks.length === 0 && !adding && (
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', padding: '0.5rem 0', marginBottom: '0.5rem' }}>
              No blocks yet — blocks render in order above the section's legacy product/store lists.
            </div>
          )}
          {blocks.map(block => (
            <BlockRow key={block.id} block={block} onDelete={handleDelete} />
          ))}
        </>
      )}

      {adding ? (
        <AddBlockForm
          sectionId={sectionId}
          onAdded={(block) => { setBlocks(prev => [...prev, block]); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{ padding: '0.35rem 0.75rem', background: '#fff', color: '#4f46e5', border: '1px dashed #c4b5fd', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.25rem' }}
        >
          + Add Block
        </button>
      )}
    </div>
  );
}
