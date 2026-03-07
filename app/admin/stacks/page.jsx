// app/admin/stacks/page.jsx
// Offer Stacks Manager
//
// Reads every store that already has ≥2 offers flagged isStackable=true on the
// Offers page, and shows them here.  The ONLY write action on this page is the
// "Homepage Featured" toggle — everything else is managed on the Offers page.
//
// Layout per store:
//   [ Store logo + name ]  [ Vouchers chips ]  [ + ]  [ Promos chips ]
//   [ Combined savings ]   [ Homepage toggle ]  [ → Manage offers ]
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import '../admin-panel.css';

// ─── constants ────────────────────────────────────────────────────────────────
const TYPE_STYLE = {
  CODE:       { label: 'Code',       bg: 'rgba(99,102,241,0.13)',  border: 'rgba(99,102,241,0.3)',  color: '#818cf8', icon: 'confirmation_number' },
  DEAL:       { label: 'Deal',       bg: 'rgba(16,185,129,0.13)',  border: 'rgba(16,185,129,0.3)',  color: '#34d399', icon: 'local_fire_department' },
  BANK_OFFER: { label: 'Bank Offer', bg: 'rgba(245,158,11,0.13)',  border: 'rgba(245,158,11,0.3)',  color: '#fbbf24', icon: 'account_balance' },
};

// ─── Offer chip ───────────────────────────────────────────────────────────────
function OfferChip({ item }) {
  const s = TYPE_STYLE[item.itemType] || TYPE_STYLE.DEAL;
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      gap:           '3px',
      background:    s.bg,
      border:        `1px solid ${s.border}`,
      borderRadius:  '8px',
      padding:       '0.4rem 0.65rem',
      minWidth:      '80px',
      maxWidth:      '160px',
    }}>
      {/* type label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <span className="material-symbols-sharp" style={{ fontSize: '0.7rem', color: s.color }}>
          {s.icon}
        </span>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: s.color,
          textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {s.label}
        </span>
      </div>
      {/* title */}
      <span style={{ fontSize: '0.75rem', fontWeight: 600,
        color: 'var(--ap-text-primary)', lineHeight: 1.25,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.title}
      </span>
      {/* discount / code */}
      {item.discountPercent != null && (
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>
          {item.discountPercent}%
        </span>
      )}
      {item.code && (
        <code style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.15)',
          padding: '1px 5px', borderRadius: '3px',
          color: 'var(--ap-text-primary)', letterSpacing: '0.04em' }}>
          {item.code}
        </code>
      )}
    </div>
  );
}

// ─── Plus separator ───────────────────────────────────────────────────────────
function Plus() {
  return (
    <span style={{ color: 'var(--ap-text-muted)', fontWeight: 700,
      fontSize: '0.85rem', padding: '0 2px', alignSelf: 'center' }}>
      +
    </span>
  );
}

// ─── Homepage toggle ──────────────────────────────────────────────────────────
function HomepageToggle({ storeId, vouchers, value, onChange, disabled }) {
  const [saving, setSaving] = useState(false);

  async function toggle() {
    if (disabled) return;
    const next = !value;
    setSaving(true);
    try {
      // Patch every CODE + DEAL voucher for this store simultaneously
      await Promise.all(
        vouchers.map(v =>
          fetch(`/api/admin/vouchers/${v.id}/calculator`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ isFeaturedStack: next }),
          })
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
      disabled={saving || disabled}
      title={
        disabled  ? 'Run migration first to enable homepage curation' :
        value     ? 'Remove from homepage stacks section' :
                    'Show in homepage stacks section'
      }
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '0.35rem',
        padding:      '0.35rem 0.75rem',
        borderRadius: '7px',
        border:       value ? 'none' : '1px solid var(--ap-border)',
        cursor:       (saving || disabled) ? 'not-allowed' : 'pointer',
        fontWeight:   700,
        fontSize:     '0.75rem',
        transition:   'all 0.15s',
        background:   disabled
          ? 'var(--ap-surface-2)'
          : value
            ? 'linear-gradient(135deg,#f59e0b 0%,#f97316 100%)'
            : 'var(--ap-surface-2)',
        color:        (disabled || !value) ? 'var(--ap-text-secondary)' : '#fff',
        boxShadow:    (!disabled && value) ? '0 2px 10px rgba(249,115,22,0.3)' : 'none',
        opacity:      (saving || disabled) ? 0.5 : 1,
        whiteSpace:   'nowrap',
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

// ─── Store stack card ─────────────────────────────────────────────────────────
function StackCard({ stack, onFeaturedChange, hasFeaturedField }) {
  const allItems = [
    ...stack.vouchers.map(v => ({ ...v, _src: 'voucher' })),
    ...stack.promos.map(p =>  ({ ...p, _src: 'promo'   })),
  ];

  return (
    <div style={{
      background:    'var(--ap-surface)',
      border:        `1px solid ${stack.isFeaturedStack ? 'rgba(249,115,22,0.4)' : 'var(--ap-border)'}`,
      borderRadius:  'var(--ap-radius)',
      overflow:      'hidden',
      transition:    'border-color 0.15s',
      boxShadow:     stack.isFeaturedStack ? '0 0 0 1px rgba(249,115,22,0.15)' : 'none',
    }}>
      {/* ── Header row ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '0.75rem',
        padding:        '0.75rem 1rem',
        borderBottom:   '1px solid var(--ap-border-light)',
        background:     stack.isFeaturedStack
          ? 'linear-gradient(90deg,rgba(249,115,22,0.06) 0%,transparent 100%)'
          : 'var(--ap-surface-2)',
      }}>
        {/* logo */}
        {stack.storeLogo ? (
          <img src={stack.storeLogo} alt={stack.storeName} width={28} height={28}
            style={{ borderRadius: 6, objectFit: 'contain',
              background: '#fff', padding: 2, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0,
            background: 'var(--ap-surface-2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
            🏪
          </div>
        )}

        {/* store name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem',
            color: 'var(--ap-text-primary)', lineHeight: 1.2 }}>
            {stack.storeName}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--ap-text-muted)',
            fontFamily: 'var(--ap-mono)' }}>
            {stack.vouchers.length} voucher{stack.vouchers.length !== 1 ? 's' : ''}
            {stack.promos.length > 0 && ` · ${stack.promos.length} bank offer${stack.promos.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* combined savings */}
        {stack.combinedSavingsPercent != null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--ap-text-muted)',
              fontFamily: 'var(--ap-mono)', textTransform: 'uppercase',
              letterSpacing: '0.06em' }}>
              up to
            </div>
            <div style={{
              fontSize:   '1.1rem',
              fontWeight: 800,
              fontFamily: 'var(--ap-mono)',
              color: stack.combinedSavingsPercent >= 20
                ? 'var(--ap-green)'
                : stack.combinedSavingsPercent >= 10
                  ? 'var(--ap-amber)'
                  : 'var(--ap-text-secondary)',
              lineHeight: 1,
            }}>
              {stack.combinedSavingsPercent}%
            </div>
          </div>
        )}
      </div>

      {/* ── Offer chips ── */}
      <div style={{
        display:    'flex',
        alignItems: 'flex-start',
        flexWrap:   'wrap',
        gap:        '0.5rem',
        padding:    '0.75rem 1rem',
      }}>
        {allItems.map((item, idx) => (
          <div key={`${item._src}-${item.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {idx > 0 && <Plus />}
            <OfferChip item={item} />
          </div>
        ))}
      </div>

      {/* ── Footer row: homepage toggle + manage link ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0.6rem 1rem',
        borderTop:      '1px solid var(--ap-border-light)',
        background:     'var(--ap-surface-2)',
        gap:            '0.75rem',
      }}>
        <HomepageToggle
          storeId={stack.storeId}
          vouchers={stack.vouchers}
          value={stack.isFeaturedStack}
          onChange={onFeaturedChange}
          disabled={!hasFeaturedField}
        />

        <Link
          href={`/admin/stores/${stack.storeId}/offers`}
          style={{ fontSize: '0.75rem', fontWeight: 600,
            color: 'var(--ap-accent)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '3px' }}
        >
          <span className="material-symbols-sharp" style={{ fontSize: '0.85rem' }}>
            tune
          </span>
          Manage offers
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StacksPage() {
  const [stacks,           setStacks]           = useState([]);
  const [meta,             setMeta]             = useState({ total: 0, homepageFeatured: 0, hasFeaturedField: true });
  const [loading,          setLoading]          = useState(true);
  const [search,       setSearch]       = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [debSearch,    setDebSearch]    = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 280);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (debSearch)    p.set('search',   debSearch);
      if (featuredOnly) p.set('featured', '1');
      const res  = await fetch(`/api/admin/stacks?${p}`);
      const json = await res.json();
      setStacks(json.data ?? []);
      setMeta(json.meta ?? { total: 0, homepageFeatured: 0 });
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

  // When searching/filtering locally we also apply against already-loaded data
  // to avoid a round-trip on every keystroke (the API handles the real filter too)
  const displayed = stacks;

  return (
    <div className="ap-root">
      <div className="ap-page">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="ap-page-header">
          <h1 className="ap-page-title">
            Offer Stacks
          </h1>
          <div className="ap-page-actions" style={{ display: 'flex', gap: '0.5rem' }}>
            <a href="/admin/vouchers" className="ap-btn ap-btn--ghost ap-btn--sm">
              All Vouchers
            </a>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────── */}
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
            <span className="ap-stat__sub">visible on store pages only</span>
          </div>
        </div>

        {/* ── Migration warning ───────────────────────────────────── */}
        {!loading && !meta.hasFeaturedField && (
          <div className="ap-alert ap-alert--warning" style={{ marginBottom: '1.25rem' }}>
            <strong>Migration needed:</strong> The <code>isFeaturedStack</code> column
            doesn't exist yet. Stacks are shown but the Homepage toggle is disabled until
            you run: <code>npx prisma migrate dev --name add_voucher_isFeaturedStack</code>
          </div>
        )}

        {/* ── Info banner ─────────────────────────────────────────── */}
        <div className="ap-alert ap-alert--info" style={{ marginBottom: '1.25rem' }}>
          Stores appear here automatically once their offers are flagged{' '}
          <strong>Stackable = Yes</strong> on the{' '}
          <Link href="/admin/vouchers" style={{ color: 'var(--ap-accent)' }}>Offers page</Link>.
          Use the <strong>Homepage</strong> toggle to curate which stores appear in
          the homepage stacks section. Store pages always show all stacks for
          that store regardless.
        </div>

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '0.75rem',
          marginBottom: '1.25rem',
          flexWrap:     'wrap',
        }}>
          <input
            className="ap-input"
            type="search"
            placeholder="Search store…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <label className="ap-checkbox-row">
            <input type="checkbox" checked={featuredOnly}
              onChange={e => setFeaturedOnly(e.target.checked)} />
            <span className="ap-checkbox-label" style={{ fontSize: '0.8rem' }}>
              Homepage only
            </span>
          </label>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem',
            color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>
            {loading ? 'Loading…' : `${displayed.length} store${displayed.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* ── Cards grid ──────────────────────────────────────────── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem',
            color: 'var(--ap-text-muted)' }}>
            <span className="ap-spinner" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="ap-empty" style={{ padding: '3rem' }}>
            {search || featuredOnly
              ? 'No stacks match your filters.'
              : <>
                  No stacks yet.{' '}
                  <Link href="/admin/vouchers" style={{ color: 'var(--ap-accent)' }}>
                    Mark vouchers as stackable
                  </Link>{' '}
                  on the Offers page first.
                </>
            }
          </div>
        ) : (
          <div style={{
            display:               'grid',
            gridTemplateColumns:   'repeat(auto-fill, minmax(420px, 1fr))',
            gap:                   '1rem',
          }}>
            {displayed.map(stack => (
              <StackCard
                key={stack.storeId}
                stack={stack}
                onFeaturedChange={handleFeaturedChange}
                hasFeaturedField={meta.hasFeaturedField}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
