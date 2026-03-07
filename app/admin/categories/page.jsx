// app/admin/categories/page.jsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { upsertCategory, deleteCategory } from '../_lib/actions';
import { DataTable } from '../_components/DataTable';
import { FormField, FormRow, FormSection } from '../_components/FormField';
import styles from '../admin.module.css';

// ─── All criteria the scoring engine understands ──────────────────────────────
const ALL_CRITERIA = [
  { key: 'travelCashback',     label: 'Travel cashback %' },
  { key: 'shoppingCashback',   label: 'Shopping cashback %' },
  { key: 'onlineCashback',     label: 'Online cashback %' },
  { key: 'diningCashback',     label: 'Dining cashback %' },
  { key: 'fuelCashback',       label: 'Fuel cashback %' },
  { key: 'gamingCashback',     label: 'Gaming cashback %' },
  { key: 'groceryCashback',    label: 'Grocery cashback %' },
  { key: 'healthcareCashback', label: 'Healthcare cashback %' },
  { key: 'generalCashback',    label: 'General cashback %' },
  { key: 'loungeAccess',       label: 'Lounge visits / year' },
  { key: 'travelInsurance',    label: 'Travel insurance (y/n)' },
  { key: 'foreignTxFee',       label: 'Foreign TX fee (lower = better)' },
  { key: 'purchaseProtection', label: 'Purchase protection (y/n)' },
  { key: 'installmentMonths',  label: 'Max 0% installment months' },
  { key: 'annualFee',          label: 'Annual fee (lower = better)' },
  { key: 'activeOfferBonus',   label: 'Active store offers count' },
  { key: 'appRating',          label: 'App store rating (0–5)' },
];

function BankScoringWeightsEditor({ weights, onChange }) {
  const total = Object.values(weights).reduce((s, v) => s + parseFloat(v || 0), 0);
  const valid = Math.abs(total - 1) < 0.01;

  return (
    <div style={{ border: '1px solid var(--ap-border, #e2e8f0)', borderRadius: 8, padding: '1rem', marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Scoring Criteria Weights</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: valid ? '#16a34a' : '#dc2626' }}>
          Σ = {total.toFixed(2)} {valid ? '✓' : '— must equal 1.00'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '0.4rem' }}>
        {ALL_CRITERIA.map(({ key, label }) => {
          const active = weights[key] !== undefined;
          return (
            <label key={key} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.5rem', borderRadius: 4, cursor: 'pointer',
              background: active ? '#f0f9ff' : 'transparent',
              border: `1px solid ${active ? '#bae6fd' : 'transparent'}`,
              fontSize: '0.78rem',
            }}>
              <input
                type="checkbox"
                checked={active}
                onChange={e => {
                  const next = { ...weights };
                  if (e.target.checked) next[key] = 0.10;
                  else delete next[key];
                  onChange(next);
                }}
              />
              <span style={{ flex: 1, color: active ? '#0369a1' : '#64748b' }}>{label}</span>
              {active && (
                <input
                  type="number" step="0.01" min="0" max="1"
                  value={weights[key]}
                  onClick={e => e.stopPropagation()}
                  onChange={e => onChange({ ...weights, [key]: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: 54, padding: '2px 4px', textAlign: 'right',
                    border: '1px solid #bae6fd', borderRadius: 3,
                    fontSize: '0.75rem', background: '#fff', color: '#0c4a6e',
                  }}
                />
              )}
            </label>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange({})}
        style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Clear all criteria
      </button>
    </div>
  );
}

function BankNicheSection({ category, weights, setWeights }) {
  const [enabled, setEnabled] = useState(
    !!(category?.bankScoringWeights && Object.keys(category.bankScoringWeights).length > 0)
  );

  return (
    <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={enabled}
          style={{ marginTop: 3 }}
          onChange={e => {
            setEnabled(e.target.checked);
            if (!e.target.checked) setWeights({});
          }}
        />
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Use as Bank Scoring Niche</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
            When enabled, this category appears in the bank leaderboard. Set the per-criterion weights below — they must sum to 1.00.
          </div>
        </div>
      </label>

      {enabled && (
        <BankScoringWeightsEditor weights={weights} onChange={setWeights} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCreate = searchParams.get('create') === 'true';
  const editId = searchParams.get('edit');

  const [categories,  setCategories]  = useState([]);
  const [editing,     setEditing]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [isPending,   startTransition] = useTransition();
  const [formError,   setFormError]   = useState('');
  const [weights,     setWeights]     = useState({});

  // ── Fetch categories ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        const res  = await fetch('/api/admin/categories?locale=en');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Load category for editing ─────────────────────────────────────────────
  useEffect(() => {
    if (editId && categories.length > 0) {
      const category = categories.find(c => c.id === parseInt(editId));
      setEditing(category || null);
      setWeights(category?.bankScoringWeights ?? {});
    } else {
      setEditing(null);
      setWeights({});
    }
  }, [editId, categories]);

  // ── Form submit ───────────────────────────────────────────────────────────
  async function handleSubmit(formData) {
    setFormError('');
    if (!formData.get('slug_en') || !formData.get('slug_ar')) {
      setFormError('Both English and Arabic slugs are required');
      return;
    }

    // Inject the weights JSON so the server action can read it
    formData.set(
      'bankScoringWeights',
      Object.keys(weights).length > 0 ? JSON.stringify(weights) : ''
    );

    startTransition(async () => {
      const result = await upsertCategory(editId, formData);
      if (result.success) {
        const res  = await fetch('/api/admin/categories?locale=en');
        const data = await res.json();
        setCategories(data);
        router.push('/admin/categories');
        setEditing(null);
        setWeights({});
      } else {
        setFormError(result.error || 'Failed to save category');
      }
    });
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) {
        const res  = await fetch('/api/admin/categories?locale=en');
        const data = await res.json();
        setCategories(data);
      } else {
        alert(result.error || 'Failed to delete category');
      }
    });
  }

  function handleEdit(id) { router.push(`/admin/categories?edit=${id}`); }
  function handleCreate()  { router.push('/admin/categories?create=true'); }
  function handleCancel()  { router.push('/admin/categories'); setEditing(null); setFormError(''); setWeights({}); }

  const enTranslation = editing?.translations?.find(t => t.locale === 'en') || {};
  const arTranslation = editing?.translations?.find(t => t.locale === 'ar') || {};

  if (loading) return <div className={styles.page}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Categories ({categories.length})</h1>
        {!showCreate && !editId && (
          <button onClick={handleCreate} className={styles.btnPrimary} disabled={isPending}>
            + Add Category
          </button>
        )}
        {(showCreate || editId) && (
          <button onClick={handleCancel} className={styles.btnSecondary} disabled={isPending}>
            ← Back to List
          </button>
        )}
      </div>

      {/* ── Create / Edit Form ──────────────────────────────────────────────── */}
      {(showCreate || editId) && (
        <form action={handleSubmit} className={styles.form}>
          <div className={styles.formHeader}>
            <h2>{showCreate ? 'Create New Category' : `Edit Category: ${enTranslation.name || ''}`}</h2>
          </div>

          {formError && <div className={styles.errorMessage}>{formError}</div>}

          <FormSection title="Basic Information">
            <FormRow>
              <FormField
                label="Emoji Icon" name="icon"
                defaultValue={editing?.icon || ''}
                placeholder="🛒, 🛍️, 📱"
                helpText="Optional emoji icon"
              />
              <FormField
                label="Color" name="color" type="color"
                defaultValue={editing?.color || '#0070f3'}
              />
              <FormField
                label="Image URL" name="image"
                defaultValue={editing?.image || ''}
                placeholder="/images/fashion-banner.jpg"
              />
            </FormRow>
          </FormSection>

          <FormSection title="English Translation">
            <FormRow>
              <FormField
                label="Name (English)" name="name_en" required
                defaultValue={enTranslation.name || ''}
                placeholder="Electronics"
              />
              <FormField
                label="Slug (English)" name="slug_en" required
                defaultValue={enTranslation.slug || ''}
                placeholder="electronics"
                helpText="URL-friendly, lowercase, no spaces"
              />
            </FormRow>
            <FormField
              label="Description (English)" name="description_en" type="textarea"
              defaultValue={enTranslation.description || ''}
            />
            <FormRow>
              <FormField label="SEO Title" name="seoTitle_en" defaultValue={enTranslation.seoTitle || ''} />
              <FormField label="SEO Description" name="seoDescription_en" type="textarea" rows={2} defaultValue={enTranslation.seoDescription || ''} />
            </FormRow>
          </FormSection>

          <FormSection title="Arabic Translation">
            <FormRow>
              <FormField
                label="Name (Arabic)" name="name_ar" required dir="rtl"
                defaultValue={arTranslation.name || ''}
                placeholder="الإلكترونيات"
              />
              <FormField
                label="Slug (Arabic)" name="slug_ar" required dir="rtl"
                defaultValue={arTranslation.slug || ''}
                placeholder="الإلكترونيات"
              />
            </FormRow>
            <FormField label="Description (Arabic)" name="description_ar" type="textarea" dir="rtl" defaultValue={arTranslation.description || ''} />
            <FormRow>
              <FormField label="SEO Title" name="seoTitle_ar" dir="rtl" defaultValue={arTranslation.seoTitle || ''} />
              <FormField label="SEO Description" name="seoDescription_ar" type="textarea" rows={2} dir="rtl" defaultValue={arTranslation.seoDescription || ''} />
            </FormRow>
          </FormSection>

          {/* ── Bank Niche Section ─────────────────────────────────────────── */}
          <FormSection title="Bank Leaderboard">
            <BankNicheSection category={editing} weights={weights} setWeights={setWeights} />
          </FormSection>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving…' : editId ? 'Update Category' : 'Create Category'}
            </button>
            <button type="button" onClick={handleCancel} className={styles.btnSecondary} disabled={isPending}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Category List ───────────────────────────────────────────────────── */}
      {!showCreate && !editId && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
            {categories.map(category => {
              const enTrans = category.translations?.find(t => t.locale === 'en') || {};
              const arTrans = category.translations?.find(t => t.locale === 'ar') || {};
              const isNiche = !!category.bankScoringWeights && Object.keys(category.bankScoringWeights).length > 0;

              return (
                <div key={category.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <div style={{
                        fontSize: 32, width: 50, height: 50,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 10, background: category.color ? `${category.color}15` : '#f0f0f0',
                      }}>
                        {category.image ? (
                          <img src={category.image} alt={enTrans.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                        ) : null}
                        <span className="material-symbols-sharp" style={{ display: category.image ? 'none' : 'block', fontSize: 24 }}>
                          {category.icon}
                        </span>
                      </div>
                      <div>
                        <h3 className={styles.cardTitle}>{enTrans.name || 'Unnamed'}</h3>
                        <div style={{ fontSize: 12, color: '#666' }}>{enTrans.slug || 'no-slug'}</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardContent}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>ID:</span>
                        <strong>{category.id}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Linked Stores:</span>
                        <strong>{category._count?.stores || 0}</strong>
                      </div>
                      {category.color && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#666' }}>Color:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 4, background: category.color, border: '1px solid #ddd' }} />
                            <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{category.color}</span>
                          </div>
                        </div>
                      )}
                      {/* Bank niche badge */}
                      {isNiche && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#666' }}>Bank Niche:</span>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                            background: '#dbeafe', color: '#1d4ed8',
                          }}>
                            {Object.keys(category.bankScoringWeights).length} criteria
                          </span>
                        </div>
                      )}
                      {arTrans.name && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee', direction: 'rtl' }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{arTrans.name}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{arTrans.slug}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                    <button onClick={() => handleEdit(category.id)} className={styles.btnEdit} style={{ flex: 1 }} disabled={isPending}>Edit</button>
                    <button onClick={() => handleDelete(category.id)} className={styles.btnDelete} style={{ flex: 1 }} disabled={isPending}>
                      {isPending ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 style={{ marginTop: 40, marginBottom: 20 }}>Table View</h2>
          <DataTable
            data={categories}
            columns={[
              { key: 'id', label: 'ID', sortable: true },
              {
                key: 'icon', label: 'Icon', sortable: false,
                render: (icon) => <div style={{ fontSize: 24 }}>{icon || '📂'}</div>,
              },
              {
                key: 'translations', label: 'Category Name', sortable: true,
                render: (trans) => {
                  const en = trans?.find(t => t.locale === 'en') || {};
                  const ar = trans?.find(t => t.locale === 'ar') || {};
                  return (
                    <div>
                      <div style={{ fontWeight: 500 }}>{en.name || '—'}</div>
                      {ar.name && <div style={{ fontSize: 12, color: '#666', direction: 'rtl', marginTop: 4 }}>{ar.name}</div>}
                    </div>
                  );
                },
              },
              {
                key: 'translations', label: 'Slug', sortable: false,
                render: (trans) => {
                  const en = trans?.find(t => t.locale === 'en') || {};
                  return <code style={{ fontSize: 11, background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{en.slug || '—'}</code>;
                },
              },
              {
                key: 'color', label: 'Color', sortable: false,
                render: (color) => color ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: color, border: '1px solid #ddd' }} />
                    <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{color}</span>
                  </div>
                ) : '—',
              },
              {
                key: 'bankScoringWeights', label: 'Bank Niche', sortable: false,
                render: (weights) => weights && Object.keys(weights).length > 0 ? (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#dbeafe', color: '#1d4ed8' }}>
                    {Object.keys(weights).length} criteria
                  </span>
                ) : <span style={{ color: '#ccc' }}>—</span>,
              },
              {
                key: '_count.stores', label: 'Stores', sortable: true,
                render: (count) => <span className={styles.badgePrimary}>{count || 0}</span>,
              },
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchable
            searchPlaceholder="Search categories…"
          />
        </>
      )}
    </div>
  );
}
