
'use client';

import { useState } from 'react';
import { createStoreProduct, updateStoreProduct, deleteStoreProduct } from '@/app/admin/_lib/actions';
import { FormField, FormRow, FormSection } from '@/app/admin/_components/FormField';
import styles from '../../../admin.module.css';

export default function ProductsSection({ storeId, products: initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (formData) => {
    setFormError('');
    setIsPending(true);
    formData.append('storeId', storeId);

    try {
      const result = editingProduct 
        ? await updateStoreProduct(editingProduct.id, formData)
        : await createStoreProduct(formData);

      if (result.success) {
        window.location.reload(); // Refresh to show changes
      } else {
        setFormError(result.error || 'Failed to save product');
      }
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    const result = await deleteStoreProduct(id);
    if (result.success) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Featured Products ({products.length})</h2>
        {!showForm && <button onClick={() => setShowForm(true)} className={styles.btnPrimary}>+ Add Product</button>}
      </div>

      {showForm && (
        <form action={handleSubmit} className={styles.form}>
          <FormSection title="Product Content">
            <FormRow>
              <FormField label="Title (EN)" name="title_en" defaultValue={editingProduct?.translations?.find(t => t.locale === 'en')?.title} required />
              <FormField label="Title (AR)" name="title_ar" defaultValue={editingProduct?.translations?.find(t => t.locale === 'ar')?.title} required dir="rtl" />
            </FormRow>
            <FormRow>
              <FormField label="Price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required />
              <FormField label="Original Price" name="originalPrice" type="number" step="0.01" defaultValue={editingProduct?.originalPrice} />
            </FormRow>
            <FormField label="Product URL" name="productUrl" defaultValue={editingProduct?.productUrl} required />
            <FormField label="Image URL" name="image" defaultValue={editingProduct?.image} required />

            {/* --- ADD THIS CHECKBOX --- */}
            <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                type="checkbox" 
                id="isFeatured" 
                name="isFeatured" 
                defaultChecked={editingProduct?.isFeatured} 
                style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="isFeatured" style={{ fontWeight: 500 }}>
                Show in Featured Carousel?
                </label>
            </div>
            {/* ------------------------- */}
          </FormSection>
          
          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>{isPending ? 'Saving...' : 'Save Product'}</button>
            <button type="button" onClick={() => {setShowForm(false); setEditingProduct(null);}} className={styles.btnSecondary}>Cancel</button>
          </div>
        </form>
      )}

      <div className={styles.grid}>
        {products.map(product => (
          <div key={product.id} className={styles.card}>
            <h4>{product.translations.find(t => t.locale === 'en')?.title}</h4>
            <p>{product.price} SAR</p>
            <div className={styles.actions}>
              <button onClick={() => {setEditingProduct(product); setShowForm(true);}} className={styles.btnEdit}>Edit</button>
              <button onClick={() => handleDelete(product.id)} className={styles.btnDelete}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
