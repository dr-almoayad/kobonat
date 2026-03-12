'use client';
// components/admin/SectionBlocksEditor/SectionBlocksEditor.jsx
//
// Inline block-based content editor for a single BlogPostSection.
// Props:
//   postId    Int  – parent post (for fetching tables)
//   sectionId Int  – section being edited

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './SectionBlocksEditor.module.css';
import RichTextEditor from '@/components/admin/RichTextEditor/RichTextEditor'; // Add this line

// ─── Constants ────────────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { value: 'TEXT',    label: 'Text',        icon: 'text_fields'     },
  { value: 'POST',    label: 'Post embed',  icon: 'article'         },
  { value: 'TABLE',   label: 'Table',       icon: 'table_chart'     },
  { value: 'PRODUCT', label: 'Product',     icon: 'inventory_2'     },
  { value: 'STORE',   label: 'Store',       icon: 'store'           },
  { value: 'BANK',    label: 'Bank',        icon: 'account_balance' },
  { value: 'CARD',    label: 'Credit card', icon: 'credit_card'     },
];

const TYPE_ICON = Object.fromEntries(BLOCK_TYPES.map(t => [t.value, t.icon]));

// ─── Block summary (one-liner shown in collapsed header) ──────────────────────
function blockSummary(block) {
  switch (block.type) {
    case 'TEXT':
      return block.textEn
        ? block.textEn.replace(/<[^>]+>/g, '').slice(0, 60) + (block.textEn.length > 60 ? '…' : '')
        : '(empty)';
    case 'POST':    return block.post?.translations?.[0]?.title || `Post #${block.postId}` || '—';
    case 'TABLE':   return block.table?.translations?.find(t => t.locale === 'en')?.title || `Table #${block.tableId}` || '—';
    case 'PRODUCT': return block.product?.translations?.[0]?.title || `Product #${block.productId}` || '—';
    case 'STORE':   return block.store?.translations?.find(t => t.locale === 'en')?.name || `Store #${block.storeId}` || '—';
    case 'BANK':    return block.bank?.translations?.[0]?.name || `Bank #${block.bankId}` || '—';
    case 'CARD':    return block.card?.translations?.[0]?.name || `Card #${block.cardId}` || '—';
    default:        return '—';
  }
}

// ─── Generic search dropdown ──────────────────────────────────────────────────
function SearchPicker({ placeholder, onSearch, onSelect, renderItem, selectedLabel, onClear }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy]       = useState(false);
  const timer = useRef(null);

  function handleQuery(q) {
    setQuery(q);
    clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setBusy(true);
      const r = await onSearch(q);
      setResults(r || []);
      setBusy(false);
    }, 300);
  }

  function pick(item) {
    onSelect(item);
    setQuery('');
    setResults([]);
  }

  return (
    <div className={styles.pickerWrap}>
      {selectedLabel ? (
        <div className={styles.selectedChip}>
          <span>{selectedLabel}</span>
          <button type="button" onClick={onClear} className={styles.clearBtn}>×</button>
        </div>
      ) : (
        <>
          <input
            className={styles.pickerInput}
            placeholder={placeholder}
            value={query}
            onChange={e => handleQuery(e.target.value)}
          />
          {busy && <p className={styles.pickerHint}>Searching…</p>}
          {results.length > 0 && (
            <div className={styles.pickerDropdown}>
              {results.map((item, i) => (
                <button key={i} type="button" className={styles.pickerOption} onClick={() => pick(item)}>
                  {renderItem(item)}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Static list picker (banks, tables) ───────────────────────────────────────
function ListPicker({ items, value, onChange, placeholder }) {
  return (
    <select className={styles.listSelect} value={value ?? ''} onChange={e => onChange(e.target.value || null)}>
      <option value="">{placeholder || '— Select —'}</option>
      {items.map(item => (
        <option key={item.id} value={item.id}>{item.label}</option>
      ))}
    </select>
  );
}

// ─── Text block editor ────────────────────────────────────────────────────────
function TextEditor({ block, onUpdate }) {
  const [en, setEn]     = useState(block.textEn || '');
  const [ar, setAr]     = useState(block.textAr || '');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function change(lang, val) {
    if (lang === 'en') setEn(val); else setAr(val);
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    await onUpdate({ textEn: en, textAr: ar });
    setDirty(false);
    setSaving(false);
  }

  return (
    <div className={styles.textEditor}>
      <div className={styles.textEditorRow}>
        <div className={styles.textEditorCol}>
          <label className={styles.fieldLabel}>Content (EN)</label>
          {/* Replace textarea with RichTextEditor */}
          <RichTextEditor
            value={en}
            onChange={val => change('en', val)}
            dir="ltr"
            minHeight="200px"
            placeholder="HTML content in English…"
          />
        </div>
        <div className={styles.textEditorCol}>
          <label className={styles.fieldLabel}>Content (AR)</label>
          {/* Replace textarea with RichTextEditor */}
          <RichTextEditor
            value={ar}
            onChange={val => change('ar', val)}
            dir="rtl"
            minHeight="200px"
            placeholder="المحتوى بالعربية…"
          />
        </div>
      </div>
      <button
        type="button"
        className={styles.btnSave}
        onClick={save}
        disabled={!dirty || saving}
      >
        {saving ? 'Saving…' : dirty ? 'Save Text' : 'Saved'}
      </button>
    </div>
  );
}

// ─── Entity editors ───────────────────────────────────────────────────────────
function PostEditor({ block, onUpdate }) {
  const label = block.post?.translations?.[0]?.title || (block.postId ? `Post #${block.postId}` : null);

  async function search(q) {
    const res = await fetch(`/api/admin/blog?locale=en`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter(p => (p.translations?.[0]?.title || p.slug || '').toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);
  }

  return (
    <SearchPicker
      placeholder="Search posts…"
      onSearch={search}
      onSelect={item => onUpdate({ postId: item.id })}
      renderItem={item => item.translations?.[0]?.title || item.slug}
      selectedLabel={label}
      onClear={() => onUpdate({ postId: null })}
    />
  );
}

function TableEditor({ block, postId, onUpdate }) {
  const [tables, setTables] = useState([]);

  useEffect(() => {
    fetch(`/api/admin/blog/${postId}/comparison-tables`)
      .then(r => r.json())
      .then(data => setTables(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [postId]);

  const items = tables.map(t => ({
    id: t.id,
    label: t.translations?.find(x => x.locale === 'en')?.title || `Table #${t.id}`,
  }));

  return (
    <ListPicker
      items={items}
      value={block.tableId}
      onChange={val => onUpdate({ tableId: val ? parseInt(val) : null })}
      placeholder="— Select a comparison table —"
    />
  );
}

function ProductEditor({ block, onUpdate }) {
  const label = block.product?.translations?.[0]?.title || (block.productId ? `Product #${block.productId}` : null);

  async function search(q) {
    const res = await fetch(`/api/admin/products?locale=en&search=${encodeURIComponent(q)}`);
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 8) : [];
  }

  return (
    <SearchPicker
      placeholder="Search products…"
      onSearch={search}
      onSelect={item => onUpdate({ productId: item.id })}
      renderItem={item => item.translations?.[0]?.title || `Product #${item.id}`}
      selectedLabel={label}
      onClear={() => onUpdate({ productId: null })}
    />
  );
}

function StoreEditor({ block, onUpdate }) {
  const label = block.store?.translations?.find(t => t.locale === 'en')?.name
    || (block.storeId ? `Store #${block.storeId}` : null);

  async function search(q) {
    const res = await fetch(`/api/admin/stores?locale=en&search=${encodeURIComponent(q)}`);
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 8) : [];
  }

  return (
    <SearchPicker
      placeholder="Search stores…"
      onSearch={search}
      onSelect={item => onUpdate({ storeId: item.id })}
      renderItem={item => item.translations?.find(t => t.locale === 'en')?.name || `Store #${item.id}`}
      selectedLabel={label}
      onClear={() => onUpdate({ storeId: null })}
    />
  );
}

function BankEditor({ block, onUpdate }) {
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    fetch('/api/admin/banks?locale=en')
      .then(r => r.json())
      .then(data => setBanks(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const items = banks.map(b => ({
    id: b.id,
    label: b.translations?.[0]?.name || `Bank #${b.id}`,
  }));

  return (
    <ListPicker
      items={items}
      value={block.bankId}
      onChange={val => onUpdate({ bankId: val ? parseInt(val) : null })}
      placeholder="— Select a bank —"
    />
  );
}

function CardEditor({ block, onUpdate }) {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    fetch('/api/admin/bank-cards?locale=en')
      .then(r => r.json())
      .then(data => setCards(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const items = cards.map(c => ({
    id: c.id,
    label: c.translations?.[0]?.name
      ? `${c.translations[0].name}${c.bank?.translations?.[0]?.name ? ` — ${c.bank.translations[0].name}` : ''}`
      : `Card #${c.id}`,
  }));

  return (
    <ListPicker
      items={items}
      value={block.cardId}
      onChange={val => onUpdate({ cardId: val ? parseInt(val) : null })}
      placeholder="— Select a credit card —"
    />
  );
}

// ─── Block row ────────────────────────────────────────────────────────────────
function BlockRow({ block, idx, total, postId, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = useState(
    block.type === 'TEXT' && !block.textEn && !block.textAr
  );

  const typeInfo = BLOCK_TYPES.find(t => t.value === block.type) || {};

  function renderEditor() {
    switch (block.type) {
      case 'TEXT':    return <TextEditor    block={block}             onUpdate={onUpdate} />;
      case 'POST':    return <PostEditor    block={block}             onUpdate={onUpdate} />;
      case 'TABLE':   return <TableEditor   block={block} postId={postId} onUpdate={onUpdate} />;
      case 'PRODUCT': return <ProductEditor block={block}             onUpdate={onUpdate} />;
      case 'STORE':   return <StoreEditor   block={block}             onUpdate={onUpdate} />;
      case 'BANK':    return <BankEditor    block={block}             onUpdate={onUpdate} />;
      case 'CARD':    return <CardEditor    block={block}             onUpdate={onUpdate} />;
      default:        return null;
    }
  }

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader}>

        {/* Order controls */}
        <div className={styles.orderControls}>
          <button
            type="button"
            className={styles.orderBtn}
            onClick={onMoveUp}
            disabled={idx === 0}
            title="Move up"
          >
            <span className="material-symbols-sharp">arrow_upward</span>
          </button>
          <span className={styles.orderNum}>{idx + 1}</span>
          <button
            type="button"
            className={styles.orderBtn}
            onClick={onMoveDown}
            disabled={idx === total - 1}
            title="Move down"
          >
            <span className="material-symbols-sharp">arrow_downward</span>
          </button>
        </div>

        {/* Type badge + summary */}
        <div className={styles.blockMeta}>
          <span className={styles.typeBadge}>
            <span className="material-symbols-sharp">{typeInfo.icon}</span>
            {typeInfo.label}
          </span>
          <span className={styles.blockSummary}>{blockSummary(block)}</span>
        </div>

        {/* Actions */}
        <div className={styles.blockActions}>
          <button
            type="button"
            className={styles.btnToggle}
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? 'Collapse' : 'Edit'}
          </button>
          <button
            type="button"
            className={styles.btnDel}
            onClick={onDelete}
          >
            <span className="material-symbols-sharp">delete</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.blockBody}>
          {renderEditor()}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SectionBlocksEditor({ postId, sectionId }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  const baseUrl = `/api/admin/blog/${postId}/sections/${sectionId}/blocks`;

  useEffect(() => {
    if (!sectionId) return;
    fetch(baseUrl)
      .then(r => r.json())
      .then(data => setBlocks(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sectionId, baseUrl]);

  async function addBlock(type) {
    setBusy(true);
    try {
      const maxOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.order)) + 1 : 0;
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, order: maxOrder }),
      });
      const data = await res.json();
      if (data.id) {
        setBlocks(prev => [...prev, data].sort((a, b) => a.order - b.order));
        setShowPicker(false);
      }
    } finally { setBusy(false); }
  }

  async function updateBlock(blockId, changes) {
    const res = await fetch(`${baseUrl}/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    const data = await res.json();
    if (data.id) {
      setBlocks(prev =>
        prev.map(b => b.id === blockId ? { ...b, ...data } : b)
          .sort((a, b) => a.order - b.order)
      );
    }
  }

  async function deleteBlock(blockId) {
    if (!confirm('Delete this block?')) return;
    await fetch(`${baseUrl}/${blockId}`, { method: 'DELETE' });
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  }

  async function moveBlock(blockId, dir) {
    const sorted = [...blocks].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(b => b.id === blockId);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const curr = sorted[idx];
    const swap = sorted[swapIdx];

    // Optimistic UI
    setBlocks(prev => prev.map(b => {
      if (b.id === curr.id) return { ...b, order: swap.order };
      if (b.id === swap.id) return { ...b, order: curr.order };
      return b;
    }).sort((a, b) => a.order - b.order));

    // Handle equal order values (edge case)
    const newCurrOrder = dir === 'up' ? swap.order - 0.5 : swap.order + 0.5;
    await Promise.all([
      fetch(`${baseUrl}/${curr.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: Math.round(newCurrOrder) }) }),
      fetch(`${baseUrl}/${swap.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: curr.order }) }),
    ]);

    // Re-fetch to get clean state
    fetch(baseUrl)
      .then(r => r.json())
      .then(data => setBlocks(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  if (loading) {
    return <p className={styles.hint}>Loading blocks…</p>;
  }

  return (
    <div className={styles.root}>

      {blocks.length === 0 && (
        <p className={styles.empty}>
          No content blocks yet. Use blocks to compose rich content: text, embedded posts, comparison
          tables, products, stores, banks, and credit cards — all in any order.
        </p>
      )}

      {/* Block list */}
      {blocks.map((block, idx) => (
        <BlockRow
          key={block.id}
          block={block}
          idx={idx}
          total={blocks.length}
          postId={postId}
          onUpdate={changes => updateBlock(block.id, changes)}
          onDelete={() => deleteBlock(block.id)}
          onMoveUp={() => moveBlock(block.id, 'up')}
          onMoveDown={() => moveBlock(block.id, 'down')}
        />
      ))}

      {/* Type picker */}
      {showPicker ? (
        <div className={styles.typePicker}>
          <p className={styles.typePickerLabel}>Choose block type</p>
          <div className={styles.typeGrid}>
            {BLOCK_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={styles.typeOption}
                onClick={() => addBlock(t.value)}
                disabled={busy}
              >
                <span className="material-symbols-sharp">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.btnCancel} onClick={() => setShowPicker(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className={styles.btnAdd} onClick={() => setShowPicker(true)}>
          <span className="material-symbols-sharp">add</span>
          Add Block
        </button>
      )}
    </div>
  );
}
