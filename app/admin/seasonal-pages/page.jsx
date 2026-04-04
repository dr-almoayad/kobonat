'use client';
// app/admin/seasonal-pages/page.jsx
// Lists all seasonal pages, shows live/upcoming/inactive status,
// and opens an inline create form.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/components/admin/admin-panel.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLive(page) {
  if (!page.startMonth || !page.endMonth) return !!page.isActive;
  const now   = new Date();
  const m     = now.getMonth() + 1;
  const d     = now.getDate();
  const cur   = m * 100 + d;
  const start = page.startMonth * 100 + (page.startDay || 1);
  const end   = page.endMonth   * 100 + (page.endDay   || 28);
  return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end;
}

function daysUntil(page) {
  if (!page.startMonth) return null;
  if (isLive(page)) return null;
  const now  = new Date();
  let target = new Date(now.getFullYear(), page.startMonth - 1, page.startDay || 1);
  if (target <= now) target = new Date(now.getFullYear() + 1, page.startMonth - 1, page.startDay || 1);
  return Math.ceil((target - now) / 86400000);
}

function StatusBadge({ page }) {
  if (!page.isActive) {
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 3,
        background: 'rgba(255,255,255,0.05)', color: 'var(--ap-text-muted)' }}>
        INACTIVE
      </span>
    );
  }
  if (isLive(page)) {
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 3,
        background: 'rgba(63,185,80,0.12)', color: 'var(--ap-green)',
        display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ap-green)',
          boxShadow: '0 0 6px var(--ap-green)' }} />
        LIVE
      </span>
    );
  }
  const days = daysUntil(page);
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 3,
      background: 'rgba(210,153,34,0.12)', color: 'var(--ap-amber)' }}>
      {days != null ? `IN ${days}d` : 'UPCOMING'}
    </span>
  );
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS = MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }));

const PRESET_SEASONS = [
  { slug: 'white_friday',   seasonKey: 'white_friday',   label: 'White Friday',     startMonth: 11, endMonth: 11 },
  { slug: 'ramadan',        seasonKey: 'ramadan',         label: 'Ramadan',          startMonth: null, endMonth: null },
  { slug: 'national_day',   seasonKey: 'national_day',    label: 'National Day (SA)',startMonth: 9,  endMonth: 9  },
  { slug: 'back_to_school', seasonKey: 'back_to_school',  label: 'Back to School',   startMonth: 8,  endMonth: 9  },
  { slug: 'summer_sale',    seasonKey: 'summer_sale',     label: 'Summer Sale',      startMonth: 6,  endMonth: 8  },
  { slug: 'year_end',       seasonKey: 'year_end',        label: 'Year End Sale',    startMonth: 12, endMonth: 12 },
  { slug: 'eid_al_fitr',    seasonKey: 'eid_al_fitr',     label: 'Eid Al Fitr',      startMonth: null, endMonth: null },
  { slug: 'eid_al_adha',    seasonKey: 'eid_al_adha',     label: 'Eid Al Adha',      startMonth: null, endMonth: null },
];

// ── Create form ───────────────────────────────────────────────────────────────

function CreateForm({ countries, onCreated, onCancel }) {
  const [form, setForm]     = useState({
    slug: '', seasonKey: '', heroImage: '',
    startMonth: '', startDay: '', endMonth: '', endDay: '',
    useStorePeakSeasonData: true, showInFooter: false, showInNav: false,
    isActive: true,
    title_en: '', offSeasonTitle_en: '',
    title_ar: '', offSeasonTitle_ar: '',
    countryIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function applyPreset(preset) {
    setForm(f => ({
      ...f,
      slug:       preset.slug,
      seasonKey:  preset.seasonKey,
      startMonth: preset.startMonth || '',
      endMonth:   preset.endMonth   || '',
    }));
  }

  function toggle(key) { setForm(f => ({ ...f, [key]: !f[key] })); }

  function toggleCountry(id) {
    setForm(f => ({
      ...f,
      countryIds: f.countryIds.includes(id)
        ? f.countryIds.filter(c => c !== id)
        : [...f.countryIds, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.slug || !form.seasonKey) { setError('Slug and season key are required'); return; }
    if (form.countryIds.length === 0)  { setError('Select at least one country');       return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/seasonal-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug:      form.slug,
          seasonKey: form.seasonKey,
          heroImage: form.heroImage || null,
          startMonth: form.startMonth ? parseInt(form.startMonth) : null,
          startDay:   form.startDay   ? parseInt(form.startDay)   : null,
          endMonth:   form.endMonth   ? parseInt(form.endMonth)   : null,
          endDay:     form.endDay     ? parseInt(form.endDay)     : null,
          useStorePeakSeasonData: form.useStorePeakSeasonData,
          showInFooter: form.showInFooter,
          showInNav:    form.showInNav,
          isActive:     form.isActive,
          countryIds:   form.countryIds,
          translations: [
            { locale: 'en', title: form.title_en, offSeasonTitle: form.offSeasonTitle_en },
            { locale: 'ar', title: form.title_ar, offSeasonTitle: form.offSeasonTitle_ar },
          ].filter(t => t.title || t.offSeasonTitle),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
      <div className="ap-card-header">
        <span className="ap-card-title">New Seasonal Page</span>
        <button onClick={onCancel}
          style={{ background: 'none', border: 'none', color: 'var(--ap-text-muted)', cursor: 'pointer', fontSize: '1rem' }}>
          ✕
        </button>
      </div>
      <div className="ap-card-body">
        {error && <div className="ap-alert ap-alert--error" style={{ marginBottom: '1rem' }}>{error}</div>}

        {/* Presets */}
        <p className="ap-section-label">Quick presets</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {PRESET_SEASONS.map(p => (
            <button key={p.slug} type="button" className="ap-btn ap-btn--ghost ap-btn--xs"
              onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Slug + seasonKey */}
          <p className="ap-section-label">Identity</p>
          <div className="ap-form-grid" style={{ marginBottom: '1rem' }}>
            <div className="ap-field">
              <label className="ap-label">Slug * <span style={{ color: 'var(--ap-text-muted)', fontWeight: 400, textTransform: 'none' }}>(URL path)</span></label>
              <input className="ap-input" value={form.slug} required
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g,'_') }))}
                placeholder="white_friday" />
            </div>
            <div className="ap-field">
              <label className="ap-label">Season Key * <span style={{ color: 'var(--ap-text-muted)', fontWeight: 400, textTransform: 'none' }}>(links StorePeakSeason)</span></label>
              <input className="ap-input" value={form.seasonKey} required
                onChange={e => setForm(f => ({ ...f, seasonKey: e.target.value.toLowerCase().replace(/\s+/g,'_') }))}
                placeholder="white_friday" />
            </div>
          </div>

          {/* Date range */}
          <p className="ap-section-label">Annual date window <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.68rem' }}>(leave blank for always-live)</span></p>
          <div className="ap-form-grid ap-form-grid--wide" style={{ marginBottom: '1rem' }}>
            <div className="ap-field">
              <label className="ap-label">Start Month</label>
              <select className="ap-select" value={form.startMonth}
                onChange={e => setForm(f => ({ ...f, startMonth: e.target.value }))}>
                <option value="">—</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">Start Day</label>
              <input className="ap-input" type="number" min="1" max="31" value={form.startDay}
                onChange={e => setForm(f => ({ ...f, startDay: e.target.value }))} placeholder="1" />
            </div>
            <div className="ap-field">
              <label className="ap-label">End Month</label>
              <select className="ap-select" value={form.endMonth}
                onChange={e => setForm(f => ({ ...f, endMonth: e.target.value }))}>
                <option value="">—</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">End Day</label>
              <input className="ap-input" type="number" min="1" max="31" value={form.endDay}
                onChange={e => setForm(f => ({ ...f, endDay: e.target.value }))} placeholder="30" />
            </div>
          </div>

          {/* Basic translations */}
          <p className="ap-section-label">Title (you can add full copy in the editor)</p>
          <div className="ap-form-grid" style={{ marginBottom: '1rem' }}>
            <div className="ap-field">
              <label className="ap-label">Live Title (EN)</label>
              <input className="ap-input" value={form.title_en}
                onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))}
                placeholder="White Friday 2026 — Best Deals in Saudi Arabia" />
            </div>
            <div className="ap-field">
              <label className="ap-label">Off-Season Title (EN)</label>
              <input className="ap-input" value={form.offSeasonTitle_en}
                onChange={e => setForm(f => ({ ...f, offSeasonTitle_en: e.target.value }))}
                placeholder="Preparing for White Friday — Shop Early Deals" />
            </div>
            <div className="ap-field">
              <label className="ap-label">Live Title (AR)</label>
              <input className="ap-input" dir="rtl" value={form.title_ar}
                onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))}
                placeholder="الجمعة البيضاء 2026" />
            </div>
            <div className="ap-field">
              <label className="ap-label">Off-Season Title (AR)</label>
              <input className="ap-input" dir="rtl" value={form.offSeasonTitle_ar}
                onChange={e => setForm(f => ({ ...f, offSeasonTitle_ar: e.target.value }))}
                placeholder="استعد للجمعة البيضاء" />
            </div>
          </div>

          {/* Countries */}
          <p className="ap-section-label">Countries *</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {countries.map(c => {
              const active = form.countryIds.includes(c.id);
              return (
                <label key={c.id} className="ap-checkbox-row"
                  style={{ padding: '4px 10px', borderRadius: 4,
                    border: `1px solid ${active ? 'var(--ap-accent)' : 'var(--ap-border)'}`,
                    background: active ? 'var(--ap-accent-subtle)' : 'transparent', cursor: 'pointer' }}>
                  <input type="checkbox" checked={active} onChange={() => toggleCountry(c.id)} />
                  <span className="ap-checkbox-label">{c.flag} {c.translations?.[0]?.name || c.code}</span>
                </label>
              );
            })}
          </div>

          {/* Flags */}
          <p className="ap-section-label">Settings</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {[
              { key: 'isActive',             label: 'Active' },
              { key: 'useStorePeakSeasonData', label: 'Auto-pull stores from StorePeakSeason' },
              { key: 'showInFooter',          label: 'Show in footer' },
              { key: 'showInNav',             label: 'Show in navigation' },
            ].map(f => (
              <label key={f.key} className="ap-checkbox-row">
                <input type="checkbox" checked={!!form[f.key]} onChange={() => toggle(f.key)} />
                <span className="ap-checkbox-label" style={{ fontSize: '0.8rem' }}>{f.label}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="ap-btn ap-btn--primary" disabled={saving}>
              {saving ? <><span className="ap-spinner" /> Creating…</> : 'Create Seasonal Page'}
            </button>
            <button type="button" className="ap-btn ap-btn--ghost" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page card ─────────────────────────────────────────────────────────────────

function PageCard({ page, onDelete }) {
  const t       = page.translations?.[0] || {};
  const live    = isLive(page);
  const days    = daysUntil(page);
  const countries = page.countries?.map(c => c.country) || [];

  const dateRange = page.startMonth && page.endMonth
    ? `${MONTH_NAMES[page.startMonth - 1]} ${page.startDay || 1} → ${MONTH_NAMES[page.endMonth - 1]} ${page.endDay || 28}`
    : 'No date restriction';

  return (
    <div className="ap-card" style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
      {/* Status bar at top */}
      <div style={{
        height: 3,
        background: !page.isActive
          ? 'var(--ap-border)'
          : live
          ? 'var(--ap-green)'
          : 'var(--ap-amber)',
      }} />

      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <StatusBadge page={page} />
              {page.showInNav && (
                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                  background: 'var(--ap-accent-subtle)', color: 'var(--ap-accent-hover)' }}>NAV</span>
              )}
              {page.showInFooter && (
                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                  background: 'rgba(255,255,255,0.06)', color: 'var(--ap-text-muted)' }}>FOOTER</span>
              )}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ap-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.title || t.offSeasonTitle || page.slug}
            </div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--ap-mono)', color: 'var(--ap-text-muted)', marginTop: '0.2rem' }}>
              /{page.slug}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            <Link href={`/admin/seasonal-pages/${page.id}`} className="ap-btn ap-btn--ghost ap-btn--sm">Edit</Link>
            <button className="ap-btn ap-btn--danger ap-btn--sm" onClick={() => onDelete(page.id, page.slug)}>Del</button>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)', paddingTop: '0.75rem', borderTop: '1px solid var(--ap-border-light)' }}>
          <span title="Date window">📅 {dateRange}</span>
          <span title="Countries">🌍 {countries.length > 0 ? countries.map(c => c.code).join(', ') : 'None'}</span>
          <span title="Pinned stores">🏪 {page._count?.pinnedStores ?? 0} stores</span>
          <span title="Hero vouchers">🎟 {page._count?.heroVouchers ?? 0} vouchers</span>
          <span title="Curated offers">✨ {page._count?.curatedOffers ?? 0} offers</span>
          <span title="Blog posts">📝 {page._count?.blogPosts ?? 0} posts</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SeasonalPagesAdminPage() {
  const router = useRouter();
  const [pages,     setPages]     = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [alert, setAlert] = useState(null);

  function flash(type, msg) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  }

  async function load() {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/seasonal-pages?locale=en'),
        fetch('/api/admin/countries?locale=en'),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      setPages(Array.isArray(pData) ? pData : []);
      setCountries(cData.countries || []);
    } catch (e) {
      flash('error', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, slug) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/seasonal-pages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('success', `"${slug}" deleted.`);
      setPages(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      flash('error', e.message);
    }
  }

  function handleCreated(newPage) {
    setShowCreate(false);
    flash('success', `"${newPage.slug}" created. Opening editor…`);
    router.push(`/admin/seasonal-pages/${newPage.id}`);
  }

  const liveCount     = pages.filter(p => p.isActive && isLive(p)).length;
  const upcomingCount = pages.filter(p => p.isActive && !isLive(p) && p.startMonth).length;
  const inactiveCount = pages.filter(p => !p.isActive).length;

  return (
    <div className="ap-root">
      <div className="ap-page">

        {/* Header */}
        <div className="ap-page-header">
          <h1 className="ap-page-title">
            Seasonal Pages
            <small>{pages.length} total</small>
          </h1>
          <div className="ap-page-actions">
            <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={() => setShowCreate(v => !v)}>
              {showCreate ? '✕ Cancel' : '+ New Season'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="ap-stats-row" style={{ marginBottom: '1.5rem' }}>
          <div className="ap-stat">
            <span className="ap-stat__label">Total</span>
            <span className="ap-stat__value">{pages.length}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Live now</span>
            <span className="ap-stat__value ap-stat__value--green">{liveCount}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Upcoming</span>
            <span className="ap-stat__value ap-stat__value--amber">{upcomingCount}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Inactive</span>
            <span className="ap-stat__value" style={{ color: 'var(--ap-text-muted)' }}>{inactiveCount}</span>
          </div>
        </div>

        {alert && <div className={`ap-alert ap-alert--${alert.type}`} style={{ marginBottom: '1rem' }}>{alert.msg}</div>}

        {/* Create form */}
        {showCreate && (
          <CreateForm
            countries={countries}
            onCreated={handleCreated}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {/* Info banner */}
        <div className="ap-alert ap-alert--info" style={{ marginBottom: '1.25rem' }}>
          Seasonal pages live at <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3 }}>/[locale]/seasonal/[slug]</code>.
          They auto-switch between live copy and off-season copy based on the date window. Year-round presence = accumulated SEO authority.
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ap-text-muted)' }}>
            <span className="ap-spinner" style={{ width: 24, height: 24 }} />
          </div>
        ) : pages.length === 0 ? (
          <div className="ap-empty">
            <p>No seasonal pages yet.</p>
            <p style={{ fontSize: '0.78rem' }}>Create your first one — White Friday is a great start.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
            {pages.map(page => (
              <PageCard key={page.id} page={page} onDelete={handleDelete} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
