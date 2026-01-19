// app/admin/vouchers/page.jsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createVoucher, updateVoucher, deleteVoucher } from '../_lib/actions';
import { DataTable } from '../_components/DataTable';
import { FormField, FormRow, FormSection } from '../_components/FormField';
import styles from '../admin.module.css';

export default function VouchersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCreate = searchParams.get('create') === 'true';
  const editId = searchParams.get('edit');
  
  const [vouchers, setVouchers] = useState([]);
  const [stores, setStores] = useState([]);
  const [countries, setCountries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchData() {
      try {
        const [vouchersRes, storesRes, countriesRes] = await Promise.all([
          fetch('/api/admin/vouchers?locale=en'),
          fetch('/api/admin/stores?locale=en'),
          fetch('/api/admin/countries?locale=en')
        ]);
        
        setVouchers(await vouchersRes.json());
        setStores(await storesRes.json());
        setCountries((await countriesRes.json()).countries || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  useEffect(() => {
    if (editId && vouchers.length > 0) {
      const voucher = vouchers.find(v => v.id === parseInt(editId));
      setEditing(voucher);
    }
  }, [editId, vouchers]);

  async function handleCreate(formData) {
    startTransition(async () => {
      const result = await createVoucher(formData);
      if (result.success) {
        router.push('/admin/vouchers');
        router.refresh();
      }
    });
  }

  async function handleUpdate(formData) {
    startTransition(async () => {
      await updateVoucher(editId, formData);
      router.push('/admin/vouchers');
      router.refresh();
    });
  }

  async function handleDelete(id) {
    startTransition(async () => {
      await deleteVoucher(id);
      const res = await fetch('/api/admin/vouchers?locale=en');
      setVouchers(await res.json());
    });
  }

  function handleEdit(id) {
    router.push(`/admin/vouchers?edit=${id}`);
  }

  const enTranslation = editing?.translations?.find(t => t.locale === 'en') || {};
  const arTranslation = editing?.translations?.find(t => t.locale === 'ar') || {};

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Vouchers ({vouchers.length})</h1>
        <button 
          onClick={() => router.push(showCreate || editId ? '/admin/vouchers' : '/admin/vouchers?create=true')}
          className={styles.btnPrimary}
          disabled={isPending}
        >
          {showCreate || editId ? '✕ Cancel' : '+ Add Voucher'}
        </button>
      </div>

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
                  label: s.translations?.[0]?.name || `Store ${s.id}`
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
                  { value: 'CODE', label: 'Code' },
                  { value: 'DEAL', label: 'Deal' },
                  { value: 'FREE_SHIPPING', label: 'Free Shipping' }
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

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : (editId ? 'Update Voucher' : 'Create Voucher')}
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

      {!showCreate && !editId && (
        <DataTable
          data={vouchers}
          columns={[
            { key: 'id', label: 'ID' },
            { 
              key: 'translations', 
              label: 'Title',
              render: (trans, row) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{trans?.[0]?.title || '—'}</div>
                  {row.isExclusive && (
                    <span className={styles.badgePrimary} style={{ fontSize: 11 }}>
                      Exclusive
                    </span>
                  )}
                </div>
              )
            },
            { 
              key: 'store', 
              label: 'Store',
              render: (store) => store?.translations?.[0]?.name || '—'
            },
            { 
              key: 'type', 
              label: 'Type',
              render: (type) => <span className={styles.badge}>{type}</span>
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
                    <span style={{ fontSize: 12, color: '#999' }}>
                      +{countries.length - 3}
                    </span>
                  )}
                </div>
              )
            },
            { 
              key: '_count', 
              label: 'Clicks',
              render: (count) => count?.clicks || 0
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
                      <span className={styles.badgeDanger} style={{ fontSize: 11 }}>
                        Expired
                      </span>
                    )}
                  </div>
                );
              }
            }
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}