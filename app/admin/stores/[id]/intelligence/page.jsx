'use client';
// app/admin/stores/[id]/intelligence/page.jsx
// Full intelligence editor for one store:
//   — Description (rich text, EN + AR)
//   — Sections (dynamic editorial blocks with images, links, embedded vouchers/promos)
//   — Logistics & delivery info
//   — Offer cadence
//   — Peak seasons
//   — Upcoming events
//   — Monthly metrics history
//   — Trigger intelligence cron for this store

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import '@/components/admin/admin-panel.css';
import RichTextEditor from '@/components/admin/RichTextEditor/RichTextEditor';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CONFIDENCE_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };

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
// Description editor
// ─────────────────────────────────────────────────────────────────────────────

function DescriptionEditor({ storeId, initialEn, initialAr, flash }) {
  const [descEn,  setDescEn]  = useState(initialEn || '');
  const [descAr,  setDescAr]  = useState(initialAr || '');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { setDescEn(initialEn || ''); }, [initialEn]);
  useEffect(() => { setDescAr(initialAr || ''); }, [initialAr]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/description`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ descriptionEn: descEn, descriptionAr: descAr }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      flash('success', 'Description saved — it will appear in the Store Intelligence card.');
    } catch (e) {
      flash('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--ap-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
        This description appears directly in the <strong>Store Intelligence Card</strong> on the store page.
        Write it from the shopper's perspective — what makes this store unique, what to expect, tips for saving.
        Supports bold, italic, lists and links. Both languages are shown to their respective audiences.
      </p>

      <p className="ap-section-label">English description</p>
      <RichTextEditor
        key={`en-${storeId}`}
        value={descEn}
        onChange={setDescEn}
        dir="ltr"
        placeholder="e.g. Noon is Saudi Arabia's leading e-commerce platform offering…"
        minHeight={220}
      />

      <p className="ap-section-label" style={{ marginTop: '1.75rem' }}>
        Arabic description — الوصف بالعربية
      </p>
      <RichTextEditor
        key={`ar-${storeId}`}
        value={descAr}
        onChange={setDescAr}
        dir="rtl"
        placeholder="مثال: نون هي المنصة الرائدة للتسوق الإلكتروني في السعودية…"
        minHeight={220}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button
          type="button"
          className="ap-btn ap-btn--primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <><span className="ap-spinner" /> Saving…</> : 'Save description'}
        </button>
      </div>
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

  const thisMonth = new Date().toISOString().slice(0, 7);

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
  { seasonKey: 'ramadan',        nameEn: 'Ramadan Sale',       nameAr: 'تخفيضات رمضان'     },
  { seasonKey: 'white_friday',   nameEn: 'White Friday',       nameAr: 'الجمعة البيضاء'     },
  { seasonKey: 'national_day',   nameEn: 'National Day',       nameAr: 'اليوم الوطني'       },
  { seasonKey: 'back_to_school', nameEn: 'Back to School',     nameAr: 'العودة للمدارس'     },
  { seasonKey: 'summer_sale',    nameEn: 'Summer Sale',        nameAr: 'تخفيضات الصيف'     },
  { seasonKey: 'year_end',       nameEn: 'Year End Sale',      nameAr: 'تخفيضات نهاية العام'},
];

const BLANK_SEASON = { seasonKey: '', nameEn: '', nameAr: '' };

function PeakSeasonsManager({ storeId, initial, flash, onChanged }) {
  const [seasons,   setSeasons]   = useState(initial || []);
  const [newSeason, setNewSeason] = useState(BLANK_SEASON);
  const [adding,    setAdding]    = useState(false);

  useEffect(() => { setSeasons(initial || []); }, [initial]);

  const existingKeys     = new Set(seasons.map((s) => s.seasonKey));
  const availablePresets = SEASON_PRESETS.filter((p) => !existingKeys.has(p.seasonKey));

  async function handleAdd() {
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/peak-seasons`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(newSeason),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSeasons((prev) => [...prev, data].sort((a,b) => a.seasonKey.localeCompare(b.seasonKey)));
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {seasons.length === 0 && <span style={{ color: 'var(--ap-text-muted)', fontSize: '0.8rem', fontFamily: 'var(--ap-mono)' }}>None added yet.</span>}
        {seasons.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.65rem', border: '1px solid var(--ap-border)', borderRadius: '4px', background: 'var(--ap-surface-2)' }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{s.nameEn}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)', direction: 'rtl' }}>{s.nameAr}</div>
            </div>
            <button onClick={() => handleDelete(s.id, s.seasonKey)} style={{ background: 'none', border: 'none', color: 'var(--ap-text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.2rem' }}>✕</button>
          </div>
        ))}
      </div>

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
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    setSeasons((prev) => [...prev, data].sort((a,b) => a.seasonKey.localeCompare(b.seasonKey)));
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
            <th>Active offers</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => {
            const scoreClass = m.storeScore >= 7.5 ? 'high' : m.storeScore >= 5 ? 'mid' : 'low';
            return (
              <tr key={m.monthIdentifier}>
                <td className="ap-table__mono">{m.monthIdentifier}</td>
                <td>
                  <span className={`ap-score ap-score--${scoreClass}`}>{m.storeScore.toFixed(1)}</span>
                </td>
                <td className="ap-table__mono ap-table__dim">{fmtPct(m.maxStackableSavingsPercent)}</td>
                <td className="ap-table__mono ap-table__dim">{fmtPct(m.averageDiscountPercent)}</td>
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
// ★ SECTION MANAGER (Intelligence Sections)
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_BLANK = {
  id: null,
  locale: 'en',
  title: '',
  content: '',
  image: '',
  linkUrl: '',
  linkText: '',
  order: 0,
  columnSpan: 1,
  voucherId: null,
  promoId: null,
};

function SectionsManager({ storeId, flash, onChanged }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/intelligence-sections`);
      const data = await res.json();
      // ✅ Ensure we always have an array
      setSections(Array.isArray(data) ? data : []);
      if (!res.ok) {
        flash('error', data.error || 'Failed to load sections');
      }
    } catch (e) {
      flash('error', e.message);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, flash]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  async function saveSection(data) {
    const isUpdate = !!data.id;
    const url = `/api/admin/stores/${storeId}/intelligence-sections${isUpdate ? `/${data.id}` : ''}`;
    const method = isUpdate ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('success', isUpdate ? 'Section updated' : 'Section added');
      setEditing(null);
      onChanged();
      await fetchSections();
    } catch (e) {
      flash('error', e.message);
    }
  }

  async function deleteSection(id) {
    if (!confirm('Delete this section?')) return;
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/intelligence-sections/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('success', 'Section deleted');
      await fetchSections();
      onChanged();
    } catch (e) {
      flash('error', e.message);
    }
  }

  if (loading) return <div className="ap-empty">Loading sections...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Custom Intelligence Sections</h3>
        <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={() => setEditing({ ...SECTION_BLANK })}>
          + Add Section
        </button>
      </div>

      {sections.length === 0 && !editing && (
        <div className="ap-empty">No custom sections yet. Add one to appear in the store intelligence card.</div>
      )}

      {sections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {sections.map((sec) => (
            <div key={sec.id} className="ap-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', border: '1px solid var(--ap-border)', borderRadius: 6 }}>
              <div>
                <strong>{sec.title}</strong>
                <span className="ap-badge" style={{ fontSize: '0.6rem', background: sec.locale === 'en' ? '#dbeafe' : '#fef3c7' }}>
                  {sec.locale === 'en' ? 'EN' : 'AR'}
                </span>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--ap-text-muted)' }}>
                  Order: {sec.order} | Span: {sec.columnSpan === 2 ? 'Full' : 'Half'}
                </span>
                {sec.voucherId && <span className="ap-badge" style={{ marginLeft: '0.25rem', background: '#d1fae5' }}>💳 Voucher</span>}
                {sec.promoId && <span className="ap-badge" style={{ marginLeft: '0.25rem', background: '#fef3c7' }}>🏦 Promo</span>}
              </div>
              <div>
                <button className="ap-btn ap-btn--ghost ap-btn--xs" onClick={() => setEditing({ ...sec })}>Edit</button>
                <button className="ap-btn ap-btn--danger ap-btn--xs" onClick={() => deleteSection(sec.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <SectionForm
          section={editing}
          storeId={storeId}
          onSave={saveSection}
          onCancel={() => setEditing(null)}
          flash={flash}
        />
      )}
    </div>
  );
}

// ─── Section Form ────────────────────────────────────────────────────────────

function SectionForm({ section, storeId, onSave, onCancel, flash }) {
  const [form, setForm] = useState({
    id: section.id || null,
    locale: section.locale || 'en',
    title: section.title || '',
    content: section.content || '',
    image: section.image || '',
    linkUrl: section.linkUrl || '',
    linkText: section.linkText || '',
    order: section.order || 0,
    columnSpan: section.columnSpan || 1,
    voucherId: section.voucherId || '',
    promoId: section.promoId || '',
  });

  const [vouchers, setVouchers] = useState([]);
  const [promos, setPromos] = useState([]);
  const [fetchError, setFetchError] = useState(false);

  // Fetch vouchers and promos for dropdowns
  useEffect(() => {
    (async () => {
      try {
        const [vRes, pRes] = await Promise.all([
          fetch(`/api/admin/stores/${storeId}/vouchers?limit=100`),
          fetch(`/api/admin/stores/${storeId}/other-promos?limit=100`),
        ]);
        if (vRes.ok) setVouchers(await vRes.json());
        if (pRes.ok) setPromos(await pRes.json());
      } catch (e) {
        console.error('Failed to fetch embeddable items:', e);
        setFetchError(true);
      }
    })();
  }, [storeId]);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.locale || !form.title || !form.content) {
      flash('error', 'Title, content and locale are required');
      return;
    }
    onSave(form);
  }

  function renderContentEditor() {
    try {
      return (
        <RichTextEditor
          key={`${form.id || 'new'}-${form.locale}`}
          value={form.content}
          onChange={(val) => setField('content', val)}
          dir={form.locale === 'ar' ? 'rtl' : 'ltr'}
          placeholder="Write your editorial content here…"
          minHeight={200}
        />
      );
    } catch (e) {
      console.warn('RichTextEditor not available, using textarea fallback');
      return (
        <textarea
          className="ap-input"
          value={form.content}
          onChange={(e) => setField('content', e.target.value)}
          rows={6}
          placeholder="Write your content here (HTML supported)…"
          dir={form.locale === 'ar' ? 'rtl' : 'ltr'}
        />
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ap-form" style={{ borderTop: '1px solid var(--ap-border)', paddingTop: '1.5rem' }}>
      <div className="ap-form-grid">
        <div className="ap-field">
          <label className="ap-label">Locale *</label>
          <select className="ap-select" value={form.locale} onChange={(e) => setField('locale', e.target.value)}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
        <div className="ap-field">
          <label className="ap-label">Order *</label>
          <input type="number" className="ap-input" min="0" value={form.order} onChange={(e) => setField('order', parseInt(e.target.value) || 0)} />
        </div>
        <div className="ap-field">
          <label className="ap-label">Column Span</label>
          <select className="ap-select" value={form.columnSpan} onChange={(e) => setField('columnSpan', parseInt(e.target.value))}>
            <option value="1">Half width</option>
            <option value="2">Full width</option>
          </select>
        </div>
      </div>

      <div className="ap-field">
        <label className="ap-label">Title *</label>
        <input className="ap-input" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Section heading" />
      </div>

      <div className="ap-field">
        <label className="ap-label">Content (HTML / rich text) *</label>
        {renderContentEditor()}
      </div>

      <div className="ap-form-grid">
        <div className="ap-field">
          <label className="ap-label">Image URL</label>
          <input className="ap-input" value={form.image} onChange={(e) => setField('image', e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>
        <div className="ap-field">
          <label className="ap-label">Link URL</label>
          <input className="ap-input" value={form.linkUrl} onChange={(e) => setField('linkUrl', e.target.value)} placeholder="https://..." />
        </div>
        <div className="ap-field">
          <label className="ap-label">Link text</label>
          <input className="ap-input" value={form.linkText} onChange={(e) => setField('linkText', e.target.value)} placeholder="Read more" />
        </div>
      </div>

      <div className="ap-form-grid">
        <div className="ap-field">
          <label className="ap-label">Embed Voucher (optional)</label>
          {fetchError ? (
            <div className="ap-text-muted" style={{ fontSize: '0.8rem', color: 'var(--ap-text-muted)' }}>Could not load vouchers</div>
          ) : (
            <select className="ap-select" value={form.voucherId} onChange={(e) => setField('voucherId', e.target.value ? parseInt(e.target.value) : '')}>
              <option value="">— None —</option>
              {vouchers.map(v => (
                <option key={v.id} value={v.id}>{v.translations?.[0]?.title || v.code || `Voucher #${v.id}`}</option>
              ))}
            </select>
          )}
        </div>
        <div className="ap-field">
          <label className="ap-label">Embed Promo (optional)</label>
          {fetchError ? (
            <div className="ap-text-muted" style={{ fontSize: '0.8rem', color: 'var(--ap-text-muted)' }}>Could not load promos</div>
          ) : (
            <select className="ap-select" value={form.promoId} onChange={(e) => setField('promoId', e.target.value ? parseInt(e.target.value) : '')}>
              <option value="">— None —</option>
              {promos.map(p => (
                <option key={p.id} value={p.id}>{p.translations?.[0]?.title || `Promo #${p.id}`}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button type="button" className="ap-btn ap-btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="ap-btn ap-btn--primary">
          {form.id ? 'Update Section' : 'Add Section'}
        </button>
      </div>
    </form>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const TABS = ['Description', 'Sections', 'Logistics', 'Upcoming Events', 'Peak Seasons', 'Metrics History'];

export default function StoreIntelligencePage() {
  const params  = useParams();
  const storeId = Number(params.id);

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('Description');
  const [alert,   setAlert]   = useState(null);
  const [running, setRunning] = useState(false);

  function flash(type, msg) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/stores/${storeId}/intelligence`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load');
      }
      setData(await res.json());
    } catch (e) {
      flash('error', e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId && !isNaN(storeId)) fetchData();
    else setLoading(false);
  }, [fetchData]);

  async function triggerCron() {
    setRunning(true);
    try {
      const res    = await fetch('/api/admin/intelligence/trigger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ storeId }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);
      flash('success', `Intelligence recalculated in ${result.durationMs}ms.`);
      await fetchData();
    } catch (e) {
      flash('error', e.message);
    } finally {
      setRunning(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="ap-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="ap-spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
      </div>
    );
  }

  // Support both old (single EN translation at [0]) and new (array with locale field)
  const translations  = data?.translations || [];
  const enTranslation = translations.find(t => t.locale === 'en') || translations[0] || {};
  const arTranslation = translations.find(t => t.locale === 'ar') || {};

  const storeName     = enTranslation.name ?? `Store #${storeId}`;
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
            <span className="ap-stat__label">Active offers</span>
            <span className="ap-stat__value">{latestMetrics?.totalActiveOffers ?? '—'}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Last verified</span>
            <span className="ap-stat__value" style={{ fontSize: '0.85rem' }}>
              {data?.lastVerifiedAt ? new Date(data.lastVerifiedAt).toLocaleDateString() : 'Never'}
            </span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Description</span>
            <span className={`ap-stat__value ${enTranslation.description ? 'ap-stat__value--green' : 'ap-stat__value--red'}`} style={{ fontSize: '0.8rem' }}>
              {enTranslation.description ? '✓ Set' : '✗ Missing'}
            </span>
            <span className="ap-stat__sub">{arTranslation.description ? '✓ AR set' : '✗ AR missing'}</span>
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
            <button key={t} className={`ap-tab ${tab === t ? 'ap-tab--active' : ''}`} onClick={() => setTab(t)}>
              {t === 'Description' && (
                <span
                  style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: enTranslation.description ? '#22c55e' : '#ef4444',
                    marginRight: 5, verticalAlign: 'middle',
                  }}
                />
              )}
              {t}
            </button>
          ))}
        </div>

        <div className="ap-card">
          <div className="ap-card-body">

            {/* ── Description tab ──────────────────────────────────────── */}
            {tab === 'Description' && (
              <DescriptionEditor
                storeId={storeId}
                initialEn={enTranslation.description || ''}
                initialAr={arTranslation.description || ''}
                flash={flash}
              />
            )}

            {/* ── Sections tab ─────────────────────────────────────────── */}
            {tab === 'Sections' && (
              <SectionsManager
                storeId={storeId}
                flash={flash}
                onChanged={fetchData}
              />
            )}

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
                onChanged={fetchData}
              />
            )}

            {tab === 'Peak Seasons' && (
              <PeakSeasonsManager
                storeId={storeId}
                initial={data?.peakSeasons}
                flash={flash}
                onChanged={fetchData}
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
