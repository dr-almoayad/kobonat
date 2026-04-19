'use client';
// components/admin/SectionBlocksEditor/SectionBlocksEditor.jsx
//
// Lets editors embed rich content blocks INSIDE a blog section:
//   TEXT       — bilingual rich text
//   POST       — embed another blog post (preview card)
//   TABLE      — embed a comparison table (by table ID)
//   PRODUCT    — embed a store product
//   STORE      — embed a store card
//   BANK       — embed a bank card
//   CARD       — embed a bank credit card
//
// Blocks are ordered (integer `order`). Drag or use ↑↓ buttons to reorder.
//
// Place at: components/admin/SectionBlocksEditor/SectionBlocksEditor.jsx

import { useState, useEffect, useCallback } from 'react';

// ─── styles ───────────────────────────────────────────────────────────────────
const S = {
  wrap:     { fontFamily: 'var(--ap-sans, system-ui)', color: 'var(--admin-text, #1a1a2e)', fontSize: 13 },
  block:    {
    border: '1px solid var(--admin-border, #e5e7eb)',
    borderRadius: 8, marginBottom: 10, overflow: 'hidden',
    background: 'var(--admin-surface, #fff)',
  },
  blockHead: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: 'var(--admin-bg, #f8f9fa)',
    borderBottom: '1px solid var(--admin-border, #e5e7eb)',
  },
  typePill: {
    fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
    letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
  },
  blockBody: { padding: 12 },
  row:  { display: 'flex', gap: 8, alignItems: 'flex-start' },
  col:  { display: 'flex', flexDirection: 'column', flex: 1, gap: 3 },
  label:    { fontSize: 11, fontWeight: 600, color: 'var(--admin-text-light, #6b7280)', display: 'block', marginBottom: 1 },
  input:    {
    border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 6,
    padding: '6px 10px', fontSize: 12, width: '100%', outline: 'none',
    background: 'var(--admin-surface, #fff)', color: 'var(--admin-text, #1a1a2e)',
    boxSizing: 'border-box',
  },
  textarea: {
    border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 6,
    padding: '8px 10px', fontSize: 12, width: '100%', outline: 'none',
    background: 'var(--admin-surface, #fff)', color: 'var(--admin-text, #1a1a2e)',
    resize: 'vertical', minHeight: 80, fontFamily: 'inherit', boxSizing: 'border-box',
  },
  select: {
    border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 6,
    padding: '6px 10px', fontSize: 12, outline: 'none',
    background: 'var(--admin-surface, #fff)', cursor: 'pointer',
  },
  btnPrimary: {
    background: '#470ae2', color: '#fff', border: 'none', borderRadius: 6,
    padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  },
  btnGhost: {
    background: 'transparent', color: 'var(--admin-text-light, #6b7280)',
    border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 6,
    padding: '5px 10px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
  },
  btnDanger: {
    background: 'transparent', color: '#dc2626',
    border: '1px solid #fca5a5', borderRadius: 6,
    padding: '5px 8px', cursor: 'pointer', fontSize: 11,
  },
  btnIcon: {
    background: 'transparent', border: '1px solid var(--admin-border, #e5e7eb)',
    borderRadius: 4, cursor: 'pointer', fontSize: 12, lineHeight: 1,
    padding: '3px 6px', color: 'var(--admin-text-light, #6b7280)',
  },
  preview: {
    background: 'var(--admin-bg, #f8f9fa)', border: '1px solid var(--admin-border, #e5e7eb)',
    borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10,
    marginTop: 6,
  },
  previewLogo: { width: 32, height: 32, objectFit: 'contain', borderRadius: 4, border: '1px solid #e5e7eb' },
  previewName: { fontWeight: 600, fontSize: 13 },
  previewSub:  { fontSize: 11, color: '#6b7280', marginTop: 1 },
  searchDrop:  {
    border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 6,
    overflow: 'hidden', marginTop: 4,
    boxShadow: '0 4px 12px rgba(0,0,0,.08)',
  },
  searchItem: {
    padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
    display: 'flex', alignItems: 'center', gap: 8,
    transition: 'background .1s',
  },
  addArea: {
    border: '2px dashed var(--admin-border, #e5e7eb)', borderRadius: 8,
    padding: 16, textAlign: 'center', marginTop: 8,
  },
  typeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 6, marginTop: 10,
  },
  typeBtn: {
    border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 8,
    padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
    background: 'var(--admin-surface, #fff)', transition: 'all .15s',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  typeBtnIcon: { fontSize: 20, lineHeight: 1 },
  typeBtnLabel: { fontSize: 11, fontWeight: 600, color: 'var(--admin-text, #1a1a2e)' },
};

// ─── Block type definitions ───────────────────────────────────────────────────

const BLOCK_TYPES = [
  { value: 'TEXT',    label: 'Text Block',      icon: '✍️',  color: '#dbeafe', text: '#1d4ed8' },
  { value: 'POST',    label: 'Blog Post',        icon: '📄',  color: '#dcfce7', text: '#166534' },
  { value: 'TABLE',   label: 'Compare Table',    icon: '📊',  color: '#ede9fe', text: '#5b21b6' },
  { value: 'PRODUCT', label: 'Product',          icon: '🛍️',  color: '#fef9c3', text: '#a16207' },
  { value: 'STORE',   label: 'Store',            icon: '🏪',  color: '#ffedd5', text: '#c2410c' },
  { value: 'BANK',    label: 'Bank',             icon: '🏦',  color: '#e0f2fe', text: '#075985' },
  { value: 'CARD',    label: 'Credit Card',      icon: '💳',  color: '#fce7f3', text: '#9d174d' },
];

function typeDef(value) {
  return BLOCK_TYPES.find(t => t.value === value) || BLOCK_TYPES[0];
}

// ─── Search + select widget ───────────────────────────────────────────────────

function SearchSelect({ placeholder, onSearch, onSelect, selected, renderSelected, renderOption }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await onSearch(q);
      setResults(res);
    } finally { setLoading(false); }
  }, [onSearch]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div>
      {selected ? (
        <div style={S.preview}>
          {renderSelected(selected)}
          <button type="button" style={{ ...S.btnGhost, marginLeft: 'auto' }} onClick={() => onSelect(null)}>
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            style={S.input}
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loading && <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Searching…</p>}
          {results.length > 0 && (
            <div style={S.searchDrop}>
              {results.map((item, i) => (
                <div
                  key={i}
                  style={S.searchItem}
                  onClick={() => { onSelect(item); setQuery(''); setResults([]); }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  {renderOption(item)}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Block editors ────────────────────────────────────────────────────────────

function TextBlockEditor({ block, onSave }) {
  const [textEn, setEn] = useState(block.textEn || '');
  const [textAr, setAr] = useState(block.textAr || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({ textEn, textAr });
    setSaving(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <label style={S.label}>Content (EN)</label>
        <textarea style={S.textarea} value={textEn} onChange={e => setEn(e.target.value)}
                  placeholder="Write the English content for this block…" />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={S.label}>Content (AR) — المحتوى بالعربية</label>
        <textarea style={{ ...S.textarea, direction: 'rtl' }} value={textAr}
                  onChange={e => setAr(e.target.value)}
                  placeholder="اكتب المحتوى بالعربية هنا…" />
      </div>
      <button type="button" style={S.btnPrimary} disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save text block'}
      </button>
    </div>
  );
}

function PostBlockEditor({ block, onSave }) {
  const [selected, setSelected] = useState(block.post || null);

  async function searchPosts(q) {
    const res = await fetch(`/api/admin/blog?locale=en`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter(p => {
        const t = p.translations?.[0]?.title || '';
        return t.toLowerCase().includes(q.toLowerCase()) || p.slug?.includes(q);
      })
      .slice(0, 8);
  }

  async function handleSelect(post) {
    setSelected(post);
    if (post) await onSave({ postId: post.id });
  }

  return (
    <SearchSelect
      placeholder="Search blog posts by title or slug…"
      onSearch={searchPosts}
      onSelect={handleSelect}
      selected={selected}
      renderSelected={p => {
        const t = p.translations?.[0]?.title || p.slug;
        return (
          <div>
            <div style={S.previewName}>{t}</div>
            <div style={S.previewSub}>Post #{p.id} · {p.status}</div>
          </div>
        );
      }}
      renderOption={p => {
        const t = p.translations?.[0]?.title || p.slug;
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{t}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>#{p.id}</div>
          </div>
        );
      }}
    />
  );
}

function TableBlockEditor({ block, postId, onSave }) {
  const [tables,   setTables]   = useState([]);
  const [selected, setSelected] = useState(block.tableId || null);

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/admin/blog/${postId}/comparison-tables`)
      .then(r => r.json())
      .then(d => setTables(d.tables || []));
  }, [postId]);

  async function handleChange(id) {
    setSelected(parseInt(id));
    await onSave({ tableId: parseInt(id) });
  }

  const selectedTable = tables.find(t => t.id === selected);

  return (
    <div>
      <label style={S.label}>Select a comparison table from this post</label>
      <select style={{ ...S.select, width: '100%' }} value={selected || ''}
              onChange={e => handleChange(e.target.value)}>
        <option value="">— Choose table —</option>
        {tables.map(t => {
          const title = t.translations?.find(tr => tr.locale === 'en')?.title || `Table #${t.id}`;
          return <option key={t.id} value={t.id}>{title}</option>;
        })}
      </select>
      {selectedTable && (
        <div style={S.preview}>
          <span>📊</span>
          <div>
            <div style={S.previewName}>
              {selectedTable.translations?.find(t => t.locale === 'en')?.title || `Table #${selectedTable.id}`}
            </div>
            <div style={S.previewSub}>{selectedTable.columns?.length || 0} columns · {selectedTable.rows?.length || 0} rows</div>
          </div>
        </div>
      )}
      {tables.length === 0 && (
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          No comparison tables yet. Create one in the "Comparison Tables" section below.
        </p>
      )}
    </div>
  );
}

function ProductBlockEditor({ block, onSave }) {
  const [selected, setSelected] = useState(block.product || null);

  async function searchProducts(q) {
    const res = await fetch(`/api/admin/stores?locale=en&limit=200`);
    // Search products across stores — use a more targeted endpoint
    const r2 = await fetch(`/api/admin/blog/1/sections/1/blocks`); // placeholder
    // Actually search via stores endpoint with product sub-query
    // We'll use a simple search across admin stores products
    return [];
  }

  // Better: search by store product name
  async function searchProductsReal(q) {
    // We don't have a dedicated product search endpoint, so we use admin stores
    // This is a best-effort approach
    try {
      const res = await fetch(`/api/admin/stores?locale=en&search=${encodeURIComponent(q)}&limit=5`);
      const stores = await res.json();
      if (!Array.isArray(stores)) return [];
      // For each store, get products — limit to 3 stores
      const results = [];
      for (const store of stores.slice(0, 3)) {
        const pr = await fetch(`/api/admin/stores/${store.id}/products?locale=en`);
        const pd = await pr.json();
        (pd.products || []).forEach(p => {
          const title = p.translations?.[0]?.title || `Product #${p.id}`;
          if (title.toLowerCase().includes(q.toLowerCase())) {
            results.push({ ...p, _storeName: store.translations?.[0]?.name || 'Store' });
          }
        });
      }
      return results.slice(0, 8);
    } catch { return []; }
  }

  async function handleSelect(product) {
    setSelected(product);
    if (product) await onSave({ productId: product.id });
  }

  return (
    <SearchSelect
      placeholder="Search products by store name…"
      onSearch={searchProductsReal}
      onSelect={handleSelect}
      selected={selected}
      renderSelected={p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {p.image && <img src={p.image} alt="" style={S.previewLogo} />}
          <div>
            <div style={S.previewName}>{p.translations?.[0]?.title || `Product #${p.id}`}</div>
            <div style={S.previewSub}>{p._storeName || ''}</div>
          </div>
        </div>
      )}
      renderOption={p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {p.image && <img src={p.image} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />}
          <div>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{p.translations?.[0]?.title || `Product #${p.id}`}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{p._storeName}</div>
          </div>
        </div>
      )}
    />
  );
}

function StoreBlockEditor({ block, onSave }) {
  const [selected, setSelected] = useState(block.store || null);

  async function searchStores(q) {
    const res = await fetch(`/api/admin/stores?locale=en&search=${encodeURIComponent(q)}&limit=8`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function handleSelect(store) {
    setSelected(store);
    if (store) await onSave({ storeId: store.id });
  }

  return (
    <SearchSelect
      placeholder="Search stores by name…"
      onSearch={searchStores}
      onSelect={handleSelect}
      selected={selected}
      renderSelected={s => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {s.logo && <img src={s.logo} alt="" style={S.previewLogo} />}
          <div>
            <div style={S.previewName}>{s.translations?.[0]?.name || `Store #${s.id}`}</div>
            <div style={S.previewSub}>{s._count?.vouchers || 0} vouchers</div>
          </div>
        </div>
      )}
      renderOption={s => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {s.logo && <img src={s.logo} alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 3 }} />}
          <div style={{ fontWeight: 600, fontSize: 12 }}>{s.translations?.[0]?.name || `Store #${s.id}`}</div>
        </div>
      )}
    />
  );
}

function BankBlockEditor({ block, onSave }) {
  const [selected, setSelected] = useState(block.bank || null);

  async function searchBanks(q) {
    const res = await fetch(`/api/admin/banks?locale=en`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter(b => {
      const name = b.translations?.[0]?.name || b.slug;
      return name.toLowerCase().includes(q.toLowerCase());
    }).slice(0, 8);
  }

  async function handleSelect(bank) {
    setSelected(bank);
    if (bank) await onSave({ bankId: bank.id });
  }

  return (
    <SearchSelect
      placeholder="Search banks by name…"
      onSearch={searchBanks}
      onSelect={handleSelect}
      selected={selected}
      renderSelected={b => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {b.logo && <img src={b.logo} alt="" style={S.previewLogo} />}
          <div>
            <div style={S.previewName}>{b.translations?.[0]?.name || b.slug}</div>
            <div style={S.previewSub}>{b.type} · {b._count?.cards || 0} cards</div>
          </div>
        </div>
      )}
      renderOption={b => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {b.logo && <img src={b.logo} alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 3 }} />}
          <div style={{ fontWeight: 600, fontSize: 12 }}>{b.translations?.[0]?.name || b.slug}</div>
        </div>
      )}
    />
  );
}

function CardBlockEditor({ block, onSave }) {
  const [banks,    setBanks]    = useState([]);
  const [bankId,   setBankId]   = useState('');
  const [cards,    setCards]    = useState([]);
  const [selected, setSelected] = useState(block.card || null);

  useEffect(() => {
    fetch('/api/admin/banks?locale=en')
      .then(r => r.json())
      .then(d => setBanks(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!bankId) return;
    fetch(`/api/admin/banks/${bankId}/cards?locale=en`)
      .then(r => r.json())
      .then(d => setCards(Array.isArray(d) ? d : []));
  }, [bankId]);

  async function handleSelect(card) {
    setSelected(card);
    if (card) await onSave({ cardId: card.id });
  }

  if (selected) {
    const name = selected.translations?.find(t => t.locale === 'en')?.name || `Card #${selected.id}`;
    return (
      <div style={S.preview}>
        {selected.image && <img src={selected.image} alt="" style={S.previewLogo} />}
        <div>
          <div style={S.previewName}>{name}</div>
          <div style={S.previewSub}>{selected.network} · {selected.tier}</div>
        </div>
        <button type="button" style={{ ...S.btnGhost, marginLeft: 'auto' }} onClick={() => setSelected(null)}>Change</button>
      </div>
    );
  }

  return (
    <div>
      <label style={S.label}>Step 1: Select bank</label>
      <select style={{ ...S.select, width: '100%', marginBottom: 8 }} value={bankId}
              onChange={e => { setBankId(e.target.value); setSelected(null); }}>
        <option value="">— Choose bank —</option>
        {banks.map(b => (
          <option key={b.id} value={b.id}>{b.translations?.[0]?.name || b.slug}</option>
        ))}
      </select>
      {bankId && (
        <>
          <label style={S.label}>Step 2: Select card</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {cards.length === 0 && <p style={{ fontSize: 11, color: '#9ca3af' }}>No cards for this bank yet.</p>}
            {cards.map(c => {
              const name = c.translations?.find(t => t.locale === 'en')?.name || `${c.network} ${c.tier}`;
              return (
                <div key={c.id} style={{ ...S.searchItem, borderRadius: 6, border: '1px solid #e5e7eb' }}
                     onClick={() => handleSelect(c)}
                     onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                     onMouseLeave={e => e.currentTarget.style.background = ''}>
                  {c.image && <img src={c.image} alt="" style={{ width: 32, height: 20, objectFit: 'contain' }} />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.network} · {c.tier}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Single block component ───────────────────────────────────────────────────

function Block({ block, index, total, postId, sectionId, onUpdate, onDelete, onMove }) {
  const [expanded, setExpanded] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const def = typeDef(block.type);

  async function saveBlock(data) {
    setSaving(true);
    await fetch(`/api/admin/blog/0/sections/${sectionId}/blocks/${block.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    onUpdate(data);
    setSaving(false);
  }

  async function deleteBlock() {
    if (!confirm('Delete this block?')) return;
    await fetch(`/api/admin/blog/0/sections/${sectionId}/blocks/${block.id}`, { method: 'DELETE' });
    onDelete(block.id);
  }

  // Label for the block header
  function blockLabel() {
    if (block.type === 'TEXT')    return block.textEn ? block.textEn.slice(0, 40) + '…' : 'Empty text block';
    if (block.type === 'POST')    return block.post?.translations?.[0]?.title || `Post #${block.postId}`;
    if (block.type === 'TABLE')   return `Table #${block.tableId}`;
    if (block.type === 'PRODUCT') return block.product?.translations?.[0]?.title || `Product #${block.productId}`;
    if (block.type === 'STORE')   return block.store?.translations?.[0]?.name || `Store #${block.storeId}`;
    if (block.type === 'BANK')    return block.bank?.translations?.[0]?.name || `Bank #${block.bankId}`;
    if (block.type === 'CARD')    return block.card?.translations?.[0]?.name || `Card #${block.cardId}`;
    return '';
  }

  return (
    <div style={S.block}>
      <div style={S.blockHead}>
        {/* Reorder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button type="button" style={S.btnIcon} onClick={() => onMove(index, -1)} disabled={index === 0} title="Move up">▲</button>
          <button type="button" style={S.btnIcon} onClick={() => onMove(index, 1)} disabled={index === total - 1} title="Move down">▼</button>
        </div>

        {/* Type badge */}
        <span style={{ ...S.typePill, background: def.color, color: def.text }}>
          {def.icon} {def.label}
        </span>

        {/* Summary */}
        <span style={{ flex: 1, fontSize: 12, color: 'var(--admin-text-light, #6b7280)',
                       overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {blockLabel()}
        </span>

        {saving && <span style={{ fontSize: 11, color: '#470ae2' }}>saving…</span>}

        {/* Expand / delete */}
        <button type="button" style={S.btnGhost} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Collapse' : 'Edit'}
        </button>
        <button type="button" style={S.btnDanger} onClick={deleteBlock}>✕</button>
      </div>

      {expanded && (
        <div style={S.blockBody}>
          {block.type === 'TEXT'    && <TextBlockEditor    block={block} onSave={saveBlock} />}
          {block.type === 'POST'    && <PostBlockEditor    block={block} onSave={saveBlock} />}
          {block.type === 'TABLE'   && <TableBlockEditor   block={block} postId={postId} onSave={saveBlock} />}
          {block.type === 'PRODUCT' && <ProductBlockEditor block={block} onSave={saveBlock} />}
          {block.type === 'STORE'   && <StoreBlockEditor   block={block} onSave={saveBlock} />}
          {block.type === 'BANK'    && <BankBlockEditor    block={block} onSave={saveBlock} />}
          {block.type === 'CARD'    && <CardBlockEditor    block={block} onSave={saveBlock} />}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function SectionBlocksEditor({ postId, sectionId }) {
  const [blocks,   setBlocks]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!sectionId) return;
    fetch(`/api/admin/blog/0/sections/${sectionId}/blocks`)
      .then(r => r.json())
      .then(data => { setBlocks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sectionId]);

  async function addBlock(type) {
    setCreating(true);
    const nextOrder = blocks.length;
    const res = await fetch(`/api/admin/blog/0/sections/${sectionId}/blocks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, order: nextOrder }),
    });
    const block = await res.json();
    setBlocks(prev => [...prev, block]);
    setAdding(false);
    setCreating(false);
  }

  function updateBlock(id, data) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  }

  function deleteBlock(id) {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }

  async function moveBlock(index, dir) {
    const newBlocks = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    // Reassign orders
    const updates = newBlocks.map((b, i) => ({ ...b, order: i }));
    setBlocks(updates);
    // Persist order for each swapped block
    await Promise.all([
      fetch(`/api/admin/blog/0/sections/${sectionId}/blocks/${newBlocks[target].id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: target }),
      }),
      fetch(`/api/admin/blog/0/sections/${sectionId}/blocks/${newBlocks[index].id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: index }),
      }),
    ]);
  }

  if (loading) return <p style={{ fontSize: 12, color: '#9ca3af' }}>Loading blocks…</p>;

  return (
    <div style={S.wrap}>
      {/* Block list */}
      {blocks.length === 0 && !adding && (
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 8px' }}>
          No blocks yet. Add content blocks below to embed rich content in this section.
        </p>
      )}

      {blocks.map((block, i) => (
        <Block
          key={block.id}
          block={block}
          index={i}
          total={blocks.length}
          postId={postId}
          sectionId={sectionId}
          onUpdate={(data) => updateBlock(block.id, data)}
          onDelete={deleteBlock}
          onMove={moveBlock}
        />
      ))}

      {/* Add block picker */}
      {adding ? (
        <div style={{ ...S.addArea, borderColor: '#470ae2', background: '#faf8ff' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#470ae2' }}>
            Choose block type to insert:
          </p>
          <div style={S.typeGrid}>
            {BLOCK_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                style={S.typeBtn}
                disabled={creating}
                onClick={() => addBlock(t.value)}
                onMouseEnter={e => { e.currentTarget.style.background = t.color; e.currentTarget.style.borderColor = t.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-surface, #fff)'; e.currentTarget.style.borderColor = 'var(--admin-border, #e5e7eb)'; }}
              >
                <span style={S.typeBtnIcon}>{t.icon}</span>
                <span style={S.typeBtnLabel}>{t.label}</span>
              </button>
            ))}
          </div>
          <button type="button" style={{ ...S.btnGhost, marginTop: 10 }} onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" style={{ ...S.btnGhost, width: '100%', marginTop: 4, padding: '10px' }}
                onClick={() => setAdding(true)}>
          + Add content block
        </button>
      )}
    </div>
  );
}
