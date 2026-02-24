// app/admin/curated-offers/page.jsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DataTable } from '@/app/admin/_components/DataTable';
import { FormField, FormRow, FormSection } from '@/app/admin/_components/FormField';
import {
  createCuratedOffer,
  updateCuratedOffer,
  deleteCuratedOffer,
} from '@/app/admin/_lib/curated-offer-actions';
import styles from '../admin.module.css';

export const metadata = { title: 'Curated Offers | Admin' }; 

// ── Prisma helpers ────────────────────────────────────────────────────────────
async function getCuratedOffers() {
  return prisma.curatedOffer.findMany({
    include: {
      translations: { where: { locale: 'en' } },
      store:        { include: { translations: { where: { locale: 'en' } } } },
      countries:    { include: { country: { include: { translations: { where: { locale: 'en' } } } } } },
      _count:       { select: { countries: true } }
    },
    orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }]
  });
}

async function getCuratedOffer(id) {
  return prisma.curatedOffer.findUnique({
    where: { id: parseInt(id) },
    include: {
      translations: true,
      countries:    { include: { country: true } }
    }
  });
}

async function getStores() {
  return prisma.store.findMany({
    where: { isActive: true },
    include: { translations: { where: { locale: 'en' } } },
    orderBy: { createdAt: 'desc' }
  });
}

async function getCountries() {
  return prisma.country.findMany({
    where: { isActive: true },
    include: { translations: { where: { locale: 'en' } } },
    orderBy: { code: 'asc' }
  });
}

// ── Shared offer form ─────────────────────────────────────────────────────────
function CuratedOfferForm({ stores, countries, editing, action }) {
  const tEn = editing?.translations?.find(t => t.locale === 'en') || {};
  const tAr = editing?.translations?.find(t => t.locale === 'ar') || {};
  const activeCountries = new Set(editing?.countries?.map(c => c.countryId) || []);

  const typeOptions = [
    'CODE','DEAL','PRODUCT','SEASONAL','FREE_SHIPPING','CASHBACK','BUNDLE','FLASH_SALE'
  ].map(v => ({ value: v, label: v.replace('_', ' ') }));

  const storeOptions = stores.map(s => ({
    value: s.id,
    label: s.translations?.[0]?.name || `Store #${s.id}`
  }));

  return (
    <form action={action}>
      {editing && <input type="hidden" name="_offerId" value={editing.id} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* ── Left ── */}
        <div>
          <FormSection title="Offer Details">
            <FormField
              label="Store"
              name="storeId"
              type="select"
              required
              defaultValue={editing?.storeId || ''}
              options={storeOptions}
              placeholder="— Select Store —"
            />

            <FormRow>
              <FormField
                label="Offer Type"
                name="type"
                type="select"
                required
                defaultValue={editing?.type || 'DEAL'}
                options={typeOptions}
              />
              <FormField
                label="Display Order"
                name="order"
                type="number"
                defaultValue={editing?.order ?? 0}
                helpText="Lower = shown first"
              />
            </FormRow>

            <FormField
              label="Offer Image URL"
              name="offerImage"
              type="url"
              required
              defaultValue={editing?.offerImage || ''}
              placeholder="https://cdn.cobonat.me/offers/..."
              helpText="Square image shown in the squircle. Recommended: 600×600px"
            />

            <FormField
              label="CTA URL"
              name="ctaUrl"
              type="url"
              required
              defaultValue={editing?.ctaUrl || ''}
              placeholder="https://store.com/deal-page"
            />

            <FormField
              label="Coupon Code"
              name="code"
              defaultValue={editing?.code || ''}
              placeholder="SAVE20 — only for CODE type"
              helpText="Leave blank for non-code offer types"
            />

            <FormRow>
              <FormField label="Start Date"  name="startDate"  type="datetime-local" defaultValue={editing?.startDate  ? new Date(editing.startDate).toISOString().slice(0,16)  : ''} />
              <FormField label="Expiry Date" name="expiryDate" type="datetime-local" defaultValue={editing?.expiryDate ? new Date(editing.expiryDate).toISOString().slice(0,16) : ''} />
            </FormRow>

            <FormRow>
              <FormField label="Active"   name="isActive"   type="checkbox" defaultValue={editing?.isActive   ?? true}  helpText="Show on frontend" />
              <FormField label="Featured" name="isFeatured" type="checkbox" defaultValue={editing?.isFeatured ?? false} helpText="Pin to top" />
            </FormRow>
          </FormSection>

          {/* Countries */}
          <FormSection title="Country Availability">
            <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              Leave all unchecked to show in all countries.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {countries.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" name="countryIds" value={c.id} defaultChecked={activeCountries.has(c.id)} />
                  <span>{c.flag}</span>
                  {c.translations?.[0]?.name || c.code}
                </label>
              ))}
            </div>
          </FormSection>
        </div>

        {/* ── Right: Translations ── */}
        <div>
          <FormSection title="Content — English">
            <FormField
              label="Title (EN)"
              name="title_en"
              required
              defaultValue={tEn.title || ''}
              placeholder="15% Cash Back for Purchases Sitewide"
            />
            <FormField
              label="Description (EN)"
              name="description_en"
              type="textarea"
              rows={3}
              defaultValue={tEn.description || ''}
              placeholder="Optional additional detail"
            />
            <FormField
              label="CTA Button Text (EN)"
              name="ctaText_en"
              defaultValue={tEn.ctaText || 'SHOP NOW'}
            />
          </FormSection>

          <FormSection title="Content — Arabic">
            <FormField
              label="العنوان (AR)"
              name="title_ar"
              dir="rtl"
              defaultValue={tAr.title || ''}
              placeholder="استرداد نقدي 15% على جميع المشتريات"
            />
            <FormField
              label="الوصف (AR)"
              name="description_ar"
              type="textarea"
              rows={3}
              dir="rtl"
              defaultValue={tAr.description || ''}
            />
            <FormField
              label="نص زر الدعوة (AR)"
              name="ctaText_ar"
              dir="rtl"
              defaultValue={tAr.ctaText || 'تسوق الآن'}
            />
          </FormSection>

          {/* Image preview */}
          {editing?.offerImage && (
            <div className={styles.card} style={{ marginTop: 0 }}>
              <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Current Image</h3></div>
              <div className={styles.cardContent}>
                <img
                  src={editing.offerImage}
                  alt="Offer"
                  style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 12 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button type="submit" className={styles.btnPrimary}>
          {editing ? 'Save Changes' : 'Create Offer'}
        </button>
        {editing && (
          <Link href="/admin/curated-offers" style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid #e5e5e5',
            textDecoration: 'none', fontSize: 14, color: '#555'
          }}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CuratedOffersPage({ searchParams }) {
  const { edit } = await searchParams;

  const [offers, stores, countries] = await Promise.all([
    getCuratedOffers(),
    getStores(),
    getCountries()
  ]);

  const editingOffer = edit ? await getCuratedOffer(edit) : null;

  // Pre-compute all display values as plain strings — no JSX, no functions.
  const now = new Date();
  const tableData = offers.map(o => {
    const t          = o.translations?.[0] || {};
    const expired    = o.expiryDate && new Date(o.expiryDate) < now;
    const countryVal = o._count?.countries || 0;

    return {
      id:        o.id,
      title:     t.title || '—',
      store:     o.store?.translations?.[0]?.name || `#${o.storeId}`,
      type:      o.type?.replace('_', ' ') || '—',
      status:    expired ? 'Expired' : o.isActive ? 'Active' : 'Inactive',
      featured:  o.isFeatured ? '★' : '—',
      order:     o.order,
      countries: countryVal === 0 ? 'All' : countryVal,
      expires:   o.expiryDate ? new Date(o.expiryDate).toLocaleDateString('en-GB') : 'Never',
    };
  });

  const columns = [
    { key: 'title',     label: 'Title'     },
    { key: 'store',     label: 'Store'     },
    { key: 'type',      label: 'Type'      },
    { key: 'status',    label: 'Status'    },
    { key: 'featured',  label: '★'         },
    { key: 'order',     label: 'Order'     },
    { key: 'countries', label: 'Countries' },
    { key: 'expires',   label: 'Expires'   },
  ];

  // ── Bound server actions ──────────────────────────────────────────────────
  async function handleCreate(formData) {
    'use server';
    const result = await createCuratedOffer(formData);
    if (!result.success) console.error('Create failed:', result.error);
    // Page revalidates automatically via revalidatePath in the action
  }

  async function handleUpdate(formData) {
    'use server';
    const id = formData.get('_offerId');
    await updateCuratedOffer(id, formData);
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Curated Offers</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
            {offers.length} total ·{' '}
            {offers.filter(o => o.isActive && (!o.expiryDate || new Date(o.expiryDate) >= new Date())).length} active
            &nbsp;·&nbsp;
            <span style={{ color: '#470ae2', fontWeight: 600 }}>
              ★ {offers.filter(o => o.isFeatured).length} featured
            </span>
          </p>
        </div>
      </div>

      {/* ── Info callout ── */}
      <div style={{
        padding: '12px 16px', borderRadius: 10,
        background: 'rgba(71,10,226,0.05)', border: '1px solid rgba(71,10,226,0.15)',
        marginBottom: 28, fontSize: 13, color: '#470ae2', display: 'flex', gap: 8, alignItems: 'center'
      }}>
        <span className="material-symbols-sharp" style={{ fontSize: 18 }}>info</span>
        <span>
          The frontend section shows the <strong>top 3 active offers</strong> ordered by
          Featured → Display Order → Date Created. Use <strong>Featured ★</strong> and <strong>Order</strong> to control which 3 appear.
        </span>
      </div>

      {/* ── Create / Edit form ── */}
      <div className={styles.card} style={{ marginBottom: 32 }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            {editingOffer ? `Editing: ${editingOffer.translations?.find(t => t.locale === 'en')?.title || `Offer #${editingOffer.id}`}` : 'New Curated Offer'}
          </h3>
        </div>
        <div className={styles.cardContent}>
          <CuratedOfferForm
            stores={stores}
            countries={countries}
            editing={editingOffer}
            action={editingOffer ? handleUpdate : handleCreate}
          />
        </div>
      </div>

      {/* ── Offers table ── */}
      <h2 style={{ marginBottom: 16, fontSize: '1.1rem', color: '#333' }}>
        All Curated Offers
      </h2>
      <DataTable
        data={tableData}
        columns={columns}
        editUrl="/admin/curated-offers?edit=:id"
        deleteAction={deleteCuratedOffer}
        searchable={true}
        searchPlaceholder="Search by title or store..."
      />
    </div>
  );
}
