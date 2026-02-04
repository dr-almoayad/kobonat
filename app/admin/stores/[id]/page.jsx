'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  updateStore, 
  updateStoreCountries, 
  updateStoreCategories,
  upsertFAQ,
  deleteFAQ,
  createOtherPromo,
  deleteOtherPromo  // ADD THIS IMPORT
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

  // Temporary states for batched updates
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

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

        if (!storeRes.ok) throw new Error(`Store fetch failed: ${storeRes.status}`);
        
        const storeData = await storeRes.json();
        const countriesData = await countriesRes.json();
        const categoriesData = await categoriesRes.json();
        const pmData = await pmRes.json();
        
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

        // Initialize selected states with current store data
        setSelectedCountries(storeData.countries?.map(c => c.countryId) || []);
        setSelectedCategories(storeData.categories?.map(c => c.categoryId) || []);

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchData();
  }, [id]);

  // Handler for category checkbox changes
  const handleCategoryChange = (categoryId, isChecked) => {
    setSelectedCategories(prev => 
      isChecked 
        ? [...prev, categoryId]
        : prev.filter(id => id !== categoryId)
    );
  };

  // Handler for country checkbox changes
  const handleCountryChange = (countryId, isChecked) => {
    setSelectedCountries(prev => 
      isChecked 
        ? [...prev, countryId]
        : prev.filter(id => id !== countryId)
    );
  };

  // Apply categories changes
  // Apply categories changes
const handleApplyCategories = async () => {
  startTransition(async () => {
    try {
      // Create FormData object as expected by the server action
      const formData = new FormData();
      selectedCategories.forEach(categoryId => {
        formData.append('categoryIds', categoryId.toString());
      });
      
      const result = await updateStoreCategories(store.id, formData);
      if (result.success) {
        // Update local store state to reflect changes
        setStore(prev => ({
          ...prev,
          categories: selectedCategories.map(catId => ({
            categoryId: catId,
            storeId: store.id
          }))
        }));
        alert('Categories updated successfully!');
      } else {
        alert('Failed to update categories: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating categories:', err);
      alert('Error updating categories: ' + err.message);
    }
  });
};

// Apply countries changes
const handleApplyCountries = async () => {
  startTransition(async () => {
    try {
      // Create FormData object as expected by the server action
      const formData = new FormData();
      selectedCountries.forEach(countryId => {
        formData.append('countryIds', countryId.toString());
      });
      
      const result = await updateStoreCountries(store.id, formData);
      if (result.success) {
        setStore(prev => ({
          ...prev,
          countries: selectedCountries.map(countryId => ({
            countryId: countryId,
            storeId: store.id
          }))
        }));
        alert('Countries updated successfully!');
      } else {
        alert('Failed to update countries: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating countries:', err);
      alert('Error updating countries: ' + err.message);
    }
  });
};

  if (loading) return <div className={styles.loading}>Loading Store Data...</div>;
  if (error || !store) return <div className={styles.errorCard}><h3>Error</h3><p>{error}</p></div>;

  const enTranslation = store.translations?.find(t => t.locale === 'en') || {};
  const arTranslation = store.translations?.find(t => t.locale === 'ar') || {};

  // Check if there are unsaved changes
  const categoriesChanged = JSON.stringify(selectedCategories.sort()) !== 
    JSON.stringify(store.categories?.map(c => c.categoryId).sort() || []);
  const countriesChanged = JSON.stringify(selectedCountries.sort()) !== 
    JSON.stringify(store.countries?.map(c => c.countryId).sort() || []);

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
            {/* Show indicator for unsaved changes */}
            {t.id === 'categories' && categoriesChanged && ' *'}
            {t.id === 'countries' && countriesChanged && ' *'}
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
        
        {/* ADD THESE SEO FIELDS */}
        <FormField 
          label="SEO Title" 
          name="seoTitle_en" 
          defaultValue={enTranslation.seoTitle}
          placeholder="Store Name - Coupons & Deals"
          helpText="Recommended: 50-60 characters"
        />
        <FormField 
          label="SEO Description" 
          name="seoDescription_en" 
          type="textarea"
          rows={3}
          defaultValue={enTranslation.seoDescription}
          placeholder="Get the best deals and coupons for Store Name..."
          helpText="Recommended: 150-160 characters"
        />
      </FormSection>
      
      <FormSection title="Arabic (AR)">
        <FormField label="Name" name="name_ar" defaultValue={arTranslation.name} required dir="rtl" />
        <FormField label="Slug" name="slug_ar" defaultValue={arTranslation.slug} required dir="rtl" />
        <FormField label="Description" name="description_ar" type="textarea" defaultValue={arTranslation.description} dir="rtl" />
        
        {/* ADD THESE SEO FIELDS */}
        <FormField 
          label="SEO Title" 
          name="seoTitle_ar" 
          defaultValue={arTranslation.seoTitle}
          dir="rtl"
          placeholder="اسم المتجر - كوبونات وعروض"
          helpText="موصى به: 50-60 حرف"
        />
        <FormField 
          label="SEO Description" 
          name="seoDescription_ar" 
          type="textarea"
          rows={3}
          defaultValue={arTranslation.seoDescription}
          dir="rtl"
          placeholder="احصل على أفضل الصفقات والكوبونات لـ اسم المتجر..."
          helpText="موصى به: 150-160 حرف"
        />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Target Countries</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {countriesChanged && (
                <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>
                  ⚠️ You have unsaved changes
                </span>
              )}
              <button 
                onClick={handleApplyCountries}
                className={styles.btnPrimary}
                disabled={isPending || !countriesChanged}
                style={{ opacity: !countriesChanged ? 0.5 : 1 }}
              >
                {isPending ? 'Applying...' : 'Apply Changes'}
              </button>
            </div>
          </div>
          
          <div className={styles.checkboxGrid}>
            {allCountries.map(country => (
              <label key={country.id} className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={selectedCountries.includes(country.id)}
                  onChange={(e) => handleCountryChange(country.id, e.target.checked)}
                />
                {country.flag} {country.translations[0]?.name}
              </label>
            ))}
          </div>
          
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            Selected: {selectedCountries.length} / {allCountries.length} countries
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      {tab === 'categories' && (
        <div className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Store Categories</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {categoriesChanged && (
                <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>
                  ⚠️ You have unsaved changes
                </span>
              )}
              <button 
                onClick={handleApplyCategories}
                className={styles.btnPrimary}
                disabled={isPending || !categoriesChanged}
                style={{ opacity: !categoriesChanged ? 0.5 : 1 }}
              >
                {isPending ? 'Applying...' : 'Apply Changes'}
              </button>
            </div>
          </div>
          
          <div className={styles.checkboxGrid}>
            {allCategories.map(cat => (
              <label key={cat.id} className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat.id)}
                  onChange={(e) => handleCategoryChange(cat.id, e.target.checked)}
                />
                {cat.translations[0]?.name}
              </label>
            ))}
          </div>
          
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            Selected: {selectedCategories.length} / {allCategories.length} categories
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
        if (!confirm('Are you sure you want to delete this promo?')) return;
        
        try {
          const result = await deleteOtherPromo(promoId);
          if (result.success) {
            // Remove the deleted promo from local state
            setOtherPromos(prev => prev.filter(promo => promo.id !== promoId));
            alert('Promo deleted successfully!');
          } else {
            alert('Failed to delete promo: ' + (result.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Error deleting promo:', error);
          alert('Error deleting promo: ' + error.message);
        }
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
