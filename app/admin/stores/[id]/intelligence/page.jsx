'use client';
// app/admin/stores/[id]/intelligence/page.jsx
// Full intelligence editor for one store:
//   — Logistics & delivery info
//   — Offer cadence
//   — Peak seasons
//   — Upcoming events
//   — Monthly metrics history
//   — Trigger intelligence cron for this store

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import '@/components/admin/admin-panel.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CONFIDENCE_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
const CERTAINTY_COLORS  = { EXACT: 'green', VERIFIED: 'green', TYPICAL: 'blue', ESTIMATED: 'amber', UNKNOWN: 'muted' };

function fmt(v) { return v == null ? '—' : v; }
function fmtPct(v) { return v == null ? '—' : `${Number(v).toFixed(1)}%`; }

function ScoreBar({ label, value, weight }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
        <span style={{ color: 'var(--ap-text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--ap-mono)', color: 'var(--ap-text-primary)' }}>{value?.toFixed(1) ?? '—'}/10</span>
      </div>
      <div style={{ height: '4px', background: 'var(--ap-border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value ?? 0) * 10}%`, background: 'var(--ap-accent)', borderRadius: '2px', transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.62rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)', textAlign: 'right' }}>{Math.round(weight * 100)}% weight</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Logistics section
// ─────────────────────────────────────────────────────────────────────────────

function LogisticsForm({ storeId, initial, onSaved, flash }) {
  const [form,   setForm]   = useState(initial || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial || {}); }, [initial]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v === '' ? null : v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/logistics`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('success', 'Logistics saved. lastVerifiedAt updated.');
      onSaved(await res.json());
    } catch (e) {
      flash('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="ap-section-label">Delivery</p>
      <div className="ap-form-grid" style={{ marginBottom: '1rem' }}>
        <div className="ap-field">
          <label className="ap-label">Min delivery days</label>
          <input type="number" className="ap-input" min="0" value={form.averageDeliveryDaysMin ?? ''} onChange={(e) => set('averageDeliveryDaysMin', e.target.value === '' ? null : Number(e.target.value))} placeholder="1" />
        </div>
        <div className="ap-field">
          <label className="ap-label">Max delivery days</label>
          <input type="number" className="ap-input" min="0" value={form.averageDeliveryDaysMax ?? ''} onChange={(e) => set('averageDeliveryDaysMax', e.target.value === '' ? null : Number(e.target.value))} placeholder="5" />
        </div>
        <div className="ap-field">
          <label className="ap-label">Free shipping from (SAR)</label>
          <input type="number" className="ap-input" min="0" value={form.freeShippingThreshold ?? ''} onChange={(e) => set('freeShippingThreshold', e.target.value === '' ? null : Number(e.target.value))} placeholder="0 = always free" />
        </div>
      </div>

      <p className="ap-section-label">Returns & Refunds</p>
      <div className="ap-form-grid" style={{ marginBottom: '1rem' }}>
        <div className="ap-field">
          <label className="ap-label">Return window (days)</label>
          <input type="number" className="ap-input" min="0" value={form.returnWindowDays ?? ''} onChange={(e) => set('returnWindowDays', e.target.value === '' ? null : Number(e.target.value))} placeholder="15" />
        </div>
        <div className="ap-field" style={{ justifyContent: 'flex-end', paddingBottom: '0.15rem' }}>
          <label className="ap-label">&nbsp;</label>
          <label className="ap-checkbox-row">
            <input type="checkbox" checked={!!form.freeReturns} onChange={(e) => set('freeReturns', e.target.checked)} />
            <span className="ap-checkbox-label">Free returns</span>
          </label>
        </div>
        <div className="ap-field">
          <label className="ap-label">Refund processing min (days)</label>
          <input type="number" className="ap-input" min="0" value={form.refundProcessingDaysMin ?? ''} onChange={(e) => set('refundProcessingDaysMin', e.target.value === '' ? null : Number(e.target.value))} placeholder="5" />
        </div>
        <div className="ap-field">
          <label className="ap-label">Refund processing max (days)</label>
          <input type="number" className="ap-input" min="0" value={form.refundProcessingDaysMax ?? ''} onChange={(e) => set('refundProcessingDaysMax', e.target.value === '' ? null : Number(e.target.value))} placeholder="10" />
        </div>
      </div>

      <p className="ap-section-label">Offer cadence</p>
      <div className="ap-form-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="ap-field">
          <label className="ap-label">Avg days between major offers</label>
          <input type="number" className="ap-input" min="0" value={form.offerFrequencyDays ?? ''} onChange={(e) => set('offerFrequencyDays', e.target.value === '' ? null : Number(e.target.value))} placeholder="7 = weekly, 30 = monthly" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="ap-btn ap-btn--primary" disabled={saving}>
          {saving ? <><span className="ap-spinner" /> Saving…</> : 'Save logistics'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming events section
// ─────────────────────────────────────────────────────────────────────────────

const BLANK_EVENT = { eventName: '', expectedMonth: '', confidenceLevel: 'MEDIUM', expectedMaxDiscount: '', notes: '' };

function UpcomingEventsManager({ storeId, initial, flash, onChanged }) {
  const [events,  setEvents]  = useState(initial || []);
  const [newItem, setNewItem] = useState(BLANK_EVENT);
  const [adding,  setAdding]  = useState(false);
  const [editing, setEditing] = useState(null); // id of row in edit mode

  useEffect(() => { setEvents(initial || []); }, [initial]);

  async function handleAdd() {
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/upcoming-events`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...newItem,
          expectedMaxDiscount: newItem.expectedMaxDiscount === '' ? null : Number(newItem.expectedMaxDiscount),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created = await res.json();
      setEvents((prev) => [...prev, created].sort((a, b) => a.expectedMonth.localeCompare(b.expectedMonth)));
      setNewItem(BLANK_EVENT);
      flash('success', 'Event added.');
      onChanged();
    } catch (e) { flash('error', e.message); }
    finally { setAdding(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event?')) return;
    const res = await fetch(`/api/admin/stores/${storeId}/upcoming-events/${id}`, { method: 'DELETE' });
    if (!res.ok) { flash('error', (await res.json()).error); return; }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    flash('success', 'Event deleted.');
    onChanged();
  }

  const thisMonth = new Date().toISOString().slice(0, 7); // "2026-03"

  return (
    <div>
      {events.length === 0 && <div className="ap-empty" style={{ marginBottom: '1rem' }}>No upcoming events added yet.</div>}

      {events.length > 0 && (
        <div className="ap-table-wrap" style={{ marginBottom: '1rem' }}>
          <table className="ap-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Expected</th>
                <th>Confidence</th>
                <th>Expected max %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.eventName}</td>
                  <td className="ap-table__mono">{ev.expectedMonth}</td>
                  <td>
                    <div className="ap-confidence">
                      {[1,2,3].map((i) => (
                        <span key={i} className={`ap-confidence__pip ${
                          (ev.confidenceLevel === 'LOW' && i === 1) ||
                          (ev.confidenceLevel === 'MEDIUM' && i <= 2) ||
                          (ev.confidenceLevel === 'HIGH')
                          ? `ap-confidence__pip--${ev.confidenceLevel}` : ''
                        }`} />
                      ))}
                      <span style={{ fontSize: '0.7rem', marginLeft: '0.3rem', color: 'var(--ap-text-secondary)' }}>
                        {CONFIDENCE_LABELS[ev.confidenceLevel]}
                      </span>
                    </div>
                  </td>
                  <td className="ap-table__mono">
                    {ev.expectedMaxDiscount != null ? `${ev.expectedMaxDiscount}%` : '—'}
                  </td>
                  <td>
                    <button className="ap-btn ap-btn--danger ap-btn--xs" onClick={() => handleDelete(ev.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add form */}
      <p className="ap-section-label">Add event</p>
      <div className="ap-form-grid" style={{ marginBottom: '0.75rem' }}>
        <div className="ap-field" style={{ gridColumn: 'span 2' }}>
          <label className="ap-label">Event name *</label>
          <input className="ap-input" value={newItem.eventName} onChange={(e) => setNewItem((f) => ({ ...f, eventName: e.target.value }))} placeholder="Ramadan Sale" />
        </div>
        <div className="ap-field">
          <label className="ap-label">Expected month * (YYYY-MM)</label>
          <input className="ap-input" type="month" value={newItem.expectedMonth} min={thisMonth} onChange={(e) => setNewItem((f) => ({ ...f, expectedMonth: e.target.value }))} />
        </div>
        <div className="ap-field">
          <label className="ap-label">Confidence</label>
          <select className="ap-select" value={newItem.confidenceLevel} onChange={(e) => setNewItem((f) => ({ ...f, confidenceLevel: e.target.value }))}>
            <option value="LOW">Low — industry pattern</option>
            <option value="MEDIUM">Medium — historical behaviour</option>
            <option value="HIGH">High — admin confirmed</option>
          </select>
        </div>
        <div className="ap-field">
          <label className="ap-label">Expected max discount (%)</label>
          <input type="number" className="ap-input" min="0" max="100" value={newItem.expectedMaxDiscount} onChange={(e) => setNewItem((f) => ({ ...f, expectedMaxDiscount: e.target.value }))} placeholder="Optional" />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="ap-btn ap-btn--primary ap-btn--sm"
          onClick={handleAdd}
          disabled={adding || !newItem.eventName || !newItem.expectedMonth}
        >
          {adding ? <span className="ap-spinner" /> : '+ Add event'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Peak seasons section
// ─────────────────────────────────────────────────────────────────────────────

const SEASON_PRESETS = [
  { seasonKey: 'ramadan',          nameEn: 'Ramadan Sale',       nameAr: 'تخفيضات رمضان'       },
  { seasonKey: 'white_friday',     nameEn: 'White Friday',       nameAr: 'الجمعة البيضاء'       },
  { seasonKey: 'national_day',     nameEn: 'National Day',       nameAr: 'اليوم الوطني'          },
  { seasonKey: 'back_to_school',   nameEn: 'Back to School',     nameAr: 'العودة للمدارس'         },
  { seasonKey: 'summer_sale',      nameEn: 'Summer Sale',        nameAr: 'تخفيضات الصيف'         },
  { seasonKey: 'year_end',         nameEn: 'Year End Sale',      nameAr: 'تخفيضات نهاية العام'   },
];

const BLANK_SEASON = { seasonKey: '', nameEn: '', nameAr: '' };

function PeakSeasonsManager({ storeId, initial, flash, onChanged }) {
  const [seasons,    setSeasons]    = useState(initial || []);
  const [newSeason,  setNewSeason]  = useState(BLANK_SEASON);
  const [usePreset,  setUsePreset]  = useState(true);
  const [adding,     setAdding]     = useState(false);

  useEffect(() => { setSeasons(initial || []); }, [initial]);

  const existingKeys = new Set(seasons.map((s) => s.seasonKey));
  const availablePresets = SEASON_PRESETS.filter((p) => !existingKeys.has(p.seasonKey));

  function applyPreset(preset) {
    setNewSeason(preset);
  }

  async function handleAdd() {
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/peak-seasons`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(newSeason),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSeasons((prev) => [...prev, await res.json()].sort((a,b) => a.seasonKey.localeCompare(b.seasonKey)));
      setNewSeason(BLANK_SEASON);
      flash('success', 'Season added.');
      onChanged();
    } catch (e) { flash('error', e.message); }
    finally { setAdding(false); }
  }

  async function handleDelete(id, seasonKey) {
    if (!confirm(`Remove "${seasonKey}" from this store?`)) return;
    const res = await fetch(`/api/admin/stores/${storeId}/peak-seasons/${id}`, { method: 'DELETE' });
    if (!res.ok) { flash('error', (await res.json()).error); return; }
    setSeasons((prev) => prev.filter((s) => s.id !== id));
    flash('success', 'Season removed.');
    onChanged();
  }

  return (
    <div>
      {/* Current seasons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {seasons.length === 0 && <span style={{ color: 'var(--ap-text-muted)', fontSize: '0.8rem', fontFamily: 'var(--ap-mono)' }}>None added yet.</span>}
        {seasons.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.65rem', border: '1px solid var(--ap-border)', borderRadius: '4px', background: 'var(--ap-surface-2)' }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{s.nameEn}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)', direction: 'rtl' }}>{s.nameAr}</div>
            </div>
            <button
              onClick={() => handleDelete(s.id, s.seasonKey)}
              style={{ background: 'none', border: 'none', color: 'var(--ap-text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.2rem' }}
            >✕</button>
          </div>
        ))}
      </div>

      {/* Presets */}
      {availablePresets.length > 0 && (
        <>
          <p className="ap-section-label">Quick-add preset seasons</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
            {availablePresets.map((p) => (
              <button
                key={p.seasonKey}
                className="ap-btn ap-btn--ghost ap-btn--xs"
                onClick={async () => {
                  setAdding(true);
                  try {
                    const res = await fetch(`/api/admin/stores/${storeId}/peak-seasons`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(p),
                    });
                    if (!res.ok) throw new Error((await res.json()).error);
                    setSeasons((prev) => [...prev, await res.json()].sort((a,b) => a.seasonKey.localeCompare(b.seasonKey)));
                    flash('success', `${p.nameEn} added.`);
                    onChanged();
                  } catch (e) { flash('error', e.message); }
                  finally { setAdding(false); }
                }}
                disabled={adding}
              >
                + {p.nameEn}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Custom season */}
      <p className="ap-section-label">Custom season</p>
      <div className="ap-form-grid" style={{ marginBottom: '0.75rem' }}>
        <div className="ap-field">
          <label className="ap-label">Season key (slug)</label>
          <input className="ap-input" value={newSeason.seasonKey} onChange={(e) => setNewSeason((f) => ({ ...f, seasonKey: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} placeholder="eid_al_fitr" />
        </div>
        <div className="ap-field">
          <label className="ap-label">Name (English)</label>
          <input className="ap-input" value={newSeason.nameEn} onChange={(e) => setNewSeason((f) => ({ ...f, nameEn: e.target.value }))} placeholder="Eid Al Fitr Sale" />
        </div>
        <div className="ap-field" dir="rtl">
          <label className="ap-label" dir="ltr">Name (Arabic)</label>
          <input className="ap-input" value={newSeason.nameAr} onChange={(e) => setNewSeason((f) => ({ ...f, nameAr: e.target.value }))} placeholder="تخفيضات عيد الفطر" dir="rtl" />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="ap-btn ap-btn--primary ap-btn--sm"
          onClick={handleAdd}
          disabled={adding || !newSeason.seasonKey || !newSeason.nameEn || !newSeason.nameAr}
        >
          {adding ? <span className="ap-spinner" /> : '+ Add custom season'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Metrics history section
// ─────────────────────────────────────────────────────────────────────────────

function MetricsHistory({ metrics }) {
  if (!metrics?.length) return <div className="ap-empty">No monthly snapshots yet. Run the intelligence cron.</div>;

  return (
    <div className="ap-table-wrap">
      <table className="ap-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Score</th>
            <th>Max stackable</th>
            <th>Avg discount</th>
            <th>Quality ratio</th>
            <th>Active offers</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => {
            const breakdown = m.scoreBreakdown ? JSON.parse(m.scoreBreakdown) : null;
            const scoreClass = m.storeScore >= 7.5 ? 'high' : m.storeScore >= 5 ? 'mid' : 'low';
            return (
              <tr key={m.monthIdentifier}>
                <td className="ap-table__mono">{m.monthIdentifier}</td>
                <td>
                  <span className={`ap-score ap-score--${scoreClass}`}>{m.storeScore.toFixed(1)}</span>
                </td>
                <td className="ap-table__mono ap-table__dim">{fmtPct(m.maxStackableSavingsPercent)}</td>
                <td className="ap-table__mono ap-table__dim">{fmtPct(m.averageDiscountPercent)}</td>
                <td className="ap-table__mono ap-table__dim">
                  {m.offerQualityRatio != null ? `${(m.offerQualityRatio * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="ap-table__mono ap-table__dim">{m.totalActiveOffers}</td>
                <td className="ap-table__dim" style={{ fontSize: '0.72rem' }}>
                  {new Date(m.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const TABS = ['Logistics', 'Upcoming Events', 'Peak Seasons', 'Metrics History'];

export default function StoreIntelligencePage() {
  const params = useParams();
  const storeId = Number(params.id);

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('Logistics');
  const [alert,   setAlert]   = useState(null);
  const [running, setRunning] = useState(false);

  function flash(type, msg) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/stores/${storeId}/intelligence`);
    setData(await res.json());
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  async function triggerCron() {
    setRunning(true);
    try {
      const res = await fetch('/api/admin/intelligence/trigger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storeId }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      flash('success', `Intelligence recalculated in ${result.durationMs}ms.`);
      await load();
    } catch (e) {
      flash('error', e.message);
    } finally {
      setRunning(false);
    }
  }

  if (loading && !data) return (
    <div className="ap-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <span className="ap-spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
    </div>
  );

  const storeName = data?.translations?.[0]?.name ?? `Store #${storeId}`;
  const latestMetrics = data?.savingsMetrics?.[0];
  const latestSnap    = data?.savingsSnapshots?.[0];

  return (
    <div className="ap-root">
      <div className="ap-page">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="ap-page-header">
          <h1 className="ap-page-title">
            {data?.logo && <img src={data.logo} alt="" style={{ height: '24px', objectFit: 'contain' }} />}
            {storeName}
            <small>Store Intelligence</small>
          </h1>
          <div className="ap-page-actions">
            <a href={`/admin/stores/${storeId}`} className="ap-btn ap-btn--ghost ap-btn--sm">← Store</a>
            <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={triggerCron} disabled={running}>
              {running ? <><span className="ap-spinner" /> Running…</> : '▷ Recalculate'}
            </button>
          </div>
        </div>

        {alert && <div className={`ap-alert ap-alert--${alert.type}`}>{alert.msg}</div>}

        {/* ── Top stats ────────────────────────────────────────────────── */}
        <div className="ap-stats-row" style={{ marginBottom: '1.5rem' }}>
          <div className="ap-stat">
            <span className="ap-stat__label">Store Score</span>
            <span className={`ap-stat__value ${latestMetrics?.storeScore >= 7.5 ? 'ap-stat__value--green' : latestMetrics?.storeScore >= 5 ? 'ap-stat__value--amber' : 'ap-stat__value--red'}`}>
              {latestMetrics?.storeScore?.toFixed(1) ?? '—'}
              <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>/10</span>
            </span>
            <span className="ap-stat__sub">{latestMetrics?.monthIdentifier ?? 'No data'}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Leaderboard rank</span>
            <span className="ap-stat__value ap-stat__value--accent">{latestSnap?.rank != null ? `#${latestSnap.rank}` : '—'}</span>
            <span className="ap-stat__sub">{latestSnap?.weekIdentifier ?? ''}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Max stackable saving</span>
            <span className="ap-stat__value">{fmtPct(latestMetrics?.maxStackableSavingsPercent)}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Offer quality ratio</span>
            <span className="ap-stat__value">
              {latestMetrics?.offerQualityRatio != null ? `${(latestMetrics.offerQualityRatio * 100).toFixed(0)}%` : '—'}
            </span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Active offers</span>
            <span className="ap-stat__value">{latestMetrics?.totalActiveOffers ?? '—'}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Last verified</span>
            <span className="ap-stat__value" style={{ fontSize: '0.85rem' }}>
              {data?.lastVerifiedAt ? new Date(data.lastVerifiedAt).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>

        {/* ── Score breakdown ───────────────────────────────────────────── */}
        {latestMetrics?.scoreBreakdown && (() => {
          const bd = JSON.parse(latestMetrics.scoreBreakdown);
          return (
            <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
              <div className="ap-card-header">
                <span className="ap-card-title">Score breakdown — {latestMetrics.monthIdentifier}</span>
              </div>
              <div className="ap-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                  <ScoreBar label="Max Stackable Savings" value={bd.maxStackableSavings} weight={0.35} />
                  <ScoreBar label="Offer Quality"         value={bd.offerQuality}        weight={0.15} />
                  <ScoreBar label="Delivery Speed"        value={bd.deliverySpeed}       weight={0.15} />
                  <ScoreBar label="Return Flexibility"    value={bd.returnFlexibility}   weight={0.15} />
                  <ScoreBar label="Offer Frequency"       value={bd.offerFrequency}      weight={0.10} />
                  <ScoreBar label="Payment Flexibility"   value={bd.paymentFlexibility}  weight={0.10} />
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="ap-tabs">
          {TABS.map((t) => (
            <button key={t} className={`ap-tab ${tab === t ? 'ap-tab--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="ap-card">
          <div className="ap-card-body">
            {tab === 'Logistics' && (
              <LogisticsForm
                storeId={storeId}
                initial={data}
                onSaved={(updated) => setData((d) => ({ ...d, ...updated }))}
                flash={flash}
              />
            )}
            {tab === 'Upcoming Events' && (
              <UpcomingEventsManager
                storeId={storeId}
                initial={data?.upcomingEvents}
                flash={flash}
                onChanged={load}
              />
            )}
            {tab === 'Peak Seasons' && (
              <PeakSeasonsManager
                storeId={storeId}
                initial={data?.peakSeasons}
                flash={flash}
                onChanged={load}
              />
            )}
            {tab === 'Metrics History' && (
              <MetricsHistory metrics={data?.savingsMetrics} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
