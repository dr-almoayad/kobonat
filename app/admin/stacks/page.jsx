// app/admin/stacks/page.jsx
// ── Offer Stacks Manager ──────────────────────────────────────────────────────
// Displays every store that has ≥2 stackable offers (CODE + DEAL + BANK_OFFER).
// Lets admin toggle "Homepage Featured" on any stack (sets isFeaturedStack on
// the CODE/DEAL voucher(s) for that store).
// Links through to /admin/stores/[id]/offers to manage isStackable flags.
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '../admin-panel.css';

// ── Type metadata ──────────────────────────────────────────────────────────────
const TYPE_META = {
  CODE:       { label: 'Code',       color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: '🎟' },
  DEAL:       { label: 'Deal',       color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🔥' },
  BANK_OFFER: { label: 'Bank Offer', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🏦' },
};

// ── Inline toggle component ───────────────────────────────────────────────────
function FeaturedToggle({ storeId, items, value, onChanged }) {
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(value);

  async function toggle() {
    const next = !current;
    setCurrent(next);
    setSaving(true);

    // Find CODE and DEAL voucher items for this store
    const voucherItems = items.filter(i => i.source === 'voucher');
    if (!voucherItems.length) { setSaving(false); return; }

    try {
      // Patch all CODE/DEAL vouchers in the stack simultaneously
      await Promise.all(
        voucherItems.map(item =>
          fetch(`/api/admin/vouchers/${item.id}/calculator`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ isFeaturedStack: next }),
          })
        )
      );
      onChanged(storeId, next);
    } catch (err) {
      // rollback on failure
      setCurrent(!next);
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '0.4rem',
        padding:        '0.3rem 0.75rem',
        borderRadius:   '6px',
        border:         'none',
        cursor:         saving ? 'wait' : 'pointer',
        fontWeight:     600,
        fontSize:       '0.75rem',
        transition:     'all 0.15s',
        background:     current
          ? 'linear-gradient(135deg,#f59e0b,#f97316)'
          : 'var(--ap-surface-2)',
        color:          current ? '#fff' : 'var(--ap-text-secondary)',
        boxShadow:      current ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
        opacity:        saving ? 0.7 : 1,
      }}
    >
      {saving
        ? <span className="ap-spinner" style={{ width: 12, height: 12 }} />
        : <span style={{ fontSize: '0.8rem' }}>{current ? '★' : '☆'}</span>
      }
      {current ? 'On Homepage' : 'Add to Homepage'}
    </button>
  );
}

// ── Stack item pill ───────────────────────────────────────────────────────────
function ItemPill({ item }) {
  const meta = TYPE_META[item.itemType] || TYPE_META.DEAL;
  return (
    <div style={{
      display:        'inline-flex',
      flexDirection:  'column',
      gap:            '2px',
      background:     meta.bg,
      border:         `1px solid ${meta.color}33`,
      borderRadius:   '8px',
      padding:        '0.35rem 0.6rem',
      minWidth:       '90px',
    }}>
      <span style={{
        fontSize:    '0.62rem',
        fontWeight:  700,
        color:       meta.color,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        {meta.icon} {meta.label}
      </span>
      <span style={{
        fontSize:   '0.75rem',
        fontWeight: 600,
        color:      'var(--ap-text-primary)',
        lineHeight: 1.2,
        maxWidth:   '120px',
        overflow:   'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {item.title}
      </span>
      {item.discountPercent != null && (
        <span style={{ fontSize: '0.7rem', color: meta.color, fontWeight: 700 }}>
          {item.discountPercent}%
        </span>
      )}
      {item.code && (
        <code style={{
          fontSize:   '0.62rem',
          background: 'rgba(0,0,0,0.1)',
          padding:    '1px 5px',
          borderRadius: 4,
          color:      'var(--ap-text-primary)',
          letterSpacing: '0.04em',
        }}>
          {item.code}
        </code>
      )}
    </div>
  );
}

// ── Stack row ─────────────────────────────────────────────────────────────────
function StackRow({ stack, onChanged }) {
  const savings = stack.combinedSavingsPercent;

  return (
    <tr style={{ background: stack.anyFeaturedStack ? 'rgba(249,115,22,0.04)' : undefined }}>
      {/* Store */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {stack.storeLogo ? (
            <img
              src={stack.storeLogo}
              alt={stack.storeName}
              width={32}
              height={32}
              style={{ borderRadius: 6, objectFit: 'contain', background: '#f8f8f8', padding: 2 }}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'var(--ap-surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
            }}>🏪</div>
          )}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ap-text-primary)' }}>
              {stack.storeName}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>
              {stack.storeSlug}
            </div>
          </div>
        </div>
      </td>

      {/* Stack composition */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {stack.items.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {idx > 0 && (
                <span style={{ color: 'var(--ap-text-muted)', fontWeight: 700, fontSize: '0.8rem' }}>+</span>
              )}
              <ItemPill item={item} />
            </div>
          ))}
        </div>
      </td>

      {/* Combined savings */}
      <td style={{ textAlign: 'center' }}>
        {savings != null ? (
          <span style={{
            display:      'inline-block',
            fontFamily:   'var(--ap-mono)',
            fontWeight:   700,
            fontSize:     '0.95rem',
            color:        savings >= 20 ? 'var(--ap-green)' : savings >= 10 ? 'var(--ap-amber)' : 'var(--ap-text-secondary)',
          }}>
            {savings}%
          </span>
        ) : (
          <span style={{ color: 'var(--ap-text-muted)', fontSize: '0.75rem' }}>—</span>
        )}
      </td>

      {/* Homepage featured toggle */}
      <td>
        <FeaturedToggle
          storeId={stack.storeId}
          items={stack.items}
          value={stack.anyFeaturedStack}
          onChanged={onChanged}
        />
      </td>

      {/* Actions */}
      <td>
        <Link
          href={`/admin/stores/${stack.storeId}/offers`}
          style={{
            fontSize:   '0.75rem',
            color:      'var(--ap-accent)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Manage offers →
        </Link>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StacksPage() {
  const [stacks,    setStacks]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [meta,      setMeta]      = useState({ total: 0, homepageFeatured: 0 });
  const [search,    setSearch]    = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (featuredOnly)    p.set('featured', '1');
      const res = await fetch(`/api/admin/stacks?${p}`);
      if (res.ok) {
        const json = await res.json();
        setStacks(json.data  ?? []);
        setMeta(json.meta ?? { total: 0, homepageFeatured: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, featuredOnly]);

  useEffect(() => { load(); }, [load]);

  // Optimistic update for the homepage toggle
  function handleFeaturedChanged(storeId, next) {
    setStacks(prev =>
      prev.map(s => {
        if (s.storeId !== storeId) return s;
        return {
          ...s,
          anyFeaturedStack: next,
          items: s.items.map(i =>
            i.source === 'voucher' ? { ...i, isFeaturedStack: next } : i
          ),
        };
      })
    );
    setMeta(prev => ({
      ...prev,
      homepageFeatured: prev.homepageFeatured + (next ? 1 : -1),
    }));
  }

  return (
    <div className="ap-root">
      <div className="ap-page">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="ap-page-header">
          <h1 className="ap-page-title">
            Offer Stacks
            <small style={{ fontFamily: 'var(--ap-mono)', fontSize: '0.7rem',
              fontWeight: 400, color: 'var(--ap-text-muted)', marginLeft: '0.5rem' }}>
              stackable offer combinations
            </small>
          </h1>
          <div className="ap-page-actions">
            <a href="/admin/vouchers" className="ap-btn ap-btn--ghost ap-btn--sm">
              All Vouchers
            </a>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────── */}
        <div className="ap-stats-row" style={{ marginBottom: '1.25rem' }}>
          <div className="ap-stat">
            <span className="ap-stat__label">Total Stacks</span>
            <span className="ap-stat__value">{loading ? '…' : meta.total}</span>
            <span className="ap-stat__sub">stores with ≥2 stackable offers</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Homepage Featured</span>
            <span className="ap-stat__value ap-stat__value--amber">
              {loading ? '…' : meta.homepageFeatured}
            </span>
            <span className="ap-stat__sub">shown in homepage stacks section</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Not Featured</span>
            <span className="ap-stat__value ap-stat__value--accent">
              {loading ? '…' : Math.max(0, meta.total - meta.homepageFeatured)}
            </span>
            <span className="ap-stat__sub">store-page only</span>
          </div>
        </div>

        {/* ── Info banner ────────────────────────────────────────── */}
        <div className="ap-alert ap-alert--info" style={{ marginBottom: '1.25rem' }}>
          <strong>How stacks work:</strong> A stack is built from one CODE voucher + one DEAL voucher + one BANK_OFFER promo at the same store — any 2 of the 3 qualify.
          Toggle <strong>isStackable</strong> on individual offers via <em>Manage offers →</em>.
          Use the <strong>Homepage toggle</strong> here to curate which stacks appear in the homepage section.
          Store pages always show all stackable offers for that store regardless of this flag.
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '0.75rem',
          marginBottom:   '1rem',
          padding:        '0.75rem 1rem',
          background:     'var(--ap-surface)',
          border:         '1px solid var(--ap-border)',
          borderRadius:   'var(--ap-radius)',
          flexWrap:       'wrap',
        }}>
          <input
            className="ap-input"
            type="search"
            placeholder="Search store name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
          <label className="ap-checkbox-row">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={e => setFeaturedOnly(e.target.checked)}
            />
            <span className="ap-checkbox-label" style={{ fontSize: '0.8rem' }}>
              Homepage featured only
            </span>
          </label>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--ap-text-muted)' }}>
            {loading ? 'Loading…' : `${stacks.length} stacks`}
          </span>
        </div>

        {/* ── Table ──────────────────────────────────────────────── */}
        <div className="ap-card">
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th style={{ width: 220 }}>Store</th>
                  <th>Stack Composition</th>
                  <th style={{ width: 110, textAlign: 'center' }}>Combined Savings</th>
                  <th style={{ width: 180 }}>Homepage</th>
                  <th style={{ width: 130 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--ap-text-muted)' }}>
                      <span className="ap-spinner" />
                    </td>
                  </tr>
                )}
                {!loading && stacks.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="ap-empty">
                        No stacks found.
                        {' '}
                        <Link href="/admin/vouchers" style={{ color: 'var(--ap-accent)' }}>
                          Mark vouchers as stackable
                        </Link>
                        {' '}to create stacks.
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && stacks.map(s => (
                  <StackRow
                    key={s.storeId}
                    stack={s}
                    onChanged={handleFeaturedChanged}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Help ────────────────────────────────────────────────── */}
        <div style={{
          marginTop:   '1.5rem',
          padding:     '1rem 1.25rem',
          background:  'var(--ap-surface)',
          border:      '1px solid var(--ap-border)',
          borderRadius: 'var(--ap-radius)',
          fontSize:    '0.8rem',
          color:       'var(--ap-text-secondary)',
          lineHeight:  1.6,
        }}>
          <strong style={{ color: 'var(--ap-text-primary)', display: 'block', marginBottom: '0.5rem' }}>
            Quick Reference
          </strong>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>
              <strong>To add a store's stack to the homepage:</strong> Toggle "Add to Homepage" here.
              This sets <code>isFeaturedStack = true</code> on the CODE/DEAL vouchers.
            </li>
            <li>
              <strong>To make a voucher or bank offer stackable:</strong> Click "Manage offers →" to
              open that store's Offers page and toggle the <em>Stackable</em> column.
            </li>
            <li>
              <strong>Store pages</strong> always show <em>all</em> stacks for that store — the
              homepage toggle only controls the homepage section.
            </li>
            <li>
              <strong>Stacks are computed dynamically</strong> — at most one CODE, one DEAL, and one
              BANK_OFFER per store is shown. The offer with the best
              <code>verifiedAvgPercent</code> is picked automatically.
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
