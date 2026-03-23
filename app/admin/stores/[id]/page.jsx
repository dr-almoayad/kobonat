// app/admin/stores/[id]/page.jsx

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
  updateOtherPromo,
  deleteOtherPromo,
} from '../../_lib/actions';
import { FormField, FormRow, FormSection } from '../../_components/FormField';
import { DataTable } from '../../_components/DataTable';
import styles from '../../admin.module.css';
import StorePaymentMethods from './StorePaymentMethods';
import ProductsSection from './products/ProductsSection';
import OtherPromosTab from '@/components/admin/OtherPromosTab/OtherPromosTab';
import OfferStacksTab from '@/components/admin/OfferStacksTab/OfferStacksTab';

export default function StoreEditPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'basic';

  // Data States
  const [store,             setStore]             = useState(null);
  const [products,          setProducts]          = useState([]);
  const [allCountries,      setAllCountries]      = useState([]);
  const [allCategories,     setAllCategories]     = useState([]);
  const [allPaymentMethods, setAllPaymentMethods] = useState([]);
  const [allBanks,          setAllBanks]          = useState([]);   // ← new
  const [otherPromos,       setOtherPromos]       = useState([]);
  const [editingFAQ,        setEditingFAQ]        = useState(null);
  const [showFAQForm,       setShowFAQForm]       = useState(false);

  // Bank/card cascade state for Other Promos form
  const [selectedBankId,    setSelectedBankId]    = useState('');
  const [bankCards,         setBankCards]         = useState([]);

  // UI States
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [isPending,  startTransition] = useTransition();

  const [selectedCountries,  setSelectedCountries]  = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  function getOfferTypeIcon(type) {
    const icons = {
      CODE: 'confirmation_number', DEAL: 'local_fire_department',
      DISCOUNT: 'sell', FREE_SHIPPING: 'local_shipping',
      CASHBACK: 'attach_money', OFFER: 'redeem',
    };
    return icons[type] || 'redeem';
  }

  function getOfferTypeGradient(type) {
    const gradients = {
      CODE: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      DEAL: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      DISCOUNT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      FREE_SHIPPING: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      CASHBACK: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      OFFER: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    };
    return gradients[type] || gradients.OFFER;
  }

  // ── Fetch all page data ─────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');

        const [storeRes, countriesRes, categoriesRes, pmRes, productsRes, promosRes, banksRes] =
          await Promise.all([
            fetch(`/api/admin/stores/${id}?locale=en`),
            fetch('/api/admin/countries?locale=en'),
            fetch('/api/admin/categories?locale=en'),
            fetch('/api/admin/payment-methods?locale=en'),
            fetch(`/api/admin/stores/${id}/products?locale=en`),
            fetch(`/api/admin/stores/${id}/other-promos?locale=en`),
            fetch('/api/admin/banks?locale=en'),              // ← new
          ]);

        if (!storeRes.ok) throw new Error(`Store fetch failed: ${storeRes.status}`);

        const storeData     = await storeRes.json();
        const countriesData = await countriesRes.json();
        const categoriesData = await categoriesRes.json();
        const pmData        = await pmRes.json();
        const productsData  = productsRes.ok ? await productsRes.json() : { products: [] };
        const banksData     = banksRes.ok    ? await banksRes.json()    : [];  // ← new

        if (promosRes.ok) {
          const promosData = await promosRes.json();
          setOtherPromos(promosData.promos || []);
        }

        setStore(storeData);
        setAllCountries(countriesData.countries || []);
        setAllCategories(categoriesData || []);
        setAllPaymentMethods(pmData.paymentMethods || []);
        setProducts(productsData.products || []);
        setAllBanks(Array.isArray(banksData) ? banksData : []);  // ← new

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

  // ── When bank picker changes, load that bank's cards ────────────────────────
  async function handleBankChange(bankId) {
    setSelectedBankId(bankId);
    setBankCards([]);
    if (!bankId) return;
    try {
      const res  = await fetch(`/api/admin/banks/${bankId}/cards`);
      const data = res.ok ? await res.json() : [];
      setBankCards(Array.isArray(data) ? data : []);
    } catch {
      setBankCards([]);
    }
  }

  // ── Country/Category handlers (unchanged) ───────────────────────────────────
  const handleCategoryChange = (categoryId, isChecked) => {
    setSelectedCategories(prev =>
      isChecked ? [...prev, categoryId] : prev.filter(i => i !== categoryId)
    );
  };
  const handleCountryChange = (countryId, isChecked) => {
    setSelectedCountries(prev =>
      isChecked ? [...prev, countryId] : prev.filter(i => i !== countryId)
    );
  };

  const handleApplyCategories = async () => {
    startTransition(async () => {
      const formData = new FormData();
      selectedCategories.forEach(id => formData.append('categoryIds', id.toString()));
      const result = await updateStoreCategories(store.id, formData);
      if (result.success) {
        setStore(prev => ({ ...prev, categories: selectedCategories.map(id => ({ categoryId: id, storeId: store.id })) }));
        alert('Categories updated successfully!');
      } else {
        alert('Failed to update categories: ' + (result.error || 'Unknown error'));
      }
    });
  };

  const handleApplyCountries = async () => {
    startTransition(async () => {
      const formData = new FormData();
      selectedCountries.forEach(id => formData.append('countryIds', id.toString()));
      const result = await updateStoreCountries(store.id, formData);
      if (result.success) {
        setStore(prev => ({ ...prev, countries: selectedCountries.map(id => ({ countryId: id, storeId: store.id })) }));
        alert('Countries updated successfully!');
      } else {
        alert('Failed to update countries: ' + (result.error || 'Unknown error'));
      }
    });
  };

  if (loading) return <div className={styles.loading}>Loading Store Data...</div>;
  if (error || !store) return <div className={styles.errorCard}><h3>Error</h3><p>{error}</p></div>;

  const enTranslation = store.translations?.find(t => t.locale === 'en') || {};
  const arTranslation = store.translations?.find(t => t.locale === 'ar') || {};

  const categoriesChanged = JSON.stringify(selectedCategories.sort()) !==
    JSON.stringify(store.categories?.map(c => c.categoryId).sort() || []);
  const countriesChanged = JSON.stringify(selectedCountries.sort()) !==
    JSON.stringify(store.countries?.map(c => c.countryId).sort() || []);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Edit Store: {enTranslation.name || `Store #${id}`}</h1>
        <button onClick={() => router.push('/admin/stores')} className={styles.btnSecondary}>← Back</button>
        <button onClick={() => router.push(`/admin/stores/${id}/intelligence`)} className={styles.btnPrimary}>Intelligence</button>
        <button onClick={() => router.push(`/admin/stores/${id}/offers`)} className={styles.btnPrimary}>Offers</button>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        {[
          { id: 'basic',           label: 'Basic Info' },
          { id: 'translations',    label: 'Translations' },
          { id: 'countries',       label: 'Countries' },
          { id: 'categories',      label: 'Categories' },
          { id: 'products',        label: 'Products' },
          { id: 'other-promos',    label: 'Other Promos' },
          { id: 'offer-stacks',    label: 'Offer Stacks' },
          { id: 'payment-methods', label: 'Payments' },
          { id: 'faqs',            label: 'FAQs' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => router.push(`/admin/stores/${id}?tab=${t.id}`)}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
          >
            {t.label}
            {t.id === 'categories' && categoriesChanged && ' *'}
            {t.id === 'countries'  && countriesChanged  && ' *'}
          </button>
        ))}
      </div>

      {/* ── BASIC INFO ────────────────────────────────────────────────────────── */}
      {tab === 'basic' && (
        <form action={(formData) => startTransition(async () => {
          const result = await updateStore(store.id, formData);
          if (result.success) {
            setStore(prev => ({
              ...prev,
              logo: formData.get('logo') || prev.logo,
              bigLogo: formData.get('bigLogo') || prev.bigLogo,
              coverImage: formData.get('coverImage') || prev.coverImage,
              backgroundImage: formData.get('backgroundImage') || prev.backgroundImage,
              color: formData.get('color') || prev.color,
              websiteUrl: formData.get('websiteUrl') || prev.websiteUrl,
              affiliateNetwork: formData.get('affiliateNetwork') || prev.affiliateNetwork,
              trackingUrl: formData.get('trackingUrl') || prev.trackingUrl,
              isActive: formData.has('isActive') ? formData.get('isActive') === 'on' : prev.isActive,
              isFeatured: formData.has('isFeatured') ? formData.get('isFeatured') === 'on' : prev.isFeatured,
              showOfferType: formData.get('showOfferType') || prev.showOfferType,
            }));
            router.refresh();
            alert('Store updated successfully!');
          } else {
            alert('Failed to update store: ' + result.error);
          }
        })} className={styles.form}>
          <FormSection title="Store Visuals">
            <FormRow>
              <FormField label="Logo URL"     name="logo"    defaultValue={store.logo} />
              <FormField label="Big Logo URL" name="bigLogo" defaultValue={store.bigLogo} />
              <FormField
                label="Hero Slot (1–5)" name="color" type="select"
                defaultValue={store.color}
                helpText="Pin to homepage hero. Leave empty to exclude."
                options={[
                  { value: '',  label: '— Not in hero —' },
                  { value: '1', label: 'Slot 1' },
                  { value: '2', label: 'Slot 2' },
                  { value: '3', label: 'Slot 3' },
                  { value: '4', label: 'Slot 4' },
                  { value: '5', label: 'Slot 5' },
                ]}
              />
            </FormRow>
            <FormRow>
              <FormField label="Cover Image URL"      name="coverImage"      defaultValue={store.coverImage} />
              <FormField label="Background Image URL" name="backgroundImage" defaultValue={store.backgroundImage} />
            </FormRow>
          </FormSection>

          <FormSection title="Core Details">
            <FormField label="Website URL" name="websiteUrl" type="url" defaultValue={store.websiteUrl} required />
            <FormRow>
              <FormField label="Affiliate Network" name="affiliateNetwork" defaultValue={store.affiliateNetwork} />
              <FormField label="Tracking URL"      name="trackingUrl"      defaultValue={store.trackingUrl} />
            </FormRow>
            <FormRow>
              <FormField label="Active"   name="isActive"   type="checkbox" defaultValue={store.isActive} />
              <FormField label="Featured" name="isFeatured" type="checkbox" defaultValue={store.isFeatured} />
            </FormRow>
          </FormSection>

          <FormSection title="Show Offer Badge">
            <FormField
              label="Show Offer Type" name="showOfferType" type="select"
              defaultValue={store.showOfferType}
              options={[
                { value: '',             label: '-- None --' },
                { value: 'CODE',         label: '💳 Code' },
                { value: 'DEAL',         label: '🔥 Deal' },
                { value: 'DISCOUNT',     label: '💰 Discount' },
                { value: 'FREE_SHIPPING',label: '📦 Free Shipping' },
                { value: 'CASHBACK',     label: '💵 Cashback' },
                { value: 'OFFER',        label: '🎁 Special Offer' },
              ]}
              helpText="Badge shown on store card."
            />
            {store.showOfferType && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#64748b' }}>Preview:</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 20, color: '#fff', fontSize: '0.875rem', fontWeight: 600, background: getOfferTypeGradient(store.showOfferType) }}>
                  <span className="material-symbols-sharp" style={{ fontSize: '1.125rem' }}>{getOfferTypeIcon(store.showOfferType)}</span>
                  <span>{store.showOfferType}</span>
                </div>
              </div>
            )}
          </FormSection>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>Save Changes</button>
          </div>
        </form>
      )}

      {/* ── TRANSLATIONS ──────────────────────────────────────────────────────── */}
      {tab === 'translations' && (
        <form action={(formData) => startTransition(async () => {
          const result = await updateStore(store.id, formData);
          if (result.success) {
            router.refresh();
            alert('Translations updated successfully!');
          } else {
            alert('Failed to update translations: ' + result.error);
          }
        })} className={styles.form}>
          <FormRow>
            <FormSection title="English (EN)">
              <FormField label="Name"  name="name_en"  defaultValue={enTranslation.name}  required />
              <FormField label="Slug"  name="slug_en"  defaultValue={enTranslation.slug}  required />
              <FormField label="Description" name="description_en" type="textarea" defaultValue={enTranslation.description} />
              <FormField label="Show Offer Text (English)" name="showOffer_en" defaultValue={enTranslation.showOffer} placeholder="Get 15% off all orders + free shipping" helpText="Appears below logo on cards." />
              <FormField label="SEO Title"       name="seoTitle_en"       defaultValue={enTranslation.seoTitle} />
              <FormField label="SEO Description" name="seoDescription_en" type="textarea" rows={3} defaultValue={enTranslation.seoDescription} />
            </FormSection>
            <FormSection title="Arabic (AR)">
              <FormField label="Name"  name="name_ar"  defaultValue={arTranslation.name}  required dir="rtl" />
              <FormField label="Slug"  name="slug_ar"  defaultValue={arTranslation.slug}  required dir="rtl" />
              <FormField label="Description" name="description_ar" type="textarea" defaultValue={arTranslation.description} dir="rtl" />
              <FormField label="Show Offer Text (Arabic)" name="showOffer_ar" defaultValue={arTranslation.showOffer} dir="rtl" />
              <FormField label="SEO Title"       name="seoTitle_ar"       defaultValue={arTranslation.seoTitle}       dir="rtl" />
              <FormField label="SEO Description" name="seoDescription_ar" type="textarea" rows={3} defaultValue={arTranslation.seoDescription} dir="rtl" />
            </FormSection>
          </FormRow>
          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary}>Update Translations</button>
          </div>
        </form>
      )}

      {/* ── COUNTRIES ─────────────────────────────────────────────────────────── */}
      {tab === 'countries' && (
        <div className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Target Countries</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {countriesChanged && <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>⚠️ Unsaved changes</span>}
              <button onClick={handleApplyCountries} className={styles.btnPrimary} disabled={isPending || !countriesChanged} style={{ opacity: !countriesChanged ? 0.5 : 1 }}>
                {isPending ? 'Applying…' : 'Apply Changes'}
              </button>
            </div>
          </div>
          <div className={styles.checkboxGrid}>
            {allCountries.map(country => (
              <label key={country.id} className={styles.checkboxLabel}>
                <input type="checkbox" checked={selectedCountries.includes(country.id)} onChange={e => handleCountryChange(country.id, e.target.checked)} />
                {country.flag} {country.translations[0]?.name}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            Selected: {selectedCountries.length} / {allCountries.length} countries
          </div>
        </div>
      )}

      {/* ── CATEGORIES ────────────────────────────────────────────────────────── */}
      {tab === 'categories' && (
        <div className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Store Categories</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {categoriesChanged && <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>⚠️ Unsaved changes</span>}
              <button onClick={handleApplyCategories} className={styles.btnPrimary} disabled={isPending || !categoriesChanged} style={{ opacity: !categoriesChanged ? 0.5 : 1 }}>
                {isPending ? 'Applying…' : 'Apply Changes'}
              </button>
            </div>
          </div>
          <div className={styles.checkboxGrid}>
            {allCategories.map(cat => (
              <label key={cat.id} className={styles.checkboxLabel}>
                <input type="checkbox" checked={selectedCategories.includes(cat.id)} onChange={e => handleCategoryChange(cat.id, e.target.checked)} />
                {cat.translations[0]?.name}
                {/* Show niche badge so admin can see which categories are bank niches */}
                {cat.bankScoringWeights && Object.keys(cat.bankScoringWeights).length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px', borderRadius: 8, background: '#dbeafe', color: '#1d4ed8', fontWeight: 600 }}>niche</span>
                )}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            Selected: {selectedCategories.length} / {allCategories.length} categories
          </div>
        </div>
      )}

      {/* ── PRODUCTS ──────────────────────────────────────────────────────────── */}
      {tab === 'products' && (
        <ProductsSection storeId={store.id} products={products} />
      )}

      {tab === 'other-promos' && (
        <OtherPromosTab
          storeId={store.id}
          allCountries={allCountries}
          allBanks={allBanks}
          allPaymentMethods={allPaymentMethods}
        />
      )}

      {/* ── OFFER STACKS ──────────────────────────────────────────────────────── */}
      {tab === 'offer-stacks' && (
        <OfferStacksTab storeId={store.id} />
      )}
      
      {/* ── PAYMENT METHODS ───────────────────────────────────────────────────── */}
      {tab === 'payment-methods' && (
        <StorePaymentMethods store={store} countries={allCountries} paymentMethods={allPaymentMethods} />
      )}

      {/* ── FAQS ──────────────────────────────────────────────────────────────── */}
      {tab === 'faqs' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Store FAQs ({store.faqs?.length || 0})</h2>
            {!showFAQForm && (
              <button onClick={() => { setShowFAQForm(true); setEditingFAQ(null); }} className={styles.btnPrimary}>
                + Add FAQ
              </button>
            )}
          </div>

          {showFAQForm && (
            <form action={(formData) => startTransition(async () => {
              if (editingFAQ) formData.append('faqId', editingFAQ.id);
              const result = await upsertFAQ(formData);
              if (result.success) {
                setShowFAQForm(false);
                setEditingFAQ(null);
                router.refresh();
                alert(editingFAQ ? 'FAQ updated!' : 'FAQ created!');
              } else {
                alert(result.error || 'Failed to save FAQ');
              }
            })} className={styles.form}>
              <FormSection title={editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}>
                <input type="hidden" name="storeId" value={store.id} />
                <FormRow>
                  <FormField label="Country" name="countryId" type="select" defaultValue={editingFAQ?.countryId} options={allCountries.map(c => ({ label: `${c.flag || ''} ${c.translations[0]?.name || c.code}`, value: c.id }))} required />
                  <FormField label="Display Order" name="order" type="number" defaultValue={editingFAQ?.order || 0} helpText="Lower = first" />
                </FormRow>
                <FormField label="Active" name="isActive" type="checkbox" defaultValue={editingFAQ?.isActive ?? true} />
                <FormRow>
                  <FormField label="Question (English)" name="question_en" defaultValue={editingFAQ?.translations?.find(t => t.locale === 'en')?.question} required />
                  <FormField label="Question (Arabic)"  name="question_ar" defaultValue={editingFAQ?.translations?.find(t => t.locale === 'ar')?.question} required dir="rtl" />
                </FormRow>
                <FormField label="Answer (English)" name="answer_en" type="textarea" rows={5} defaultValue={editingFAQ?.translations?.find(t => t.locale === 'en')?.answer} required />
                <FormField label="Answer (Arabic)"  name="answer_ar" type="textarea" rows={5} defaultValue={editingFAQ?.translations?.find(t => t.locale === 'ar')?.answer} required dir="rtl" />
                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary} disabled={isPending}>
                    {isPending ? 'Saving…' : editingFAQ ? 'Update FAQ' : 'Create FAQ'}
                  </button>
                  <button type="button" onClick={() => { setShowFAQForm(false); setEditingFAQ(null); }} className={styles.btnSecondary} disabled={isPending}>
                    Cancel
                  </button>
                </div>
              </FormSection>
            </form>
          )}

          {!showFAQForm && store.faqs?.length > 0 ? (
            <DataTable
              data={store.faqs}
              columns={[
                { key: 'id', label: 'ID', sortable: true },
                { key: 'country', label: 'Country', render: (c) => `${c?.flag || '🌍'} ${c?.translations?.[0]?.name || c?.code || '—'}` },
                {
                  key: 'translations', label: 'Question',
                  render: (trans) => {
                    const en = trans?.find(t => t.locale === 'en')?.question;
                    const ar = trans?.find(t => t.locale === 'ar')?.question;
                    return (
                      <div>
                        <div style={{ fontWeight: 500 }}>{en || '—'}</div>
                        {ar && <div style={{ fontSize: 12, color: '#666', direction: 'rtl', marginTop: 2 }}>{ar}</div>}
                      </div>
                    );
                  },
                },
                { key: 'order', label: 'Order', sortable: true, render: (o) => <span className={styles.badge}>#{o}</span> },
                { key: 'isActive', label: 'Status', sortable: true, render: (v) => <span className={v ? styles.badgeSuccess : styles.badgeDanger}>{v ? 'Active' : 'Inactive'}</span> },
              ]}
              onEdit={(faqId) => {
                const faq = store.faqs.find(f => f.id === faqId);
                if (faq) { setEditingFAQ(faq); setShowFAQForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
              }}
              onDelete={async (faqId) => {
                if (!confirm('Delete this FAQ?')) return;
                startTransition(async () => {
                  const fd = new FormData();
                  fd.append('id', faqId);
                  fd.append('storeId', store.id);
                  const result = await deleteFAQ(fd);
                  if (result.success) { router.refresh(); } else { alert(result.error || 'Failed to delete FAQ'); }
                });
              }}
            />
          ) : !showFAQForm ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-sharp" style={{ fontSize: 48, color: '#ccc' }}>help_outline</span>
              <p>No FAQs yet. Click "Add FAQ" to get started.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
