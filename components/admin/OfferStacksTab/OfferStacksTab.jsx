'use client';
// components/admin/OfferStacksTab/OfferStacksTab.jsx
//
// Drop-in for app/admin/stores/[id]/page.jsx:
//   import OfferStacksTab from '@/components/admin/OfferStacksTab/OfferStacksTab';
//   {tab === 'offer-stacks' && (
//     <OfferStacksTab storeId={store.id} />
//   )}
//
// Also add tab entry in page.jsx tabs array:
//   { id: 'offer-stacks', label: 'Offer Stacks' }

import { useState, useEffect, useCallback } from 'react';

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  wrap:    { padding: '1.25rem' },
  section: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', marginBottom: '1.25rem' },
  row2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' },
  label:   { display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#374151', marginBottom: 3 },
  inp:     { padding: '0.42rem 0.6rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.82rem', background: '#fff', width: '100%', boxSizing: 'border-box' },
  badge:   (color) => ({ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: color === 'indigo' ? '#eef2ff' : color === 'green' ? '#f0fdf4' : '#fefce8', color: color === 'indigo' ? '#4338ca' : color === 'green' ? '#15803d' : '#a16207', border: `1px solid ${color === 'indigo' ? '#e0e7ff' : color === 'green' ? '#dcfce7' : '#fef08a'}` }),
  btn:     (variant) => ({ padding: '0.4rem 1rem', borderRadius: 7, border: variant === 'ghost' ? '1px solid #e2e8f0' : 'none', background: variant === 'primary' ? '#0f172a' : variant === 'danger' ? '#fef2f2' : '#f8fafc', color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#dc2626' : '#374151', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }),
};

// ── helpers ───────────────────────────────────────────────────────────────────
const vTitle = v => v?.translations?.[0]?.title || `#${v?.id}`;
const pTitle = p => p?.translations?.[0]?.title || `#${p?.id}`;
const pct    = v => {
  const n = v?.verifiedAvgPercent ?? v?.discountPercent;
  return n != null ? `${n}%` : v?.discount || '';
};

function Slot({ label, color, icon, value, options, onChange, placeholder }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
        <span className="material-symbols-sharp" style={{ fontSize: '0.9rem', color: color === 'indigo' ? '#4338ca' : color === 'green' ? '#15803d' : '#a16207' }}>{icon}</span>
        <span style={s.badge(color)}>{label}</span>
      </div>
      <select style={s.inp} value={value || ''} onChange={e => onChange(e.target.value || null)}>
        <option value="">— {placeholder} —</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>
            {o.label} {o.pct ? `· ${o.pct}` : ''} {o.code ? `· "${o.code}"` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── StackForm — create or edit ────────────────────────────────────────────────
function StackForm({ initial, codeOptions, dealOptions, promoOptions, onSave, onCancel, saving, title }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filledCount = [form.codeVoucherId, form.dealVoucherId, form.promoId].filter(Boolean).length;
  const valid = filledCount >= 2;

  return (
    <div style={s.section}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '1rem' }}>{title}</div>

      {/* Label + order + active */}
      <div style={s.row2}>
        <div>
          <label style={s.label}>Stack Label <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
          <input style={s.inp} value={form.label || ''} onChange={e => set('label', e.target.value)} placeholder="e.g. Ramadan Deal" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label style={s.label}>Order</label>
            <input type="number" style={s.inp} value={form.order ?? 0} onChange={e => set('order', e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Active</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <input type="checkbox" id="stackActive" checked={!!form.isActive} onChange={e => set('isActive', e.target.checked)} />
              <label htmlFor="stackActive" style={{ fontSize: '0.82rem', color: '#374151' }}>Active</label>
            </div>
          </div>
        </div>
      </div>

      {/* Item slots */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <Slot
          label="Coupon Code" color="indigo" icon="confirmation_number" placeholder="No code"
          value={form.codeVoucherId} options={codeOptions}
          onChange={v => set('codeVoucherId', v)}
        />
        <Slot
          label="Deal" color="green" icon="local_fire_department" placeholder="No deal"
          value={form.dealVoucherId} options={dealOptions}
          onChange={v => set('dealVoucherId', v)}
        />
        <Slot
          label="Bank Offer" color="amber" icon="account_balance" placeholder="No bank offer"
          value={form.promoId} options={promoOptions}
          onChange={v => set('promoId', v)}
        />
      </div>

      {!valid && (
        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '0.75rem' }}>
          ⚠ Select at least 2 items to form a valid stack.
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {onCancel && <button style={s.btn('ghost')} onClick={onCancel}>Cancel</button>}
        <button style={{ ...s.btn('primary'), opacity: (!valid || saving) ? 0.5 : 1, cursor: (!valid || saving) ? 'not-allowed' : 'pointer' }}
          onClick={() => valid && !saving && onSave(form)} disabled={!valid || saving}>
          {saving ? 'Saving…' : 'Save Stack'}
        </button>
      </div>
    </div>
  );
}

// ── StackCard — read-only row with Edit / Delete ──────────────────────────────
function StackCard({ stack, onEdit, onDelete }) {
  const items = [
    stack.codeVoucher && { type: 'CODE',       color: 'indigo', icon: 'confirmation_number', title: vTitle(stack.codeVoucher), pct: pct(stack.codeVoucher), code: stack.codeVoucher.code },
    stack.dealVoucher && { type: 'DEAL',       color: 'green',  icon: 'local_fire_department', title: vTitle(stack.dealVoucher), pct: pct(stack.dealVoucher) },
    stack.promo       && { type: 'BANK_OFFER', color: 'amber',  icon: 'account_balance', title: pTitle(stack.promo), pct: pct(stack.promo), bank: stack.promo.bank?.translations?.[0]?.name },
  ].filter(Boolean);

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {stack.label && <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{stack.label}</span>}
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: stack.isActive ? '#dcfce7' : '#fee2e2', color: stack.isActive ? '#166534' : '#991b1b' }}>
            {stack.isActive ? 'Active' : 'Inactive'}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Order: {stack.order}</span>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '0.3rem 0.6rem' }}>
              <span className="material-symbols-sharp" style={{ fontSize: '0.8rem', color: item.color === 'indigo' ? '#4338ca' : item.color === 'green' ? '#15803d' : '#a16207' }}>{item.icon}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
              {item.pct && <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.pct}</span>}
              {item.code && <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#ede9fe', color: '#5b21b6', padding: '1px 5px', borderRadius: 3 }}>{item.code}</span>}
              {item.bank && <span style={{ fontSize: '0.65rem', color: '#a16207' }}>({item.bank})</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
        <button style={s.btn('ghost')} onClick={onEdit}>Edit</button>
        <button style={s.btn('danger')} onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const EMPTY = { label: '', codeVoucherId: null, dealVoucherId: null, promoId: null, isActive: true, order: 0 };

export default function OfferStacksTab({ storeId }) {
  const [stacks,       setStacks]       = useState([]);
  const [codeVouchers, setCodeVouchers] = useState([]);
  const [dealVouchers, setDealVouchers] = useState([]);
  const [promos,       setPromos]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [editInit,     setEditInit]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');

  const loadStacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/stacks`);
      if (!res.ok) throw new Error(`${res.status}`);
      setStacks((await res.json()).stacks || []);
    } catch (e) { setError(`Failed to load stacks: ${e.message}`); }
    setLoading(false);
  }, [storeId]);

  // Load vouchers + promos for dropdowns
  useEffect(() => {
    async function loadOptions() {
      const now = new Date().toISOString();
      const [vRes, pRes] = await Promise.all([
        fetch(`/api/admin/stores/${storeId}/vouchers-calc?limit=200`),
        fetch(`/api/admin/stores/${storeId}/promos-calc`),
      ]);

      if (vRes.ok) {
        const { data } = await vRes.json();
        setCodeVouchers((data || []).filter(v => v.stackGroup === 'CODE').map(v => ({
          id: v.id, label: vTitle(v), pct: pct(v), code: v.code,
        })));
        setDealVouchers((data || []).filter(v => v.stackGroup === 'DEAL').map(v => ({
          id: v.id, label: vTitle(v), pct: pct(v),
        })));
      }
      if (pRes.ok) {
        const { data } = await pRes.json();
        setPromos((data || []).filter(p => p.stackGroup === 'BANK_OFFER').map(p => ({
          id: p.id, label: pTitle(p), pct: pct(p),
        })));
      }
    }
    loadOptions();
    loadStacks();
  }, [storeId, loadStacks]);

  async function handleCreate(form) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/stacks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || `${res.status}`);
      setShowCreate(false);
      await loadStacks();
    } catch (e) { alert(`Create failed: ${e.message}`); }
    setSaving(false);
  }

  async function handleEdit(form) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/stacks/${editId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || `${res.status}`);
      setEditId(null); setEditInit(null);
      await loadStacks();
    } catch (e) { alert(`Save failed: ${e.message}`); }
    setSaving(false);
  }

  async function handleDelete(stack) {
    const label = stack.label || `Stack #${stack.id}`;
    if (!confirm(`Delete "${label}"?`)) return;
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/stacks/${stack.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || `${res.status}`);
      await loadStacks();
    } catch (e) { alert(`Delete failed: ${e.message}`); }
  }

  function openEdit(stack) {
    setEditInit({
      label:         stack.label         || '',
      codeVoucherId: stack.codeVoucherId || null,
      dealVoucherId: stack.dealVoucherId || null,
      promoId:       stack.promoId       || null,
      isActive:      stack.isActive,
      order:         stack.order ?? 0,
    });
    setEditId(stack.id);
    setShowCreate(false);
  }

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>Offer Stacks</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
            Each stack combines up to 3 stackable offers. Users are guided step-by-step on how to apply them.
          </div>
        </div>
        {!showCreate && !editId && (
          <button style={s.btn('primary')} onClick={() => setShowCreate(true)}>+ New Stack</button>
        )}
      </div>

      {showCreate && (
        <StackForm
          title="Create Stack"
          initial={EMPTY}
          codeOptions={codeVouchers}
          dealOptions={dealVouchers}
          promoOptions={promos}
          saving={saving}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading stacks…</div>
      ) : stacks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem', border: '1px dashed #e2e8f0', borderRadius: 10 }}>
          No stacks yet. Click <strong>+ New Stack</strong> to build one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {stacks.map(stack => (
            <div key={stack.id}>
              {editId === stack.id && editInit ? (
                <StackForm
                  title={`Edit: ${stack.label || `Stack #${stack.id}`}`}
                  initial={editInit}
                  codeOptions={codeVouchers}
                  dealOptions={dealVouchers}
                  promoOptions={promos}
                  saving={saving}
                  onSave={handleEdit}
                  onCancel={() => { setEditId(null); setEditInit(null); }}
                />
              ) : (
                <StackCard stack={stack} onEdit={() => openEdit(stack)} onDelete={() => handleDelete(stack)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
