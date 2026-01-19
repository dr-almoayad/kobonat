// app/admin/stores/[id]/page.jsx - FIXED for Next.js 15
'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  updateStore, 
  updateStoreCountries, 
  updateStoreCategories,
  upsertFAQ,
  deleteFAQ
} from '../../_lib/actions';
import { FormField, FormRow, FormSection } from '../../_components/FormField';
import { DataTable } from '../../_components/DataTable';
import styles from '../../admin.module.css';
import StorePaymentMethods from './StorePaymentMethods';

export default function StoreEditPage({ params }) {
  // FIX: Unwrap params Promise for Next.js 15
  const { id } = use(params);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'basic';
  
  // States
  const [store, setStore] = useState(null);
  const [allCountries, setAllCountries] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allPaymentMethods, setAllPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        
        // Parallel Fetch
        const [storeRes, countriesRes, categoriesRes, pmRes] = await Promise.all([
          fetch(`/api/admin/stores/${id}?locale=en`),
          fetch('/api/admin/countries?locale=en'),
          fetch('/api/admin/categories?locale=en'),
          fetch('/api/admin/payment-methods?locale=en')
        ]);

        // Parse JSON
        const storeData = await storeRes.json();
        const countriesData = await countriesRes.json();
        const categoriesData = await categoriesRes.json();
        const pmData = await pmRes.json();

        if (!storeRes.ok) throw new Error(storeData.error || 'Store not found');

        // Set State
        setStore(storeData);
        setAllCountries(countriesData.countries || []);
        setAllCategories(categoriesData || []);
        setAllPaymentMethods(pmData.paymentMethods || []);

      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchData();
  }, [id]);

  // Handle Loading & Error States
  if (loading) return <div className={styles.loading}>Loading Store Data...</div>;
  if (error || !store) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <h3>Error</h3>
          <p>{error || 'Store not found'}</p>
          <button onClick={() => router.push('/admin/stores')} className={styles.btnSecondary}>
            ← Back to Stores
          </button>
        </div>
      </div>
    );
  }

  const enTranslation = store.translations?.find(t => t.locale === 'en') || {};
  const arTranslation = store.translations?.find(t => t.locale === 'ar') || {};

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Edit Store: {enTranslation.name || `Store #${id}`}</h1>
        <button 
          onClick={() => router.push('/admin/stores')}
          className={styles.btnSecondary}
        >
          ← Back to Stores
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabs}>
        {['basic', 'translations', 'countries', 'categories', 'vouchers', 'payment-methods', 'faqs'].map((t) => (
          <button 
            key={t}
            onClick={() => router.push(`/admin/stores/${id}?tab=${t}`)}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* 1. BASIC INFO TAB */}
      {tab === 'basic' && (
        <form action={(formData) => {
          startTransition(async () => {
            const result = await updateStore(store.id, formData);
            if (result.success) {
              router.refresh();
            } else {
              alert(result.error || 'Failed to update');
            }
          });
        }} className={styles.form}>
          <FormSection title="Basic Information">
            <FormRow>
              <FormField
                label="Logo URL"
                name="logo"
                defaultValue={store.logo || ''}
                placeholder="https://example.com/logo.png"
              />
              <FormField
                label="Brand Color"
                name="color"
                type="color"
                defaultValue={store.color || '#2563eb'}
              />
            </FormRow>

            <FormField
              label="Website URL"
              name="websiteUrl"
              type="url"
              required
              defaultValue={store.websiteUrl || ''}
              placeholder="https://store.com"
            />

            <FormRow>
              <FormField
                label="Affiliate Network"
                name="affiliateNetwork"
                defaultValue={store.affiliateNetwork || ''}
                placeholder="ShareASale, CJ, etc."
              />
              <FormField
                label="Tracking URL"
                name="trackingUrl"
                defaultValue={store.trackingUrl || ''}
                placeholder="https://track.example.com/?ref={code}"
              />
            </FormRow>
          </FormSection>

          <FormSection title="Settings">
            <FormField
              label="Active"
              name="isActive"
              type="checkbox"
              defaultValue={store.isActive}
            />
            <FormField
              label="Featured"
              name="isFeatured"
              type="checkbox"
              defaultValue={store.isFeatured}
            />
          </FormSection>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* 2. TRANSLATIONS TAB */}
      {tab === 'translations' && (
        <form action={(formData) => {
          startTransition(async () => {
            const result = await updateStore(store.id, formData);
            if (result.success) {
              router.refresh();
            } else {
              alert(result.error || 'Failed to update');
            }
          });
        }} className={styles.form}>
          <FormSection title="English Translation">
            <FormRow>
              <FormField label="Name" name="name_en" required defaultValue={enTranslation.name || ''} />
              <FormField label="Slug" name="slug_en" required defaultValue={enTranslation.slug || ''} />
            </FormRow>
            <FormRow>
              <FormField label="SEO Title" name="seoTitle_en" defaultValue={enTranslation.seoTitle || ''} />
              <FormField label="SEO Description" name="seoDescription_en" defaultValue={enTranslation.seoDescription || ''} />
            </FormRow>
            <FormField label="Description" name="description_en" type="textarea" defaultValue={enTranslation.description || ''} />
          </FormSection>

          <FormSection title="Arabic Translation">
            <FormRow>
              <FormField label="Name" name="name_ar" required dir="rtl" defaultValue={arTranslation.name || ''} />
              <FormField label="Slug" name="slug_ar" required dir="rtl" defaultValue={arTranslation.slug || ''} />
            </FormRow>
            <FormRow>
              <FormField label="SEO Title" name="seoTitle_ar" dir="rtl" defaultValue={arTranslation.seoTitle || ''} />
              <FormField label="SEO Description" name="seoDescription_ar" dir="rtl" defaultValue={arTranslation.seoDescription || ''} />
            </FormRow>
            <FormField label="Description" name="description_ar" type="textarea" dir="rtl" defaultValue={arTranslation.description || ''} />
          </FormSection>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Translations'}
            </button>
          </div>
        </form>
      )}

      {/* 3. COUNTRIES TAB */}
      {tab === 'countries' && (
        <form action={(formData) => {
          startTransition(async () => {
            await updateStoreCountries(store.id, formData);
            router.refresh();
          });
        }} className={styles.form}>
          <FormSection title="Select Operating Countries">
            <p className={styles.helpText} style={{ marginBottom: 15 }}>
              Select which countries this store is available in.
            </p>
            <div className={styles.checkboxGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {allCountries.map(country => {
                const isSelected = store.countries?.some(sc => sc.countryId === country.id);
                return (
                  <div key={country.id} className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      name="countryIds"
                      value={country.id}
                      id={`country-${country.id}`}
                      defaultChecked={isSelected}
                    />
                    <label htmlFor={`country-${country.id}`}>
                      {country.flag} {country.translations?.[0]?.name || country.code}
                    </label>
                  </div>
                );
              })}
            </div>
          </FormSection>
          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : 'Update Countries'}
            </button>
          </div>
        </form>
      )}

      {/* 4. CATEGORIES TAB */}
      {tab === 'categories' && (
        <form action={(formData) => {
          startTransition(async () => {
            const res = await updateStoreCategories(id, formData);
            if (res.success) router.refresh();
          });
        }} className={styles.form}>
          <FormSection title="Select Categories">
            <div className={styles.checkboxGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {allCategories.map(cat => {
                const isLinked = store?.categories?.some(sc => sc.categoryId === cat.id);
                const catName = cat.translations?.[0]?.name || `Category ${cat.id}`;
                
                return (
                  <label key={cat.id} className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid #eee' }}>
                    <input 
                      type="checkbox" 
                      name="categoryIds" 
                      value={cat.id}
                      defaultChecked={isLinked} 
                    />
                    <span>{cat.icon} {catName}</span>
                  </label>
                );
              })}
            </div>
          </FormSection>
          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Categories'}
            </button>
          </div>
        </form>
      )}

      {/* 5. VOUCHERS TAB */}
      {tab === 'vouchers' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <button 
              onClick={() => router.push(`/admin/vouchers?create=true&storeId=${id}`)}
              className={styles.btnPrimary}
            >
              + Add Voucher
            </button>
          </div>
          <DataTable
            data={store.vouchers || []}
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'code', label: 'Code' },
              { 
                key: 'type', 
                label: 'Type',
                render: (type) => <span className={styles.badge}>{type}</span>
              },
              { 
                key: 'expiryDate', 
                label: 'Status',
                render: (date) => {
                  if (!date) return <span className={styles.badgeSuccess}>Active</span>;
                  const isExpired = new Date(date) < new Date();
                  return isExpired ? 
                    <span className={styles.badgeDanger}>Expired</span> : 
                    <span className={styles.badgeSuccess}>Active</span>;
                }
              }
            ]}
            onEdit={(voucherId) => router.push(`/admin/vouchers?edit=${voucherId}`)}
            searchable={true}
          />
        </div>
      )}

      {/* 6. PAYMENT METHODS TAB */}
      {tab === 'payment-methods' && (
        <StorePaymentMethods 
          store={store} 
          paymentMethods={allPaymentMethods}
          countries={store.countries || []}
        />
      )}

      {/* 7. FAQS TAB */}
      {tab === 'faqs' && (
        <div>
          <form action={(formData) => {
            startTransition(async () => {
              await upsertFAQ(formData);
              router.refresh();
            });
          }} className={styles.form} style={{ marginBottom: 30 }}>
            <input type="hidden" name="storeId" value={store.id} />
            <FormSection title="Add New FAQ">
              <FormField
                label="Country"
                name="countryId"
                type="select"
                required
                options={(store.countries || []).map(sc => ({
                  value: sc.countryId,
                  label: `${sc.country?.code} - ${sc.country?.translations?.[0]?.name}`
                }))}
                placeholder="Select country"
              />
              <FormRow>
                <FormField label="Question (English)" name="question_en" required />
                <FormField label="Question (Arabic)" name="question_ar" required dir="rtl" />
              </FormRow>
              <FormRow>
                <FormField label="Answer (English)" name="answer_en" type="textarea" required />
                <FormField label="Answer (Arabic)" name="answer_ar" type="textarea" required dir="rtl" />
              </FormRow>
              <FormRow>
                <FormField label="Order" name="order" type="number" defaultValue="0" />
                <FormField label="Active" name="isActive" type="checkbox" defaultValue={true} />
              </FormRow>
              <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                {isPending ? 'Adding...' : 'Add FAQ'}
              </button>
            </FormSection>
          </form>

          <DataTable
            data={store.faqs || []}
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'country.code', label: 'Country' },
              { 
                key: 'translations', 
                label: 'Question',
                render: (trans) => trans?.[0]?.question || '—'
              },
              { key: 'order', label: 'Order' },
              { 
                key: 'isActive', 
                label: 'Status',
                render: (active) => <span className={active ? styles.badgeSuccess : styles.badgeDanger}>{active ? 'Active' : 'Inactive'}</span>
              }
            ]}
            onDelete={(faqId) => {
              startTransition(async () => {
                const formData = new FormData();
                formData.append('id', faqId);
                formData.append('storeId', store.id);
                await deleteFAQ(formData);
                router.refresh();
              });
            }}
            searchable={false}
          />
        </div>
      )}
    </div>
  );
}