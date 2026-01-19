'use client';

import { useState, useEffect } from 'react';
import styles from '../../admin.module.css';

export default function StorePaymentMethods({ store, countries, paymentMethods }) {
  const [storePaymentMethods, setStorePaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    countryId: '',
    paymentMethodId: '',
    isActive: true,
    notes_en: '',
    notes_ar: ''
  });

  useEffect(() => {
    fetchLinkedMethods();
  }, [store.id]);

  async function fetchLinkedMethods() {
    try {
      const res = await fetch(`/api/admin/stores/${store.id}/payment-methods?locale=en`);
      const data = await res.json();
      setStorePaymentMethods(data.storePaymentMethods || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLink(e) {
    e.preventDefault();
    if (!formData.countryId || !formData.paymentMethodId) return alert('Select Country & Method');

    try {
      const res = await fetch(`/api/admin/stores/${store.id}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId: parseInt(formData.countryId),
          paymentMethodId: parseInt(formData.paymentMethodId),
          isActive: formData.isActive,
          notes_en: formData.notes_en,
          notes_ar: formData.notes_ar
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShowForm(false);
        fetchLinkedMethods();
        setFormData({ 
          countryId: '', paymentMethodId: '', isActive: true, notes_en: '', notes_ar: '' 
        });
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Failed to link');
    }
  }

  async function handleUnlink(countryId, paymentMethodId) {
    if(!confirm("Remove this payment method?")) return;
    try {
      const res = await fetch(
        `/api/admin/stores/${store.id}/payment-methods?countryId=${countryId}&paymentMethodId=${paymentMethodId}`, 
        { method: 'DELETE' }
      );
      if(res.ok) fetchLinkedMethods();
    } catch(e) { console.error(e); }
  }

  const getMethodsForCountry = (cId) => storePaymentMethods.filter(spm => spm.countryId === cId);

  if (loading) return <div>Loading linked methods...</div>;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3>Store Payment Methods</h3>
        <button onClick={() => setShowForm(!showForm)} className={styles.btnPrimary}>
          {showForm ? 'Cancel' : '+ Add Method'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleLink} className={styles.formBox} style={{background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
            <div className={styles.formGroup}>
              <label>Country *</label>
              <select 
                value={formData.countryId}
                onChange={e => setFormData({...formData, countryId: e.target.value})}
                className={styles.formSelect}
                required
              >
                <option value="">Select Country...</option>
                {countries.map(sc => (
                  <option key={sc.countryId} value={sc.countryId}>
                    {sc.country?.translations?.[0]?.name || sc.country?.code}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Payment Method *</label>
              <select
                value={formData.paymentMethodId}
                onChange={e => setFormData({...formData, paymentMethodId: e.target.value})}
                className={styles.formSelect}
                required
              >
                <option value="">Select Method...</option>
                {paymentMethods.map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.translations?.[0]?.name || pm.slug}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
             <div className={styles.formGroup}>
               <label>Notes (English)</label>
               <input 
                 className={styles.formInput} 
                 value={formData.notes_en}
                 onChange={e => setFormData({...formData, notes_en: e.target.value})}
                 placeholder="e.g. Min order 50 SAR"
               />
             </div>
             <div className={styles.formGroup}>
               <label>Notes (Arabic)</label>
               <input 
                 className={styles.formInput} 
                 value={formData.notes_ar}
                 onChange={e => setFormData({...formData, notes_ar: e.target.value})}
                 placeholder="مثال: الحد الأدنى 50 ريال"
                 dir="rtl"
               />
             </div>
          </div>
          <button type="submit" className={styles.btnPrimary}>Save Mapping</button>
        </form>
      )}

      <div className={styles.grid} style={{display:'grid', gap:'1rem'}}>
        {countries.map(sc => {
          const methods = getMethodsForCountry(sc.countryId);
          return (
            <div key={sc.countryId} className={styles.card} style={{border:'1px solid #eee', padding:'1rem', borderRadius:'8px'}}>
              <h4 style={{marginBottom:'0.5rem', borderBottom:'1px solid #eee', paddingBottom:'0.5rem'}}>
                {sc.country?.flag} {sc.country?.translations?.[0]?.name}
              </h4>
              {methods.length === 0 ? <p className={styles.textMuted} style={{fontSize:'0.9rem'}}>No methods configured</p> : (
                <table style={{width:'100%', fontSize:'0.9rem'}}>
                  <tbody>
                    {methods.map(m => (
                      <tr key={m.id}>
                        <td style={{padding:'4px'}}>{m.paymentMethod?.translations?.[0]?.name}</td>
                        <td style={{padding:'4px'}}><span className={styles.badge}>{m.paymentMethod?.type}</span></td>
                        <td style={{padding:'4px', color:'#666'}}>
                          {m.translations?.find(t => t.locale === 'en')?.notes || '-'}
                        </td>
                        <td style={{padding:'4px', textAlign:'right'}}>
                          <button 
                            onClick={() => handleUnlink(sc.countryId, m.paymentMethodId)}
                            style={{color:'red', background:'none', border:'none', cursor:'pointer'}}
                          >
                            Remove
                          </button>
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