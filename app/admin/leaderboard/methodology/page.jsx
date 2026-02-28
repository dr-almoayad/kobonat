'use client';
// app/admin/leaderboard/methodology/page.jsx
// Formula version management: list, create, activate, delete.

import { useState, useEffect } from 'react';
import '@/components/admin/admin-panel.css';

const FIELD_DEFS = [
  { key: 'maxSavingsCap',       label: 'Max savings cap (%)',      step: 1,    min: 0, max: 100,  help: 'No store can rank with a saving above this value.' },
  { key: 'referenceBasketSize', label: 'Reference basket (SAR)',   step: 50,   min: 0,             help: 'Used to compute realistic effective % on capped offers.' },
  { key: 'multiplierExact',     label: 'Multiplier — EXACT',       step: 0.05, min: 0, max: 1,    help: 'Contractual offers e.g. "10% off with Visa".' },
  { key: 'multiplierVerified',  label: 'Multiplier — VERIFIED',    step: 0.05, min: 0, max: 1,    help: 'Admin checked real product prices.' },
  { key: 'multiplierTypical',   label: 'Multiplier — TYPICAL',     step: 0.05, min: 0, max: 1,    help: 'Admin-estimated reasonable figure.' },
  { key: 'multiplierEstimated', label: 'Multiplier — ESTIMATED',   step: 0.05, min: 0, max: 1,    help: '"Up to X% off" marketing claim.' },
];

const DEFAULT_FORM = {
  version:             '',
  description:         '',
  maxSavingsCap:       75,
  referenceBasketSize: 500,
  multiplierExact:     1.00,
  multiplierVerified:  1.00,
  multiplierTypical:   0.80,
  multiplierEstimated: 0.35,
};

function MethodologyRow({ m, onActivate, onDelete, activating, deleting }) {
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="ap-table__mono" style={{ fontWeight: 700 }}>{m.version}</span>
          {m.isActive && <span className="ap-badge ap-badge--green">ACTIVE</span>}
        </div>
      </td>
      <td style={{ color: 'var(--ap-text-secondary)', maxWidth: '320px' }}>{m.description}</td>
      <td className="ap-table__mono">{m.maxSavingsCap}%</td>
      <td className="ap-table__mono">{m.referenceBasketSize} SAR</td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'var(--ap-mono)', fontSize: '0.7rem' }}>
          <span><span style={{ color: 'var(--ap-text-muted)' }}>EXACT</span> {m.multiplierExact}</span>
          <span><span style={{ color: 'var(--ap-text-muted)' }}>TYPICAL</span> {m.multiplierTypical}</span>
          <span><span style={{ color: 'var(--ap-text-muted)' }}>EST</span> {m.multiplierEstimated}</span>
        </div>
      </td>
      <td className="ap-table__mono ap-table__dim">{m._count?.snapshots ?? 0} snapshots</td>
      <td>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {!m.isActive && (
            <button
              className="ap-btn ap-btn--primary ap-btn--xs"
              onClick={() => onActivate(m.id)}
              disabled={activating}
            >
              {activating ? <span className="ap-spinner" /> : 'Activate'}
            </button>
          )}
          {!m.isActive && (m._count?.snapshots ?? 0) === 0 && (
            <button
              className="ap-btn ap-btn--danger ap-btn--xs"
              onClick={() => onDelete(m.id, m.version)}
              disabled={deleting}
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function MethodologyPage() {
  const [methodologies, setMethodologies] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [form,          setForm]          = useState(DEFAULT_FORM);
  const [saving,        setSaving]        = useState(false);
  const [activatingId,  setActivatingId]  = useState(null);
  const [deletingId,    setDeletingId]    = useState(null);
  const [alert,         setAlert]         = useState(null);

  async function load() {
    setLoading(true);
    const res  = await fetch('/api/admin/methodology');
    const data = await res.json();
    setMethodologies(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function flash(type, msg) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/methodology', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash('success', `Version "${data.version}" created.`);
      setShowCreate(false);
      setForm(DEFAULT_FORM);
      await load();
    } catch (e) {
      flash('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(id) {
    setActivatingId(id);
    try {
      const res = await fetch(`/api/admin/methodology/${id}/activate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash('success', `Version "${data.version}" is now active.`);
      await load();
    } catch (e) {
      flash('error', e.message);
    } finally {
      setActivatingId(null);
    }
  }

  async function handleDelete(id, version) {
    if (!confirm(`Delete version "${version}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/methodology/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('success', `Version "${version}" deleted.`);
      await load();
    } catch (e) {
      flash('error', e.message);
    } finally {
      setDeletingId(null);
    }
  }

  const active = methodologies.find((m) => m.isActive);

  return (
    <div className="ap-root">
      <div className="ap-page">

        <div className="ap-page-header">
          <h1 className="ap-page-title">
            Formula Versions
            <small>Savings Methodology</small>
          </h1>
          <div className="ap-page-actions">
            <a href="/admin/leaderboard" className="ap-btn ap-btn--ghost ap-btn--sm">← Leaderboard</a>
            <button className="ap-btn ap-btn--primary ap-btn--sm" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? 'Cancel' : '+ New version'}
            </button>
          </div>
        </div>

        {alert && (
          <div className={`ap-alert ap-alert--${alert.type}`}>{alert.msg}</div>
        )}

        {/* Active formula summary */}
        {active && (
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <div className="ap-card-header">
              <span className="ap-card-title">Active formula — {active.version}</span>
              <span className="ap-badge ap-badge--green">LIVE</span>
            </div>
            <div className="ap-card-body">
              <div className="ap-stats-row" style={{ marginBottom: 0 }}>
                <div className="ap-stat">
                  <span className="ap-stat__label">Max cap</span>
                  <span className="ap-stat__value ap-stat__value--accent">{active.maxSavingsCap}%</span>
                </div>
                <div className="ap-stat">
                  <span className="ap-stat__label">Basket size</span>
                  <span className="ap-stat__value">{active.referenceBasketSize} SAR</span>
                </div>
                <div className="ap-stat">
                  <span className="ap-stat__label">EXACT/VERIFIED mult</span>
                  <span className="ap-stat__value ap-stat__value--green">{active.multiplierExact}×</span>
                </div>
                <div className="ap-stat">
                  <span className="ap-stat__label">TYPICAL mult</span>
                  <span className="ap-stat__value ap-stat__value--amber">{active.multiplierTypical}×</span>
                </div>
                <div className="ap-stat">
                  <span className="ap-stat__label">ESTIMATED mult</span>
                  <span className="ap-stat__value ap-stat__value--red">{active.multiplierEstimated}×</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="ap-card" style={{ marginBottom: '1.5rem' }}>
            <div className="ap-card-header">
              <span className="ap-card-title">Create new version</span>
            </div>
            <form className="ap-card-body" onSubmit={handleCreate}>
              <div className="ap-form-grid ap-form-grid--wide" style={{ marginBottom: '1rem' }}>
                <div className="ap-field">
                  <label className="ap-label">Version identifier *</label>
                  <input
                    className="ap-input"
                    required
                    placeholder="v2"
                    value={form.version}
                    onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                  />
                </div>
                <div className="ap-field" style={{ gridColumn: 'span 2' }}>
                  <label className="ap-label">Description *</label>
                  <input
                    className="ap-input"
                    required
                    placeholder="What changed vs previous version"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <hr className="ap-divider" />
              <p className="ap-section-label">Formula parameters</p>
              <div className="ap-form-grid">
                {FIELD_DEFS.map((def) => (
                  <div className="ap-field" key={def.key}>
                    <label className="ap-label">{def.label}</label>
                    <input
                      type="number"
                      className="ap-input"
                      step={def.step}
                      min={def.min}
                      max={def.max}
                      value={form[def.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [def.key]: Number(e.target.value) }))}
                    />
                    <span style={{ fontSize: '0.67rem', color: 'var(--ap-text-muted)' }}>{def.help}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="ap-btn ap-btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="ap-btn ap-btn--primary" disabled={saving}>
                  {saving ? <><span className="ap-spinner" /> Saving…</> : 'Create version'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* All versions table */}
        <div className="ap-card">
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Description</th>
                  <th>Max cap</th>
                  <th>Basket</th>
                  <th>Multipliers</th>
                  <th>Usage</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--ap-text-muted)' }}>
                    <span className="ap-spinner" />
                  </td></tr>
                )}
                {!loading && methodologies.map((m) => (
                  <MethodologyRow
                    key={m.id}
                    m={m}
                    onActivate={handleActivate}
                    onDelete={handleDelete}
                    activating={activatingId === m.id}
                    deleting={deletingId === m.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
