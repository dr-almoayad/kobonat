// app/admin/countries/page.jsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCountry, updateCountry, deleteCountry } from '../_lib/actions';
import { DataTable } from '../_components/DataTable';
import { FormField, FormRow, FormSection } from '../_components/FormField';
import styles from '../admin.module.css';
import Image from 'next/image';

export default function CountriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const action = searchParams.get('action'); // 'create', 'edit', or null
  const countryId = searchParams.get('id'); // For edit mode
  
  const [countries, setCountries] = useState([]);
  const [currentCountry, setCurrentCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState('');

  // Fetch countries list
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch('/api/admin/countries?locale=en');
        const data = await res.json();
        setCountries(data.countries || []);
        
        // If in edit mode, find the country to edit
        if (action === 'edit' && countryId) {
          const countryToEdit = data.countries?.find(c => c.id.toString() === countryId);
          setCurrentCountry(countryToEdit || null);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCountries();
  }, [action, countryId]);

  // Handle create/edit form submission
  async function handleSubmit(formData) {
    setFormError('');
    
    // Validation
    const code = formData.get('code');
    const currency = formData.get('currency');
    
    if (!/^[A-Z]{2}$/.test(code)) {
      setFormError('Country code must be 2 uppercase letters (e.g., SA, AE)');
      return;
    }
    
    if (!/^[A-Z]{3}$/.test(currency)) {
      setFormError('Currency must be 3 uppercase letters (e.g., SAR, AED)');
      return;
    }
    
    startTransition(async () => {
      let result;
      
      if (action === 'edit' && countryId) {
        result = await updateCountry(countryId, formData);
      } else {
        result = await createCountry(formData);
      }
      
      if (result.success) {
        // Reset form and refresh data
        router.push('/admin/countries');
        const res = await fetch('/api/admin/countries?locale=en');
        const data = await res.json();
        setCountries(data.countries || []);
        setCurrentCountry(null);
      } else {
        setFormError(result.error || 'Failed to save country');
      }
    });
  }

  // Handle delete
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this country?')) return;
    
    const result = await deleteCountry(id);
    if (result.success) {
      // Refresh the list
      const res = await fetch('/api/admin/countries?locale=en');
      const data = await res.json();
      setCountries(data.countries || []);
    } else {
      alert(result.error || 'Failed to delete country');
    }
  }

  // Handle edit
  function handleEdit(id) {
    router.push(`/admin/countries?action=edit&id=${id}`);
  }

  // Handle create
  function handleCreate() {
    router.push('/admin/countries?action=create');
  }

  // Cancel form
  function handleCancel() {
    router.push('/admin/countries');
    setCurrentCountry(null);
  }

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Countries ({countries.length})</h1>
        {!action && (
          <button 
            onClick={handleCreate}
            className={styles.btnPrimary}
          >
            + Add Country
          </button>
        )}
        {action && (
          <button 
            onClick={handleCancel}
            className={styles.btnSecondary}
          >
            ← Back to List
          </button>
        )}
      </div>

      {/* Form for Create/Edit */}
      {(action === 'create' || action === 'edit') && (
        <form action={handleSubmit} className={styles.form}>
          <div className={styles.formHeader}>
            <h2>
              {action === 'create' ? 'Create New Country' : `Edit Country: ${currentCountry?.name || ''}`}
            </h2>
          </div>
          
          {formError && (
            <div className={styles.errorMessage}>
              {formError}
            </div>
          )}
          
          <FormSection title="Country Information">
            <FormRow>
              <FormField
                label="Country Code"
                name="code"
                defaultValue={currentCountry?.code || ''}
                required
                placeholder="SA, AE, EG"
                maxLength="2"
                pattern="[A-Z]{2}"
                title="Two-letter country code (e.g., SA, AE)"
              />
              <FormField
                label="Currency"
                name="currency"
                defaultValue={currentCountry?.currency || ''}
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
                defaultValue={currentCountry?.name || ''}
                required
              />
              <FormField
                label="Name (Arabic)"
                name="name_ar"
                defaultValue={currentCountry?.name_ar || ''}
                required
                dir="rtl"
              />
            </FormRow>

            <FormField
              label="Flag Emoji"
              name="flag"
              defaultValue={currentCountry?.flag || ''}
              placeholder="🇸🇦, 🇦🇪, 🇪🇬"
              helpText="Copy emoji from https://emojipedia.org/flags/"
            />
          </FormSection>

          <FormSection title="Settings">
            <FormField
              label="Active"
              name="isActive"
              type="checkbox"
              defaultChecked={action === 'create' ? true : currentCountry?.isActive}
              helpText="Show this country in the platform"
            />
            <FormField
              label="Default Country"
              name="isDefault"
              type="checkbox"
              defaultChecked={action === 'create' ? false : currentCountry?.isDefault}
              helpText="Set as default country for new users"
            />
          </FormSection>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : action === 'create' ? 'Create Country' : 'Save Changes'}
            </button>
            <button 
              type="button"
              onClick={handleCancel}
              className={styles.btnSecondary}
              disabled={isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Countries List */}
      {!action && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {countries.map(country => (
              <div 
                key={country.id} 
                className={`${styles.card} ${!country.isActive ? styles.cardInactive : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <Image src={country.flag} width={36} height={28}/>
                    <div>
                      <h3 className={styles.cardTitle}>{country.name}</h3>
                      <div style={{ fontSize: 12, color: '#666' }}>{country.code}</div>
                    </div>
                  </div>
                  {country.isDefault && (
                    <span className={styles.badgePrimary}>Default</span>
                  )}
                </div>
                
                <div className={styles.cardContent}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>Currency:</span>
                      <strong>{country.currency}</strong>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>Stores:</span>
                      <strong>{country._count?.stores || 0}</strong>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>Vouchers:</span>
                      <strong>{country._count?.vouchers || 0}</strong>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #eee' }}>
                  <span className={country.isActive ? styles.badgeSuccess : styles.badgeDanger}>
                    {country.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                  <button 
                    onClick={() => handleEdit(country.id)}
                    className={styles.btnEdit}
                    style={{ flex: 1 }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(country.id)}
                    className={styles.btnDelete}
                    style={{ flex: 1 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Alternative: Using DataTable */}
          {countries.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <DataTable
                data={countries}
                columns={[
                  { 
                    key: 'id', 
                    label: 'ID',
                    sortable: true 
                  },
                  { 
                    key: 'flag', 
                    label: 'Flag',
                    sortable: false,
                    render: (flag) => (
                      <div style={{ fontSize: 24 }}>
                        {flag || '🌍'}
                      </div>
                    )
                  },
                  { 
                    key: 'name', 
                    label: 'Name',
                    sortable: true,
                    render: (name, row) => (
                      <div>
                        <div style={{ fontWeight: 500 }}>{name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{row.code}</div>
                      </div>
                    )
                  },
                  { 
                    key: 'currency', 
                    label: 'Currency',
                    sortable: true
                  },
                  { 
                    key: '_count.stores', 
                    label: 'Stores',
                    sortable: true,
                    render: (count) => count || 0
                  },
                  { 
                    key: '_count.vouchers', 
                    label: 'Vouchers',
                    sortable: true,
                    render: (count) => count || 0
                  },
                  { 
                    key: 'isActive', 
                    label: 'Status',
                    render: (active, row) => (
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span className={active ? styles.badgeSuccess : styles.badgeDanger}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                        {row.isDefault && (
                          <span className={styles.badgePrimary}>Default</span>
                        )}
                      </div>
                    )
                  }
                ]}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchable={true}
                searchPlaceholder="Search countries..."
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}