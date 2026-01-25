'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  updateStore, 
  updateStoreCountries, 
  updateStoreCategories,
  upsertFAQ,
  deleteFAQ,
  createOtherPromo
} from '../../_lib/actions';
import { FormField, FormRow, FormSection } from '../../_components/FormField';
import { DataTable } from '../../_components/DataTable';
import styles from '../../admin.module.css';
import StorePaymentMethods from './StorePaymentMethods';
import ProductsSection from './products/ProductsSection';

export default function StoreEditPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'basic';
  
  // Data States
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allPaymentMethods, setAllPaymentMethods] = useState([]);
  const [otherPromos, setOtherPromos] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        
        const [storeRes, countriesRes, categoriesRes, pmRes, productsRes, promosRes] = await Promise.all([
          fetch(`/api/admin/stores/${id}?locale=en`),
          fetch('/api/admin/countries?locale=en'),
          fetch('/api/admin/categories?locale=en'),
          fetch('/api/admin/payment-methods?locale=en'),
          fetch(`/api/admin/stores/${id}/products?locale=en`),
          fetch(`/api/admin/stores/${id}/other-promos?locale=en`)
        ]);



        // Validate responses before parsing to avoid JSON error
        if (!storeRes.ok) throw new Error(`Store fetch failed: ${storeRes.status}`);
        
        const storeData = await storeRes.json();
        const countriesData = await countriesRes.json();
        const categoriesData = await categoriesRes.json();
        const pmData = await pmRes.json();
        
        // Products might return 404 if route isn't created yet, handle gracefully
        let productsData = { products: [] };
        if (productsRes.ok) {
          productsData = await productsRes.json();
        }

        if (promosRes.ok) {
          const promosData = await promosRes.json();
          setOtherPromos(promosData.promos || []);
        }

        setStore(storeData);
        setAllCountries(countriesData.countries || []);
        setAllCategories(categoriesData || []);
        setAllPaymentMethods(pmData.paymentMethods || []);
        setProducts(productsData.products || []);

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className={styles.loading}>Loading Store Data...</div>;
  if (error || !store) return <div className={styles.errorCard}><h3>Error</h3><p>{error}</p></div>;

  const enTranslation = store.translations?.find(t => t.locale === 'en') || {};
  const arTranslation = store.translations?.find(t => t.locale === 'ar') || {};

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Edit Store: {enTranslation.name || `Store #${id}`}</h1>
        <button onClick={() => router.push('/admin/stores')} className={styles.btnSecondary}>← Back</button>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabs}>
        {[
          { id: 'basic', label: 'Basic Info' },
          { id: 'translations', label: 'Translations' },
          { id: 'countries', label: 'Countries' },
          { id: 'categories', label: 'Categories' },
          { id: 'products', label: 'Products' },
          { id: 'other-promos', label: 'Other Promos' },
          { id: 'payment-methods', label: 'Payments' },
          { id: 'faqs', label: 'FAQs' }
        ].map((t) => (
          <button 
            key={t.id}
            onClick={() => router.push(`/admin/stores/${id}?tab=${t.id}`)}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* BASIC INFO */}
      {tab === 'basic' && (
        <form action={(formData) => startTransition(async () => {
          const result = await updateStore(store.id, formData);
          if (result.success) router.refresh();
        })} className={styles.form}>
          <FormSection title="Store Visuals">
            <FormRow>
              <FormField label="Logo URL" name="logo" defaultValue={store.logo} />
              <FormField label="Brand Color" name="color" type="color" defaultValue={store.color} />
            </FormRow>
            <FormRow>
              <FormField 
                label="Cover Image URL" 
                name="coverImage" 
                defaultValue={store.coverImage} 
                helpText="Main banner image for the store page"
              />
              <FormField 
                label="Background Image URL" 
                name="backgroundImage" 
                defaultValue={store.backgroundImage} 
                helpText="Background pattern or image"
              />
            </FormRow>
          </FormSection>

          <FormSection title="Core Details">
            <FormField label="Website URL" name="websiteUrl" type="url" defaultValue={store.websiteUrl} required />
            <FormRow>
              <FormField label="Affiliate Network" name="affiliateNetwork" defaultValue={store.affiliateNetwork} />
              <FormField label="Tracking URL" name="trackingUrl" defaultValue={store.trackingUrl} />
            </FormRow>
            <FormRow>
              <FormField label="Active" name="isActive" type="checkbox" defaultValue={store.isActive} />
              <FormField label="Featured" name="isFeatured" type="checkbox" defaultValue={store.isFeatured} />
            </FormRow>
          </FormSection>
          
          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>Save Changes</button>
          </div>
        </form>
      )}

      {/* TRANSLATIONS */}
      {tab === 'translations' && (
        <form action={(formData) => startTransition(async () => {
          await updateStore(store.id, formData);
          router.refresh();
        })} className={styles.form}>
          <FormRow>
            <FormSection title="English (EN)">
              <FormField label="Name" name="name_en" defaultValue={enTranslation.name} required />
              <FormField label="Slug" name="slug_en" defaultValue={enTranslation.slug} required />
              <FormField label="Description" name="description_en" type="textarea" defaultValue={enTranslation.description} />
            </FormSection>
            <FormSection title="Arabic (AR)">
              <FormField label="Name" name="name_ar" defaultValue={arTranslation.name} required dir="rtl" />
              <FormField label="Slug" name="slug_ar" defaultValue={arTranslation.slug} required dir="rtl" />
              <FormField label="Description" name="description_ar" type="textarea" defaultValue={arTranslation.description} dir="rtl" />
            </FormSection>
          </FormRow>
          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary}>Update Translations</button>
          </div>
        </form>
      )}

      {/* COUNTRIES */}
      {tab === 'countries' && (
        <div className={styles.section}>
          <h3>Target Countries</h3>
          <div className={styles.checkboxGrid}>
            {allCountries.map(country => (
              <label key={country.id} className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  defaultChecked={store.countries?.some(c => c.countryId === country.id)}
                  onChange={async (e) => {
                    const currentIds = store.countries.map(c => c.countryId);
                    const newIds = e.target.checked 
                      ? [...currentIds, country.id] 
                      : currentIds.filter(id => id !== country.id);
                    await updateStoreCountries(store.id, newIds);
                  }}
                />
                {country.flag} {country.translations[0]?.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      {tab === 'categories' && (
        <div className={styles.section}>
          <h3>Store Categories</h3>
          <div className={styles.checkboxGrid}>
            {allCategories.map(cat => (
              <label key={cat.id} className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  defaultChecked={store.categories?.some(c => c.categoryId === cat.id)}
                  onChange={async (e) => {
                    const currentIds = store.categories.map(c => c.categoryId);
                    const newIds = e.target.checked 
                      ? [...currentIds, cat.id] 
                      : currentIds.filter(id => id !== cat.id);
                    await updateStoreCategories(store.id, newIds);
                  }}
                />
                {cat.translations[0]?.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {tab === 'products' && (
        <ProductsSection storeId={store.id} products={products} />
      )}


      {/* OTHER PROMOS */}
      {tab === 'other-promos' && (
        <div className={styles.section}>
          <form action={(formData) => startTransition(async () => {
            const result = await createOtherPromo(formData);
            if (result.success) router.refresh();
          })} className={styles.form}>
            <FormSection title="Add Other Promo">
              <input type="hidden" name="storeId" value={store.id} />
              <FormRow>
                <FormField 
                  label="Country" 
                  name="countryId" 
                  type="select" 
                  options={allCountries.map(c => ({ 
                    label: c.translations[0]?.name, 
                    value: c.id 
                  }))} 
                  required 
                />
                <FormField 
                  label="Type" 
                  name="type" 
                  type="select" 
                  options={[
                    { label: 'Bank Offer', value: 'BANK_OFFER' },
                    { label: 'Card Offer', value: 'CARD_OFFER' },
                    { label: 'Payment Offer', value: 'PAYMENT_OFFER' },
                    { label: 'Seasonal', value: 'SEASONAL' },
                    { label: 'Bundle', value: 'BUNDLE' },
                    { label: 'Other', value: 'OTHER' }
                  ]} 
                  required 
                />
              </FormRow>
              <FormRow>
                <FormField label="Image URL" name="image" />
                <FormField label="External URL" name="url" type="url" />
              </FormRow>
              <FormRow>
                <FormField label="Start Date" name="startDate" type="date" />
                <FormField label="Expiry Date" name="expiryDate" type="date" />
              </FormRow>
              <FormRow>
                <FormField label="Order" name="order" type="number" defaultValue="0" />
                <FormField label="Active" name="isActive" type="checkbox" defaultValue={true} />
              </FormRow>
              <FormRow>
                <FormField label="Title (EN)" name="title_en" required />
                <FormField label="Title (AR)" name="title_ar" required dir="rtl" />
              </FormRow>
              <FormRow>
                <FormField label="Description (EN)" name="description_en" type="textarea" />
                <FormField label="Description (AR)" name="description_ar" type="textarea" dir="rtl" />
              </FormRow>
              <FormRow>
                <FormField label="Terms (EN)" name="terms_en" type="textarea" />
                <FormField label="Terms (AR)" name="terms_ar" type="textarea" dir="rtl" />
              </FormRow>
              <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                Add Other Promo
              </button>
            </FormSection>
          </form>

          <DataTable
            data={otherPromos || []}
            columns={[
              { 
                key: 'translations', 
                label: 'Title', 
                render: (t) => t?.[0]?.title || '—' 
              },
              { key: 'type', label: 'Type' },
              { 
                key: 'expiryDate', 
                label: 'Expires', 
                render: (date) => date ? new Date(date).toLocaleDateString() : 'No expiry' 
              },
              { 
                key: 'isActive', 
                label: 'Status', 
                render: (val) => val ? 'Active' : 'Inactive' 
              }
            ]}
            onDelete={async (promoId) => {
              await deleteOtherPromo(promoId);
              router.refresh();
            }}
          />
        </div>
      )}

      {/* PAYMENT METHODS */}
      {tab === 'payment-methods' && (
        <StorePaymentMethods 
          store={store} 
          countries={allCountries} 
          paymentMethods={allPaymentMethods} 
        />
      )}

      {/* FAQS */}
      {tab === 'faqs' && (
        <div className={styles.section}>
          <form action={(formData) => startTransition(async () => {
            const result = await upsertFAQ(formData);
            if (result.success) router.refresh();
          })} className={styles.form}>
            <FormSection title="Add FAQ">
              <input type="hidden" name="storeId" value={store.id} />
              <FormRow>
                <FormField label="Country" name="countryId" type="select" options={allCountries.map(c => ({ label: c.translations[0]?.name, value: c.id }))} required />
                <FormField label="Order" name="order" type="number" defaultValue="0" />
              </FormRow>
              <FormRow>
                <FormField label="Question (EN)" name="question_en" required />
                <FormField label="Question (AR)" name="question_ar" required dir="rtl" />
              </FormRow>
              <FormField label="Answer (EN)" name="answer_en" type="textarea" required />
              <FormField label="Answer (AR)" name="answer_ar" type="textarea" required dir="rtl" />
              <button type="submit" className={styles.btnPrimary} disabled={isPending}>Add FAQ</button>
            </FormSection>
          </form>

          <DataTable
            data={store.faqs || []}
            columns={[
              { key: 'country.code', label: 'Country' },
              { key: 'translations', label: 'Question', render: (t) => t?.[0]?.question || '—' },
              { key: 'order', label: 'Order' },
              { key: 'isActive', label: 'Status', render: (val) => val ? 'Active' : 'Inactive' }
            ]}
            onDelete={async (faqId) => {
              const fd = new FormData();
              fd.append('id', faqId);
              fd.append('storeId', store.id);
              await deleteFAQ(fd);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
