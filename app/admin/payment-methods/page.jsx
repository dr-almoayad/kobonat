// app/admin/payment-methods/page.jsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { upsertPaymentMethod, deletePaymentMethod } from '@/app/admin/_lib/actions'; // Adjust path if needed
import { FormField, FormRow, FormSection } from '@/app/admin/_components/FormField';
import styles from '@/app/admin/admin.module.css';

export default function PaymentMethodsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCreate = searchParams.get('create') === 'true';
  const editId = searchParams.get('edit');

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/payment-methods?locale=en');
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Handle Edit Mode
  useEffect(() => {
    if (editId && paymentMethods.length > 0) {
      const method = paymentMethods.find(m => m.id === parseInt(editId));
      setEditing(method || null);
    } else {
      setEditing(null);
    }
  }, [editId, paymentMethods]);

  // Handle Form Submit
  async function handleSubmit(formData) {
    if (editId) {
      formData.append('id', editId); // Critical: Append ID for update action
    }
    
    startTransition(async () => {
      const result = await upsertPaymentMethod(formData);
      if (result.success) {
        // Refresh local data
        const res = await fetch('/api/admin/payment-methods?locale=en');
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
        
        router.push('/admin/payment-methods'); // Close form
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  // Handle Delete
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    startTransition(async () => {
      const result = await deletePaymentMethod(id);
      if (result.error) {
        alert(result.error);
      } else {
        setPaymentMethods(prev => prev.filter(p => p.id !== id));
      }
    });
  }

  const enTranslation = editing?.translations?.find(t => t.locale === 'en') || {};
  const arTranslation = editing?.translations?.find(t => t.locale === 'ar') || {};

  // Grouping for display
  const groupedMethods = {
    BNPL: paymentMethods.filter(p => p.isBnpl),
    CARD: paymentMethods.filter(p => p.type === 'CARD' && !p.isBnpl),
    OTHER: paymentMethods.filter(p => !p.isBnpl && p.type !== 'CARD')
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Payment Methods</h1>
        <button 
          onClick={() => router.push(showCreate || editId ? '/admin/payment-methods' : '?create=true')}
          className={styles.btnPrimary}
          disabled={isPending}
        >
          {showCreate || editId ? '✕ Cancel' : '+ Add Payment Method'}
        </button>
      </div>

      {(showCreate || editId) && (
        // KEY prop forces re-render when switching edit targets, fixing defaultValue issues
        <form key={editId || 'new'} action={handleSubmit} className={styles.form}>
          <FormSection title={editId ? `Edit: ${enTranslation.name}` : "New Payment Method"}>
            <FormRow>
              <FormField
                label="Slug (Unique)"
                name="slug"
                required
                defaultValue={editing?.slug || ''}
                placeholder="tabby, tamara, visa"
              />
              <FormField
                label="Type"
                name="type"
                type="select"
                required
                defaultValue={editing?.type || 'CARD'}
                options={[
                  { value: 'CARD', label: 'Card (Credit/Debit)' },
                  { value: 'BNPL', label: 'Buy Now Pay Later' },
                  { value: 'COD', label: 'Cash on Delivery' },
                  { value: 'WALLET', label: 'Digital Wallet' },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
                ]}
              />
            </FormRow>

            <FormField
              label="Logo URL"
              name="logo"
              defaultValue={editing?.logo || ''}
              placeholder="https://example.com/logo.png"
            />
          </FormSection>

          <FormSection title="Translations">
            <FormRow>
              <FormField label="Name (EN)" name="name_en" required defaultValue={enTranslation.name || ''} />
              <FormField label="Name (AR)" name="name_ar" required dir="rtl" defaultValue={arTranslation.name || ''} />
            </FormRow>
            <FormRow>
              <FormField label="Desc (EN)" name="description_en" type="textarea" rows={2} defaultValue={enTranslation.description || ''} />
              <FormField label="Desc (AR)" name="description_ar" type="textarea" rows={2} dir="rtl" defaultValue={arTranslation.description || ''} />
            </FormRow>
          </FormSection>

          <FormSection title="Settings">
            <FormField
              label="Is Buy Now Pay Later (BNPL)?"
              name="isBnpl"
              type="checkbox"
              defaultChecked={editing?.isBnpl}
            />
          </FormSection>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* List View */}
      {!showCreate && !editId && Object.entries(groupedMethods).map(([key, methods]) => (
        methods.length > 0 && (
          <div key={key} style={{ marginBottom: 30 }}>
            <h3 className={styles.sectionTitle}>{key}</h3>
            <div className={styles.grid}>
              {methods.map(method => {
                 const name = method.translations?.find(t => t.locale === 'en')?.name || method.slug;
                 return (
                  <div key={method.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      {method.logo && <img src={method.logo} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />}
                      <div>
                        <h4>{name}</h4>
                        <span className={styles.badge}>{method.type}</span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button onClick={() => router.push(`?edit=${method.id}`)} className={styles.btnEdit}>Edit</button>
                      <button onClick={() => handleDelete(method.id)} className={styles.btnDelete}>Delete</button>
                    </div>
                  </div>
                 );
              })}
            </div>
          </div>
        )
      ))}
    </div>
  );
}