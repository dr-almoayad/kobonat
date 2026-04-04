'use client';
// app/admin/seasonal-pages/[id]/page.jsx
// Full editor for a single seasonal page.
// Tabs: Info | Translations | Countries | Stores | Vouchers | Offers | Blog Posts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/components/admin/admin-panel.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = ['Info', 'Translations', 'Countries', 'Stores', 'Vouchers', 'Offers', 'Blog Posts'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS = MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }));

// ── Tiny shared helpers ───────────────────────────────────────────────────────

function isLive(page) {
  if (!page?.startMonth || !page?.endMonth) return !!page?.isActive;
  const now = new Date();
  const cur   = (now.getMonth() + 1) * 100 + now.getDate();
  const start = page.startMonth * 100 + (page.startDay || 1);
  const end   = page.endMonth   * 100 + (page.endDay   || 28);
  return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end;
}

function Field({ label, hint, children }) {
  return (
    <div className="ap-field">
      <label className="ap-label">{label}</label>
      {children}
      {hint && <span style={{ fontSize: '0.67rem', color: 'var(--ap-text-muted)', marginTop: '0.2rem' }}>{hint}</span>}
    </div>
  );
}

function SaveBtn({ saving, label = 'Save', onClick }) {
  return (
    <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={onClick} disabled={saving}>
      {saving ? <><span className="ap-spinner" /> Saving…</> : label}
    </button>
  );
}

// ── INFO TAB ──────────────────────────────────────────────────────────────────

function InfoTab({ page, onSaved, flash }) {
  const [form,   setForm]   = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!page) return;
    setForm({
      heroImage:              page.heroImage         || '',
      startMonth:             page.startMonth        || '',
      startDay:               page.startDay          || '',
      endMonth:               page.endMonth          || '',
      endDay:                 page.endDay            || '',
      useStorePeakSeasonData: page.useStorePeakSeasonData ?? true,
      showInFooter:           page.showInFooter      ?? false,
      showInNav:              page.showInNav         ?? false,
      isActive:               page.isActive          ?? true,
    });
  }, [page]);

  if (!form) return null;

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/seasonal-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroImage:  form.heroImage || null,
          startMonth: form.startMonth ? parseInt(form.startMonth) : null,
          startDay:   form.startDay   ? parseInt(form.startDay)   : null,
          endMonth:   form.endMonth   ? parseInt(form.endMonth)   : null,
          endDay:     form.endDay     ? parseInt(form.endDay)     : null,
          useStorePeakSeasonData: form.useStorePeakSeasonData,
          showInFooter: form.showInFooter,
          showInNav:    form.showInNav,
          isActive:     form.isActive,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('success', 'Settings saved.');
      onSaved({ ...page, ...form });
    } catch (e) {
      flash('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  const live = isLive({ ...page, ...form });

  return (
    <div>
      {/* Status preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
        borderRadius: 6, marginBottom: '1.5rem',
        background: live ? 'rgba(63,185,80,0.08)' : 'rgba(210,153,34,0.08)',
        border: `1px solid ${live ? 'rgba(63,185,80,0.2)' : 'rgba(210,153,34,0.2)'}` }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%',
          background: live ? 'var(--ap-green)' : 'var(--ap-amber)',
          boxShadow: live ? '0 0 8px var(--ap-green)' : 'none' }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600,
          color: live ? 'var(--ap-green)' : 'var(--ap-amber)' }}>
          {live ? 'Season is currently LIVE — live copy will be shown' : 'Season is not live — off-season copy will be shown'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <p className="ap-section-label">Identification</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="ap-field">
              <label className="ap-label">Slug</label>
              <input className="ap-input" value={page.slug} disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                title="Slug cannot be changed after creation" />
              <span style={{ fontSize: '0.67rem', color: 'var(--ap-text-muted)' }}>
                Slug is immutable — changing it breaks indexed URLs.
              </span>
            </div>
            <div className="ap-field">
              <label className="ap-label">Season Key</label>
              <input className="ap-input" value={page.seasonKey} disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <Field label="Hero Image URL" hint="1200×630px recommended. Used in OG card.">
              <input className="ap-input" value={form.heroImage}
                onChange={e => set('heroImage', e.target.value)}
                placeholder="https://cdn.cobonat.me/seasonal/white-friday.jpg" />
            </Field>
            {form.heroImage && (
              <img src={form.heroImage} alt="" style={{ width: '100%', height: 140,
                objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ap-border)' }} />
            )}
          </div>
        </div>

        <div>
          <p className="ap-section-label">Annual date window</p>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.72rem', color: 'var(--ap-text-muted)' }}>
            The page exists year-round but shows different copy inside vs outside this window.
            Leave blank to always show live copy.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Field label="Start Month">
              <select className="ap-select" value={form.startMonth}
                onChange={e => set('startMonth', e.target.value)}>
                <option value="">—</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Start Day">
              <input className="ap-input" type="number" min="1" max="31"
                value={form.startDay} onChange={e => set('startDay', e.target.value)} placeholder="1" />
            </Field>
            <Field label="End Month">
              <select className="ap-select" value={form.endMonth}
                onChange={e => set('endMonth', e.target.value)}>
                <option value="">—</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="End Day">
              <input className="ap-input" type="number" min="1" max="31"
                value={form.endDay} onChange={e => set('endDay', e.target.value)} placeholder="30" />
            </Field>
          </div>

          <p className="ap-section-label" style={{ marginTop: '1rem' }}>Settings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { key: 'isActive',              label: 'Active (page is publicly accessible)' },
              { key: 'useStorePeakSeasonData', label: 'Auto-pull stores from StorePeakSeason' },
              { key: 'showInNav',              label: 'Show link in site navigation' },
              { key: 'showInFooter',           label: 'Show link in site footer' },
            ].map(f => (
              <label key={f.key} className="ap-checkbox-row">
                <input type="checkbox" checked={!!form[f.key]}
                  onChange={() => setForm(prev => ({ ...prev, [f.key]: !prev[f.key] }))} />
                <span className="ap-checkbox-label" style={{ fontSize: '0.8rem' }}>{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <SaveBtn saving={saving} onClick={save} />
        <Link href={`/ar-SA/seasonal/${page.slug}`} target="_blank"
          className="ap-btn ap-btn--ghost ap-btn--sm">
          Preview →
        </Link>
      </div>
    </div>
  );
}

// ── TRANSLATIONS TAB ──────────────────────────────────────────────────────────

function TranslationsTab({ page, onSaved, flash }) {
  const [form,   setForm]   = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!page) return;
    const en = page.translations?.find(t => t.locale === 'en') || {};
    const ar = page.translations?.find(t => t.locale === 'ar') || {};
    setForm({
      title_en:                   en.title                   || '',
      description_en:             en.description             || '',
      seoTitle_en:                en.seoTitle                || '',
      seoDescription_en:          en.seoDescription          || '',
      offSeasonTitle_en:          en.offSeasonTitle          || '',
      offSeasonDescription_en:    en.offSeasonDescription    || '',
      offSeasonSeoTitle_en:       en.offSeasonSeoTitle       || '',
      offSeasonSeoDescription_en: en.offSeasonSeoDescription || '',
      title_ar:                   ar.title                   || '',
      description_ar:             ar.description             || '',
      seoTitle_ar:                ar.seoTitle                || '',
      seoDescription_ar:          ar.seoDescription          || '',
      offSeasonTitle_ar:          ar.offSeasonTitle          || '',
      offSeasonDescription_ar:    ar.offSeasonDescription    || '',
      offSeasonSeoTitle_ar:       ar.offSeasonSeoTitle       || '',
      offSeasonSeoDescription_ar: ar.offSeasonSeoDescription || '',
    });
  }, [page]);

  if (!form) return null;

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/seasonal-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translations: [
            {
              locale:                  'en',
              title:                   form.title_en,
              description:             form.description_en             || null,
              seoTitle:                form.seoTitle_en                || null,
              seoDescription:          form.seoDescription_en          || null,
              offSeasonTitle:          form.offSeasonTitle_en          || null,
              offSeasonDescription:    form.offSeasonDescription_en    || null,
              offSeasonSeoTitle:       form.offSeasonSeoTitle_en       || null,
              offSeasonSeoDescription: form.offSeasonSeoDescription_en || null,
            },
            {
              locale:                  'ar',
              title:                   form.title_ar,
              description:             form.description_ar             || null,
              seoTitle:                form.seoTitle_ar                || null,
              seoDescription:          form.seoDescription_ar          || null,
              offSeasonTitle:          form.offSeasonTitle_ar          || null,
              offSeasonDescription:    form.offSeasonDescription_ar    || null,
              offSeasonSeoTitle:       form.offSeasonSeoTitle_ar       || null,
              offSeasonSeoDescription: form.offSeasonSeoDescription_ar || null,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('success', 'Translations saved.');
    } catch (e) {
      flash('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function LangBlock({ lang, dir }) {
    const suffix = `_${lang}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p className="ap-section-label">
          {lang === 'en' ? '🇬🇧 English' : '🇸🇦 Arabic'} — Live Season Copy
        </p>
        <Field label="Title *">
          <input className="ap-input" dir={dir} value={form[`title${suffix}`]}
            onChange={e => set(`title${suffix}`, e.target.value)} />
        </Field>
        <Field label="Description">
          <textarea className="ap-textarea" dir={dir} rows={3}
            value={form[`description${suffix}`]}
            onChange={e => set(`description${suffix}`, e.target.value)} />
        </Field>
        <Field label="SEO Title" hint="Defaults to Title if blank">
          <input className="ap-input" dir={dir} value={form[`seoTitle${suffix}`]}
            onChange={e => set(`seoTitle${suffix}`, e.target.value)} />
        </Field>
        <Field label="SEO Description">
          <textarea className="ap-textarea" dir={dir} rows={2}
            value={form[`seoDescription${suffix}`]}
            onChange={e => set(`seoDescription${suffix}`, e.target.value)} />
        </Field>

        <p className="ap-section-label" style={{ marginTop: '0.5rem' }}>Off-Season Copy (shown year-round outside window)</p>
        <Field label="Off-Season Title">
          <input className="ap-input" dir={dir} value={form[`offSeasonTitle${suffix}`]}
            onChange={e => set(`offSeasonTitle${suffix}`, e.target.value)}
            placeholder={lang === 'en' ? 'Preparing for White Friday — Shop early deals' : 'استعد للجمعة البيضاء'} />
        </Field>
        <Field label="Off-Season Description">
          <textarea className="ap-textarea" dir={dir} rows={3}
            value={form[`offSeasonDescription${suffix}`]}
            onChange={e => set(`offSeasonDescription${suffix}`, e.target.value)} />
        </Field>
        <Field label="Off-Season SEO Title">
          <input className="ap-input" dir={dir} value={form[`offSeasonSeoTitle${suffix}`]}
            onChange={e => set(`offSeasonSeoTitle${suffix}`, e.target.value)} />
        </Field>
        <Field label="Off-Season SEO Description">
          <textarea className="ap-textarea" dir={dir} rows={2}
            value={form[`offSeasonSeoDescription${suffix}`]}
            onChange={e => set(`offSeasonSeoDescription${suffix}`, e.target.value)} />
        </Field>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
        <LangBlock lang="en" dir="ltr" />
        <LangBlock lang="ar" dir="rtl" />
      </div>
      <SaveBtn saving={saving} onClick={save} />
    </div>
  );
}

// ── COUNTRIES TAB ─────────────────────────────────────────────────────────────

function CountriesTab({ page, allCountries, onSaved, flash }) {
  const [selected, setSelected] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [changed,  setChanged]  = useState(false);

  useEffect(() => {
    if (!page) return;
    const ids = page.countries?.map(c => c.countryId) || [];
    setSelected(ids);
    setChanged(false);
  }, [page]);

  function toggle(id) {
    setSelected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setChanged(true);
      return next;
    });
  }

  async function save() {
    if (selected.length === 0) { flash('error', 'Select at least one country.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/seasonal-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryIds: selected }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('success', 'Countries updated.');
      setChanged(false);
    } catch (e) {
      flash('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--ap-text-muted)' }}>
        The seasonal page is only accessible from selected countries.
        {changed && <span style={{ color: 'var(--ap-amber)', marginLeft: '0.5rem' }}>⚠ Unsaved changes</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {allCountries.map(c => {
          const active = selected.includes(c.id);
          return (
            <label key={c.id} className="ap-checkbox-row" style={{
              padding: '0.6rem 0.875rem', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${active ? 'var(--ap-accent)' : 'var(--ap-border)'}`,
              background: active ? 'var(--ap-accent-subtle)' : 'var(--ap-surface)',
            }}>
              <input type="checkbox" checked={active} onChange={() => toggle(c.id)} />
              <span className="ap-checkbox-label" style={{ fontWeight: active ? 600 : 400 }}>
                {c.flag} {c.translations?.[0]?.name || c.code}
              </span>
            </label>
          );
        })}
      </div>
      <SaveBtn saving={saving} onClick={save} label="Update Countries" />
    </div>
  );
}

// ── STORES TAB ────────────────────────────────────────────────────────────────

function StoresTab({ page, flash }) {
  const [pinned,  setPinned]  = useState([]);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/seasonal-pages/${page.id}/stores?locale=en`);
    const data = await res.json();
    setPinned(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [page.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/admin/stores?locale=en&search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      const pinnedIds = new Set(pinned.map(p => p.storeId));
      setResults((Array.isArray(data) ? data : []).filter(s => !pinnedIds.has(s.id)));
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, pinned]);

  async function addStore(store) {
    try {
      const res = await fetch(`/api/admin/seasonal-pages/${page.id}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setQuery('');
      setResults([]);
      load();
      flash('success', `${store.translations?.[0]?.name || store.id} pinned.`);
    } catch (e) {
      flash('error', e.message);
    }
  }

  async function removeStore(storeId) {
    try {
      const res = await fetch(`/api/admin/seasonal-pages/${page.id}/stores?storeId=${storeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setPinned(prev => prev.filter(p => p.storeId !== storeId));
      flash('success', 'Store removed.');
    } catch (e) {
      flash('error', e.message);
    }
  }

  return (
    <div>
      {/* Auto-pull notice */}
      <div className="ap-alert ap-alert--info" style={{ marginBottom: '1.25rem' }}>
        {page.useStorePeakSeasonData
          ? `Auto-pull is ON — stores with seasonKey "${page.seasonKey}" in StorePeakSeason are automatically included. Pinned stores appear first.`
          : 'Auto-pull is OFF (toggle in Info tab). Only manually pinned stores will appear.'}
      </div>

      {/* Search + add */}
      <p className="ap-section-label">Pin a store</p>
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <input className="ap-input" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search stores by name…" style={{ marginBottom: 0 }} />
        {(searching || results.length > 0) && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
            background: 'var(--ap-surface)', border: '1px solid var(--ap-border)', borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)', maxHeight: 280, overflowY: 'auto' }}>
            {searching && <div style={{ padding: '0.75rem 1rem', color: 'var(--ap-text-muted)', fontSize: '0.8rem' }}>Searching…</div>}
            {results.map(s => {
              const name = s.translations?.[0]?.name || `Store #${s.id}`;
              return (
                <button key={s.id} onClick={() => addStore(s)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid var(--ap-border-light)', textAlign: 'left',
                }}>
                  {s.logo && <img src={s.logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ap-text-primary)' }}>{name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)' }}>{s.translations?.[0]?.slug}</div>
                  </div>
                </button>
              );
            })}
            {!searching && results.length === 0 && query.length >= 2 && (
              <div style={{ padding: '0.75rem 1rem', color: 'var(--ap-text-muted)', fontSize: '0.8rem' }}>No results</div>
            )}
          </div>
        )}
      </div>

      {/* Pinned list */}
      <p className="ap-section-label">Pinned stores ({pinned.length})</p>
      {loading ? <span className="ap-spinner" /> : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Store</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pinned.length === 0 && (
                <tr><td colSpan={3}><div className="ap-empty" style={{ padding: '1.5rem' }}>No pinned stores. Use search above to add.</div></td></tr>
              )}
              {pinned.map((p, idx) => {
                const name = p.store?.translations?.[0]?.name || `Store #${p.storeId}`;
                return (
                  <tr key={p.storeId}>
                    <td className="ap-table__mono ap-table__dim" style={{ width: 40 }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {p.store?.logo && <img src={p.store.logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4, background: '#fff', padding: 2 }} />}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>{p.store?.translations?.[0]?.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="ap-btn ap-btn--danger ap-btn--xs" onClick={() => removeStore(p.storeId)}>Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── GENERIC RELATION TAB (Vouchers / Offers / Blog Posts) ────────────────────

function RelationTab({ pageId, endpoint, searchEndpoint, searchParam = 'search',
  idField, renderItem, renderResult, emptyText, sectionLabel, flash }) {

  const [items,    setItems]    = useState([]);
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [searching,setSearching]= useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/seasonal-pages/${pageId}/${endpoint}?locale=en`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [pageId, endpoint]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res  = await fetch(`${searchEndpoint}?locale=en&${searchParam}=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      const existingIds = new Set(items.map(i => i[idField]));
      const list = Array.isArray(data) ? data : (data.stores || data.vouchers || data.posts || data.offers || []);
      setResults(list.filter(r => !existingIds.has(r.id)));
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, items, searchEndpoint, searchParam, idField]);

  async function add(item) {
    try {
      const body = {};
      body[idField] = item.id;
      const res = await fetch(`/api/admin/seasonal-pages/${pageId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setQuery(''); setResults([]);
      load();
      flash('success', 'Added.');
    } catch (e) { flash('error', e.message); }
  }

  async function remove(itemId) {
    try {
      const res = await fetch(
        `/api/admin/seasonal-pages/${pageId}/${endpoint}?${idField}=${itemId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error((await res.json()).error);
      setItems(prev => prev.filter(i => i[idField] !== itemId));
      flash('success', 'Removed.');
    } catch (e) { flash('error', e.message); }
  }

  return (
    <div>
      <p className="ap-section-label">Add {sectionLabel}</p>
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <input className="ap-input" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={`Search ${sectionLabel}…`} />
        {(searching || results.length > 0) && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
            background: 'var(--ap-surface)', border: '1px solid var(--ap-border)',
            borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            maxHeight: 300, overflowY: 'auto' }}>
            {searching && <div style={{ padding: '0.75rem 1rem', color: 'var(--ap-text-muted)', fontSize: '0.8rem' }}>Searching…</div>}
            {results.map(r => (
              <button key={r.id} onClick={() => add(r)} style={{
                width: '100%', display: 'block', padding: '0.6rem 1rem',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid var(--ap-border-light)',
              }}>
                {renderResult(r)}
              </button>
            ))}
            {!searching && results.length === 0 && query.length >= 2 && (
              <div style={{ padding: '0.75rem 1rem', color: 'var(--ap-text-muted)', fontSize: '0.8rem' }}>No results</div>
            )}
          </div>
        )}
      </div>

      <p className="ap-section-label">{sectionLabel} linked ({items.length})</p>
      {loading ? <span className="ap-spinner" /> : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>#</th><th>Item</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={3}><div className="ap-empty" style={{ padding: '1.5rem' }}>{emptyText}</div></td></tr>
              )}
              {items.map((item, idx) => (
                <tr key={item[idField]}>
                  <td className="ap-table__mono ap-table__dim" style={{ width: 40 }}>{idx + 1}</td>
                  <td>{renderItem(item)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="ap-btn ap-btn--danger ap-btn--xs" onClick={() => remove(item[idField])}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VouchersTab({ page, flash }) {
  return (
    <RelationTab
      pageId={page.id} endpoint="vouchers"
      searchEndpoint="/api/admin/vouchers" searchParam="search"
      idField="voucherId" sectionLabel="hero vouchers"
      emptyText="No hero vouchers pinned yet." flash={flash}
      renderResult={v => {
        const t = v.translations?.[0];
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ap-text-primary)' }}>{t?.title || v.id}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)' }}>
              {v.code && <code style={{ marginRight: 4 }}>{v.code}</code>}
              {v.store?.translations?.[0]?.name}
            </div>
          </div>
        );
      }}
      renderItem={item => {
        const v = item.voucher;
        const t = v?.translations?.[0];
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{t?.title || item.voucherId}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)' }}>
              {v?.type && <span className="ap-badge ap-badge--muted" style={{ marginRight: 4 }}>{v.type}</span>}
              {v?.code && <code style={{ fontSize: '0.68rem' }}>{v.code}</code>}
            </div>
          </div>
        );
      }}
    />
  );
}

function OffersTab({ page, flash }) {
  return (
    <RelationTab
      pageId={page.id} endpoint="curated-offers"
      searchEndpoint="/api/curated-offers" searchParam="search"
      idField="offerId" sectionLabel="curated offers"
      emptyText="No curated offers linked yet." flash={flash}
      renderResult={o => {
        const t = o.translations?.[0];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {o.offerImage && <img src={o.offerImage} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ap-text-primary)' }}>{t?.title || o.id}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)' }}>{o.store?.name}</div>
            </div>
          </div>
        );
      }}
      renderItem={item => {
        const o = item.offer;
        const t = o?.translations?.[0];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {o?.offerImage && <img src={o.offerImage} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{t?.title || item.offerId}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)' }}>{o?.store?.translations?.[0]?.name}</div>
            </div>
          </div>
        );
      }}
    />
  );
}

function BlogPostsTab({ page, flash }) {
  return (
    <RelationTab
      pageId={page.id} endpoint="blog-posts"
      searchEndpoint="/api/admin/blog" searchParam="search"
      idField="postId" sectionLabel="blog posts"
      emptyText="No blog posts linked yet." flash={flash}
      renderResult={p => {
        const t = p.translations?.[0];
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ap-text-primary)' }}>{t?.title || p.slug}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>{p.slug}</div>
          </div>
        );
      }}
      renderItem={item => {
        const p = item.post;
        const t = p?.translations?.[0];
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{t?.title || item.postId}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)', fontFamily: 'var(--ap-mono)' }}>{p?.slug}</div>
          </div>
        );
      }}
    />
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function SeasonalPageEditor() {
  const { id } = useParams();
  const router  = useRouter();
  const [page,         setPage]         = useState(null);
  const [allCountries, setAllCountries] = useState([]);
  const [tab,          setTab]          = useState('Info');
  const [loading,      setLoading]      = useState(true);
  const [alert,        setAlert]        = useState(null);

  function flash(type, msg) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  }

  const loadPage = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/admin/seasonal-pages/${id}?locale=en`),
        fetch('/api/admin/countries?locale=en'),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (!pRes.ok) throw new Error(pData.error);
      setPage(pData);
      setAllCountries(cData.countries || []);
    } catch (e) {
      flash('error', e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPage(); }, [loadPage]);

  async function handleDelete() {
    if (!confirm(`Delete "${page?.slug}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/seasonal-pages/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/seasonal-pages');
    else flash('error', (await res.json()).error);
  }

  if (loading) {
    return (
      <div className="ap-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="ap-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="ap-root">
        <div className="ap-page">
          <div className="ap-alert ap-alert--error">Seasonal page not found.</div>
          <Link href="/admin/seasonal-pages" className="ap-btn ap-btn--ghost ap-btn--sm" style={{ marginTop: '1rem' }}>← Back</Link>
        </div>
      </div>
    );
  }

  const live = isLive(page);
  const t    = page.translations?.find(t => t.locale === 'en') || {};

  return (
    <div className="ap-root">
      <div className="ap-page">

        {/* Header */}
        <div className="ap-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                background: live ? 'rgba(63,185,80,0.12)' : 'rgba(210,153,34,0.1)',
                color: live ? 'var(--ap-green)' : 'var(--ap-amber)' }}>
                {live ? '● LIVE' : '○ OFF-SEASON'}
              </span>
              {page.showInNav    && <span className="ap-badge ap-badge--blue">NAV</span>}
              {page.showInFooter && <span className="ap-badge ap-badge--muted">FOOTER</span>}
              {!page.isActive    && <span className="ap-badge ap-badge--red">INACTIVE</span>}
            </div>
            <h1 className="ap-page-title">
              {t.title || t.offSeasonTitle || page.slug}
              <small>/{page.slug}</small>
            </h1>
          </div>
          <div className="ap-page-actions">
            <Link href="/admin/seasonal-pages" className="ap-btn ap-btn--ghost ap-btn--sm">← All seasons</Link>
            <Link href={`/ar-SA/seasonal/${page.slug}`} target="_blank" className="ap-btn ap-btn--ghost ap-btn--sm">Preview →</Link>
            <button className="ap-btn ap-btn--danger ap-btn--sm" onClick={handleDelete}>Delete</button>
          </div>
        </div>

        {/* Stats summary */}
        <div className="ap-stats-row" style={{ marginBottom: '1.5rem' }}>
          {page.startMonth && (
            <div className="ap-stat">
              <span className="ap-stat__label">Date window</span>
              <span className="ap-stat__value" style={{ fontSize: '0.85rem', paddingTop: '0.2rem' }}>
                {MONTH_NAMES[page.startMonth - 1]} {page.startDay || 1}
                {' → '}
                {MONTH_NAMES[(page.endMonth || page.startMonth) - 1]} {page.endDay || 28}
              </span>
            </div>
          )}
          <div className="ap-stat">
            <span className="ap-stat__label">Countries</span>
            <span className="ap-stat__value">{page.countries?.length || 0}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Pinned stores</span>
            <span className="ap-stat__value">{page._count?.pinnedStores || 0}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Hero vouchers</span>
            <span className="ap-stat__value">{page._count?.heroVouchers || 0}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Curated offers</span>
            <span className="ap-stat__value">{page._count?.curatedOffers || 0}</span>
          </div>
          <div className="ap-stat">
            <span className="ap-stat__label">Blog posts</span>
            <span className="ap-stat__value">{page._count?.blogPosts || 0}</span>
          </div>
        </div>

        {/* Alert */}
        {alert && <div className={`ap-alert ap-alert--${alert.type}`} style={{ marginBottom: '1rem' }}>{alert.msg}</div>}

        {/* Tab bar */}
        <div className="ap-tabs" style={{ marginBottom: '1.5rem' }}>
          {TABS.map(t => (
            <button key={t} className={`ap-tab ${tab === t ? 'ap-tab--active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="ap-card">
          <div className="ap-card-body">
            {tab === 'Info'         && <InfoTab         page={page} onSaved={setPage} flash={flash} />}
            {tab === 'Translations' && <TranslationsTab page={page} onSaved={setPage} flash={flash} />}
            {tab === 'Countries'    && <CountriesTab    page={page} allCountries={allCountries} onSaved={setPage} flash={flash} />}
            {tab === 'Stores'       && <StoresTab       page={page} flash={flash} />}
            {tab === 'Vouchers'     && <VouchersTab     page={page} flash={flash} />}
            {tab === 'Offers'       && <OffersTab       page={page} flash={flash} />}
            {tab === 'Blog Posts'   && <BlogPostsTab    page={page} flash={flash} />}
          </div>
        </div>

      </div>
    </div>
  );
}
