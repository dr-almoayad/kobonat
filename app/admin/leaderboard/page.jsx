'use client';
// app/admin/leaderboard/page.jsx
// Full leaderboard management: week selector, rank table, override modal, cron trigger.

import { useState, useEffect, useCallback } from 'react';
import '@/components/admin/admin-panel.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function scoreClass(pct) {
  if (pct >= 30) return 'high';
  if (pct >= 15) return 'mid';
  return 'low';
}

function fmtPct(v, override) {
  if (v == null) return '—';
  const display = override ?? v;
  return `${display.toFixed(1)}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Override modal
// ─────────────────────────────────────────────────────────────────────────────

function OverrideModal({ snapshot, onClose, onSaved }) {
  const [value, setValue]   = useState(
    snapshot.savingsOverridePercent != null ? String(snapshot.savingsOverridePercent) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const storeName = snapshot.store?.translations?.[0]?.name ?? `Store #${snapshot.storeId}`;
  const calc      = snapshot.calculatedMaxSavingsPercent;

  async function handleSave() {
    const num = value === '' ? null : Number(value);
    if (num !== null && (isNaN(num) || num < 0 || num > 100)) {
      setError('Must be 0–100 or empty to clear');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/leaderboard/${snapshot.id}/override`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ savingsOverridePercent: num }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onSaved(await res.json());
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ap-modal-backdrop" onClick={onClose}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal__header">
          <h3 className="ap-modal__title">Override — {storeName}</h3>
          <button className="ap-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="ap-modal__body">
          <div className="ap-alert ap-alert--info">
            Calculated value: <strong>{calc.toFixed(1)}%</strong>
            &nbsp;({snapshot.stackingPath || 'no path'})
          </div>
          {error && <div className="ap-alert ap-alert--error">{error}</div>}
          <div className="ap-field">
            <label className="ap-label">Override percentage (0–100)</label>
            <input
              type="number"
              className="ap-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Leave empty to clear override"
              min="0"
              max="100"
              step="0.1"
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--ap-text-muted)' }}>
              Empty = revert to calculated value. Override is shown on the public leaderboard.
            </span>
          </div>
        </div>
        <div className="ap-modal__footer">
          <button className="ap-btn ap-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
          {snapshot.savingsOverridePercent != null && (
            <button
              className="ap-btn ap-btn--danger"
              onClick={() => { setValue(''); }}
              disabled={saving}
            >
              Clear override
            </button>
          )}
          <button className="ap-btn ap-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="ap-spinner" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trigger cron modal
// ─────────────────────────────────────────────────────────────────────────────

function TriggerModal({ onClose }) {
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');

  async function run() {
    setRunning(true);
    setError('');
    try {
      const res = await fetch('/api/admin/leaderboard/trigger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="ap-modal-backdrop" onClick={!running ? onClose : undefined}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal__header">
          <h3 className="ap-modal__title">Run Leaderboard Cron</h3>
          <button className="ap-modal__close" onClick={onClose} disabled={running}>✕</button>
        </div>
        <div className="ap-modal__body">
          {!result && !error && (
            <div className="ap-alert ap-alert--warning">
              This will recalculate rankings for all active stores and write new snapshots for the
              current week. It may take 30–90 seconds for large catalogues.
            </div>
          )}
          {error  && <div className="ap-alert ap-alert--error">{error}</div>}
          {result && (
            <div className="ap-alert ap-alert--success">
              Completed in {result.durationMs}ms — {result.processed} stores processed.
              {result.errors?.length > 0 && (
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="ap-modal__footer">
          <button className="ap-btn ap-btn--ghost" onClick={onClose} disabled={running}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button className="ap-btn ap-btn--primary" onClick={run} disabled={running}>
              {running ? <><span className="ap-spinner" /> Running…</> : 'Run now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function LeaderboardAdminPage() {
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [week,           setWeek]           = useState('');
  const [search,         setSearch]         = useState('');
  const [page,           setPage]           = useState(1);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [showTrigger,    setShowTrigger]    = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 50, ...(week && { week }), ...(search && { search }) });
    const res    = await fetch(`/api/admin/leaderboard?${params}`);
    const json   = await res.json();
    setData(json);
    if (!week && json.meta?.week) setWeek(json.meta.week);
    setLoading(false);
  }, [week, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleOverrideSaved(updated) {
    setData((prev) => ({
      ...prev,
      data: prev.data.map((s) => s.id === updated.id ? { ...s, ...updated } : s),
    }));
  }

  const snapshots     = data?.data     ?? [];
  const meta          = data?.meta     ?? {};
  const availableWeeks = meta.availableWeeks ?? [];

  return (
    <div className="ap-root">
      <div className="ap-page">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="ap-page-header">
          <h1 className="ap-page-title">
            Savings Leaderboard
            <small>{week || '…'}</small>
          </h1>
          <div className="ap-page-actions">
            <a href="/admin/leaderboard/methodology" className="ap-btn ap-btn--ghost ap-btn--sm">
              Formula versions
            </a>
            <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={() => setShowTrigger(true)}>
              ▷ Run cron
            </button>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="ap-stats-row">
          <div className="ap-stat">
            <span className="ap-stat__label">Total stores</span>
            <span className="ap-stat__value ap-stat__value--accent">{meta.total ?? '—'}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Week</span>
            <span className="ap-stat__value" style={{ fontSize: '1rem', paddingTop: '0.2rem' }}>{week || '—'}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Overrides active</span>
            <span className="ap-stat__value ap-stat__value--amber">
              {snapshots.filter((s) => s.savingsOverridePercent != null).length}
            </span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">New entries</span>
            <span className="ap-stat__value">
              {snapshots.filter((s) => s.movement === 'NEW').length}
            </span>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="ap-card" style={{ marginBottom: '1rem' }}>
          <div className="ap-card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '0.85rem 1.25rem' }}>
            <div className="ap-field" style={{ flex: '1', minWidth: '160px' }}>
              <label className="ap-label">Week</label>
              <select
                className="ap-select"
                value={week}
                onChange={(e) => { setWeek(e.target.value); setPage(1); }}
              >
                {availableWeeks.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div className="ap-field" style={{ flex: '2', minWidth: '220px' }}>
              <label className="ap-label">Search store</label>
              <input
                className="ap-input"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Store name…"
              />
            </div>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="ap-card">
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Store</th>
                  <th>Effective savings</th>
                  <th>Breakdown</th>
                  <th>Stacking path</th>
                  <th>Formula</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--ap-text-muted)' }}>
                    <span className="ap-spinner" />
                  </td></tr>
                )}
                {!loading && snapshots.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="ap-empty">No snapshots for {week}. Run the cron to generate them.</div>
                  </td></tr>
                )}
                {!loading && snapshots.map((s) => {
                  const effective = s.savingsOverridePercent ?? s.calculatedMaxSavingsPercent;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="ap-rank">
                          <span className="ap-rank__num">{s.rank}</span>
                          <span className={`ap-rank__move ap-rank__move--${s.movement}`}>
                            {s.movement === 'UP'   ? `↑${s.previousRank - s.rank}` :
                             s.movement === 'DOWN' ? `↓${s.rank - s.previousRank}` :
                             s.movement === 'NEW'  ? 'NEW' : '–'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="ap-store-cell">
                          {s.store?.logo && (
                            <img src={s.store.logo} alt="" className="ap-store-cell__logo" />
                          )}
                          <div>
                            <div className="ap-store-cell__name">
                              {s.store?.translations?.[0]?.name ?? `#${s.storeId}`}
                            </div>
                            <div className="ap-store-cell__slug">
                              {s.store?.translations?.[0]?.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`ap-score ap-score--${scoreClass(effective)}`}>
                          {effective.toFixed(1)}%
                        </span>
                        {s.savingsOverridePercent != null && (
                          <div className="ap-override">
                            calc: {s.calculatedMaxSavingsPercent.toFixed(1)}%
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {s.maxDirectDiscountPercent > 0 && (
                            <span className="ap-badge ap-badge--muted">
                              DEAL {s.maxDirectDiscountPercent.toFixed(1)}%
                            </span>
                          )}
                          {s.maxCouponPercent > 0 && (
                            <span className="ap-badge ap-badge--blue">
                              CODE {s.maxCouponPercent.toFixed(1)}%
                            </span>
                          )}
                          {s.maxBankOfferPercent > 0 && (
                            <span className="ap-badge ap-badge--green">
                              BANK {s.maxBankOfferPercent.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {s.stackingPath
                          ? <span className="ap-path">{s.stackingPath}</span>
                          : <span className="ap-table__dim">—</span>}
                      </td>
                      <td className="ap-table__mono ap-table__dim">{s.methodology?.version ?? '—'}</td>
                      <td>
                        <button
                          className="ap-btn ap-btn--ghost ap-btn--xs"
                          onClick={() => setOverrideTarget(s)}
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.pages > 1 && (
            <div style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--ap-border-light)' }}>
              <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              <span style={{ fontSize: '0.75rem', color: 'var(--ap-text-secondary)', fontFamily: 'var(--ap-mono)' }}>
                Page {page} of {meta.pages} ({meta.total} stores)
              </span>
              <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setPage((p) => Math.min(meta.pages, p + 1))} disabled={page === meta.pages}>Next →</button>
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {overrideTarget && (
        <OverrideModal
          snapshot={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onSaved={handleOverrideSaved}
        />
      )}
      {showTrigger && (
        <TriggerModal onClose={() => { setShowTrigger(false); fetchData(); }} />
      )}
    </div>
  );
}
