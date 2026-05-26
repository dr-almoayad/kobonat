'use client';

import { useState, useEffect, useCallback } from 'react';
import { createStoreProduct, updateStoreProduct, deleteStoreProduct } from '@/app/admin/_lib/actions';
import { FormField, FormRow, FormSection } from '@/app/admin/_components/FormField';
import CategoryTagger from '@/components/admin/CategoryTagger/CategoryTagger';
import styles from '../../../admin.module.css';

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function voucherLabel(v) {
  const title    = v.translations?.[0]?.title || '';
  const code     = v.code     ? ` · ${v.code}`    : '';
  const discount = v.discount ? ` · ${v.discount}` : '';
  return `[${v.type}] ${title}${code}${discount}`.trim();
}

function promoLabel(p) {
  const title = p.translations?.[0]?.title || '';
  const bank  = p.bank?.translations?.[0]?.name;
  const who   = bank ? ` · ${bank}` : '';
  const pct   = p.discountPercent ? ` · ${p.discountPercent}% OFF` : '';
  const inst  = p.installmentMonths ? ` · ${p.installmentMonths}mo BNPL` : '';
  return `[${p.type}] ${title}${who}${pct}${inst}`.trim();
}

// ─── linked-promo chip ─────────────────────────────────────────────────────────

function PromoChip({ product }) {
  const promo   = product.linkedPromo;
  const voucher = product.linkedVoucher;

  if (!promo && !voucher && !product.linkedPromoId && !product.linkedVoucherId) return null;

  if (promo) {
    const bankLogo = promo.bank?.logo;
    const payLogo  = promo.paymentMethod?.logo;
    const chipText = promo.bank?.translations?.[0]?.name
                  || promo.paymentMethod?.translations?.[0]?.name
                  || promo.translations?.[0]?.title
                  || 'Bank Offer';
    const bnplTag  = promo.installmentMonths
      ? <span style={{ marginLeft: 4, fontSize: '0.6rem', color: '#15803d', background: '#dcfce7', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>{promo.installmentMonths}mo</span>
      : null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {bankLogo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={bankLogo} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 3, background: '#fff', padding: 1, border: '1px solid #ede8fb' }} />
        ) : payLogo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={payLogo} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 3, background: '#fff', padding: 1, border: '1px solid #ede8fb' }} />
        ) : (
          <span className="material-symbols-sharp" style={{ fontSize: '0.85rem', color: '#470ae2' }}>account_balance</span>
        )}
        <span style={{ fontSize: '0.68rem', color: '#470ae2', fontWeight: 600, background: '#f5f1ff', border: '1px solid #ddd4fb', borderRadius: 20, padding: '2px 8px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chipText}
        </span>
        {bnplTag}
      </div>
    );
  }

  if (voucher) {
    const codeText = voucher.code || voucher.translations?.[0]?.title || `#${product.linkedVoucherId}`;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
        <span className="material-symbols-sharp" style={{ fontSize: '0.85rem', color: '#470ae2' }}>confirmation_number</span>
        <span style={{ fontSize: '0.68rem', color: '#470ae2', fontWeight: 600, background: '#f5f1ff', border: '1px solid #ddd4fb', borderRadius: 20, padding: '2px 8px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {codeText}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
      <span className="material-symbols-sharp" style={{ fontSize: '0.85rem', color: '#999' }}>sell</span>
      <span style={{ fontSize: '0.68rem', color: '#888', background: '#f3f4f6', borderRadius: 20, padding: '2px 8px' }}>
        Ribbon linked
      </span>
    </div>
  );
}

// ─── Price display helper for the admin card grid ─────────────────────────────
function PriceDisplay({ product }) {
  const cur = product.currentPrice;
  const orig = product.originalPrice;
  if (!cur) return null;

  const savingsPct = orig && orig > cur
    ? Math.round(((orig - cur) / orig) * 100)
    : null;

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#18113a' }}>
        SAR {cur.toFixed(2)}
      </span>
      {orig && orig > cur && (
        <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>
          SAR {orig.toFixed(2)}
        </span>
      )}
      {savingsPct != null && (
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', background: '#16a34a', borderRadius: 4, padding: '2px 5px' }}>
          -{savingsPct}%
        </span>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ProductsSection({ storeId, products: initialProducts, categories = [] }) {
  const [products,       setProducts]       = useState(initialProducts || []);
  const [showForm,       setShowForm]       = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isPending,      setIsPending]      = useState(false);
  const [formError,      setFormError]      = useState('');

  // Voucher / promo options for ribbon dropdowns
  const [storeVouchers,  setStoreVouchers]  = useState([]);
  const [storePromos,    setStorePromos]    = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // ── fetch ribbon options ────────────────────────────────────────────────────
  const fetchRibbonOptions = useCallback(async () => {
    if (!storeId) return;
    setLoadingOptions(true);
    try {
      const [vRes, pRes] = await Promise.all([
        fetch(`/api/admin/stores/${storeId}/vouchers-calc?limit=200&expired=false`),
        fetch(`/api/admin/stores/${storeId}/other-promos?locale=en`),
      ]);
      if (vRes.ok) { const j = await vRes.json(); setStoreVouchers(j.data || []); }
      if (pRes.ok) { const j = await pRes.json(); setStorePromos(j.promos || []); }
    } catch (err) {
      console.error('Failed to load ribbon options:', err);
    } finally {
      setLoadingOptions(false);
    }
  }, [storeId]);

  useEffect(() => { fetchRibbonOptions(); }, [fetchRibbonOptions]);

  function openCreate() { setEditingProduct(null); setFormError(''); setShowForm(true); }
  function openEdit(p)  { setEditingProduct(p);    setFormError(''); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function closeForm()  { setShowForm(false); setEditingProduct(null); setFormError(''); }

  const handleSubmit = async (formData) => {
    setFormError('');
    setIsPending(true);
    formData.append('storeId', storeId);
    try {
      const result = editingProduct
        ? await updateStoreProduct(editingProduct.id, formData)
        : await createStoreProduct(formData);
      if (result.success) {
        window.location.reload();
      } else {
        setFormError(result.error || 'Failed to save product');
      }
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    const result = await deleteStoreProduct(id);
    if (result.success) {
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      alert(result.error || 'Failed to delete');
    }
  };

  const enTrans          = editingProduct?.translations?.find(t => t.locale === 'en') || {};
  const arTrans          = editingProduct?.translations?.find(t => t.locale === 'ar') || {};
  const currentVoucherId = editingProduct?.linkedVoucherId ?? '';
  const currentPromoId   = editingProduct?.linkedPromoId   ?? '';

  return (
    <div className={styles.section}>

      {/* Header */}
      <div className={styles.sectionHeader}>
        <h2>Featured Products ({products.length})</h2>
        {!showForm && (
          <button onClick={openCreate} className={styles.btnPrimary}>
            + Add Product
          </button>
        )}
      </div>

      {/* ── Create / edit form ─────────────────────────────────────────── */}
      {showForm && (
        <form key={editingProduct?.id ?? 'new'} action={handleSubmit} className={styles.form}>

          {formError && (
            <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {formError}
            </div>
          )}

          {/* ── Basic content ────────────────────────────────────────── */}
          <FormSection title="Product Content">
            <FormRow>
              <FormField label="Title (EN)" name="title_en" defaultValue={enTrans.title} required />
              <FormField label="Title (AR)" name="title_ar" defaultValue={arTrans.title} required dir="rtl" />
            </FormRow>
            <FormField label="Product URL"  name="productUrl" defaultValue={editingProduct?.productUrl} required />
            <FormField label="Image URL"    name="image"      defaultValue={editingProduct?.image}      required />
            <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                defaultChecked={editingProduct?.isFeatured ?? true}
                style={{ width: 18, height: 18 }}
              />
              <label htmlFor="isFeatured" style={{ fontWeight: 500 }}>
                Show in Featured Carousel
              </label>
            </div>
          </FormSection>

          {/* ── Pricing ──────────────────────────────────────────────── */}
          <FormSection title="Pricing">
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 0, marginBottom: '1rem', lineHeight: 1.5 }}>
              Set <strong>Current Price</strong> and optionally <strong>Original Price</strong> to display a
              strikethrough with automatic savings % badge. If prices are omitted the legacy discount badge
              is used instead.
            </p>
            <FormRow>
              <FormField
                label="Current Price (SAR)"
                name="currentPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingProduct?.currentPrice ?? ''}
                placeholder="e.g. 191.24"
                helpText="The live selling price shown prominently"
              />
              <FormField
                label="Original / Was Price (SAR)"
                name="originalPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingProduct?.originalPrice ?? ''}
                placeholder="e.g. 249.00"
                helpText="The crossed-out 'was' price (must be higher than current)"
              />
            </FormRow>

            {/* Visual preview */}
            {editingProduct?.currentPrice && (
              <div style={{ padding: '0.75rem 1rem', background: '#f8f5ff', border: '1px solid #ede8fb', borderRadius: 8, display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>Preview:</span>
                <PriceDisplay product={editingProduct} />
              </div>
            )}

            {/* Legacy discount badge (kept for backwards compat) */}
            <details style={{ marginTop: '0.75rem' }}>
              <summary style={{ fontSize: '0.8rem', color: '#9ca3af', cursor: 'pointer' }}>
                Legacy discount badge (use only if not setting prices above)
              </summary>
              <div style={{ marginTop: '0.75rem' }}>
                <FormRow>
                  <FormField
                    label="Discount Type"
                    name="discountType"
                    type="select"
                    defaultValue={editingProduct?.discountType || 'PERCENTAGE'}
                    options={[
                      { value: 'PERCENTAGE', label: 'Percentage (%)' },
                      { value: 'ABSOLUTE',   label: 'Absolute Amount (SAR)' },
                    ]}
                  />
                  <FormField
                    label="Discount Value"
                    name="discountValue"
                    type="number"
                    step="0.01"
                    defaultValue={editingProduct?.discountValue ?? ''}
                    placeholder="e.g. 20"
                  />
                </FormRow>
              </div>
            </details>
          </FormSection>

          {/* ── Promo ribbon ─────────────────────────────────────────── */}
          <FormSection title="Promo Ribbon & BNPL">
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 0, marginBottom: '1rem', lineHeight: 1.5 }}>
              Link a bank/payment offer to show BNPL installment pricing. If the offer has
              <strong> installment months</strong> set, the card will show
              <em> "Or pay SAR X/month × N at 0% interest"</em>.
            </p>

            {loadingOptions ? (
              <p style={{ color: '#888', fontSize: '0.85rem' }}>Loading vouchers and offers…</p>
            ) : (
              <FormRow>
                {/* Voucher dropdown */}
                <div className={styles.formGroup}>
                  <label htmlFor="linkedVoucherId">Link Voucher</label>
                  <select
                    id="linkedVoucherId"
                    name="linkedVoucherId"
                    defaultValue={currentVoucherId}
                    className={styles.formSelect}
                  >
                    <option value="">— None —</option>
                    {storeVouchers.length === 0 && <option disabled>No active vouchers</option>}
                    {storeVouchers.map(v => (
                      <option key={v.id} value={v.id}>{voucherLabel(v)}</option>
                    ))}
                  </select>
                  <p className={styles.helpText}>Shows a voucher-code ribbon on the card</p>
                  {editingProduct?.linkedVoucher && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#470ae2', background: '#f5f1ff', border: '1px solid #ddd4fb', borderRadius: 8, padding: '0.4rem 0.7rem' }}>
                      <span className="material-symbols-sharp" style={{ fontSize: '0.9rem' }}>confirmation_number</span>
                      Currently: <strong>{editingProduct.linkedVoucher.code || editingProduct.linkedVoucher.translations?.[0]?.title}</strong>
                    </div>
                  )}
                </div>

                {/* Other promo dropdown */}
                <div className={styles.formGroup}>
                  <label htmlFor="linkedPromoId">Link Bank / Payment Offer <span style={{ color: '#16a34a', fontWeight: 700 }}>(enables BNPL line)</span></label>
                  <select
                    id="linkedPromoId"
                    name="linkedPromoId"
                    defaultValue={currentPromoId}
                    className={styles.formSelect}
                  >
                    <option value="">— None —</option>
                    {storePromos.length === 0 && <option disabled>No bank/payment offers</option>}
                    {storePromos.map(p => (
                      <option key={p.id} value={p.id}>{promoLabel(p)}</option>
                    ))}
                  </select>
                  <p className={styles.helpText}>
                    Offer must have <strong>installment months</strong> set to show the BNPL line
                  </p>
                  {editingProduct?.linkedPromo && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#470ae2', background: '#f5f1ff', border: '1px solid #ddd4fb', borderRadius: 8, padding: '0.4rem 0.7rem' }}>
                      {editingProduct.linkedPromo.bank?.logo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={editingProduct.linkedPromo.bank.logo} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 3, background: '#fff', padding: 1 }} />
                      )}
                      <span className="material-symbols-sharp" style={{ fontSize: '0.9rem' }}>account_balance</span>
                      Currently: <strong>{editingProduct.linkedPromo.translations?.[0]?.title}</strong>
                      {editingProduct.linkedPromo.installmentMonths && (
                        <span style={{ marginLeft: 4, fontSize: '0.6rem', color: '#15803d', background: '#dcfce7', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>
                          {editingProduct.linkedPromo.installmentMonths}mo BNPL
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </FormRow>
            )}
          </FormSection>

          {/* ── Category tags (edit only) ─────────────────────────────── */}
          {editingProduct && categories.length > 0 && (
            <FormSection title="Category Tags">
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem', marginTop: 0 }}>
                Tag this product to appear on specific category pages. Mark as <strong>Featured</strong> to pin it to the top strip.
              </p>
              <CategoryTagger
                itemType="STORE_PRODUCT"
                itemId={editingProduct.id}
                availableCategories={categories}
              />
            </FormSection>
          )}

          {/* Actions */}
          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving…' : editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
            <button type="button" onClick={closeForm} className={styles.btnSecondary} disabled={isPending}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Product grid ──────────────────────────────────────────────── */}
      {!showForm && (
        <div className={styles.grid}>
          {products.length === 0 && (
            <p style={{ color: '#888', fontSize: '0.875rem' }}>No products yet. Click "Add Product" to get started.</p>
          )}
          {products.map(product => {
            const enTitle = product.translations?.find(t => t.locale === 'en')?.title || `Product #${product.id}`;
            // Legacy badge fallback
            const discountDisplay = !product.currentPrice && product.discountValue
              ? `${product.discountValue}${product.discountType === 'PERCENTAGE' ? '%' : ' SAR'} OFF`
              : null;

            return (
              <div key={product.id} className={styles.card}>
                {product.image && (
                  <div style={{ width: '100%', aspectRatio: '1', background: 'linear-gradient(145deg,#f8f5ff,#f0ebff)', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={enTitle}
                      style={{ maxWidth: '72%', maxHeight: '72%', objectFit: 'contain' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}

                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4 }}>
                  {enTitle}
                </h4>

                {/* Price display (new) */}
                <PriceDisplay product={product} />

                {/* Legacy discount badge */}
                {discountDisplay && (
                  <p style={{ margin: '0 0 0.4rem', color: '#470ae2', fontWeight: 700, fontSize: '0.8rem' }}>
                    🔥 {discountDisplay}
                  </p>
                )}

                {/* Promo ribbon indicator */}
                <PromoChip product={product} />

                <div className={styles.cardActions} style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEdit(product)} className={styles.btnEdit} style={{ flex: 1 }}>Edit</button>
                  <button onClick={() => handleDelete(product.id)} className={styles.btnDelete}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
