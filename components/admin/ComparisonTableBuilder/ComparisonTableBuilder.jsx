'use client';
// components/admin/ComparisonTableBuilder/ComparisonTableBuilder.jsx
//
// Embedded in the blog post edit page.
// Props:
//   postId       — Int, the blog post being edited
//   locale       — 'en' | 'ar'  (editor language preference)
//   stores       — [{id, name}]  optional pre-loaded store list
//   banks        — [{id, name, logo}]  optional pre-loaded bank list

import { useState, useEffect, useCallback } from 'react';
import styles from './ComparisonTableBuilder.css';

// ── Constants ──────────────────────────────────────────────────────────────────
const ENTITY_TYPES = [
  { value: 'CUSTOM',    label: 'Custom / Generic' },
  { value: 'STORE',     label: 'Stores' },
  { value: 'BANK',      label: 'Banks' },
  { value: 'BANK_CARD', label: 'Bank Cards' },
  { value: 'VOUCHER',   label: 'Vouchers / Deals' },
  { value: 'PROMO',     label: 'Bank Offers / Promos' },
  { value: 'PRODUCT',   label: 'Products' },
];

const ROW_TYPES = [
  { value: 'TEXT',    label: 'Text',    icon: 'text_fields' },
  { value: 'RATING',  label: 'Rating',  icon: 'star' },
  { value: 'BOOLEAN', label: 'Yes / No', icon: 'check_circle' },
  { value: 'BADGE',   label: 'Badge',   icon: 'sell' },
];

// ── Tiny shared helpers ────────────────────────────────────────────────────────
function F({ label, value, onChange, placeholder, dir, type = 'text', style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...style }}>
      {label && <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>}
      <input
        type={type} value={value ?? ''} placeholder={placeholder} dir={dir}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 5, color: 'var(--ap-text-primary)', padding: '0.35rem 0.6rem', fontSize: '0.82rem', width: '100%' }}
      />
    </div>
  );
}

function Sel({ label, value, onChange, options, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...style }}>
      {label && <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>}
      <select
        value={value ?? ''} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 5, color: 'var(--ap-text-primary)', padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
      >
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = 'ghost', size = 'sm', disabled, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    padding: size === 'sm' ? '0.3rem 0.65rem' : '0.45rem 1rem',
    borderRadius: 6, fontWeight: 600, fontSize: size === 'sm' ? '0.75rem' : '0.82rem',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
    border: 'none', transition: 'all 0.12s', ...style,
  };
  const variants = {
    primary: { background: '#470ae2', color: '#fff' },
    danger:  { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
    ghost:   { background: 'var(--ap-surface-2)', color: 'var(--ap-text-secondary)', border: '1px solid var(--ap-border)' },
    amber:   { background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)' },
  };
  return <button type="button" onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

// ── Cell editor ──────────────────────────────────────────────────────────────
function CellInput({ rowType, cell, onChange }) {
  const s = { background: 'var(--ap-surface-2)', border: '1px solid var(--ap-border)', borderRadius: 4, color: 'var(--ap-text-primary)', padding: '0.3rem 0.5rem', fontSize: '0.78rem', width: '100%' };

  if (rowType === 'BOOLEAN') {
    return (
      <select value={cell.boolValue == null ? '' : String(cell.boolValue)} onChange={e => onChange({ ...cell, boolValue: e.target.value === '' ? null : e.target.value === 'true' })} style={s}>
        <option value="">N/A</option>
        <option value="true">✓ Yes</option>
        <option value="false">✗ No</option>
      </select>
    );
  }
  if (rowType === 'RATING') {
    return (
      <input type="number" min={0} max={5} step={0.5} value={cell.numericValue ?? ''} onChange={e => onChange({ ...cell, numericValue: e.target.value === '' ? null : parseFloat(e.target.value) })} style={s} />
    );
  }
  // TEXT + BADGE — bilingual
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <input placeholder="EN" value={cell.textValueEn ?? ''} onChange={e => onChange({ ...cell, textValueEn: e.target.value })} style={s} />
      <input placeholder="AR" dir="rtl" value={cell.textValueAr ?? ''} onChange={e => onChange({ ...cell, textValueAr: e.target.value })} style={{ ...s, fontFamily: 'inherit' }} />
    </div>
  );
}

// ── Single table editor ────────────────────────────────────────────────────────
function TableEditor({ table: initialTable, onDelete, stores = [], banks = [] }) {
  const [table,       setTable]       = useState(initialTable);
  const [cellMap,     setCellMap]     = useState(() => buildCellMap(initialTable));
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const [showColForm, setShowColForm] = useState(false);
  const [showRowForm, setShowRowForm] = useState(false);
  const [editMeta,    setEditMeta]    = useState(false);
  const [metaForm,    setMetaForm]    = useState({
    titleEn:    table.translations?.find(t => t.locale === 'en')?.title    ?? '',
    titleAr:    table.translations?.find(t => t.locale === 'ar')?.title    ?? '',
    subtitleEn: table.translations?.find(t => t.locale === 'en')?.subtitle ?? '',
    subtitleAr: table.translations?.find(t => t.locale === 'ar')?.subtitle ?? '',
    entityType: table.entityType,
    order:      table.order,
  });

  const [colForm, setColForm] = useState(emptyCol());
  const [rowForm, setRowForm] = useState(emptyRow());

  function emptyCol() {
    return { nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '', badgeEn: '', badgeAr: '', image: '', isHighlighted: false, ctaUrl: '', storeId: '', bankId: '', bankCardId: '', voucherId: '', promoId: '', productId: '' };
  }
  function emptyRow() {
    return { labelEn: '', labelAr: '', helpTextEn: '', helpTextAr: '', rowType: 'TEXT', key: '' };
  }

  function flash(ok) {
    setMsg(ok ? '✓ Saved' : '✗ Failed');
    setTimeout(() => setMsg(''), 2500);
  }

  // ── Save metadata ────────────────────────────────────────────────────────
  async function saveMeta() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/comparison-tables/${table.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaForm),
      });
      if (res.ok) { const d = await res.json(); setTable(d); flash(true); setEditMeta(false); }
      else flash(false);
    } finally { setSaving(false); }
  }

  // ── Add column ───────────────────────────────────────────────────────────
  async function addColumn() {
    if (!colForm.nameEn.trim()) return alert('Column name (EN) is required');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/comparison-tables/${table.id}/columns`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colForm),
      });
      if (res.ok) {
        const col = await res.json();
        setTable(t => ({ ...t, columns: [...t.columns, col] }));
        setColForm(emptyCol());
        setShowColForm(false);
        flash(true);
      } else flash(false);
    } finally { setSaving(false); }
  }

  // ── Delete column ────────────────────────────────────────────────────────
  async function deleteColumn(colId) {
    if (!confirm('Delete this column and all its cells?')) return;
    await fetch(`/api/admin/comparison-tables/${table.id}/columns/${colId}`, { method: 'DELETE' });
    setTable(t => ({ ...t, columns: t.columns.filter(c => c.id !== colId) }));
    setCellMap(m => {
      const next = { ...m };
      Object.keys(next).filter(k => k.startsWith(`${colId}-`)).forEach(k => delete next[k]);
      return next;
    });
  }

  // ── Add row ──────────────────────────────────────────────────────────────
  async function addRow() {
    if (!rowForm.labelEn.trim()) return alert('Row label (EN) is required');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/comparison-tables/${table.id}/rows`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowForm),
      });
      if (res.ok) {
        const row = await res.json();
        setTable(t => ({ ...t, rows: [...t.rows, row] }));
        setRowForm(emptyRow());
        setShowRowForm(false);
        flash(true);
      } else flash(false);
    } finally { setSaving(false); }
  }

  // ── Delete row ───────────────────────────────────────────────────────────
  async function deleteRow(rowId) {
    if (!confirm('Delete this row and all its cells?')) return;
    await fetch(`/api/admin/comparison-tables/${table.id}/rows/${rowId}`, { method: 'DELETE' });
    setTable(t => ({ ...t, rows: t.rows.filter(r => r.id !== rowId) }));
    setCellMap(m => {
      const next = { ...m };
      Object.keys(next).filter(k => k.endsWith(`-${rowId}`)).forEach(k => delete next[k]);
      return next;
    });
  }

  // ── Save all cells ───────────────────────────────────────────────────────
  async function saveCells() {
    setSaving(true);
    try {
      const cells = Object.entries(cellMap).map(([key, cell]) => {
        const [colId, rowId] = key.split('-').map(Number);
        return { columnId: colId, rowId, ...cell };
      });
      const res = await fetch(`/api/admin/comparison-tables/${table.id}/cells`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells }),
      });
      flash(res.ok);
    } finally { setSaving(false); }
  }

  // ── Cell helpers ─────────────────────────────────────────────────────────
  function getCell(colId, rowId) {
    return cellMap[`${colId}-${rowId}`] || { textValueEn: '', textValueAr: '', numericValue: null, boolValue: null, isHighlighted: false };
  }
  function setCell(colId, rowId, value) {
    setCellMap(m => ({ ...m, [`${colId}-${rowId}`]: value }));
  }

  // ── Column image/name display helper ────────────────────────────────────
  function colDisplay(col) {
    const t = col.translations?.find(t => t.locale === 'en') || {};
    const img = col.image || col.bank?.logo || col.store?.logo || col.bankCard?.image || col.product?.image;
    const name = t.name || col.bank?.translations?.[0]?.name || col.store?.translations?.[0]?.name || 'Column';
    return { img, name, badge: t.badge };
  }

  const cols = table.columns || [];
  const rows = table.rows    || [];

  return (
    <div className="ctb-table-editor">

      {/* ── Table header ── */}
      <div className="ctb-table-header">
        <div className="ctb-table-title">
          <span className="material-symbols-sharp" style={{ fontSize: '1rem', color: '#470ae2' }}>table_chart</span>
          <span>{table.translations?.find(t => t.locale === 'en')?.title || '(Untitled table)'}</span>
          <span className="ctb-entity-badge">{table.entityType}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {msg && <span style={{ fontSize: '0.75rem', color: msg.startsWith('✓') ? '#16a34a' : '#ef4444' }}>{msg}</span>}
          <Btn onClick={() => setEditMeta(v => !v)}>⚙ Settings</Btn>
          <Btn variant="danger" onClick={onDelete}>Delete Table</Btn>
        </div>
      </div>

      {/* ── Meta editor ── */}
      {editMeta && (
        <div className="ctb-meta-form">
          <div className="ctb-meta-grid">
            <F label="Title (EN)" value={metaForm.titleEn} onChange={v => setMetaForm(f => ({ ...f, titleEn: v }))} />
            <F label="Title (AR)" value={metaForm.titleAr} onChange={v => setMetaForm(f => ({ ...f, titleAr: v }))} dir="rtl" />
            <F label="Subtitle (EN)" value={metaForm.subtitleEn} onChange={v => setMetaForm(f => ({ ...f, subtitleEn: v }))} />
            <F label="Subtitle (AR)" value={metaForm.subtitleAr} onChange={v => setMetaForm(f => ({ ...f, subtitleAr: v }))} dir="rtl" />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', alignItems: 'flex-end' }}>
            <Sel label="Entity Type" value={metaForm.entityType} onChange={v => setMetaForm(f => ({ ...f, entityType: v }))} options={ENTITY_TYPES} style={{ minWidth: 180 }} />
            <F label="Order" value={metaForm.order} onChange={v => setMetaForm(f => ({ ...f, order: v }))} type="number" style={{ width: 80 }} />
            <Btn variant="primary" onClick={saveMeta} disabled={saving}>Save Settings</Btn>
          </div>
        </div>
      )}

      {/* ── Spreadsheet grid ── */}
      {cols.length > 0 && rows.length > 0 && (
        <div className="ctb-grid-wrap">
          <table className="ctb-grid">
            <thead>
              <tr>
                <th className="ctb-row-label-header">Attribute</th>
                {cols.map(col => {
                  const { img, name, badge } = colDisplay(col);
                  return (
                    <th key={col.id} className={`ctb-col-header${col.isHighlighted ? ' ctb-col-highlighted' : ''}`}>
                      <div className="ctb-col-header-inner">
                        {img
                          ? <img src={img} alt={name} className="ctb-col-img" />
                          : <div className="ctb-col-initials">{name.slice(0, 2).toUpperCase()}</div>
                        }
                        <span className="ctb-col-name">{name}</span>
                        {badge && <span className="ctb-col-badge">{badge}</span>}
                        {col.isHighlighted && <span className="ctb-highlighted-dot" title="Highlighted column" />}
                      </div>
                      <button type="button" className="ctb-del-col" onClick={() => deleteColumn(col.id)} title="Delete column">✕</button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const rt = row.translations?.find(t => t.locale === 'en') || {};
                return (
                  <tr key={row.id}>
                    <td className="ctb-row-label">
                      <div className="ctb-row-label-inner">
                        <span className="material-symbols-sharp" style={{ fontSize: '0.85rem', color: 'var(--ap-text-muted)' }}>
                          {ROW_TYPES.find(r => r.value === row.rowType)?.icon || 'text_fields'}
                        </span>
                        <span>{rt.label || '—'}</span>
                        <span className="ctb-row-type-badge">{row.rowType}</span>
                      </div>
                      <button type="button" className="ctb-del-row" onClick={() => deleteRow(row.id)} title="Delete row">✕</button>
                    </td>
                    {cols.map(col => (
                      <td key={col.id} className={`ctb-cell${col.isHighlighted ? ' ctb-cell-highlighted' : ''}`}>
                        <div className="ctb-cell-inner">
                          <CellInput
                            rowType={row.rowType}
                            cell={getCell(col.id, row.id)}
                            onChange={v => setCell(col.id, row.id, v)}
                          />
                          <label className="ctb-cell-highlight-toggle" title="Highlight this cell">
                            <input
                              type="checkbox"
                              checked={getCell(col.id, row.id).isHighlighted ?? false}
                              onChange={e => setCell(col.id, row.id, { ...getCell(col.id, row.id), isHighlighted: e.target.checked })}
                            />
                            ★
                          </label>
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {cols.length === 0 && <p className="ctb-empty">No columns yet — add columns below to start building the table.</p>}
      {cols.length > 0 && rows.length === 0 && <p className="ctb-empty">Columns added. Now add rows (attributes to compare).</p>}

      {/* ── Save cells button ── */}
      {cols.length > 0 && rows.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
          <Btn variant="primary" onClick={saveCells} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save All Cells'}
          </Btn>
        </div>
      )}

      {/* ── Add Column form ── */}
      <div className="ctb-add-section">
        <Btn onClick={() => setShowColForm(v => !v)} variant="ghost">
          <span className="material-symbols-sharp" style={{ fontSize: '0.9rem' }}>add_circle</span>
          {showColForm ? 'Cancel' : 'Add Column'}
        </Btn>
        {showColForm && (
          <div className="ctb-add-form">
            <div className="ctb-form-row">
              <F label="Name (EN) *" value={colForm.nameEn} onChange={v => setColForm(f => ({ ...f, nameEn: v }))} />
              <F label="Name (AR)" value={colForm.nameAr} onChange={v => setColForm(f => ({ ...f, nameAr: v }))} dir="rtl" />
              <F label="Description (EN)" value={colForm.descriptionEn} onChange={v => setColForm(f => ({ ...f, descriptionEn: v }))} />
              <F label="Description (AR)" value={colForm.descriptionAr} onChange={v => setColForm(f => ({ ...f, descriptionAr: v }))} dir="rtl" />
            </div>
            <div className="ctb-form-row">
              <F label="Badge (EN)" value={colForm.badgeEn} onChange={v => setColForm(f => ({ ...f, badgeEn: v }))} placeholder="Best Value" />
              <F label="Badge (AR)" value={colForm.badgeAr} onChange={v => setColForm(f => ({ ...f, badgeAr: v }))} dir="rtl" placeholder="الأفضل" />
              <F label="Image URL" value={colForm.image} onChange={v => setColForm(f => ({ ...f, image: v }))} placeholder="https://…" />
              <F label="CTA URL" value={colForm.ctaUrl} onChange={v => setColForm(f => ({ ...f, ctaUrl: v }))} placeholder="https://…" />
            </div>
            <div className="ctb-form-row" style={{ alignItems: 'flex-end' }}>
              {/* Entity link dropdowns — conditional per entityType */}
              {metaForm.entityType === 'STORE' && stores.length > 0 && (
                <Sel label="Link Store" value={colForm.storeId} onChange={v => setColForm(f => ({ ...f, storeId: v }))} options={[{ value: '', label: '— None —' }, ...stores.map(s => ({ value: s.id, label: s.name }))]} />
              )}
              {(metaForm.entityType === 'BANK' || metaForm.entityType === 'BANK_CARD') && banks.length > 0 && (
                <Sel label="Link Bank" value={colForm.bankId} onChange={v => setColForm(f => ({ ...f, bankId: v }))} options={[{ value: '', label: '— None —' }, ...banks.map(b => ({ value: b.id, label: b.name }))]} />
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--ap-text-secondary)', cursor: 'pointer', marginBottom: 2 }}>
                <input type="checkbox" checked={colForm.isHighlighted} onChange={e => setColForm(f => ({ ...f, isHighlighted: e.target.checked }))} />
                Highlight (Best Pick)
              </label>
              <Btn variant="primary" onClick={addColumn} disabled={saving}>Add Column</Btn>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Row form ── */}
      <div className="ctb-add-section">
        <Btn onClick={() => setShowRowForm(v => !v)} variant="ghost">
          <span className="material-symbols-sharp" style={{ fontSize: '0.9rem' }}>playlist_add</span>
          {showRowForm ? 'Cancel' : 'Add Row'}
        </Btn>
        {showRowForm && (
          <div className="ctb-add-form">
            <div className="ctb-form-row">
              <F label="Label (EN) *" value={rowForm.labelEn} onChange={v => setRowForm(f => ({ ...f, labelEn: v }))} placeholder="e.g. Annual Fee" />
              <F label="Label (AR)" value={rowForm.labelAr} onChange={v => setRowForm(f => ({ ...f, labelAr: v }))} dir="rtl" placeholder="رسوم سنوية" />
              <F label="Help Text (EN)" value={rowForm.helpTextEn} onChange={v => setRowForm(f => ({ ...f, helpTextEn: v }))} placeholder="Tooltip shown on hover" />
              <Sel label="Row Type" value={rowForm.rowType} onChange={v => setRowForm(f => ({ ...f, rowType: v }))} options={ROW_TYPES} />
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <Btn variant="primary" onClick={addRow} disabled={saving}>Add Row</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Build cellMap from fetched table data
function buildCellMap(table) {
  const map = {};
  for (const col of table.columns || []) {
    for (const cell of col.cells || []) {
      map[`${col.id}-${cell.rowId}`] = {
        textValueEn:  cell.textValueEn  ?? '',
        textValueAr:  cell.textValueAr  ?? '',
        numericValue: cell.numericValue ?? null,
        boolValue:    cell.boolValue    ?? null,
        isHighlighted: cell.isHighlighted ?? false,
      };
    }
  }
  return map;
}

// ── Main exported component ───────────────────────────────────────────────────
export default function ComparisonTableBuilder({ postId, stores = [], banks = [] }) {
  const [tables,      setTables]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [adding,      setAdding]      = useState(false);
  const [newForm,     setNewForm]     = useState({ titleEn: '', titleAr: '', entityType: 'CUSTOM' });
  const [saving,      setSaving]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}/comparison-tables`);
      if (res.ok) {
        const { tables: data } = await res.json();
        setTables(data || []);
      }
    } finally { setLoading(false); }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  async function createTable() {
    if (!newForm.titleEn.trim()) return alert('Table title (EN) is required');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}/comparison-tables`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        const table = await res.json();
        setTables(t => [...t, table]);
        setNewForm({ titleEn: '', titleAr: '', entityType: 'CUSTOM' });
        setAdding(false);
      }
    } finally { setSaving(false); }
  }

  async function deleteTable(tableId) {
    if (!confirm('Delete this entire comparison table?')) return;
    await fetch(`/api/admin/comparison-tables/${tableId}`, { method: 'DELETE' });
    setTables(t => t.filter(t => t.id !== tableId));
  }

  if (loading) return <p style={{ color: 'var(--ap-text-muted)', fontSize: '0.85rem' }}>Loading comparison tables…</p>;

  return (
    <div className="ctb-root">

      {tables.length === 0 && !adding && (
        <p style={{ color: 'var(--ap-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          No comparison tables yet. Add one to insert a side-by-side comparison into this post.
        </p>
      )}

      {tables.map(table => (
        <TableEditor
          key={table.id}
          table={table}
          stores={stores}
          banks={banks}
          onDelete={() => deleteTable(table.id)}
        />
      ))}

      {/* ── New table form ── */}
      {adding ? (
        <div className="ctb-new-form">
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>New Comparison Table</h4>
          <div className="ctb-form-row">
            <F label="Title (EN) *" value={newForm.titleEn} onChange={v => setNewForm(f => ({ ...f, titleEn: v }))} placeholder="e.g. Best Travel Credit Cards 2025" />
            <F label="Title (AR)" value={newForm.titleAr} onChange={v => setNewForm(f => ({ ...f, titleAr: v }))} dir="rtl" placeholder="أفضل بطاقات الائتمان للسفر" />
            <Sel label="Entity Type" value={newForm.entityType} onChange={v => setNewForm(f => ({ ...f, entityType: v }))} options={ENTITY_TYPES} />
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <Btn variant="primary" onClick={createTable} disabled={saving}>{saving ? 'Creating…' : 'Create Table'}</Btn>
            <Btn onClick={() => setAdding(false)}>Cancel</Btn>
          </div>
        </div>
      ) : (
        <Btn variant="amber" onClick={() => setAdding(true)} style={{ marginTop: tables.length > 0 ? '1rem' : 0 }}>
          <span className="material-symbols-sharp" style={{ fontSize: '0.95rem' }}>table_chart</span>
          + Add Comparison Table
        </Btn>
      )}
    </div>
  );
}
