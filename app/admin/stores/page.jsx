'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createStore, deleteStore } from '../_lib/actions';
import { DataTable } from '../_components/DataTable';
import { FormField, FormRow, FormSection } from '../_components/FormField';
import styles from '../admin.module.css';

export default function StoresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCreate = searchParams.get('create') === 'true';
  
  const [stores, setStores] = useState([]);
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [storesRes, countriesRes, categoriesRes] = await Promise.all([
          fetch('/api/admin/stores?locale=en'),
          fetch('/api/admin/countries?locale=en'),
          fetch('/api/admin/categories?locale=en')
        ]);
        
        setStores(await storesRes.json());
        setCountries((await countriesRes.json()).countries || []);
        setCategories(await categoriesRes.json());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  async function handleCreate(formData) {
    setIsPending(true);
    try {
      const result = await createStore(formData);
      if (result.success) {
        router.push(`/admin/stores/${result.id}`);
        router.refresh();
      } else {
        alert(result.error || 'Failed to create store');
      }
    } catch (error) {
      alert('Error creating store');
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(formData) {
    const id = formData.get('id');
    if (!confirm('Are you sure you want to delete this store?')) return;
    
    const result = await deleteStore(id);
    if (result.success) {
      // Refresh data
      const res = await fetch('/api/admin/stores?locale=en');
      setStores(await res.json());
    } else {
      alert(result.error || 'Failed to delete store');
    }
  }

  function handleEdit(id) {
    router.push(`/admin/stores/${id}`);
  }

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Stores ({stores.length})</h1>
        <button 
          onClick={() => router.push(showCreate ? '/admin/stores' : '/admin/stores?create=true')}
          className={styles.btnPrimary}
          disabled={isPending}
        >
          {showCreate ? '✕ Cancel' : '+ Add Store'}
        </button>
      </div>

      {showCreate && (
        <form action={handleCreate} className={styles.form}>
          <input type="hidden" name="id" value="" />
          
          <FormSection title="Basic Information">
            <FormRow>
              <FormField
                label="Logo URL"
                name="logo"
                placeholder="https://example.com/logo.png"
              />
              <FormField
                label="Brand Color"
                name="color"
                type="color"
                defaultValue="#2563eb"
              />
            </FormRow>

            <FormField
              label="Website URL"
              name="websiteUrl"
              type="url"
              required
              placeholder="https://store.com"
            />

            <FormRow>
              <FormField
                label="Affiliate Network"
                name="affiliateNetwork"
                placeholder="ShareASale, CJ, etc."
              />
              <FormField
                label="Tracking URL"
                name="trackingUrl"
                placeholder="https://track.example.com/?ref={code}"
              />
            </FormRow>
          </FormSection>

          <FormSection title="English Translation">
            <FormRow>
              <FormField
                label="Name (English)"
                name="name_en"
                required
              />
              <FormField
                label="Slug (English)"
                name="slug_en"
                required
                placeholder="store-name"
              />
            </FormRow>

            <FormRow>
              <FormField
                label="SEO Title"
                name="seoTitle_en"
                placeholder="Store Name - Discounts & Coupons"
              />
              <FormField
                label="SEO Description"
                name="seoDescription_en"
                placeholder="Save money with Store Name coupons and promo codes"
              />
            </FormRow>

            <FormField
              label="Description (English)"
              name="description_en"
              type="textarea"
            />
          </FormSection>

          <FormSection title="Arabic Translation">
            <FormRow>
              <FormField
                label="Name (Arabic)"
                name="name_ar"
                required
                dir="rtl"
              />
              <FormField
                label="Slug (Arabic)"
                name="slug_ar"
                required
                dir="rtl"
              />
            </FormRow>

            <FormRow>
              <FormField
                label="SEO Title (Arabic)"
                name="seoTitle_ar"
                dir="rtl"
                placeholder="اسم المتجر - خصومات وكوبونات"
              />
              <FormField
                label="SEO Description (Arabic)"
                name="seoDescription_ar"
                dir="rtl"
                placeholder="وفر المال مع كوبونات وعروض اسم المتجر"
              />
            </FormRow>

            <FormField
              label="Description (Arabic)"
              name="description_ar"
              type="textarea"
              dir="rtl"
            />
          </FormSection>

          <FormSection title="Countries & Categories">
            <FormRow>
              <div className={styles.formGroup}>
                <label>Countries</label>
                {countries.map(country => (
                  <div key={country.id} className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      name="countryIds"
                      value={country.id}
                      id={`country-${country.id}`}
                      defaultChecked={country.isDefault}
                    />
                    <label htmlFor={`country-${country.id}`}>
                      {country.flag} {country.name}
                    </label>
                  </div>
                ))}
              </div>

              <div className={styles.formGroup}>
                <label>Categories</label>
                {categories.map(category => (
                  <div key={category.id} className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={category.id}
                      id={`category-${category.id}`}
                    />
                    <label htmlFor={`category-${category.id}`}>
                      {category.icon} {category.translations?.[0]?.name || `Category ${category.id}`}
                    </label>
                  </div>
                ))}
              </div>
            </FormRow>
          </FormSection>

          <FormSection title="Settings">
            <FormField
              label="Active"
              name="isActive"
              type="checkbox"
              defaultChecked={true}
              helpText="Store is visible to users"
            />
            <FormField
              label="Featured"
              name="isFeatured"
              type="checkbox"
              helpText="Highlight in featured sections"
            />
          </FormSection>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Store'}
            </button>
            <button 
              type="button"
              onClick={() => router.push('/admin/stores')}
              className={styles.btnSecondary}
              disabled={isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showCreate && (
        <DataTable
          data={stores}
          columns={[
            { 
              key: 'id', 
              label: 'ID',
              sortable: true 
            },
            { 
              key: 'logo', 
              label: 'Logo',
              sortable: false,
              render: (logo) => logo ? (
                <img src={logo} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6 }} />
              ) : '—'
            },
            { 
              key: 'translations', 
              label: 'Name',
              render: (trans) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{trans?.[0]?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{trans?.[0]?.slug}</div>
                </div>
              )
            },
            { 
              key: 'countries', 
              label: 'Countries',
              sortable: false,
              render: (countries) => (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {countries?.map(sc => (
                    <span 
                      key={sc.country?.id}
                      className={styles.badge}
                      style={{ background: '#e9ecef', color: '#495057' }}
                    >
                      {sc.country?.code}
                    </span>
                  ))}
                </div>
              )
            },
            { 
              key: '_count.vouchers', 
              label: 'Vouchers',
              sortable: true
            },
            { 
              key: 'isActive', 
              label: 'Status',
              render: (active) => (
                <span className={active ? styles.badgeSuccess : styles.badgeDanger}>
                  {active ? 'Active' : 'Inactive'}
                </span>
              )
            }
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}