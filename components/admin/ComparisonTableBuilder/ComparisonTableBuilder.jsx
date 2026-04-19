'use client';
// components/admin/ComparisonTableBuilder/ComparisonTableBuilder.jsx
//
// Redesigned comparison table editor:
//  - A table = columns (things being compared) × rows (attributes)
//  - EN / AR are edited in a split-pane grid — no more nested modals
//  - Add table → fill column names → add rows → fill cells inline
//
// Place at: components/admin/ComparisonTableBuilder/ComparisonTableBuilder.jsx

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── tiny CSS-in-JS (no external sheet needed) ───────────────────────────────
const S = {
  wrap:     { fontFamily: 'var(--ap-sans, system-ui)', color: 'var(--admin-text, #1a1a2e)' },
  toolbar:  { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  card:     {
    border: '1px solid var(--admin-border, #e5e7eb)',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    background: 'var(--admin-surface, #fff)',
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
  },
  cardHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'var(--admin-bg, #f8f9fa)',
    borderBottom: '1px solid var(--admin-border, #e5e7eb)',
    gap: 8,
  },
  cardTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #1a1a2e)', flex: 1 },
  // Grid
  grid:     { overflowX: 'auto' },
  table:    { borderCollapse: 'collapse', width: '100%', minWidth: 600, fontSize: 12 },
  th:       {
    padding: '6px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11,
    background: 'var(--admin-bg, #f8f9fa)', borderBottom: '2px solid var(--admin-border, #e5e7eb)',
    whiteSpace: 'nowrap', verticalAlign: 'bottom',
  },
  td:       {
    padding: 0, borderBottom: '1px solid var(--admin-border-light, #f0f0f0)',
    borderRight: '1px solid var(--admin-border-light, #f0f0f0)',
    verticalAlign: 'top',
  },
  cellWrap: { display: 'flex', flexDirection: 'column', gap: 0 },
  cellInput: {
    width: '100%', border: 'none', outline: 'none', padding: '5px 8px',
    fontSize: 12, background: 'transparent', resize: 'none',
    fontFamily: 'inherit', lineHeight: 1.4,
  },
  cellInputAr: { direction: 'rtl', borderTop: '1px dashed #e5e7eb', background: 'rgba(71,10,226,.03)' },
  langBadge: {
    fontSize: 9, fontWeight: 800, letterSpacing: '.05em', padding: '1px 4px',
    borderRadius: 3, lineHeight: 1, textTransform: 'uppercase',
  },
  // Buttons
  btnPrimary: {
    background: '#470ae2', color: '#fff', border: 'none', borderRadius: 6,
    padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  btnGhost: {
    background: 'transparent', color: 'var(--admin-text-light, #6b7280)',
    border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 6,
    padding: '5px 10px', cursor: 'pointer', fontSize: 12,
  },
  btnDanger: {
    background: 'transparent', color: '#dc2626',
    border: '1px solid #fca5a5', borderRadius: 6,
    padding: '5px 10px', cursor: 'pointer', fontSize: 12,
  },
  btnIcon: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 16, lineHeight: 1, padding: 4, color: 'var(--admin-text-light, #6b7280)',
    borderRadius: 4,
  },
  input: {
    border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 6,
    padding: '6px 10px', fontSize: 12, width: '100%', outline: 'none',
    background: 'var(--admin-surface, #fff)', color: 'var(--admin-text, #1a1a2e)',
  },
  select: {
    border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 6,
    padding: '6px 10px', fontSize: 12, outline: 'none', cursor: 'pointer',
    background: 'var(--admin-surface, #fff)',
  },
  label: { fontSize: 11, fontWeight: 600, color: 'var(--admin-text-light, #6b7280)', marginBottom: 3, display: 'block' },
  row:   { display: 'flex', gap: 8, alignItems: 'flex-end' },
  col:   { display: 'flex', flexDirection: 'column', flex: 1 },
  hint:  { fontSize: 11, color: 'var(--admin-text-muted, #9ca3af)', marginTop: 3 },
  rowTypeBadge: {
    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
    whiteSpace: 'nowrap', border: '1px solid',
  },
  colHeader: {
    padding: '8px 10px',
    borderBottom: '1px solid var(--admin-border, #e5e7eb)',
  },
  colHeaderEn: { fontWeight: 700, fontSize: 12 },
  colHeaderAr: { fontSize: 11, color: 'var(--admin-text-light, #6b7280)', direction: 'rtl', marginTop: 1 },
};

const ROW_TYPES = [
  { value: 'TEXT',    label: 'Text',    color: '#dbeafe', textColor: '#1d4ed8' },
  { value: 'RATING',  label: 'Rating ★', color: '#fef9c3', textColor: '#a16207' },
  { value: 'BOOLEAN', label: 'Yes / No', color: '#dcfce7', textColor: '#166534' },
  { value: 'BADGE',   label: 'Badge',   color: '#ede9fe', textColor: '#5b21b6' },
];

const ENTITY_TYPES = [
  { value: 'CUSTOM',    label: 'Custom' },
  { value: 'STORE',     label: 'Store' },
  { value: 'BANK',      label: 'Bank' },
  { value: 'BANK_CARD', label: 'Bank Card' },
  { value: 'VOUCHER',   label: 'Voucher / Code' },
  { value: 'PRODUCT',   label: 'Product' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function RowTypeBadge({ type }) {
  const def = ROW_TYPES.find(r => r.value === type) || ROW_TYPES[0];
  return (
    <span style={{ ...S.rowTypeBadge, background: def.color, color: def.textColor, borderColor: def.color }}>
      {def.label}
    </span>
  );
}

// Boolean cell renders a toggle instead of free text
function BoolCell({ enVal, arVal, onChange }) {
  const val = enVal === 'true' || enVal === '✓';
  return (
    <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        type="button"
        onClick={() => { const n = val ? 'false' : 'true'; onChange(n, n); }}
        style={{
          width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: val ? '#22c55e' : '#d1d5db', position: 'relative', transition: 'background .15s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: val ? 18 : 2, width: 16, height: 16,
          borderRadius: '50%', background: '#fff', transition: 'left .15s',
        }} />
      </button>
      <span style={{ fontSize: 11, color: val ? '#166534' : '#6b7280' }}>{val ? 'Yes / نعم' : 'No / لا'}</span>
    </div>
  );
}

// Rating cell (1–5 stars)
function RatingCell({ enVal, onChange }) {
  const num = parseInt(enVal) || 0;
  return (
    <div style={{ padding: '4px 8px', display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(String(n), String(n))}
          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                   fontSize: 16, color: n <= num ? '#f59e0b' : '#d1d5db' }}
        >★</button>
      ))}
    </div>
  );
}

// ─── individual table editor ──────────────────────────────────────────────────

function TableEditor({ table, postId, onUpdate, onDelete }) {
  const [cols,    setCols]    = useState(table.columns || []);
  const [rows,    setRows]    = useState(table.rows    || []);
  const [cells,   setCells]   = useState(() => {
    // flat map: { [colId-rowId]: { textValueEn, textValueAr, numericValue, boolValue } }
    const map = {};
    (table.columns || []).forEach(col =>
      (col.cells || []).forEach(cell => {
        map[`${cell.columnId}-${cell.rowId}`] = cell;
      })
    );
    return map;
  });

  const [saving,    setSaving]    = useState(false);
  const [addColOpen, setAddColOpen] = useState(false);
  const [addRowOpen, setAddRowOpen] = useState(false);
  const [titleEn,    setTitleEn]    = useState(table.translations?.find(t => t.locale === 'en')?.title || '');
  const [titleAr,    setTitleAr]    = useState(table.translations?.find(t => t.locale === 'ar')?.title || '');
  const [newCol,     setNewCol]     = useState({ nameEn: '', nameAr: '' });
  const [newRow,     setNewRow]     = useState({ labelEn: '', labelAr: '', rowType: 'TEXT' });
  const saveTimer = useRef(null);

  // Debounced cell save
  const flushCells = useCallback(async (cellMap) => {
    const payload = Object.values(cellMap).filter(c => c.columnId && c.rowId);
    if (!payload.length) return;
    await fetch(`/api/admin/comparison-tables/${table.id}/cells`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cells: payload }),
    });
  }, [table.id]);

  const updateCell = useCallback((colId, rowId, enVal, arVal) => {
    const key = `${colId}-${rowId}`;
    const updated = {
      ...cells,
      [key]: { ...cells[key], columnId: colId, rowId, textValueEn: enVal, textValueAr: arVal },
    };
    setCells(updated);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flushCells(updated), 900);
  }, [cells, flushCells]);

  // Save table title
  async function saveTitle() {
    await fetch(`/api/admin/comparison-tables/${table.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titleEn, titleAr }),
    });
  }

  // Add column
  async function addColumn() {
    if (!newCol.nameEn) return;
    setSaving(true);
    const res = await fetch(`/api/admin/comparison-tables/${table.id}/columns`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameEn: newCol.nameEn, nameAr: newCol.nameAr }),
    });
    const col = await res.json();
    setCols(prev => [...prev, col]);
    setNewCol({ nameEn: '', nameAr: '' });
    setAddColOpen(false);
    setSaving(false);
  }

  // Add row
  async function addRow() {
    if (!newRow.labelEn) return;
    setSaving(true);
    const res = await fetch(`/api/admin/comparison-tables/${table.id}/rows`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        labelEn: newRow.labelEn, labelAr: newRow.labelAr, rowType: newRow.rowType,
      }),
    });
    const row = await res.json();
    setRows(prev => [...prev, row]);
    setNewRow({ labelEn: '', labelAr: '', rowType: 'TEXT' });
    setAddRowOpen(false);
    setSaving(false);
  }

  // Delete column
  async function deleteColumn(colId) {
    if (!confirm('Delete this column and all its cells?')) return;
    await fetch(`/api/admin/comparison-tables/${table.id}/columns/${colId}`, { method: 'DELETE' });
    setCols(prev => prev.filter(c => c.id !== colId));
  }

  // Delete row
  async function deleteRow(rowId) {
    if (!confirm('Delete this row and all its cells?')) return;
    await fetch(`/api/admin/comparison-tables/${table.id}/rows/${rowId}`, { method: 'DELETE' });
    setRows(prev => prev.filter(r => r.id !== rowId));
  }

  // Flush on unmount
  useEffect(() => () => {
    clearTimeout(saveTimer.current);
    flushCells(cells);
  }, []);

  return (
    <div style={S.card}>
      {/* Header */}
      <div style={S.cardHead}>
        <div style={{ flex: 1 }}>
          <div style={S.row}>
            <div style={{ ...S.col, flex: 1 }}>
              <label style={S.label}>Table title (EN)</label>
              <input style={S.input} value={titleEn} onChange={e => setTitleEn(e.target.value)}
                     onBlur={saveTitle} placeholder="e.g. Compare Cashback Cards" />
            </div>
            <div style={{ ...S.col, flex: 1 }}>
              <label style={S.label}>Table title (AR) — عنوان الجدول</label>
              <input style={{ ...S.input, direction: 'rtl' }} value={titleAr}
                     onChange={e => setTitleAr(e.target.value)} onBlur={saveTitle}
                     placeholder="قارن بطاقات الكاش باك" />
            </div>
          </div>
        </div>
        <button style={{ ...S.btnDanger, marginTop: 16 }} type="button" onClick={onDelete}>
          🗑 Delete table
        </button>
      </div>

      {/* Grid */}
      <div style={S.grid}>
        <table style={S.table}>
          <thead>
            <tr>
              {/* Row-label column */}
              <th style={{ ...S.th, width: 160, minWidth: 140 }}>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>Attribute / السمة</div>
              </th>
              {/* One <th> per column */}
              {cols.map(col => {
                const tEn = col.translations?.find(t => t.locale === 'en')?.name || col.name || '';
                const tAr = col.translations?.find(t => t.locale === 'ar')?.name || '';
                return (
                  <th key={col.id} style={{ ...S.th, minWidth: 160 }}>
                    <div style={S.colHeader}>
                      <div style={S.colHeaderEn}>{tEn || <span style={{ color: '#9ca3af' }}>Unnamed</span>}</div>
                      {tAr && <div style={S.colHeaderAr}>{tAr}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <EditColumnPopover col={col} tableId={table.id} onSaved={updated => {
                        setCols(prev => prev.map(c => c.id === col.id ? { ...c, ...updated } : c));
                      }} />
                      <button type="button" style={S.btnIcon} onClick={() => deleteColumn(col.id)}
                              title="Delete column">✕</button>
                    </div>
                  </th>
                );
              })}
              {/* Add column button */}
              <th style={{ ...S.th, width: 120 }}>
                {addColOpen ? (
                  <div style={{ padding: 4, minWidth: 140 }}>
                    <input style={{ ...S.input, marginBottom: 4 }} placeholder="Name (EN)" autoFocus
                           value={newCol.nameEn} onChange={e => setNewCol(p => ({ ...p, nameEn: e.target.value }))} />
                    <input style={{ ...S.input, direction: 'rtl', marginBottom: 6 }} placeholder="الاسم (AR)"
                           value={newCol.nameAr} onChange={e => setNewCol(p => ({ ...p, nameAr: e.target.value }))} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" style={S.btnPrimary} onClick={addColumn} disabled={saving}>
                        {saving ? '…' : '+ Add'}
                      </button>
                      <button type="button" style={S.btnGhost} onClick={() => setAddColOpen(false)}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" style={{ ...S.btnGhost, width: '100%' }}
                          onClick={() => setAddColOpen(true)}>+ Column</button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const tEn = row.translations?.find(t => t.locale === 'en')?.label || '';
              const tAr = row.translations?.find(t => t.locale === 'ar')?.label || '';
              const rowType = row.rowType || 'TEXT';
              return (
                <tr key={row.id}>
                  {/* Row label */}
                  <td style={{ ...S.td, padding: '6px 8px', background: 'var(--admin-bg, #f8f9fa)' }}>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{tEn || <span style={{ color: '#9ca3af' }}>Label</span>}</div>
                    {tAr && <div style={{ fontSize: 11, direction: 'rtl', color: 'var(--admin-text-light, #6b7280)' }}>{tAr}</div>}
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
                      <RowTypeBadge type={rowType} />
                      <EditRowPopover row={row} tableId={table.id} onSaved={updated => {
                        setRows(prev => prev.map(r => r.id === row.id ? { ...r, ...updated } : r));
                      }} />
                      <button type="button" style={{ ...S.btnIcon, fontSize: 12 }} onClick={() => deleteRow(row.id)}>✕</button>
                    </div>
                  </td>
                  {/* One cell per column */}
                  {cols.map(col => {
                    const key = `${col.id}-${row.id}`;
                    const cell = cells[key] || {};
                    const enVal = cell.textValueEn || '';
                    const arVal = cell.textValueAr || '';
                    return (
                      <td key={col.id} style={S.td}>
                        {rowType === 'BOOLEAN' ? (
                          <BoolCell enVal={enVal} arVal={arVal}
                                    onChange={(e, a) => updateCell(col.id, row.id, e, a)} />
                        ) : rowType === 'RATING' ? (
                          <RatingCell enVal={enVal} onChange={(e, a) => updateCell(col.id, row.id, e, a)} />
                        ) : (
                          <div style={S.cellWrap}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 4, paddingTop: 2 }}>
                              <span style={{ ...S.langBadge, background: '#dbeafe', color: '#1d4ed8' }}>EN</span>
                            </div>
                            <textarea style={S.cellInput} rows={1} value={enVal} placeholder="—"
                                      onChange={e => updateCell(col.id, row.id, e.target.value, arVal)} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 4, paddingTop: 1 }}>
                              <span style={{ ...S.langBadge, background: '#fef3c7', color: '#b45309' }}>AR</span>
                            </div>
                            <textarea style={{ ...S.cellInput, ...S.cellInputAr }} rows={1} value={arVal} placeholder="—"
                                      onChange={e => updateCell(col.id, row.id, enVal, e.target.value)} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ ...S.td, background: 'transparent' }} />
                </tr>
              );
            })}
            {/* Add row */}
            <tr>
              <td colSpan={cols.length + 2} style={{ padding: 8, background: 'var(--admin-bg, #f8f9fa)' }}>
                {addRowOpen ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={S.col}>
                      <label style={S.label}>Row label (EN)</label>
                      <input style={S.input} autoFocus placeholder="e.g. Annual Fee"
                             value={newRow.labelEn} onChange={e => setNewRow(p => ({ ...p, labelEn: e.target.value }))} />
                    </div>
                    <div style={S.col}>
                      <label style={S.label}>Row label (AR)</label>
                      <input style={{ ...S.input, direction: 'rtl' }} placeholder="الرسوم السنوية"
                             value={newRow.labelAr} onChange={e => setNewRow(p => ({ ...p, labelAr: e.target.value }))} />
                    </div>
                    <div style={{ ...S.col, flex: 0, minWidth: 120 }}>
                      <label style={S.label}>Cell type</label>
                      <select style={S.select} value={newRow.rowType}
                              onChange={e => setNewRow(p => ({ ...p, rowType: e.target.value }))}>
                        {ROW_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <button type="button" style={S.btnPrimary} onClick={addRow} disabled={saving}>
                      {saving ? '…' : '+ Add Row'}
                    </button>
                    <button type="button" style={S.btnGhost} onClick={() => setAddRowOpen(false)}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" style={S.btnGhost} onClick={() => setAddRowOpen(true)}>
                    + Add row
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Autosave hint */}
      <div style={{ padding: '6px 12px', fontSize: 10, color: '#9ca3af', borderTop: '1px solid var(--admin-border-light, #f0f0f0)' }}>
        ✓ Cells save automatically after typing stops.
      </div>
    </div>
  );
}

// ─── edit column popover ──────────────────────────────────────────────────────

function EditColumnPopover({ col, tableId, onSaved }) {
  const [open, setOpen]   = useState(false);
  const [nameEn, setEn]   = useState(col.translations?.find(t => t.locale === 'en')?.name || '');
  const [nameAr, setAr]   = useState(col.translations?.find(t => t.locale === 'ar')?.name || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/comparison-tables/${tableId}/columns/${col.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameEn, nameAr }),
    });
    const updated = await res.json();
    onSaved(updated);
    setSaving(false);
    setOpen(false);
  }

  if (!open) return (
    <button type="button" style={S.btnIcon} onClick={() => setOpen(true)} title="Edit column">✎</button>
  );

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 24, left: 0, zIndex: 50, width: 220,
        background: '#fff', border: '1px solid var(--admin-border, #e5e7eb)',
        borderRadius: 8, padding: 10, boxShadow: '0 4px 12px rgba(0,0,0,.1)',
      }}>
        <label style={S.label}>Name (EN)</label>
        <input style={{ ...S.input, marginBottom: 6 }} value={nameEn} autoFocus onChange={e => setEn(e.target.value)} />
        <label style={S.label}>Name (AR)</label>
        <input style={{ ...S.input, direction: 'rtl', marginBottom: 8 }} value={nameAr} onChange={e => setAr(e.target.value)} />
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" style={S.btnPrimary} onClick={save} disabled={saving}>{saving ? '…' : 'Save'}</button>
          <button type="button" style={S.btnGhost} onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── edit row popover ─────────────────────────────────────────────────────────

function EditRowPopover({ row, tableId, onSaved }) {
  const [open, setOpen]     = useState(false);
  const [labelEn, setEn]    = useState(row.translations?.find(t => t.locale === 'en')?.label || '');
  const [labelAr, setAr]    = useState(row.translations?.find(t => t.locale === 'ar')?.label || '');
  const [rowType, setType]  = useState(row.rowType || 'TEXT');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/comparison-tables/${tableId}/rows/${row.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelEn, labelAr, rowType }),
    });
    const updated = await res.json();
    onSaved(updated);
    setSaving(false);
    setOpen(false);
  }

  if (!open) return (
    <button type="button" style={{ ...S.btnIcon, fontSize: 11 }} onClick={() => setOpen(true)} title="Edit row">✎</button>
  );

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 20, left: 0, zIndex: 50, width: 220,
        background: '#fff', border: '1px solid var(--admin-border, #e5e7eb)',
        borderRadius: 8, padding: 10, boxShadow: '0 4px 12px rgba(0,0,0,.1)',
      }}>
        <label style={S.label}>Label (EN)</label>
        <input style={{ ...S.input, marginBottom: 6 }} value={labelEn} autoFocus onChange={e => setEn(e.target.value)} />
        <label style={S.label}>Label (AR)</label>
        <input style={{ ...S.input, direction: 'rtl', marginBottom: 6 }} value={labelAr} onChange={e => setAr(e.target.value)} />
        <label style={S.label}>Cell type</label>
        <select style={{ ...S.select, width: '100%', marginBottom: 8 }} value={rowType} onChange={e => setType(e.target.value)}>
          {ROW_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" style={S.btnPrimary} onClick={save} disabled={saving}>{saving ? '…' : 'Save'}</button>
          <button type="button" style={S.btnGhost} onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export default function ComparisonTableBuilder({ postId }) {
  const [tables,   setTables]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTable, setNewTable] = useState({ entityType: 'CUSTOM', titleEn: '', titleAr: '' });

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/admin/blog/${postId}/comparison-tables`)
      .then(r => r.json())
      .then(d => { setTables(d.tables || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [postId]);

  async function createTable() {
    if (!newTable.titleEn) return;
    setCreating(true);
    const res = await fetch(`/api/admin/blog/${postId}/comparison-tables`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTable),
    });
    const table = await res.json();
    setTables(prev => [...prev, table]);
    setNewTable({ entityType: 'CUSTOM', titleEn: '', titleAr: '' });
    setCreating(false);
  }

  async function deleteTable(tableId) {
    if (!confirm('Delete this comparison table permanently?')) return;
    await fetch(`/api/admin/comparison-tables/${tableId}`, { method: 'DELETE' });
    setTables(prev => prev.filter(t => t.id !== tableId));
  }

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading tables…</p>;

  return (
    <div style={S.wrap}>
      {/* Existing tables */}
      {tables.map(table => (
        <TableEditor
          key={table.id}
          table={table}
          postId={postId}
          onUpdate={updated => setTables(prev => prev.map(t => t.id === table.id ? { ...t, ...updated } : t))}
          onDelete={() => deleteTable(table.id)}
        />
      ))}

      {/* New table form */}
      <div style={{ ...S.card, borderStyle: 'dashed', borderColor: '#470ae2', background: '#faf8ff' }}>
        <div style={{ padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#470ae2' }}>
            + New Comparison Table
          </p>
          <div style={S.row}>
            <div style={S.col}>
              <label style={S.label}>Entity type</label>
              <select style={S.select} value={newTable.entityType}
                      onChange={e => setNewTable(p => ({ ...p, entityType: e.target.value }))}>
                {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ ...S.col, flex: 2 }}>
              <label style={S.label}>Title (EN) *</label>
              <input style={S.input} placeholder="e.g. Top Cashback Credit Cards in Saudi Arabia"
                     value={newTable.titleEn} onChange={e => setNewTable(p => ({ ...p, titleEn: e.target.value }))} />
            </div>
            <div style={{ ...S.col, flex: 2 }}>
              <label style={S.label}>Title (AR)</label>
              <input style={{ ...S.input, direction: 'rtl' }} placeholder="أفضل بطاقات الكاش باك في السعودية"
                     value={newTable.titleAr} onChange={e => setNewTable(p => ({ ...p, titleAr: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="button" style={S.btnPrimary} onClick={createTable} disabled={creating || !newTable.titleEn}>
              {creating ? 'Creating…' : 'Create Table'}
            </button>
          </div>
          <p style={S.hint}>After creating: add columns (the things being compared), then rows (the attributes), then fill in the grid cells.</p>
        </div>
      </div>
    </div>
  );
}
