// components/admin/StoreGuideManager.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/admin/admin.module.css';
import { FormField, DataTable } from '@/app/admin/_components';
import { upsertGuideStep, deleteGuideStep, reorderGuideSteps } from '@/app/admin/_lib/actions';

const STEP_TYPES = [
  { value: 'VOUCHER', label: 'Voucher Codes' },
  { value: 'DEAL', label: 'Deals' },
  { value: 'BANK', label: 'Bank & Payment Offers' },
  { value: 'CREDIT', label: 'In-Site Credit' },
  { value: 'GIFT_CARD', label: 'Gift Cards' },
  { value: 'BNPL', label: 'Buy Now, Pay Later' },
];

const TYPE_ICONS = {
  VOUCHER: 'confirmation_number',
  DEAL: 'local_fire_department',
  BANK: 'account_balance',
  CREDIT: 'wallet',
  GIFT_CARD: 'card_giftcard',
  BNPL: 'bolt',
};

export default function StoreGuideManager({ storeId }) {
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState('en'); // ✅ NEW: locale state
  const [loading, setLoading] = useState(true);
  const [stepsByType, setStepsByType] = useState({});
  const [editingStep, setEditingStep] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSteps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/guide?locale=${activeLocale}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStepsByType(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load guide steps');
    } finally {
      setLoading(false);
    }
  }, [storeId, activeLocale]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const handleAdd = (type) => {
    setFormType(type);
    setEditingStep(null);
    setShowForm(true);
  };

  const handleEdit = (step) => {
    setFormType(step.type);
    setEditingStep(step);
    setShowForm(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const result = await upsertGuideStep(storeId, {
        id: editingStep?.id,
        locale: activeLocale, // ✅ use activeLocale instead of hardcoded 'en'
        type: formType,
        title: formData.title,
        description: formData.description,
        images: formData.images ? formData.images.split(',').map(s => s.trim()).filter(Boolean) : [],
        order: editingStep?.order,
        bnplPartner: formData.bnplPartner || null,
      });
      if (result.error) {
        alert(result.error);
      } else {
        setShowForm(false);
        setEditingStep(null);
        fetchSteps();
        router.refresh();
      }
    } catch (err) {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (stepId) => {
    if (!confirm('Delete this step?')) return;
    const result = await deleteGuideStep(stepId, storeId);
    if (result.error) {
      alert(result.error);
    } else {
      fetchSteps();
      router.refresh();
    }
  };

  // handleReorder is defined but not yet used; you can add drag‑and‑drop later
  const handleReorder = async (orderedIds) => {
    const result = await reorderGuideSteps(storeId, orderedIds);
    if (result.error) {
      alert(result.error);
    } else {
      fetchSteps();
      router.refresh();
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading guide steps...</div>;
  }

  return (
    <div className={styles.section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Store How‑to Guide</h3>
        {/* ── Locale toggle ── */}
        <div style={{ display: 'flex', gap: '0.25rem', background: '#f3f4f6', padding: '0.2rem', borderRadius: 6 }}>
          <button
            type="button"
            className={activeLocale === 'en' ? styles.btnPrimary : styles.btnSecondary}
            style={{ padding: '0.3rem 1rem', fontSize: '0.8rem' }}
            onClick={() => setActiveLocale('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={activeLocale === 'ar' ? styles.btnPrimary : styles.btnSecondary}
            style={{ padding: '0.3rem 1rem', fontSize: '0.8rem' }}
            onClick={() => setActiveLocale('ar')}
          >
            AR
          </button>
        </div>
      </div>

      <p style={{ marginBottom: '1.5rem', color: 'var(--ap-text-muted)', fontSize: '0.9rem' }}>
        Each step type appears as a separate tab on the store page. Steps are ordered within each type.
        {activeLocale === 'ar' && ' (العربية)'}
      </p>

      {STEP_TYPES.map(({ value: type, label }) => {
        const steps = stepsByType[type] || [];
        const hasSteps = steps.length > 0;

        return (
          <div key={type} className={styles.card} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-sharp">{TYPE_ICONS[type] || 'help'}</span>
                {label}
                <span style={{ fontSize: '0.7rem', color: 'var(--ap-text-muted)', fontWeight: 400 }}>
                  ({steps.length})
                </span>
              </h4>
              <button className={styles.btnPrimary} onClick={() => handleAdd(type)}>
                + Add Step
              </button>
            </div>

            {hasSteps ? (
              <DataTable
                data={steps}
                columns={[
                  { key: 'order', label: 'Order', sortable: true },
                  { key: 'title', label: 'Title' },
                  { key: 'description', label: 'Description', render: (v) => v ? v.substring(0, 60) + (v.length > 60 ? '…' : '') : '—' },
                  { key: 'images', label: 'Images', render: (v) => Array.isArray(v) ? v.length : 0 },
                  { key: 'bnplPartner', label: 'BNPL Partner', render: (v) => v || '—' },
                ]}
                onEdit={(id) => {
                  const step = steps.find(s => s.id === id);
                  if (step) handleEdit(step);
                }}
                onDelete={(id) => handleDelete(id)}
                searchable
                searchPlaceholder="Search steps…"
              />
            ) : (
              <div style={{ padding: '1rem', color: 'var(--ap-text-muted)', fontSize: '0.85rem', textAlign: 'center', border: '1px dashed var(--ap-border)', borderRadius: 4 }}>
                No steps yet. Click <strong>+ Add Step</strong> to create one.
              </div>
            )}
          </div>
        );
      })}

      {showForm && (
        <div className={styles.card} style={{ border: '2px solid var(--ap-accent)', marginTop: '1.5rem' }}>
          <h4>{editingStep ? 'Edit Step' : `Add Step (${STEP_TYPES.find(t => t.value === formType)?.label})`}</h4>
          <form action={async (formData) => {
            const title = formData.get('title');
            const description = formData.get('description');
            const images = formData.get('images');
            const bnplPartner = formData.get('bnplPartner');
            await handleSave({ title, description, images, bnplPartner });
          }}>
            <FormField label="Title" name="title" defaultValue={editingStep?.title || ''} required />
            <FormField label="Description" name="description" type="textarea" rows={4} defaultValue={editingStep?.description || ''} />
            <FormField label="Images (comma-separated URLs)" name="images" defaultValue={editingStep?.images?.join(', ') || ''} placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
            {formType === 'BNPL' && (
              <FormField label="BNPL Partner Name" name="bnplPartner" defaultValue={editingStep?.bnplPartner || ''} placeholder="e.g. Tabby, Tamara" />
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : editingStep ? 'Update Step' : 'Add Step'}
              </button>
              <button type="button" className={styles.btnSecondary} onClick={() => { setShowForm(false); setEditingStep(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
