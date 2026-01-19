// app/admin/categories/page.jsx - COMPLETE WITH EDIT/DELETE
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { upsertCategory, deleteCategory } from '../_lib/actions';
import { DataTable } from '../_components/DataTable';
import { FormField, FormRow, FormSection } from '../_components/FormField';
import styles from '../admin.module.css';

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCreate = searchParams.get('create') === 'true';
  const editId = searchParams.get('edit');
  
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState('');

  // Fetch categories
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/categories?locale=en');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Load category for editing
  useEffect(() => {
    if (editId && categories.length > 0) {
      const category = categories.find(c => c.id === parseInt(editId));
      setEditing(category);
    } else {
      setEditing(null);
    }
  }, [editId, categories]);

  // Handle form submission
  async function handleSubmit(formData) {
    setFormError('');
    
    // Validate slugs
    const slugEn = formData.get('slug_en');
    const slugAr = formData.get('slug_ar');
    
    if (!slugEn || !slugAr) {
      setFormError('Both English and Arabic slugs are required');
      return;
    }
    
    startTransition(async () => {
      const result = await upsertCategory(editId, formData);
      
      if (result.success) {
        // Refresh data and go back to list
        const res = await fetch('/api/admin/categories?locale=en');
        const data = await res.json();
        setCategories(data);
        router.push('/admin/categories');
        setEditing(null);
      } else {
        setFormError(result.error || 'Failed to save category');
      }
    });
  }

  // Handle delete
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    startTransition(async () => {
      const result = await deleteCategory(id);
      
      if (result.success) {
        // Refresh the list
        const res = await fetch('/api/admin/categories?locale=en');
        const data = await res.json();
        setCategories(data);
      } else {
        alert(result.error || 'Failed to delete category');
      }
    });
  }

  // Handle edit
  function handleEdit(id) {
    router.push(`/admin/categories?edit=${id}`);
  }

  // Handle create
  function handleCreate() {
    router.push('/admin/categories?create=true');
  }

  // Cancel form
  function handleCancel() {
    router.push('/admin/categories');
    setEditing(null);
    setFormError('');
  }

  // Get translations for editing
  const enTranslation = editing?.translations?.find(t => t.locale === 'en') || {};
  const arTranslation = editing?.translations?.find(t => t.locale === 'ar') || {};

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Categories ({categories.length})</h1>
        {!showCreate && !editId && (
          <button 
            onClick={handleCreate}
            className={styles.btnPrimary}
            disabled={isPending}
          >
            + Add Category
          </button>
        )}
        {(showCreate || editId) && (
          <button 
            onClick={handleCancel}
            className={styles.btnSecondary}
            disabled={isPending}
          >
            ← Back to List
          </button>
        )}
      </div>

      {/* Form for Create/Edit */}
      {(showCreate || editId) && (
        <form action={handleSubmit} className={styles.form}>
          <div className={styles.formHeader}>
            <h2>
              {showCreate ? 'Create New Category' : `Edit Category: ${enTranslation.name || ''}`}
            </h2>
          </div>
          
          {formError && (
            <div className={styles.errorMessage}>
              {formError}
            </div>
          )}
          
          <FormSection title="Basic Information">
            <FormRow>
              <FormField
                label="Emoji Icon"
                name="icon"
                defaultValue={editing?.icon || ''}
                placeholder="🛒, 🛍️, 📱"
                helpText="Optional emoji icon for the category"
              />
              <FormField
                label="Color"
                name="color"
                type="color"
                defaultValue={editing?.color || '#0070f3'}
                helpText="Brand color for the category"
              />
            </FormRow>
          </FormSection>

          <FormSection title="English Translation">
            <FormRow>
              <FormField
                label="Name (English)"
                name="name_en"
                required
                defaultValue={enTranslation.name || ''}
                placeholder="Electronics"
              />
              <FormField
                label="Slug (English)"
                name="slug_en"
                required
                defaultValue={enTranslation.slug || ''}
                placeholder="electronics"
                helpText="URL-friendly identifier (lowercase, no spaces)"
              />
            </FormRow>

            <FormField
              label="Description (English)"
              name="description_en"
              type="textarea"
              defaultValue={enTranslation.description || ''}
              placeholder="Category description..."
            />

            <FormRow>
              <FormField
                label="SEO Title"
                name="seoTitle_en"
                defaultValue={enTranslation.seoTitle || ''}
                placeholder="Best Electronics Deals & Coupons"
              />
              <FormField
                label="SEO Description"
                name="seoDescription_en"
                type="textarea"
                rows={2}
                defaultValue={enTranslation.seoDescription || ''}
                placeholder="Find the best electronics deals..."
              />
            </FormRow>
          </FormSection>

          <FormSection title="Arabic Translation">
            <FormRow>
              <FormField
                label="Name (Arabic)"
                name="name_ar"
                required
                dir="rtl"
                defaultValue={arTranslation.name || ''}
                placeholder="الإلكترونيات"
              />
              <FormField
                label="Slug (Arabic)"
                name="slug_ar"
                required
                dir="rtl"
                defaultValue={arTranslation.slug || ''}
                placeholder="الإلكترونيات"
                helpText="معرّف صديق لعناوين URL"
              />
            </FormRow>

            <FormField
              label="Description (Arabic)"
              name="description_ar"
              type="textarea"
              dir="rtl"
              defaultValue={arTranslation.description || ''}
              placeholder="وصف الفئة..."
            />

            <FormRow>
              <FormField
                label="SEO Title"
                name="seoTitle_ar"
                dir="rtl"
                defaultValue={arTranslation.seoTitle || ''}
              />
              <FormField
                label="SEO Description"
                name="seoDescription_ar"
                type="textarea"
                rows={2}
                dir="rtl"
                defaultValue={arTranslation.seoDescription || ''}
              />
            </FormRow>
          </FormSection>

          <div className={styles.formActions}>
            <button 
              type="submit" 
              className={styles.btnPrimary} 
              disabled={isPending}
            >
              {isPending ? 'Saving...' : (editId ? 'Update Category' : 'Create Category')}
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

      {/* Categories List */}
      {!showCreate && !editId && (
        <>
          {/* Card Grid View */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: 20,
            marginBottom: 40
          }}>
            {categories.map(category => {
              const enTrans = category.translations?.find(t => t.locale === 'en') || {};
              const arTrans = category.translations?.find(t => t.locale === 'ar') || {};
              
              return (
                <div key={category.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <div style={{ 
                        fontSize: 32,
                        width: 50,
                        height: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        background: category.color ? `${category.color}15` : '#f0f0f0'
                      }}>
                        <span className="material-symbols-sharp">{category.icon}</span>
                      </div>
                      <div>
                        <h3 className={styles.cardTitle}>{enTrans.name || 'Unnamed'}</h3>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {enTrans.slug || 'no-slug'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.cardContent}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>ID:</span>
                        <strong>{category.id}</strong>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Linked Stores:</span>
                        <strong>{category._count?.stores || 0}</strong>
                      </div>
                      
                      {category.color && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#666' }}>Color:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: 4, 
                              background: category.color,
                              border: '1px solid #ddd'
                            }} />
                            <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                              {category.color}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {arTrans.name && (
                        <div style={{ 
                          marginTop: 8, 
                          paddingTop: 8, 
                          borderTop: '1px solid #eee',
                          direction: 'rtl'
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{arTrans.name}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{arTrans.slug}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                    <button 
                      onClick={() => handleEdit(category.id)}
                      className={styles.btnEdit}
                      style={{ flex: 1 }}
                      disabled={isPending}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)}
                      className={styles.btnDelete}
                      style={{ flex: 1 }}
                      disabled={isPending}
                    >
                      {isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Table View */}
          <h2 style={{ marginTop: 40, marginBottom: 20 }}>Table View</h2>
          <DataTable
            data={categories}
            columns={[
              { 
                key: 'id', 
                label: 'ID',
                sortable: true 
              },
              { 
                key: 'icon', 
                label: 'Icon',
                sortable: false,
                render: (icon) => (
                  <div style={{ fontSize: 24 }}>
                    {icon || '📂'}
                  </div>
                )
              },
              { 
                key: 'translations', 
                label: 'Category Name',
                sortable: true,
                render: (trans, row) => {
                  const enTrans = trans?.find(t => t.locale === 'en') || {};
                  const arTrans = trans?.find(t => t.locale === 'ar') || {};
                  
                  return (
                    <div>
                      <div style={{ fontWeight: 500 }}>{enTrans.name || '—'}</div>
                      {arTrans.name && (
                        <div style={{ fontSize: 12, color: '#666', direction: 'rtl', marginTop: 4 }}>
                          {arTrans.name}
                        </div>
                      )}
                    </div>
                  );
                }
              },
              { 
                key: 'translations', 
                label: 'Slug',
                sortable: false,
                render: (trans) => {
                  const enTrans = trans?.find(t => t.locale === 'en') || {};
                  return (
                    <code style={{ 
                      fontSize: 11, 
                      background: '#f5f5f5', 
                      padding: '2px 6px', 
                      borderRadius: 4 
                    }}>
                      {enTrans.slug || '—'}
                    </code>
                  );
                }
              },
              { 
                key: 'color', 
                label: 'Color',
                sortable: false,
                render: (color) => color ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: 4, 
                      background: color,
                      border: '1px solid #ddd'
                    }} />
                    <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{color}</span>
                  </div>
                ) : '—'
              },
              { 
                key: '_count.stores', 
                label: 'Stores',
                sortable: true,
                render: (count) => (
                  <span className={styles.badgePrimary}>
                    {count || 0}
                  </span>
                )
              }
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchable={true}
            searchPlaceholder="Search categories..."
          />
        </>
      )}
    </div>
  );
}