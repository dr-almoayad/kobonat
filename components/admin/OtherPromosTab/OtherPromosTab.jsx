'use client';
// components/admin/OtherPromosTab/OtherPromosTab.jsx
//
// Drop-in replacement for the "Other Promos" tab content in
// app/admin/stores/[id]/page.jsx
//
// Usage in page.jsx:
//   import OtherPromosTab from '@/components/admin/OtherPromosTab/OtherPromosTab';
//   ...
//   {tab === 'other-promos' && (
//     <OtherPromosTab storeId={store.id} allCountries={allCountries} allBanks={allBanks} />
//   )}

import { useState, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const PROMO_TYPES = [
  { label: 'Bank Offer',     value: 'BANK_OFFER'     },
  { label: 'Card Offer',     value: 'CARD_OFFER'     },
  { label: 'Payment Offer',  value: 'PAYMENT_OFFER'  },
  { label: 'Seasonal',       value: 'SEASONAL'       },
  { label: 'Bundle',         value: 'BUNDLE'         },
  { label: 'Other',          value: 'OTHER'          },
];

const CARD_NETWORKS = [
  { label: '— Any —', value: '' },
  { label: 'Visa',       value: 'VISA'       },
  { label: 'Mastercard', value: 'MASTERCARD' },
  { label: 'Amex',       value: 'AMEX'       },
  { label: 'Mada',       value: 'MADA'       },
];

const EMPTY_FORM = {
  countryId: '', type: 'BANK_OFFER',
  bankId: '', cardId: '', cardNetwork: '', installmentMonths: '',
  image: '', url: '',
  startDate: '', expiryDate: '',
  order: '0', isActive: true,
  title_en: '', title_ar: '',
  description_en: '', description_ar: '',
  terms_en: '', terms_ar: '',
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Field({ label, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inp = {
  padding: '0.45rem 0.6rem',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: '0.82rem',
  background: '#fff',
  width: '100%',
  boxSizing: 'border-box',
};

const row = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' };

// ─── PromoForm — reused for create AND edit ───────────────────────────────────
function PromoForm({ initial, allCountries, allBanks, onSave, onCancel, saving, title }) {
  const [form, setForm]         = useState(initial);
  const [bankCards, setBankCards] = useState([]);

  // load cards when bankId is pre-set
  useEffect(() => {
    if (form.bankId) loadCards(form.bankId);
    else setBankCards([]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCards(bankId) {
    if (!bankId) { setBankCards([]); return; }
    try {
      const res = await fetch(`/api/admin/banks/${bankId}/cards`);
      setBankCards(res.ok ? await res.json() : []);
    } catch { setBankCards([]); }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleBankChange(bankId) {
    set('bankId', bankId);
    set('cardId', '');
    loadCards(bankId);
  }

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '1rem' }}>{title}</div>

      {/* ── Core ── */}
      <div style={{ ...row, marginBottom: '0.75rem' }}>
        <Field label="Country" required>
          <select style={inp} value={form.countryId} onChange={e => set('countryId', e.target.value)} required>
            <option value="">— Select —</option>
            {allCountries.map(c => (
              <option key={c.id} value={c.id}>{c.translations?.[0]?.name || c.id}</option>
            ))}
          </select>
        </Field>
        <Field label="Type" required>
          <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
            {PROMO_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      {/* ── Bank / Card cascade ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.85rem', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
          Bank / Card Link <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
        </div>
        <div style={{ ...row, marginBottom: '0.6rem' }}>
          <Field label="Bank">
            <select style={inp} value={form.bankId} onChange={e => handleBankChange(e.target.value)}>
              <option value="">— No bank —</option>
              {allBanks.map(b => (
                <option key={b.id} value={b.id}>{b.translations?.[0]?.name || b.slug}</option>
              ))}
            </select>
          </Field>
          <Field label="Card (optional)">
            <select style={inp} value={form.cardId} onChange={e => set('cardId', e.target.value)} disabled={!bankCards.length}>
              <option value="">— Any card —</option>
              {bankCards.map(c => (
                <option key={c.id} value={c.id}>{c.translations?.[0]?.name || `Card #${c.id}`}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ ...row }}>
          <Field label="Card network">
            <select style={inp} value={form.cardNetwork} onChange={e => set('cardNetwork', e.target.value)}>
              {CARD_NETWORKS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="0% Install. months">
            <input type="number" style={inp} min="0" max="60" value={form.installmentMonths}
              onChange={e => set('installmentMonths', e.target.value)} placeholder="Leave empty if N/A" />
          </Field>
        </div>
      </div>

      {/* ── Media & dates ── */}
      <div style={{ ...row, marginBottom: '0.75rem' }}>
        <Field label="Image URL"><input style={inp} value={form.image} onChange={e => set('image', e.target.value)} /></Field>
        <Field label="External URL (T&Cs)"><input style={inp} type="url" value={form.url} onChange={e => set('url', e.target.value)} /></Field>
      </div>
      <div style={{ ...row, marginBottom: '0.75rem' }}>
        <Field label="Start Date"><input style={inp} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></Field>
        <Field label="Expiry Date"><input style={inp} type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} /></Field>
      </div>
      <div style={{ ...row, marginBottom: '1rem' }}>
        <Field label="Order"><input style={inp} type="number" value={form.order} onChange={e => set('order', e.target.value)} /></Field>
        <Field label="Active">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <input type="checkbox" id="isActiveChk" checked={!!form.isActive} onChange={e => set('isActive', e.target.checked)} />
            <label htmlFor="isActiveChk" style={{ fontSize: '0.82rem', color: '#374151' }}>Active</label>
          </div>
        </Field>
      </div>

      {/* ── Translations ── */}
      <div style={{ ...row, marginBottom: '0.75rem' }}>
        <Field label="Title (EN)" required>
          <input style={inp} value={form.title_en} onChange={e => set('title_en', e.target.value)} required />
        </Field>
        <Field label="Title (AR)" required>
          <input style={{ ...inp, direction: 'rtl' }} value={form.title_ar} onChange={e => set('title_ar', e.target.value)} required />
        </Field>
      </div>
      <div style={{ ...row, marginBottom: '0.75rem' }}>
        <Field label="Description (EN)">
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={form.description_en} onChange={e => set('description_en', e.target.value)} />
        </Field>
        <Field label="Description (AR)">
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical', direction: 'rtl' }} value={form.description_ar} onChange={e => set('description_ar', e.target.value)} />
        </Field>
      </div>
      <div style={{ ...row, marginBottom: '1rem' }}>
        <Field label="Terms (EN)">
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={form.terms_en} onChange={e => set('terms_en', e.target.value)} />
        </Field>
        <Field label="Terms (AR)">
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical', direction: 'rtl' }} value={form.terms_ar} onChange={e => set('terms_ar', e.target.value)} />
        </Field>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button onClick={onCancel}
            style={{ padding: '0.45rem 1rem', borderRadius: 7, border: '1px solid #d1d5db', background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
            Cancel
          </button>
        )}
        <button onClick={() => onSave(form)} disabled={saving}
          style={{ padding: '0.45rem 1.1rem', borderRadius: 7, border: 'none', background: '#0f172a', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function OtherPromosTab({ storeId, allCountries = [], allBanks = [] }) {
  const [promos,   setPromos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editId,   setEditId]   = useState(null);   // promoId being edited
  const [editInit, setEditInit] = useState(null);   // prefilled form values
  const [saving,   setSaving]   = useState(false);

  // ── helpers for country/bank name ──────────────────────────────────────────
  const countryName = id => allCountries.find(c => c.id === id)?.translations?.[0]?.name || id;
  const bankName    = id => allBanks.find(b => b.id === id)?.translations?.[0]?.name || null;

  // ── fetch list ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/other-promos?locale=en`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setPromos(data.promos || []);
    } catch (e) {
      setError(`Failed to load promos: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  // ── create ──────────────────────────────────────────────────────────────────
  async function handleCreate(form) {
    if (!form.countryId) { alert('Country is required.'); return; }
    if (!form.title_en)  { alert('Title (EN) is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/other-promos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, storeId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `${res.status}`);
      setShowCreate(false);
      await load();
    } catch (e) {
      alert(`Create failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  // ── open edit — prefill form from promo row ─────────────────────────────────
  function openEdit(p) {
    const tr = (locale) => p.translations?.find(t => t.locale === locale) || {};
    const fmt = d => d ? new Date(d).toISOString().slice(0, 10) : '';
    setEditInit({
      countryId:          p.countryId       || '',
      type:               p.type            || 'BANK_OFFER',
      bankId:             p.bankId          || '',
      cardId:             p.cardId          || '',
      cardNetwork:        p.cardNetwork     || '',
      installmentMonths:  p.installmentMonths != null ? String(p.installmentMonths) : '',
      image:              p.image           || '',
      url:                p.url             || '',
      startDate:          fmt(p.startDate),
      expiryDate:         fmt(p.expiryDate),
      order:              String(p.order    ?? 0),
      isActive:           !!p.isActive,
      title_en:           tr('en').title       || '',
      title_ar:           tr('ar').title       || '',
      description_en:     tr('en').description || '',
      description_ar:     tr('ar').description || '',
      terms_en:           tr('en').terms       || '',
      terms_ar:           tr('ar').terms       || '',
    });
    setEditId(p.id);
    setShowCreate(false);
  }

  // ── save edit ───────────────────────────────────────────────────────────────
  async function handleEdit(form) {
    if (!form.title_en) { alert('Title (EN) is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/other-promos/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || `${res.status}`);
      setEditId(null);
      setEditInit(null);
      await load();
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(p) {
    const name = p.translations?.find(t => t.locale === 'en')?.title || `#${p.id}`;
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/other-promos/${p.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || `${res.status}`);
      await load();
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '1.25rem' }}>

      {/* ── Create button / form ── */}
      {!showCreate && !editId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{ padding: '0.45rem 1rem', borderRadius: 7, border: 'none', background: '#0f172a', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            + Add Promo
          </button>
        </div>
      )}

      {showCreate && (
        <PromoForm
          title="Add Other Promo"
          initial={EMPTY_FORM}
          allCountries={allCountries}
          allBanks={allBanks}
          saving={saving}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</div>}

      {/* ── Promo rows ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading…</div>
      ) : promos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>No other promos for this store yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {promos.map(p => {
            const enTitle = p.translations?.find(t => t.locale === 'en')?.title;
            const arTitle = p.translations?.find(t => t.locale === 'ar')?.title;
            const bank    = p.bankId ? bankName(p.bankId) : null;
            const country = p.countryId ? countryName(p.countryId) : '—';
            const isEditing = editId === p.id;

            return (
              <div key={p.id}>
                {/* ── Edit form (inline) ── */}
                {isEditing && editInit && (
                  <PromoForm
                    title={`Edit: ${enTitle || `Promo #${p.id}`}`}
                    initial={editInit}
                    allCountries={allCountries}
                    allBanks={allBanks}
                    saving={saving}
                    onSave={handleEdit}
                    onCancel={() => { setEditId(null); setEditInit(null); }}
                  />
                )}

                {/* ── Promo row card ── */}
                {!isEditing && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                    padding: '0.75rem 1rem',
                  }}>
                    {/* image thumbnail */}
                    {p.image && (
                      <img src={p.image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', flexShrink: 0, border: '1px solid #f1f5f9' }} />
                    )}

                    {/* main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{enTitle || `Promo #${p.id}`}</span>
                        {arTitle && <span style={{ fontSize: '0.8rem', color: '#64748b', direction: 'rtl' }}>{arTitle}</span>}
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* type badge */}
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#eef2ff', color: '#4338ca' }}>
                          {p.type?.replace('_', ' ')}
                        </span>

                        {/* bank badge */}
                        {bank && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#dbeafe', color: '#1d4ed8' }}>
                            🏦 {bank}
                          </span>
                        )}

                        {/* country */}
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{country}</span>

                        {/* active status */}
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                          background: p.isActive ? '#dcfce7' : '#fee2e2',
                          color:      p.isActive ? '#166534' : '#991b1b',
                        }}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>

                        {/* expiry */}
                        {p.expiryDate && (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                            Expires {new Date(p.expiryDate).toLocaleDateString('en-SA')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* actions */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => openEdit(p)}
                        style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
