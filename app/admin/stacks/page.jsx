'use client';
// app/admin/stacks/page.jsx
// Global overview of all OfferStack records.
// Management happens at the per-store level — this page shows what exists
// and deep-links into each store's Offer Stacks tab.

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import '../admin-panel.css';

const TYPE_STYLE = {
  CODE:       { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  color: '#818cf8', icon: 'confirmation_number', label: 'Code'       },
  DEAL:       { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  color: '#34d399', icon: 'local_fire_department', label: 'Deal'       },
  BANK_OFFER: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  color: '#fbbf24', icon: 'account_balance',       label: 'Bank Offer' },
};

function OfferPill({ type, title, subtitle, code }) {
  const s = TYPE_STYLE[type] || TYPE_STYLE.DEAL;
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', gap: 2,
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 7, padding: '0.3rem 0.55rem',
      maxWidth: 160, minWidth: 72,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span className="material-symbols-sharp" style={{ fontSize: '0.65rem', color: s.color }}>{s.icon}</span>
        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {s.label}
        </span>
      </div>
      <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--ap-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title || '—'}
      </span>
      {code && (
        <code style={{ fontSize: '0.6rem', background: 'rgba(0,0,0,0.12)', padding: '1px 4px', borderRadius: 3, color: 'var(--ap-text-primary)', letterSpacing: '0.04em' }}>
          {code}
        </code>
      )}
      {subtitle && !code && (
        <span style={{ fontSize: '0.65rem', color: s.color }}>{subtitle}</span>
      )}
    </div>
  );
}

function StackRow({ stack }) {
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
    <tr style={{ opacity: stack.isActive ? 1 : 0.45 }}>
      <td>
        <div style={{ fontFamily: 'var(--ap-mono)', fontSize: '0.72rem', color: 'var(--ap-text-muted)' }}>#{stack.id}</div>
        {stack.label && <div style={{ fontSize: '0.78rem', fontWeight: 500, marginTop: 2 }}>{stack.label}</div>}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {idx > 0 && <span style={{ color: 'var(--ap-text-muted)', fontWeight: 700, fontSize: '0.8rem' }}>+</span>}
              <OfferPill {...item} />
            </div>
          ))}
          {items.length === 0 && <span style={{ color: 'var(--ap-text-muted)', fontSize: '0.75rem' }}>No offers linked</span>}
        </div>
      </td>
      <td>
        <span style={{ fontFamily: 'var(--ap-mono)', fontSize: '0.72rem', color: 'var(--ap-text-secondary)' }}>{stack.order}</span>
      </td>
      <td>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3,
          background: stack.isActive ? 'rgba(63,185,80,0.12)' : 'rgba(255,255,255,0.05)',
          color: stack.isActive ? 'var(--ap-green)' : 'var(--ap-text-muted)',
        }}>
          {stack.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
    </tr>
  );
}

function StoreCard({ group }) {
  const [open, setOpen] = useState(false);
  const activeCount = group.stacks.filter(s => s.isActive).length;

  return (
    <div style={{
      border: '1px solid var(--ap-border)', borderRadius: 'var(--ap-radius)',
      overflow: 'hidden', background: 'var(--ap-surface)',
    }}>
      {/* Store header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1rem', background: 'var(--ap-surface-2)',
          border: 'none', cursor: 'pointer', borderBottom: open ? '1px solid var(--ap-border)' : 'none',
        }}
      >
        {group.storeLogo ? (
          <img src={group.storeLogo} alt={group.storeName} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4, background: '#fff', padding: 2, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--ap-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>
            🏪
          </div>
        )}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ap-text-primary)' }}>{group.storeName}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>
            {group.stacks.length} stack{group.stacks.length !== 1 ? 's' : ''} · {activeCount} active
          </div>
        </div>
        <Link
          href={`/admin/stores/${group.storeId}?tab=offer-stacks`}
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: '0.72rem', fontWeight: 600, color: 'var(--ap-accent)',
            textDecoration: 'none', padding: '0.2rem 0.6rem',
            border: '1px solid rgba(31,111,235,0.3)', borderRadius: 4,
            whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 3,
          }}
        >
          <span className="material-symbols-sharp" style={{ fontSize: '0.78rem' }}>tune</span>
          Manage
        </Link>
        <span className="material-symbols-sharp" style={{ fontSize: '1rem', color: 'var(--ap-text-muted)' }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Stack rows */}
      {open && (
        <div style={{ overflowX: 'auto' }}>
          <table className="ap-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID / Label</th>
                <th>Offers in Stack</th>
                <th style={{ width: 60 }}>Order</th>
                <th style={{ width: 80 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {group.stacks
                .sort((a, b) => a.order - b.order)
                .map(stack => <StackRow key={stack.id} stack={stack} />)
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function StacksPage() {
  const [groups,     setGroups]     = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, storeCount: 0, activeCount: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [debSearch,  setDebSearch]  = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 280);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (debSearch)  p.set('search', debSearch);
      if (activeOnly) p.set('active', '1');
      const res  = await fetch(`/api/admin/stacks?${p}`);
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const json = await res.json();
      setGroups(json.data || []);
      setMeta(json.meta || { total: 0, storeCount: 0, activeCount: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [debSearch, activeOnly]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="ap-root">
      <div className="ap-page">

        {/* Header */}
        <div className="ap-page-header">
          <h1 className="ap-page-title">Offer Stacks</h1>
          <div className="ap-page-actions">
            <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>

        {/* Stats */}
        <div className="ap-stats-row" style={{ marginBottom: '1.25rem' }}>
          <div className="ap-stat">
            <span className="ap-stat__label">Total Stacks</span>
            <span className="ap-stat__value">{loading ? '…' : meta.total}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Active</span>
            <span className="ap-stat__value ap-stat__value--green">{loading ? '…' : meta.activeCount}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Stores with Stacks</span>
            <span className="ap-stat__value ap-stat__value--accent">{loading ? '…' : meta.storeCount}</span>
          </div>
        </div>

        {/* Info callout */}
        <div className="ap-alert ap-alert--info" style={{ marginBottom: '1.25rem' }}>
          Stacks are managed <strong>per store</strong>. Click <strong>Manage →</strong> next to any store to
          create, edit or delete its stacks. This page is a read-only overview.
        </div>

        {error && <div className="ap-alert ap-alert--error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="ap-input" type="search"
            placeholder="Search by store name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
          <label className="ap-checkbox-row">
            <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
            <span className="ap-checkbox-label" style={{ fontSize: '0.8rem' }}>Active stacks only</span>
          </label>
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>
            {!loading && `${meta.storeCount} store${meta.storeCount !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ap-text-muted)' }}>
            <span className="ap-spinner" />
          </div>
        ) : groups.length === 0 ? (
          <div className="ap-empty" style={{ padding: '3rem' }}>
            {search || activeOnly
              ? 'No stacks match your filters.'
              : (
                <>
                  No stacks yet. Go to a store's{' '}
                  <Link href="/admin/stores" style={{ color: 'var(--ap-accent)' }}>
                    Offer Stacks tab
                  </Link>{' '}
                  to create the first one.
                </>
              )
            }
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {groups.map(group => (
              <StoreCard key={group.storeId} group={group} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
