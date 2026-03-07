// app/admin/stacks/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import '../admin-panel.css';

const TYPE_STYLE = {
  CODE:       { label: 'Code',       bg: 'rgba(99,102,241,0.13)', border: 'rgba(99,102,241,0.3)', color: '#818cf8', icon: 'confirmation_number' },
  DEAL:       { label: 'Deal',       bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.3)', color: '#34d399', icon: 'local_fire_department' },
  BANK_OFFER: { label: 'Bank Offer', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', icon: 'account_balance' },
};

// ── Offer chip ─────────────────────────────────────────────────────────────────
function OfferChip({ item }) {
  const s = TYPE_STYLE[item.itemType] || TYPE_STYLE.DEAL;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '3px',
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: '8px', padding: '0.4rem 0.65rem',
      minWidth: '80px', maxWidth: '160px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <span className="material-symbols-sharp" style={{ fontSize: '0.7rem', color: s.color }}>
          {s.icon}
        </span>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: s.color,
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {s.label}
        </span>
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ap-text-primary)',
        lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.title}
      </span>
      {item.discountPercent != null && (
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>
          {item.discountPercent}%
        </span>
      )}
      {item.code && (
        <code style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.15)',
          padding: '1px 5px', borderRadius: '3px', color: 'var(--ap-text-primary)',
          letterSpacing: '0.04em' }}>
          {item.code}
        </code>
      )}
    </div>
  );
}

// ── Homepage featured toggle ───────────────────────────────────────────────────
// PATCHes isFeaturedStack on every CODE+DEAL voucher for the store simultaneously.
function HomepageToggle({ storeId, vouchers, value, onChange }) {
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !value;
    setSaving(true);
    try {
      await Promise.all(
        vouchers.map(v =>
          fetch(`/api/admin/vouchers/${v.id}/calculator`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ isFeaturedStack: next }),
          }).then(r => { if (!r.ok) throw new Error(`voucher ${v.id} PATCH failed`); })
        )
      );
      onChange(storeId, next);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title={value ? 'Remove from homepage stacks section' : 'Add to homepage stacks section'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.35rem 0.75rem', borderRadius: '7px',
        border: value ? 'none' : '1px solid var(--ap-border)',
        cursor: saving ? 'wait' : 'pointer',
        fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.15s', whiteSpace: 'nowrap',
        background: value ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'var(--ap-surface-2)',
        color:      value ? '#fff' : 'var(--ap-text-secondary)',
        boxShadow:  value ? '0 2px 10px rgba(249,115,22,0.3)' : 'none',
        opacity:    saving ? 0.65 : 1,
      }}
    >
      {saving
        ? <span className="ap-spinner" style={{ width: 11, height: 11 }} />
        : <span className="material-symbols-sharp" style={{ fontSize: '0.9rem' }}>
            {value ? 'star' : 'star_border'}
          </span>
      }
      {value ? 'On Homepage' : 'Add to Homepage'}
    </button>
  );
}

// ── Stack card ────────────────────────────────────────────────────────────────
function StackCard({ stack, onFeaturedChange }) {
  const allItems = [
    ...stack.vouchers.map(v => ({ ...v, _src: 'voucher' })),
    ...stack.promos.map(p =>  ({ ...p, _src: 'promo' })),
  ];

  return (
    <div style={{
      background: 'var(--ap-surface)',
      border: `1px solid ${stack.isFeaturedStack ? 'rgba(249,115,22,0.45)' : 'var(--ap-border)'}`,
      borderRadius: 'var(--ap-radius)', overflow: 'hidden',
      boxShadow: stack.isFeaturedStack ? '0 0 0 1px rgba(249,115,22,0.12)' : 'none',
      transition: 'border-color 0.15s',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem', borderBottom: '1px solid var(--ap-border-light)',
        background: stack.isFeaturedStack
          ? 'linear-gradient(90deg,rgba(249,115,22,0.07) 0%,transparent 100%)'
          : 'var(--ap-surface-2)',
      }}>
        {stack.storeLogo ? (
          <img src={stack.storeLogo} alt={stack.storeName} width={28} height={28}
            style={{ borderRadius: 6, objectFit: 'contain', background: '#fff',
              padding: 2, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0,
            background: 'var(--ap-surface)', border: '1px solid var(--ap-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
            🏪
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ap-text-primary)' }}>
            {stack.storeName}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>
            {stack.vouchers.length} voucher{stack.vouchers.length !== 1 ? 's' : ''}
            {stack.promos.length > 0 && ` · ${stack.promos.length} bank offer${stack.promos.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {stack.combinedSavingsPercent != null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)',
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>up to</div>
            <div style={{
              fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--ap-mono)', lineHeight: 1,
              color: stack.combinedSavingsPercent >= 20 ? 'var(--ap-green)'
                   : stack.combinedSavingsPercent >= 10 ? 'var(--ap-amber)'
                   : 'var(--ap-text-secondary)',
            }}>
              {stack.combinedSavingsPercent}%
            </div>
          </div>
        )}
      </div>

      {/* Offer chips */}
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap',
        gap: '0.5rem', padding: '0.75rem 1rem' }}>
        {allItems.map((item, idx) => (
          <div key={`${item._src}-${item.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {idx > 0 && (
              <span style={{ color: 'var(--ap-text-muted)', fontWeight: 700,
                fontSize: '0.85rem', alignSelf: 'center' }}>+</span>
            )}
            <OfferChip item={item} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.6rem 1rem', borderTop: '1px solid var(--ap-border-light)',
        background: 'var(--ap-surface-2)', gap: '0.75rem',
      }}>
        <HomepageToggle
          storeId={stack.storeId}
          vouchers={stack.vouchers}
          value={stack.isFeaturedStack}
          onChange={onFeaturedChange}
        />
        <Link href={`/admin/stores/${stack.storeId}/offers`}
          style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ap-accent)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span className="material-symbols-sharp" style={{ fontSize: '0.85rem' }}>tune</span>
          Manage offers
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StacksPage() {
  const [stacks,       setStacks]       = useState([]);
  const [meta,         setMeta]         = useState({ total: 0, homepageFeatured: 0 });
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [debSearch,    setDebSearch]    = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 280);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (debSearch)    p.set('search',   debSearch);
      if (featuredOnly) p.set('featured', '1');
      const res  = await fetch(`/api/admin/stacks?${p}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setStacks(json.data ?? []);
      setMeta(json.meta  ?? { total: 0, homepageFeatured: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [debSearch, featuredOnly]);

  useEffect(() => { load(); }, [load]);

  function handleFeaturedChange(storeId, next) {
    setStacks(prev => prev.map(s =>
      s.storeId !== storeId ? s : {
        ...s,
        isFeaturedStack: next,
        vouchers: s.vouchers.map(v => ({ ...v, isFeaturedStack: next })),
      }
    ));
    setMeta(prev => ({
      ...prev,
      homepageFeatured: prev.homepageFeatured + (next ? 1 : -1),
    }));
  }

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
            <span className="ap-stat__label">Stores with Stacks</span>
            <span className="ap-stat__value">{loading ? '…' : meta.total}</span>
            <span className="ap-stat__sub">≥2 stackable offers</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">On Homepage</span>
            <span className="ap-stat__value ap-stat__value--amber">
              {loading ? '…' : meta.homepageFeatured}
            </span>
            <span className="ap-stat__sub">featured in homepage section</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Store-Page Only</span>
            <span className="ap-stat__value ap-stat__value--accent">
              {loading ? '…' : Math.max(0, meta.total - meta.homepageFeatured)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="ap-alert ap-alert--info" style={{ marginBottom: '1.25rem' }}>
          Stores appear here automatically once their offers are flagged{' '}
          <strong>Stackable = Yes</strong> on their Offers page (at least 2 offers needed).
          Use the <strong>★ Homepage</strong> toggle to curate which stores appear in
          the homepage stacks section. Store pages always show all stacks regardless.
        </div>

        {/* Error */}
        {error && (
          <div className="ap-alert ap-alert--error" style={{ marginBottom: '1.25rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem',
          marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input className="ap-input" type="search" placeholder="Search store…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 220 }} />
          <label className="ap-checkbox-row">
            <input type="checkbox" checked={featuredOnly}
              onChange={e => setFeaturedOnly(e.target.checked)} />
            <span className="ap-checkbox-label" style={{ fontSize: '0.8rem' }}>Homepage only</span>
          </label>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem',
            color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>
            {!loading && `${stacks.length} store${stacks.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ap-text-muted)' }}>
            <span className="ap-spinner" />
          </div>
        ) : stacks.length === 0 && !error ? (
          <div className="ap-empty" style={{ padding: '3rem' }}>
            {search || featuredOnly
              ? 'No stacks match your filters.'
              : <>
                  No stacks yet — open a store's{' '}
                  <Link href="/admin/vouchers" style={{ color: 'var(--ap-accent)' }}>
                    Offers page
                  </Link>{' '}
                  and set <strong>Stackable = Yes</strong> on at least 2 offers.
                </>
            }
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '1rem',
          }}>
            {stacks.map(stack => (
              <StackCard
                key={stack.storeId}
                stack={stack}
                onFeaturedChange={handleFeaturedChange}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
