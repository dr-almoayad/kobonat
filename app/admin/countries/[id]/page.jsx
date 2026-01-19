// app/admin/countries/[id]/page.jsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCountry } from '../../_lib/actions';
import { FormField, FormRow, FormSection } from '../../_components/FormField';
import styles from '../../admin.module.css';

export default function EditCountryPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchCountry() {
      try {
        const res = await fetch(`/api/admin/countries/${id}?locale=en`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCountry(data.country);
      } catch (error) {
        console.error('Error fetching country:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCountry();
  }, [id]);

  async function handleSubmit(formData) {
    startTransition(async () => {
      await updateCountry(id, formData);
      router.push('/admin/countries');
      router.refresh();
    });
  }

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  if (!country) {
    return <div className={styles.page}>Country not found</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Edit Country: {country.name}</h1>
        <button 
          onClick={() => router.push('/admin/countries')}
          className={styles.btnSecondary}
        >
          ← Back to Countries
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 30 }}>
        <form action={handleSubmit} className={styles.form}>
          <FormSection title="Country Information">
            <FormRow>
              <FormField
                label="Country Code"
                name="code"
                defaultValue={country.code}
                required
                placeholder="SA, AE, EG"
                maxLength="2"
                pattern="[A-Z]{2}"
                title="Two-letter country code (e.g., SA, AE)"
              />
              <FormField
                label="Currency"
                name="currency"
                defaultValue={country.currency}
                required
                placeholder="SAR, AED, EGP"
                maxLength="3"
                pattern="[A-Z]{3}"
                title="Three-letter currency code (e.g., SAR, AED)"
              />
            </FormRow>

            <FormRow>
              <FormField
                label="Name (English)"
                name="name_en"
                defaultValue={country.name}
                required
              />
              <FormField
                label="Name (Arabic)"
                name="name_ar"
                defaultValue={country.name_ar || ''}
                required
                dir="rtl"
              />
            </FormRow>

            <FormField
              label="Flag Emoji"
              name="flag"
              defaultValue={country.flag || ''}
              placeholder="🇸🇦, 🇦🇪, 🇪🇬"
              helpText="Copy emoji from https://emojipedia.org/flags/"
            />
          </FormSection>

          <FormSection title="Settings">
            <FormField
              label="Active"
              name="isActive"
              type="checkbox"
              defaultChecked={country.isActive}
              helpText="Show this country in the platform"
            />
            <FormField
              label="Default Country"
              name="isDefault"
              type="checkbox"
              defaultChecked={country.isDefault}
              helpText="Set as default country for new users"
            />
          </FormSection>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button"
              onClick={() => router.push('/admin/countries')}
              className={styles.btnSecondary}
              disabled={isPending}
            >
              Cancel
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Statistics</h3>
            <div className={styles.cardContent}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#666' }}>Active Stores</span>
                  <strong style={{ color: '#0070f3' }}>{country._count?.stores || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#666' }}>Active Vouchers</span>
                  <strong style={{ color: '#0070f3' }}>{country._count?.vouchers || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #eee' }}>
                  <span style={{ color: '#666' }}>Status</span>
                  <span className={country.isActive ? styles.badgeSuccess : styles.badgeDanger}>
                    {country.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {country.isDefault && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Default</span>
                    <span className={styles.badgePrimary}>Default Country</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Preview</h3>
            <div className={styles.cardContent}>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>{country.flag || '🌍'}</div>
                <div style={{ fontWeight: 500, marginBottom: 5 }}>{country.name}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                  <span className={styles.badgePrimary}>{country.code}</span>
                  <span className={styles.badgeInfo}>{country.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}