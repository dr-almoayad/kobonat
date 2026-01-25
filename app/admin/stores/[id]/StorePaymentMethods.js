// app/admin/stores/[id]/StorePaymentMethods.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../../admin.module.css';

export default function StorePaymentMethods({ store, countries, paymentMethods  }) {
  const [storePaymentMethods, setStorePaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const allMethods = paymentMethods || [];
  
  const [formData, setFormData] = useState({
    countryId: '',
    paymentMethodId: '',
    isActive: true,
    notes_en: '',
    notes_ar: ''
  });

  // Use store?.id to prevent crash if store is briefly null
  const fetchLinkedMethods = useCallback(async () => {
    if (!store?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/stores/${store.id}/payment-methods?locale=en`);
      const data = await res.json();
      setStorePaymentMethods(data.storePaymentMethods || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchLinkedMethods();
  }, [fetchLinkedMethods]);

  async function handleLink(e) {
    e.preventDefault();
    if (!formData.countryId || !formData.paymentMethodId) return alert('Select Country & Method');

    try {
      const res = await fetch(`/api/admin/stores/${store.id}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        fetchLinkedMethods();
      }
    } catch (e) { alert(e.message); }
  }

  async function handleUnlink(countryId, paymentMethodId) {
    if (!confirm('Remove this payment method?')) return;
    try {
      await fetch(`/api/admin/stores/${store.id}/payment-methods?countryId=${countryId}&paymentMethodId=${paymentMethodId}`, {
        method: 'DELETE'
      });
      fetchLinkedMethods();
    } catch (e) { console.error(e); }
  }

  if (loading && !storePaymentMethods.length) return <p>Loading methods...</p>;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3>Linked Payment Methods</h3>
        <button onClick={() => setShowForm(!showForm)} className={styles.btnPrimary}>
          {showForm ? 'Cancel' : '+ Link Method'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleLink} className={`${styles.form} ${styles.card}`} style={{marginBottom: '2rem'}}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Country</label>
              <select 
                value={formData.countryId} 
                onChange={e => setFormData({...formData, countryId: e.target.value})}
                className={styles.formInput}
              >
                <option value="">Select Country</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.translations[0]?.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Payment Method</label>
              <select 
                value={formData.paymentMethodId} 
                onChange={e => setFormData({...formData, paymentMethodId: e.target.value})}
                className={styles.formInput}
              >
                <option value="">Select Method</option>
                {allMethods.map(m => <option key={m.id} value={m.id}>{m.translations[0]?.name} ({m.type})</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Notes (EN)</label>
              <input type="text" className={styles.formInput} value={formData.notes_en} onChange={e => setFormData({...formData, notes_en: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Notes (AR)</label>
              <input type="text" className={styles.formInput} dir="rtl" value={formData.notes_ar} onChange={e => setFormData({...formData, notes_ar: e.target.value})} />
            </div>
          </div>
          <button type="submit" className={styles.btnPrimary}>Save Link</button>
        </form>
      )}

      <div className={styles.grid}>
        {countries.filter(c => store.countries?.some(sc => sc.countryId === c.id)).map(sc => {
          const methods = storePaymentMethods.filter(m => m.countryId === sc.id);
          return (
            <div key={sc.id} className={styles.card}>
              <h4 style={{borderBottom:'1px solid #eee', paddingBottom:'0.5rem'}}>
                {sc.flag} {sc.translations?.[0]?.name}
              </h4>
              {methods.length === 0 ? <p className={styles.textMuted}>No methods configured</p> : (
                <table style={{width:'100%', fontSize:'0.9rem'}}>
                  <tbody>
                    {methods.map(m => (
                      <tr key={m.paymentMethodId}>
                        <td style={{padding:'4px'}}>{m.paymentMethod?.translations?.[0]?.name}</td>
                        <td style={{padding:'4px'}}><span className={styles.badge}>{m.paymentMethod?.type}</span></td>
                        <td style={{padding:'4px', textAlign:'right'}}>
                          <button onClick={() => handleUnlink(sc.id, m.paymentMethodId)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
