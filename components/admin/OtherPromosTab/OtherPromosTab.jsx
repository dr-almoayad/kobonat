'use client';
// components/admin/OtherPromosTab/OtherPromosTab.jsx
//
// Usage in app/admin/stores/[id]/page.jsx:
//   import OtherPromosTab from '@/components/admin/OtherPromosTab/OtherPromosTab';
//   ...
//   {tab === 'other-promos' && (
//     <OtherPromosTab
//       storeId={store.id}
//       allCountries={allCountries}
//       allBanks={allBanks}
//       allPaymentMethods={allPaymentMethods}
//       allCategories={allCategories}   // ← new prop
//     />
//   )}

import { useState, useEffect, useCallback } from 'react';
import CategoryTagger from '@/components/admin/CategoryTagger/CategoryTagger';

// ─── Constants ────────────────────────────────────────────────────────────────
const PROMO_TYPES = [
  { label: 'Bank Offer',    value: 'BANK_OFFER'    },
  { label: 'Card Offer',    value: 'CARD_OFFER'    },
  { label: 'Payment Offer', value: 'PAYMENT_OFFER' },
  { label: 'Seasonal',      value: 'SEASONAL'      },
  { label: 'Bundle',        value: 'BUNDLE'        },
  { label: 'Other',         value: 'OTHER'         },
];

const CARD_NETWORKS = [
  { label: '— Any —',     value: ''           },
  { label: 'Visa',        value: 'VISA'       },
  { label: 'Mastercard',  value: 'MASTERCARD' },
  { label: 'Amex',        value: 'AMEX'       },
  { label: 'Mada',        value: 'MADA'       },
  { label: 'UnionPay',    value: 'UNIONPAY'   },
];

const EMPTY_FORM = {
  countryId: '', type: 'BANK_OFFER',
  // payment provider — any combination
  paymentMethodId: '',   // ← new: Visa, Mastercard, Tabby, Tamara, STC Pay…
  bankId: '', cardId: '', cardNetwork: '', installmentMonths: '',
  // content
  voucherCode: '',       // ← was missing; maps to OtherPromo.voucherCode
  image: '', url: '',
  startDate: '', expiryDate: '',
  order: '0', isActive: true,
  title_en: '', title_ar: '',
  description_en: '', description_ar: '',
  terms_en: '', terms_ar: '',
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Field({ label, children, required, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 1 }}>{hint}</span>}
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

const sectionBox = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '0.85rem',
  marginBottom: '0.75rem',
};

const sectionLabel = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.6rem',
};

// ─── PromoForm ────────────────────────────────────────────────────────────────
function PromoForm({ initial, allCountries, allBanks, allPaymentMethods = [], allCategories = [], itemId = null, onSave, onCancel, saving, title }) {
  const [form,      setForm]      = useState(initial);
  const [bankCards, setBankCards] = useState([]);

  // pre-load cards if editing a promo that already has a bank
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

  // Derived: split payment methods into BNPL vs the rest
  const bnplMethods  = allPaymentMethods.filter(m => m.isBnpl);
  const otherMethods = allPaymentMethods.filter(m => !m.isBnpl);

  const pmName = (m) => m.translations?.find(t => t.locale === 'en')?.name || m.slug;

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '1rem' }}>{title}</div>

      {/* ── Core ── */}
      <div style={{ ...row, marginBottom: '0.75rem' }}>
        <Field label="Country" required>
          <select style={inp} value={form.countryId} onChange={e => set('countryId', e.target.value)}>
            <option value="">— Select country —</option>
            {allCountries.map(c => (
              <option key={c.id} value={c.id}>{c.translations?.[0]?.name || c.code || c.id}</option>
            ))}
          </select>
        </Field>
        <Field label="Type" required>
          <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
            {PROMO_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      {/* ── Payment Method (Visa / Mastercard / Tabby / Tamara / STC Pay…) ── */}
      <div style={sectionBox}>
        <div style={sectionLabel}>
          Payment Method
          <span style={{ fontWeight: 400, textTransform: 'none', marginInlineStart: 4 }}>
            — Visa, Mastercard, Tabby, Tamara, STC Pay, etc.
          </span>
        </div>
        <Field
          label="Payment Method"
          hint="Shown as the secondary logo on the store page card. Pick this OR a bank — or both for e.g. 'Tamara at Noon'."
        >
          <select
            style={inp}
            value={form.paymentMethodId}
            onChange={e => set('paymentMethodId', e.target.value)}
          >
            <option value="">— None —</option>

            {bnplMethods.length > 0 && (
              <optgroup label="Buy Now Pay Later (BNPL)">
                {bnplMethods.map(m => (
                  <option key={m.id} value={m.id}>{pmName(m)}</option>
                ))}
              </optgroup>
            )}

            {otherMethods.length > 0 && (
              <optgroup label="Cards &amp; Wallets">
                {otherMethods.map(m => (
                  <option key={m.id} value={m.id}>
                    {pmName(m)} ({m.type})
                  </option>
                ))}
              </optgroup>
            )}

            {allPaymentMethods.length === 0 && (
              <option disabled value="">No payment methods found — add them in Admin → Payment Methods</option>
            )}
          </select>
        </Field>
      </div>

      {/* ── Bank / Card cascade ── */}
      <div style={sectionBox}>
        <div style={sectionLabel}>
          Bank / Card Link
          <span style={{ fontWeight: 400, textTransform: 'none', marginInlineStart: 4 }}>(optional)</span>
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
          <Field label="Card (optional)" hint="Auto-filters to the selected bank.">
            <select
              style={inp}
              value={form.cardId}
              onChange={e => set('cardId', e.target.value)}
              disabled={!bankCards.length}
            >
              <option value="">— Any card —</option>
              {bankCards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.translations?.find(t => t.locale === 'en')?.name || `${c.network} ${c.tier}`}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div style={row}>
          <Field label="Card network">
            <select style={inp} value={form.cardNetwork} onChange={e => set('cardNetwork', e.target.value)}>
              {CARD_NETWORKS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="0% Installment months">
            <input
              type="number" style={inp} min="0" max="60"
              value={form.installmentMonths}
              onChange={e => set('installmentMonths', e.target.value)}
              placeholder="Leave empty if N/A"
            />
          </Field>
        </div>
      </div>

      {/* ── Promo code ── */}
      <div style={{ marginBottom: '0.75rem' }}>
        <Field label="Promo / Voucher Code" hint="Optional. Shown in a copy-to-clipboard box in the modal.">
          <input
            style={{ ...inp, fontFamily: 'monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}
            value={form.voucherCode}
            onChange={e => set('voucherCode', e.target.value.toUpperCase())}
            placeholder="e.g. VISA10OFF"
          />
        </Field>
      </div>

      {/* ── Media & dates ── */}
      <div style={{ ...row, marginBottom: '0.75rem' }}>
        <Field label="Image URL">
          <input style={inp} value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="External URL (T&Cs / landing page)">
          <input style={inp} type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://…" />
        </Field>
      </div>
      <div style={{ ...row, marginBottom: '0.75rem' }}>
        <Field label="Start Date">
          <input style={inp} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </Field>
        <Field label="Expiry Date">
          <input style={inp} type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
        </Field>
      </div>
      <div style={{ ...row, marginBottom: '1rem' }}>
        <Field label="Order">
          <input style={inp} type="number" value={form.order} onChange={e => set('order', e.target.value)} />
        </Field>
        <Field label="Status">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <input
              type="checkbox" id="isActiveChk"
              checked={!!form.isActive}
              onChange={e => set('isActive', e.target.checked)}
            />
            <label htmlFor="isActiveChk" style={{ fontSize: '0.82rem', color: '#374151' }}>Active</label>
          </div>
        </Field>
      </div>

      {/* ── Translations ── */}
      <div style={{ ...row, marginBottom: '0.75rem' }}>
        <Field label="Title (EN)" required>
          <input style={inp} value={form.title_en} onChange={e => set('title_en', e.target.value)} />
        </Field>
        <Field label="Title (AR)" required>
          <input style={{ ...inp, direction: 'rtl' }} value={form.title_ar} onChange={e => set('title_ar', e.target.value)} />
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

      {/* Category Tags – only when editing an existing promo */}
      {itemId && allCategories.length > 0 && (
        <div style={sectionBox}>
          <div style={sectionLabel}>Category Tags</div>
          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem', marginTop: 0 }}>
            Tag this promo to appear directly on specific category pages, regardless
            of which store it belongs to. Mark as <strong>Featured</strong> to show it
            in the highlighted strip at the top of the category page.
          </p>
          <CategoryTagger
            itemType="OTHER_PROMO"
            itemId={itemId}
            availableCategories={allCategories}
          />
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{ padding: '0.45rem 1rem', borderRadius: 7, border: '1px solid #d1d5db', background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          style={{ padding: '0.45rem 1.1rem', borderRadius: 7, border: 'none', background: '#0f172a', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function OtherPromosTab({
  storeId,
  allCountries     = [],
  allBanks         = [],
  allPaymentMethods = [],
  allCategories     = [],   // ← new prop
}) {
  const [promos,     setPromos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [editInit,   setEditInit]   = useState(null);
  const [saving,     setSaving]     = useState(false);

  // ── Name helpers ───────────────────────────────────────────────────────────
  const countryName = id => allCountries.find(c => c.id === id || c.id === Number(id))?.translations?.[0]?.name || String(id);
  const bankName    = id => allBanks.find(b => b.id === id || b.id === Number(id))?.translations?.[0]?.name || null;
  const pmName      = id => {
    const m = allPaymentMethods.find(m => m.id === id || m.id === Number(id));
    return m ? (m.translations?.find(t => t.locale === 'en')?.name || m.slug) : null;
  };

  // ── fetch list ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
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

  // ── create ─────────────────────────────────────────────────────────────────
  async function handleCreate(form) {
    if (!form.countryId) { alert('Country is required.'); return; }
    if (!form.title_en)  { alert('Title (EN) is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/other-promos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(form)),
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

  // ── open edit ──────────────────────────────────────────────────────────────
  function openEdit(p) {
    const tr  = (locale) => p.translations?.find(t => t.locale === locale) || {};
    const fmt = d => d ? new Date(d).toISOString().slice(0, 10) : '';
    setEditInit({
      countryId:          p.countryId           || '',
      type:               p.type                || 'BANK_OFFER',
      paymentMethodId:    p.paymentMethodId      || '',
      bankId:             p.bankId              || '',
      cardId:             p.cardId              || '',
      cardNetwork:        p.cardNetwork         || '',
      installmentMonths:  p.installmentMonths != null ? String(p.installmentMonths) : '',
      voucherCode:        p.voucherCode         || '',
      image:              p.image               || '',
      url:                p.url                 || '',
      startDate:          fmt(p.startDate),
      expiryDate:         fmt(p.expiryDate),
      order:              String(p.order        ?? 0),
      isActive:           !!p.isActive,
      title_en:           tr('en').title         || '',
      title_ar:           tr('ar').title         || '',
      description_en:     tr('en').description   || '',
      description_ar:     tr('ar').description   || '',
      terms_en:           tr('en').terms         || '',
      terms_ar:           tr('ar').terms         || '',
    });
    setEditId(p.id);
    setShowCreate(false);
  }

  // ── save edit ──────────────────────────────────────────────────────────────
  async function handleEdit(form) {
    if (!form.title_en) { alert('Title (EN) is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/other-promos/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(form)),
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

  // ── delete ─────────────────────────────────────────────────────────────────
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

  // ── build API payload (coerce types) ──────────────────────────────────────
  function buildPayload(form) {
    return {
      countryId:         form.countryId         ? Number(form.countryId)         : undefined,
      type:              form.type,
      paymentMethodId:   form.paymentMethodId    ? Number(form.paymentMethodId)   : null,
      bankId:            form.bankId             ? Number(form.bankId)             : null,
      cardId:            form.cardId             ? Number(form.cardId)             : null,
      cardNetwork:       form.cardNetwork        || null,
      installmentMonths: form.installmentMonths  ? Number(form.installmentMonths)  : null,
      voucherCode:       form.voucherCode?.trim().toUpperCase() || null,
      image:             form.image              || null,
      url:               form.url               || null,
      startDate:         form.startDate         || null,
      expiryDate:        form.expiryDate        || null,
      order:             Number(form.order)      ?? 0,
      isActive:          !!form.isActive,
      title_en:          form.title_en,
      title_ar:          form.title_ar,
      description_en:    form.description_en    || null,
      description_ar:    form.description_ar    || null,
      terms_en:          form.terms_en          || null,
      terms_ar:          form.terms_ar          || null,
    };
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '1.25rem' }}>

      {/* ── Create button / form ── */}
      {!showCreate && !editId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{ padding: '0.45rem 1rem', borderRadius: 7, border: 'none', background: '#0f172a', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
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
          allPaymentMethods={allPaymentMethods}
          allCategories={allCategories}
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
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          No other promos for this store yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {promos.map(p => {
            const enTitle  = p.translations?.find(t => t.locale === 'en')?.title;
            const arTitle  = p.translations?.find(t => t.locale === 'ar')?.title;
            const bName    = p.bankId          ? bankName(p.bankId)          : null;
            const pmLabel  = p.paymentMethodId ? pmName(p.paymentMethodId)  : null;
            const cName    = p.countryId       ? countryName(p.countryId)   : '—';
            const isEditing = editId === p.id;

            return (
              <div key={p.id}>

                {/* ── Inline edit form ── */}
                {isEditing && editInit && (
                  <PromoForm
                    title={`Edit: ${enTitle || `Promo #${p.id}`}`}
                    initial={editInit}
                    allCountries={allCountries}
                    allBanks={allBanks}
                    allPaymentMethods={allPaymentMethods}
                    allCategories={allCategories}
                    itemId={editId}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                          {enTitle || `Promo #${p.id}`}
                        </span>
                        {arTitle && (
                          <span style={{ fontSize: '0.8rem', color: '#64748b', direction: 'rtl' }}>{arTitle}</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>

                        {/* type */}
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#eef2ff', color: '#4338ca' }}>
                          {p.type?.replace(/_/g, ' ')}
                        </span>

                        {/* payment method badge — NEW */}
                        {pmLabel && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                            💳 {pmLabel}
                          </span>
                        )}

                        {/* bank badge */}
                        {bName && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#dbeafe', color: '#1d4ed8' }}>
                            🏦 {bName}
                          </span>
                        )}

                        {/* voucher code badge — NEW */}
                        {p.voucherCode && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                            {p.voucherCode}
                          </span>
                        )}

                        {/* country */}
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{cName}</span>

                        {/* active */}
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
                        style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
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
