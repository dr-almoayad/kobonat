// app/admin/vouchers/page.jsx
'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createVoucher, updateVoucher, deleteVoucher } from '../_lib/actions';
import { DataTable } from '../_components/DataTable';
import { FormField, FormRow, FormSection } from '../_components/FormField';
import CategoryTagger from '@/components/admin/CategoryTagger/CategoryTagger';
import styles from '../admin.module.css';

const LIMIT = 50;

export default function VouchersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCreate = searchParams.get('create') === 'true';
  const editId = searchParams.get('edit');

  // List state
  const [vouchers,   setVouchers]   = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, page: 1, pages: 1 });
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showExpired, setShowExpired] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Form state
  const [stores,     setStores]     = useState([]);
  const [countries,  setCountries]  = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing,    setEditing]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [isPending,  startTransition] = useTransition();

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter, showExpired]);

  // Fetch vouchers list
  const fetchVouchers = useCallback(async () => {
    setListLoading(true);
    try {
      const params = new URLSearchParams({
        locale:  'en',
        page:    String(page),
        limit:   String(LIMIT),
        expired: String(showExpired),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (typeFilter)      params.set('type', typeFilter);

      const res  = await fetch(`/api/admin/vouchers?${params}`);
      const json = await res.json();
      setVouchers(json.data || []);
      setMeta(json.meta || { total: 0, page: 1, pages: 1 });
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, showExpired]);

  useEffect(() => {
    if (!showCreate && !editId) {
      fetchVouchers();
    }
  }, [fetchVouchers, showCreate, editId]);

  // Fetch reference data (stores, countries, categories) once
  useEffect(() => {
    async function fetchRefs() {
      try {
        const [storesRes, countriesRes, categoriesRes] = await Promise.all([
          fetch('/api/admin/stores?locale=en'),
          fetch('/api/admin/countries?locale=en'),
          fetch('/api/admin/categories?locale=en'),
        ]);
        setStores(await storesRes.json());
        setCountries((await countriesRes.json()).countries || []);
        setCategories(await categoriesRes.json());
      } catch (error) {
        console.error('Error fetching ref data:', error);
      }
    }
    fetchRefs();
  }, []);

  // Load editing voucher when editId changes
  useEffect(() => {
    if (editId && vouchers.length > 0) {
      const voucher = vouchers.find(v => v.id === parseInt(editId));
      setEditing(voucher || null);
    } else if (!editId) {
      setEditing(null);
    }
  }, [editId, vouchers]);

  async function handleCreate(formData) {
    startTransition(async () => {
      const result = await createVoucher(formData);
      if (result.success) {
        router.push('/admin/vouchers');
        fetchVouchers();
      }
    });
  }

  async function handleUpdate(formData) {
    startTransition(async () => {
      await updateVoucher(editId, formData);
      router.push('/admin/vouchers');
      fetchVouchers();
    });
  }

  async function handleDelete(id) {
    startTransition(async () => {
      await deleteVoucher(id);
      fetchVouchers();
    });
  }

  function handleEdit(id) {
    router.push(`/admin/vouchers?edit=${id}`);
  }

  const enTranslation = editing?.translations?.find(t => t.locale === 'en') || {};
  const arTranslation = editing?.translations?.find(t => t.locale === 'ar') || {};

  if (loading && !showCreate && !editId) {
    return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>
          Vouchers
          {!showCreate && !editId && (
            <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#888', marginLeft: 8 }}>
              ({meta.total} total)
            </span>
          )}
        </h1>
        <button
          onClick={() => router.push(showCreate || editId ? '/admin/vouchers' : '/admin/vouchers?create=true')}
          className={styles.btnPrimary}
          disabled={isPending}
        >
          {showCreate || editId ? '✕ Cancel' : '+ Add Voucher'}
        </button>
      </div>

      {/* ── Create / Edit Form ──────────────────────────────────────────── */}
      {(showCreate || editId) && (
        <form action={editId ? handleUpdate : handleCreate} className={styles.form}>
          <FormSection title="Basic Information">
            <FormRow>
              <FormField
                label="Store"
                name="storeId"
                type="select"
                required
                defaultValue={editing?.storeId}
                options={stores.map(s => ({
                  value: s.id,
                  label: s.translations?.[0]?.name || `Store ${s.id}`,
                }))}
                placeholder="Select store"
              />
              <FormField
                label="Type"
                name="type"
                type="select"
                required
                defaultValue={editing?.type}
                options={[
                  { value: 'CODE',          label: 'Code'          },
                  { value: 'DEAL',          label: 'Deal'          },
                  { value: 'FREE_SHIPPING', label: 'Free Shipping' },
                ]}
                placeholder="Select type"
              />
            </FormRow>

            <FormRow>
              <FormField
                label="Voucher Code"
                name="code"
                defaultValue={editing?.code}
                placeholder="SAVE20, SUMMER25"
              />
              <FormField
                label="Discount/Offer"
                name="discount"
                defaultValue={editing?.discount}
                placeholder="20% off, Buy 1 Get 1"
              />
            </FormRow>

            <FormField
              label="Landing URL"
              name="landingUrl"
              type="url"
              required
              defaultValue={editing?.landingUrl}
              placeholder="https://store.com/sale"
            />
          </FormSection>

          <FormSection title="Dates">
            <FormRow>
              <FormField
                label="Start Date"
                name="startDate"
                type="datetime-local"
                defaultValue={editing?.startDate ? new Date(editing.startDate).toISOString().slice(0, 16) : ''}
              />
              <FormField
                label="Expiry Date"
                name="expiryDate"
                type="datetime-local"
                defaultValue={editing?.expiryDate ? new Date(editing.expiryDate).toISOString().slice(0, 16) : ''}
              />
            </FormRow>
          </FormSection>

          <FormSection title="Countries">
            <div className={styles.formRow}>
              {countries.map(country => {
                const isSelected = editing?.countries?.some(vc => vc.countryId === country.id);
                return (
                  <div key={country.id} className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      name="countryIds"
                      value={country.id}
                      id={`country-${country.id}`}
                      defaultChecked={isSelected || (!editing && country.isDefault)}
                    />
                    <label htmlFor={`country-${country.id}`}>
                      {country.flag} {country.name}
                    </label>
                  </div>
                );
              })}
            </div>
          </FormSection>

          <FormSection title="English Translation">
            <FormField
              label="Title (English)"
              name="title_en"
              required
              defaultValue={enTranslation.title}
            />
            <FormField
              label="Description (English)"
              name="description_en"
              type="textarea"
              defaultValue={enTranslation.description}
            />
          </FormSection>

          <FormSection title="Arabic Translation">
            <FormField
              label="Title (Arabic)"
              name="title_ar"
              required
              dir="rtl"
              defaultValue={arTranslation.title}
            />
            <FormField
              label="Description (Arabic)"
              name="description_ar"
              type="textarea"
              dir="rtl"
              defaultValue={arTranslation.description}
            />
          </FormSection>

          <FormSection title="Settings">
            <FormField
              label="Exclusive Voucher"
              name="isExclusive"
              type="checkbox"
              defaultValue={editing?.isExclusive}
            />
            <FormField
              label="Verified"
              name="isVerified"
              type="checkbox"
              defaultValue={editing?.isVerified ?? true}
            />
            {editId && (
              <FormField
                label="Popularity Score"
                name="popularityScore"
                type="number"
                defaultValue={editing?.popularityScore || 0}
              />
            )}
          </FormSection>

          {editId && (
            <FormSection title="Category Tags">
              <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.75rem', marginTop: 0 }}>
                Tag this voucher to appear directly on specific category pages, regardless
                of which store it belongs to. Mark as <strong>Featured</strong> to show it
                in the highlighted strip at the top of the category page.
              </p>
              <CategoryTagger
                itemType="VOUCHER"
                itemId={parseInt(editId)}
                availableCategories={categories}
              />
            </FormSection>
          )}

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : editId ? 'Update Voucher' : 'Create Voucher'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/vouchers')}
              className={styles.btnSecondary}
              disabled={isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── List View ───────────────────────────────────────────────────── */}
      {!showCreate && !editId && (
        <>
          {/* Filters bar */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '1.25rem',
            padding: '0.875rem 1rem',
            background: 'var(--ap-surface-2, #f8fafc)',
            border: '1px solid var(--ap-border, #e5e7eb)',
            borderRadius: '8px',
          }}>
            {/* Search */}
            <input
              type="search"
              placeholder="Search by title, code or store…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.formInput}
              style={{ maxWidth: 280, flex: '1 1 200px' }}
            />

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className={styles.formSelect}
              style={{ width: 160 }}
            >
              <option value="">All types</option>
              <option value="CODE">Code</option>
              <option value="DEAL">Deal</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>

            {/* Show expired toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={showExpired}
                onChange={e => setShowExpired(e.target.checked)}
              />
              Include expired
            </label>

            {/* Result count */}
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#888', whiteSpace: 'nowrap' }}>
              {listLoading ? 'Loading…' : `${meta.total} voucher${meta.total !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Table */}
          <div style={{ opacity: listLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <DataTable
              data={vouchers}
              columns={[
                { key: 'id', label: 'ID', sortable: true },
                {
                  key: 'translations',
                  label: 'Title',
                  render: (trans, row) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{trans?.[0]?.title || '—'}</div>
                      {row.isExclusive && (
                        <span className={styles.badgePrimary} style={{ fontSize: 11 }}>Exclusive</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'store',
                  label: 'Store',
                  render: (store) => store?.translations?.[0]?.name || '—',
                },
                {
                  key: 'type',
                  label: 'Type',
                  render: (type) => <span className={styles.badge}>{type}</span>,
                },
                { key: 'code', label: 'Code' },
                {
                  key: 'countries',
                  label: 'Countries',
                  sortable: false,
                  render: (countries) => (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {countries?.slice(0, 3).map(vc => (
                        <span key={vc.country?.id} className={styles.badge}>
                          {vc.country?.code}
                        </span>
                      ))}
                      {countries && countries.length > 3 && (
                        <span style={{ fontSize: 12, color: '#999' }}>+{countries.length - 3}</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: '_count',
                  label: 'Clicks',
                  render: (count) => count?.clicks || 0,
                },
                {
                  key: 'expiryDate',
                  label: 'Expiry',
                  render: (date) => {
                    if (!date) return <span className={styles.badgeSuccess}>No expiry</span>;
                    const isExpired = new Date(date) < new Date();
                    return (
                      <div>
                        <div>{new Date(date).toLocaleDateString()}</div>
                        {isExpired && (
                          <span className={styles.badgeDanger} style={{ fontSize: 11 }}>Expired</span>
                        )}
                      </div>
                    );
                  },
                },
              ]}
              onEdit={handleEdit}
              onDelete={handleDelete}
              searchable={false}
            />
          </div>

          {/* Pagination */}
          {meta.pages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1.5rem',
              flexWrap: 'wrap',
            }}>
              {/* First */}
              <button
                onClick={() => setPage(1)}
                disabled={page === 1 || listLoading}
                className={styles.btnSecondary}
                style={{ padding: '6px 10px', fontSize: '0.8rem', minWidth: 'unset' }}
              >
                «
              </button>

              {/* Prev */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || listLoading}
                className={styles.btnSecondary}
                style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: 'unset' }}
              >
                ‹ Prev
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(7, meta.pages) }, (_, i) => {
                let pageNum;
                if (meta.pages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= meta.pages - 3) {
                  pageNum = meta.pages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                if (pageNum < 1 || pageNum > meta.pages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={listLoading}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      cursor: 'pointer',
                      fontWeight: pageNum === page ? 700 : 400,
                      background: pageNum === page ? '#2563eb' : '#fff',
                      color:      pageNum === page ? '#fff'    : '#374151',
                      borderColor: pageNum === page ? '#2563eb' : '#d1d5db',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next */}
              <button
                onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                disabled={page === meta.pages || listLoading}
                className={styles.btnSecondary}
                style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: 'unset' }}
              >
                Next ›
              </button>

              {/* Last */}
              <button
                onClick={() => setPage(meta.pages)}
                disabled={page === meta.pages || listLoading}
                className={styles.btnSecondary}
                style={{ padding: '6px 10px', fontSize: '0.8rem', minWidth: 'unset' }}
              >
                »
              </button>

              <span style={{ fontSize: '0.78rem', color: '#888', marginLeft: '0.25rem' }}>
                Page {page} of {meta.pages} · {meta.total} total
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
