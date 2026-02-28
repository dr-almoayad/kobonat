'use client';
// app/admin/stores/[id]/offers/page.jsx
// Inline editor for calculator fields on every voucher and OtherPromo.
// Two tabs: Vouchers / Bank & Card Offers.
// Inline row editing — click a cell to change certainty, stack group, cap, verified avg.

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import '@/components/admin/admin-panel.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CERTAINTY_OPTIONS = [
  { value: 'EXACT',     label: 'EXACT',      help: 'Contractual — applies universally' },
  { value: 'VERIFIED',  label: 'VERIFIED',   help: 'Admin verified real product prices' },
  { value: 'TYPICAL',   label: 'TYPICAL',    help: 'Admin-estimated reasonable figure' },
  { value: 'ESTIMATED', label: 'ESTIMATED',  help: '"Up to X%" marketing headline' },
  { value: 'UNKNOWN',   label: 'UNKNOWN',    help: 'No reliable number — excluded' },
];

const VOUCHER_STACK_GROUPS = [
  { value: 'DEAL',       label: 'DEAL',        help: 'Auto-applied site-wide discount' },
  { value: 'CODE',       label: 'CODE',        help: 'Requires entering a coupon code' },
  { value: 'CASHBACK',   label: 'CASHBACK',    help: 'Post-purchase — excluded from % calc' },
  { value: 'BUNDLE',     label: 'BUNDLE',      help: 'Buy X get Y — excluded from % calc' },
];

const PROMO_STACK_GROUPS = [
  { value: 'BANK_OFFER', label: 'BANK_OFFER',  help: 'Bank / card / payment method offer' },
  { value: 'CASHBACK',   label: 'CASHBACK',    help: 'Post-purchase — excluded from % calc' },
];

const CERTAINTY_COLOR = {
  EXACT:     'green',
  VERIFIED:  'green',
  TYPICAL:   'blue',
  ESTIMATED: 'amber',
  UNKNOWN:   'muted',
};

const MULTIPLIERS = { EXACT: 1.0, VERIFIED: 1.0, TYPICAL: 0.8, ESTIMATED: 0.35, UNKNOWN: 0 };

// ─────────────────────────────────────────────────────────────────────────────
// Effective % preview
// ─────────────────────────────────────────────────────────────────────────────

function EffectivePct({ discountPercent, verifiedAvgPercent, discountCertainty }) {
  if (verifiedAvgPercent) {
    return <span style={{ fontFamily: 'var(--ap-mono)', color: 'var(--ap-green)', fontWeight: 700 }}>{verifiedAvgPercent}%<sup style={{ fontSize: '0.6rem', marginLeft: '2px' }}>✓</sup></span>;
  }
  if (!discountPercent || discountCertainty === 'UNKNOWN') {
    return <span style={{ color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>—</span>;
  }
  const eff = (discountPercent * (MULTIPLIERS[discountCertainty] ?? 1)).toFixed(1);
  return (
    <span style={{ fontFamily: 'var(--ap-mono)', color: discountCertainty === 'ESTIMATED' ? 'var(--ap-amber)' : 'var(--ap-text-primary)' }}>
      {eff}%
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline field editors
// ─────────────────────────────────────────────────────────────────────────────

function InlineSelect({ value, options, onSave, disabled }) {
  const [editing, setEditing] = useState(false);
  const [local,   setLocal]   = useState(value);

  function handleChange(e) {
    setLocal(e.target.value);
    onSave(e.target.value);
    setEditing(false);
  }

  if (editing) {
    return (
      <select className="ap-select" style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: 'auto' }}
        autoFocus value={local} onChange={handleChange} onBlur={() => setEditing(false)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  return (
    <button
      onClick={() => !disabled && setEditing(true)}
      style={{ background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer', padding: 0 }}
      title={options.find((o) => o.value === value)?.help}
    >
      <span className={`ap-badge ap-badge--${CERTAINTY_COLOR[value] ?? 'muted'}`}>{value}</span>
    </button>
  );
}

function InlineNumber({ value, onSave, placeholder = '—', suffix = '' }) {
  const [editing, setEditing] = useState(false);
  const [local,   setLocal]   = useState(value ?? '');

  function handleBlur() {
    const num = local === '' ? null : Number(local);
    onSave(num);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus type="number" step="0.1" min="0"
        className="ap-input"
        style={{ width: '90px', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') handleBlur(); if (e.key === 'Escape') setEditing(false); }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ap-mono)', fontSize: '0.78rem', color: value != null ? 'var(--ap-text-primary)' : 'var(--ap-text-muted)', padding: 0 }}
    >
      {value != null ? `${value}${suffix}` : placeholder}
    </button>
  );
}

function InlineToggle({ value, onSave }) {
  return (
    <button
      onClick={() => onSave(!value)}
      className={`ap-badge ${value ? 'ap-badge--green' : 'ap-badge--muted'}`}
      style={{ cursor: 'pointer', border: 'none' }}
    >
      {value ? 'Yes' : 'No'}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single row — handles its own save debouncing
// ─────────────────────────────────────────────────────────────────────────────

function VoucherRow({ voucher: initial, flash }) {
  const [v,       setV]       = useState(initial);
  const [saving,  setSaving]  = useState(false);

  async function patch(fields) {
    const optimistic = { ...v, ...fields };
    setV(optimistic);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/vouchers/${v.id}/calculator`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(fields),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setV(await res.json());
    } catch (e) {
      setV(initial); // rollback
      flash('error', `Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  const isExpired = v.expiryDate && new Date(v.expiryDate) < new Date();

  return (
    <tr style={{ opacity: isExpired ? 0.5 : 1 }}>
      <td>
        <div>
          <div style={{ fontWeight: 500, fontSize: '0.82rem' }}>
            {v.translations?.[0]?.title ?? '—'}
          </div>
          {v.code && (
            <code style={{ fontSize: '0.7rem', background: 'var(--ap-surface-2)', padding: '1px 5px', borderRadius: '3px', color: 'var(--ap-accent-hover)', border: '1px solid var(--ap-border)' }}>
              {v.code}
            </code>
          )}
        </div>
      </td>
      <td>
        <span className="ap-badge ap-badge--muted">{v.type}</span>
        {isExpired && <span className="ap-badge ap-badge--red" style={{ marginLeft: '4px' }}>EXP</span>}
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--ap-text-secondary)' }}>{v.discount ?? '—'}</span>
          <InlineNumber
            value={v.discountPercent}
            suffix="%"
            placeholder="Set %"
            onSave={(val) => patch({ discountPercent: val })}
          />
        </div>
      </td>
      <td>
        <InlineNumber
          value={v.verifiedAvgPercent}
          suffix="%"
          placeholder="Set verified avg"
          onSave={(val) => patch({ verifiedAvgPercent: val })}
        />
      </td>
      <td>
        <InlineSelect
          value={v.discountCertainty}
          options={CERTAINTY_OPTIONS}
          onSave={(val) => patch({ discountCertainty: val })}
        />
      </td>
      <td>
        <EffectivePct
          discountPercent={v.discountPercent}
          verifiedAvgPercent={v.verifiedAvgPercent}
          discountCertainty={v.discountCertainty}
        />
      </td>
      <td>
        <InlineSelect
          value={v.stackGroup}
          options={VOUCHER_STACK_GROUPS}
          onSave={(val) => patch({ stackGroup: val })}
        />
      </td>
      <td>
        <InlineToggle value={v.isStackable} onSave={(val) => patch({ isStackable: val })} />
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <InlineToggle value={v.isCapped} onSave={(val) => patch({ isCapped: val })} />
          {v.isCapped && (
            <InlineNumber
              value={v.maxDiscountAmount}
              suffix=" SAR"
              placeholder="Max SAR"
              onSave={(val) => patch({ maxDiscountAmount: val })}
            />
          )}
        </div>
      </td>
      <td>
        <InlineNumber
          value={v.minSpendAmount}
          suffix=" SAR"
          placeholder="None"
          onSave={(val) => patch({ minSpendAmount: val })}
        />
      </td>
      <td>
        {saving && <span className="ap-spinner" />}
      </td>
    </tr>
  );
}

function PromoRow({ promo: initial, flash }) {
  const [p,      setP]      = useState(initial);
  const [saving, setSaving] = useState(false);

  async function patch(fields) {
    setP((prev) => ({ ...prev, ...fields }));
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/promos/${p.id}/calculator`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(fields),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setP(await res.json());
    } catch (e) {
      setP(initial);
      flash('error', `Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 500, fontSize: '0.82rem' }}>{p.translations?.[0]?.title ?? '—'}</div>
        <span className="ap-badge ap-badge--muted" style={{ marginTop: '2px' }}>{p.type}</span>
      </td>
      <td>
        <InlineNumber value={p.discountPercent} suffix="%" placeholder="Set %" onSave={(val) => patch({ discountPercent: val })} />
      </td>
      <td>
        <InlineNumber value={p.verifiedAvgPercent} suffix="%" placeholder="Set verified avg" onSave={(val) => patch({ verifiedAvgPercent: val })} />
      </td>
      <td>
        <InlineSelect value={p.discountCertainty} options={CERTAINTY_OPTIONS} onSave={(val) => patch({ discountCertainty: val })} />
      </td>
      <td>
        <EffectivePct discountPercent={p.discountPercent} verifiedAvgPercent={p.verifiedAvgPercent} discountCertainty={p.discountCertainty} />
      </td>
      <td>
        <InlineSelect value={p.stackGroup} options={PROMO_STACK_GROUPS} onSave={(val) => patch({ stackGroup: val })} />
      </td>
      <td>
        <InlineToggle value={p.isStackable} onSave={(val) => patch({ isStackable: val })} />
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <InlineToggle value={p.isCapped} onSave={(val) => patch({ isCapped: val })} />
          {p.isCapped && (
            <InlineNumber value={p.maxDiscountAmount} suffix=" SAR" placeholder="Max SAR" onSave={(val) => patch({ maxDiscountAmount: val })} />
          )}
        </div>
      </td>
      <td>
        <InlineNumber value={p.minSpendAmount} suffix=" SAR" placeholder="None" onSave={(val) => patch({ minSpendAmount: val })} />
      </td>
      <td>{saving && <span className="ap-spinner" />}</td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filters bar
// ─────────────────────────────────────────────────────────────────────────────

function FiltersBar({ filters, setFilters, isPromo }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--ap-border-light)', alignItems: 'flex-end' }}>
      <div className="ap-field" style={{ minWidth: '180px' }}>
        <label className="ap-label">Search</label>
        <input className="ap-input" placeholder="Title…" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))} />
      </div>
      <div className="ap-field">
        <label className="ap-label">Certainty</label>
        <select className="ap-select" value={filters.certainty} onChange={(e) => setFilters((f) => ({ ...f, certainty: e.target.value, page: 1 }))}>
          <option value="">All</option>
          {CERTAINTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {!isPromo && (
        <div className="ap-field">
          <label className="ap-label">Stack group</label>
          <select className="ap-select" value={filters.stackGroup} onChange={(e) => setFilters((f) => ({ ...f, stackGroup: e.target.value, page: 1 }))}>
            <option value="">All</option>
            {VOUCHER_STACK_GROUPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
      <label className="ap-checkbox-row" style={{ paddingBottom: '0.1rem' }}>
        <input type="checkbox" checked={filters.expired} onChange={(e) => setFilters((f) => ({ ...f, expired: e.target.checked, page: 1 }))} />
        <span className="ap-checkbox-label" style={{ fontSize: '0.78rem' }}>Include expired</span>
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vouchers tab
// ─────────────────────────────────────────────────────────────────────────────

function VouchersTab({ storeId, flash }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', certainty: '', stackGroup: '', expired: false, page: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: filters.page, limit: 50, ...(filters.search && { search: filters.search }), ...(filters.certainty && { certainty: filters.certainty }), ...(filters.stackGroup && { stackGroup: filters.stackGroup }), expired: filters.expired });
    const res = await fetch(`/api/admin/stores/${storeId}/vouchers-calc?${p}`);
    setData(await res.json());
    setLoading(false);
  }, [storeId, filters]);

  useEffect(() => { load(); }, [load]);

  const vouchers = data?.data ?? [];
  const meta     = data?.meta ?? {};

  // Counts for the warning banner
  const unknownCount   = vouchers.filter((v) => v.discountCertainty === 'UNKNOWN').length;
  const noPercentCount = vouchers.filter((v) => v.discountPercent == null && !['BUNDLE','CASHBACK'].includes(v.stackGroup)).length;

  return (
    <div>
      <FiltersBar filters={filters} setFilters={setFilters} isPromo={false} />

      {(unknownCount > 0 || noPercentCount > 0) && !loading && (
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--ap-border-light)' }}>
          {unknownCount > 0   && <div className="ap-alert ap-alert--warning" style={{ marginBottom: '0.5rem' }}>{unknownCount} vouchers are UNKNOWN certainty — excluded from calculator.</div>}
          {noPercentCount > 0 && <div className="ap-alert ap-alert--info">{noPercentCount} vouchers have no discountPercent set — will be excluded.</div>}
        </div>
      )}

      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              <th>Voucher</th>
              <th>Type</th>
              <th>Discount %</th>
              <th>Verified avg %</th>
              <th>Certainty</th>
              <th>Effective %</th>
              <th>Stack group</th>
              <th>Stackable</th>
              <th>Capped</th>
              <th>Min spend</th>
              <th style={{ width: '24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--ap-text-muted)' }}><span className="ap-spinner" /></td></tr>
            )}
            {!loading && vouchers.length === 0 && (
              <tr><td colSpan={11}><div className="ap-empty">No vouchers match these filters.</div></td></tr>
            )}
            {!loading && vouchers.map((v) => <VoucherRow key={v.id} voucher={v} flash={flash} />)}
          </tbody>
        </table>
      </div>

      {meta.pages > 1 && (
        <div style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--ap-border-light)' }}>
          <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} disabled={filters.page === 1}>← Prev</button>
          <span style={{ fontSize: '0.75rem', color: 'var(--ap-text-secondary)', fontFamily: 'var(--ap-mono)' }}>
            Page {filters.page} of {meta.pages} ({meta.total} vouchers)
          </span>
          <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} disabled={filters.page === meta.pages}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Promos tab — loads from existing other-promos API
// ─────────────────────────────────────────────────────────────────────────────

function PromosTab({ storeId, flash }) {
  const [promos,  setPromos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', certainty: '', page: 1 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Reuse the existing promos list — no separate route needed for promos
      // since they're loaded per-country; use a simplified country-agnostic query
      const res = await fetch(`/api/admin/stores/${storeId}/promos-calc`);
      if (res.ok) setPromos((await res.json()).data ?? []);
      setLoading(false);
    })();
  }, [storeId]);

  const filtered = promos.filter((p) => {
    if (filters.certainty && p.discountCertainty !== filters.certainty) return false;
    if (filters.search    && !p.translations?.[0]?.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--ap-border-light)', flexWrap: 'wrap' }}>
        <div className="ap-field" style={{ minWidth: '180px' }}>
          <label className="ap-label">Search</label>
          <input className="ap-input" placeholder="Title…" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <div className="ap-field">
          <label className="ap-label">Certainty</label>
          <select className="ap-select" value={filters.certainty} onChange={(e) => setFilters((f) => ({ ...f, certainty: e.target.value }))}>
            <option value="">All</option>
            {CERTAINTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              <th>Offer</th>
              <th>Discount %</th>
              <th>Verified avg %</th>
              <th>Certainty</th>
              <th>Effective %</th>
              <th>Stack group</th>
              <th>Stackable</th>
              <th>Capped</th>
              <th>Min spend</th>
              <th style={{ width: '24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem' }}><span className="ap-spinner" /></td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={10}><div className="ap-empty">No bank / card offers for this store.</div></td></tr>}
            {!loading && filtered.map((p) => <PromoRow key={p.id} promo={p} flash={flash} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function StoreOffersPage() {
  const params  = useParams();
  const storeId = Number(params.id);

  const [tab,   setTab]   = useState('Vouchers');
  const [alert, setAlert] = useState(null);

  function flash(type, msg) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  }

  return (
    <div className="ap-root">
      <div className="ap-page">
        <div className="ap-page-header">
          <h1 className="ap-page-title">
            Offer Calculator Fields
            <small>Store #{storeId}</small>
          </h1>
          <div className="ap-page-actions">
            <a href={`/admin/stores/${storeId}/intelligence`} className="ap-btn ap-btn--ghost ap-btn--sm">Intelligence →</a>
          </div>
        </div>

        {alert && <div className={`ap-alert ap-alert--${alert.type}`}>{alert.msg}</div>}

        <div className="ap-alert ap-alert--info" style={{ marginBottom: '1.5rem' }}>
          <strong>Click any cell to edit inline.</strong> Changes save immediately.
          <br />
          <strong>Effective %</strong> = what the calculator actually uses.
          Verified avg overrides certainty haircut. UNKNOWN = excluded.
        </div>

        <div className="ap-tabs">
          {['Vouchers', 'Bank & Card Offers'].map((t) => (
            <button key={t} className={`ap-tab ${tab === t ? 'ap-tab--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="ap-card">
          {tab === 'Vouchers'          && <VouchersTab storeId={storeId} flash={flash} />}
          {tab === 'Bank & Card Offers' && <PromosTab  storeId={storeId} flash={flash} />}
        </div>
      </div>
    </div>
  );
}
