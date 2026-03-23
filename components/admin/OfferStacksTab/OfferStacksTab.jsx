'use client';
// components/admin/OfferStacksTab/OfferStacksTab.jsx
// Per-store offer stack management using the OfferStack model.
// Each stack explicitly links: one CODE voucher + one DEAL voucher + one OtherPromo (any combination ≥ 2).

import { useState, useEffect, useCallback } from 'react';
import styles from '@/app/admin/admin.module.css';

const TYPE_STYLE = {
  CODE:       { bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.3)',  color: '#818cf8', icon: 'confirmation_number' },
  DEAL:       { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  color: '#34d399', icon: 'local_fire_department' },
  BANK_OFFER: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: '#fbbf24', icon: 'account_balance' },
};

const BLANK_FORM = {
  label:         '',
  codeVoucherId: '',
  dealVoucherId: '',
  promoId:       '',
  isActive:      true,
  order:         0,
};

// ── Offer chip ─────────────────────────────────────────────────────────────────
function OfferChip({ type, title, subtitle, code }) {
  const s = TYPE_STYLE[type] || TYPE_STYLE.DEAL;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 3,
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 8, padding: '0.4rem 0.65rem',
      minWidth: 90, maxWidth: 180,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="material-symbols-sharp" style={{ fontSize: '0.7rem', color: s.color }}>{s.icon}</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {type?.replace('_', ' ')}
        </span>
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ap-text-primary)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title || '—'}
      </span>
      {subtitle && (
        <span style={{ fontSize: '0.7rem', color: s.color }}>{subtitle}</span>
      )}
      {code && (
        <code style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.12)', padding: '1px 5px', borderRadius: 3, color: 'var(--ap-text-primary)', letterSpacing: '0.04em' }}>
          {code}
        </code>
      )}
    </div>
  );
}

// ── Stack card ────────────────────────────────────────────────────────────────
function StackCard({ stack, onEdit, onDelete, onToggle, saving }) {
  const items = [];

  if (stack.codeVoucher) {
    const t = stack.codeVoucher.translations?.[0];
    items.push({ type: 'CODE', title: t?.title || stack.codeVoucher.discount || '—', subtitle: stack.codeVoucher.discount, code: stack.codeVoucher.code });
  }
  if (stack.dealVoucher) {
    const t = stack.dealVoucher.translations?.[0];
    items.push({ type: 'DEAL', title: t?.title || stack.dealVoucher.discount || '—', subtitle: stack.dealVoucher.discount });
  }
  if (stack.promo) {
    const t = stack.promo.translations?.[0];
    const bankName = stack.promo.bank?.translations?.[0]?.name;
    items.push({ type: 'BANK_OFFER', title: t?.title || bankName || '—' });
  }

  return (
    <div style={{
      background: 'var(--ap-surface)',
      border: `1px solid ${stack.isActive ? 'var(--ap-border)' : 'var(--ap-border-light)'}`,
      borderRadius: 'var(--ap-radius)',
      overflow: 'hidden',
      opacity: stack.isActive ? 1 : 0.55,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.65rem 1rem', borderBottom: '1px solid var(--ap-border-light)',
        background: 'var(--ap-surface-2)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {stack.label ? (
            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ap-text-primary)' }}>{stack.label}</span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>Stack #{stack.id}</span>
          )}
        </div>
        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--ap-mono)', color: 'var(--ap-text-muted)' }}>order: {stack.order}</span>
        <span className={`${styles.badge} ${stack.isActive ? styles.badgeSuccess : styles.badgeMuted}`}>
          {stack.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Offer chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {idx > 0 && <span style={{ color: 'var(--ap-text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>+</span>}
            <OfferChip {...item} />
          </div>
        ))}
        {items.length === 0 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--ap-text-muted)' }}>No offers linked</span>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem',
        borderTop: '1px solid var(--ap-border-light)', background: 'var(--ap-surface-2)',
      }}>
        <button
          className={styles.btnEdit}
          onClick={() => onEdit(stack)}
          disabled={saving}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(stack)}
          disabled={saving}
          style={{
            fontSize: '0.75rem', padding: '0.25rem 0.65rem',
            borderRadius: 'var(--admin-radius-sm)',
            border: '1px solid var(--ap-border)', background: 'transparent',
            color: 'var(--ap-text-secondary)', cursor: 'pointer',
          }}
        >
          {stack.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          className={styles.btnDelete}
          onClick={() => onDelete(stack.id)}
          disabled={saving}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', marginLeft: 'auto' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OfferStacksTab({ storeId }) {
  const [stacks,   setStacks]   = useState([]);
  const [vouchers, setVouchers] = useState([]);   // all CODE + DEAL vouchers for this store
  const [promos,   setPromos]   = useState([]);   // all active OtherPromos for this store
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(BLANK_FORM);
  const [error,    setError]    = useState('');

  // ── Load stacks, vouchers, promos ──────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stacksRes, vouchersRes, promosRes] = await Promise.all([
        fetch(`/api/admin/stores/${storeId}/stacks`),
        fetch(`/api/admin/stores/${storeId}/vouchers-calc?limit=200&expired=false`),
        fetch(`/api/admin/stores/${storeId}/promos-calc`),
      ]);

      if (stacksRes.ok) {
        const d = await stacksRes.json();
        setStacks(d.stacks || []);
      }
      if (vouchersRes.ok) {
        const d = await vouchersRes.json();
        setVouchers(d.data || []);
      }
      if (promosRes.ok) {
        const d = await promosRes.json();
        setPromos(d.data || []);
      }
    } catch (e) {
      console.error('[OfferStacksTab] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filledCount = [form.codeVoucherId, form.dealVoucherId, form.promoId].filter(Boolean).length;

  function openNew() {
    setEditing(null);
    setForm(BLANK_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(stack) {
    setEditing(stack);
    setForm({
      label:         stack.label         || '',
      codeVoucherId: stack.codeVoucherId ? String(stack.codeVoucherId) : '',
      dealVoucherId: stack.dealVoucherId ? String(stack.dealVoucherId) : '',
      promoId:       stack.promoId       ? String(stack.promoId)       : '',
      isActive:      stack.isActive      ?? true,
      order:         stack.order         ?? 0,
    });
    setError('');
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditing(null);
    setForm(BLANK_FORM);
    setError('');
  }

  async function handleSave() {
    if (filledCount < 2) {
      setError('Select at least 2 offers to form a stack.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        label:         form.label         || null,
        codeVoucherId: form.codeVoucherId  ? parseInt(form.codeVoucherId)  : null,
        dealVoucherId: form.dealVoucherId  ? parseInt(form.dealVoucherId)  : null,
        promoId:       form.promoId        ? parseInt(form.promoId)        : null,
        isActive:      form.isActive,
        order:         parseInt(form.order) || 0,
      };

      const url    = editing ? `/api/admin/stores/${storeId}/stacks/${editing.id}` : `/api/admin/stores/${storeId}/stacks`;
      const method = editing ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to save');
        return;
      }
      await load();
      cancelForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this stack?')) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/stores/${storeId}/stacks/${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(stack) {
    setSaving(true);
    try {
      await fetch(`/api/admin/stores/${storeId}/stacks/${stack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !stack.isActive }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  // ── Filter options ─────────────────────────────────────────────────────────
  const codeVouchers = vouchers.filter(v => v.stackGroup === 'CODE' || v.type === 'CODE');
  const dealVouchers = vouchers.filter(v => v.stackGroup === 'DEAL' || v.type === 'DEAL');

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <div style={{ padding: '2rem', color: 'var(--ap-text-muted)' }}>Loading stacks…</div>;

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.sectionHeader} style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Offer Stacks ({stacks.length})</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--ap-text-muted)' }}>
            Combine a code voucher, deal, or bank offer into a stack shown on the store page.
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={showForm ? cancelForm : openNew} disabled={saving}>
          {showForm ? '✕ Cancel' : '+ New Stack'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className={styles.formSection} style={{ marginBottom: '1.5rem', border: '1px solid var(--admin-primary)', borderRadius: 8 }}>
          <h3 className={styles.formSectionTitle}>{editing ? `Edit Stack #${editing.id}` : 'New Offer Stack'}</h3>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Stack Label (optional)</label>
              <input className={styles.formInput} value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. Best combo for electronics" />
            </div>
            <div className={styles.formGroup}>
              <label>Display Order</label>
              <input type="number" className={styles.formInput} value={form.order} onChange={e => set('order', e.target.value)} min="0" />
            </div>
          </div>

          {/* Offer selectors */}
          <div className={styles.formRow}>
            {/* CODE voucher */}
            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-sharp" style={{ fontSize: '0.9rem', color: '#818cf8' }}>confirmation_number</span>
                Code Voucher
              </label>
              <select className={styles.formSelect} value={form.codeVoucherId} onChange={e => set('codeVoucherId', e.target.value)}>
                <option value="">— None —</option>
                {codeVouchers.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.translations?.[0]?.title || v.discount || `Voucher #${v.id}`}
                    {v.code ? ` (${v.code})` : ''}
                    {v.discountPercent ? ` · ${v.discountPercent}%` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* DEAL voucher */}
            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-sharp" style={{ fontSize: '0.9rem', color: '#34d399' }}>local_fire_department</span>
                Deal Voucher
              </label>
              <select className={styles.formSelect} value={form.dealVoucherId} onChange={e => set('dealVoucherId', e.target.value)}>
                <option value="">— None —</option>
                {dealVouchers.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.translations?.[0]?.title || v.discount || `Voucher #${v.id}`}
                    {v.discountPercent ? ` · ${v.discountPercent}%` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank/card promo */}
            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-sharp" style={{ fontSize: '0.9rem', color: '#fbbf24' }}>account_balance</span>
                Bank / Card Offer
              </label>
              <select className={styles.formSelect} value={form.promoId} onChange={e => set('promoId', e.target.value)}>
                <option value="">— None —</option>
                {promos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.translations?.[0]?.title || `Promo #${p.id}`}
                    {p.discountPercent ? ` · ${p.discountPercent}%` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation hint */}
          <p style={{ fontSize: '0.75rem', color: filledCount >= 2 ? '#16a34a' : '#f59e0b', marginBottom: '0.5rem' }}>
            {filledCount >= 2
              ? `✓ ${filledCount} offers selected — ready to save`
              : `Select at least 2 offers (${filledCount}/2 selected)`}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className={styles.btnPrimary} onClick={handleSave} disabled={saving || filledCount < 2}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Stack'}
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
              Active
            </label>
            <button className={styles.btnSecondary} onClick={cancelForm} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {stacks.length === 0 && !showForm && (
        <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed var(--ap-border)', borderRadius: 8, color: 'var(--ap-text-muted)' }}>
          <span className="material-symbols-sharp" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>layers</span>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>No stacks yet. Create one to combine offers for this store.</p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem' }}>Tip: set vouchers as stackable on the <strong>Offers</strong> page first.</p>
        </div>
      )}

      {/* Stack grid */}
      {stacks.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {stacks
            .sort((a, b) => a.order - b.order)
            .map(stack => (
              <StackCard
                key={stack.id}
                stack={stack}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                saving={saving}
              />
            ))
          }
        </div>
      )}
    </div>
  );
}
