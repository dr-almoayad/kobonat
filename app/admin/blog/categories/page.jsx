// app/admin/blog/categories/page.jsx
import { getBlogCategories, getBlogTags } from '@/app/admin/_lib/queries';
import { upsertBlogCategory, deleteBlogCategory, upsertBlogTag, deleteBlogTag } from '@/app/admin/_lib/blog-actions';
import { DataTable } from '@/app/admin/_components/DataTable';
import { FormField, FormRow } from '@/app/admin/_components/FormField';
import Link from 'next/link';
import styles from '../../admin.module.css';

export const metadata = { title: 'Blog Categories & Tags | Admin' };

export default async function BlogCategoriesPage({ searchParams }) {
  const { editCat, editTag } = await searchParams;

  const [categories, tags] = await Promise.all([
    getBlogCategories('en'),
    getBlogTags('en')
  ]);

  const editingCategory = editCat ? categories.find(c => c.id === parseInt(editCat)) : null;
  const editingTag      = editTag  ? tags.find(t => t.id === parseInt(editTag))       : null;

  // ── Category table data — plain primitives only, no JSX ──────────────────
  const catData = categories.map(c => ({
    id:    c.id,
    name:  c.translations?.[0]?.name || '—',
    slug:  c.slug,
    color: c.color || '—',
    posts: c._count?.posts ?? 0,
  }));

  const catColumns = [
    { key: 'name',  label: 'Name'  },
    { key: 'slug',  label: 'Slug'  },
    { key: 'color', label: 'Color' },
    { key: 'posts', label: 'Posts' },
  ];

  // ── Tag table data — plain primitives only, no JSX ───────────────────────
  const tagData = tags.map(t => ({
    id:    t.id,
    name:  t.translations?.[0]?.name || '—',
    slug:  t.slug,
    posts: t._count?.posts ?? 0,
  }));

  const tagColumns = [
    { key: 'name',  label: 'Name'          },
    { key: 'slug',  label: 'Slug'          },
    { key: 'posts', label: 'Used in Posts' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Blog Categories & Tags</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
            {categories.length} categories · {tags.length} tags
          </p>
        </div>
        <Link href="/admin/blog" style={{ fontSize: 13, color: '#470ae2', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to Posts
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

        {/* ── CATEGORIES ─────────────────────────────────────────────── */}
        <div>
          <h2 style={{ marginBottom: 16 }}>Categories</h2>

          <div className={styles.card} style={{ marginBottom: 24 }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                {editingCategory
                  ? `Edit: ${editingCategory.translations?.find(t => t.locale === 'en')?.name || editingCategory.slug}`
                  : 'New Category'}
              </h3>
              {editingCategory && (
                <Link href="/admin/blog/categories" style={{ fontSize: 12, color: '#888' }}>Cancel</Link>
              )}
            </div>
            <div className={styles.cardContent}>
              <form action={upsertBlogCategory}>
                {editingCategory && (
                  <input type="hidden" name="categoryId" value={editingCategory.id} />
                )}
                <FormField
                  label="Slug" name="slug" required
                  defaultValue={editingCategory?.slug || ''}
                  placeholder="shopping-tips"
                  helpText="URL-safe, shared across locales"
                />
                <FormRow>
                  <FormField
                    label="Name (EN)" name="name_en" required
                    defaultValue={editingCategory?.translations?.find(t => t.locale === 'en')?.name || ''}
                    placeholder="Shopping Tips"
                  />
                  <FormField
                    label="Name (AR)" name="name_ar" dir="rtl"
                    defaultValue={editingCategory?.translations?.find(t => t.locale === 'ar')?.name || ''}
                    placeholder="نصائح التسوق"
                  />
                </FormRow>
                <FormRow>
                  <FormField
                    label="Description (EN)" name="description_en"
                    defaultValue={editingCategory?.translations?.find(t => t.locale === 'en')?.description || ''}
                  />
                  <FormField
                    label="Description (AR)" name="description_ar" dir="rtl"
                    defaultValue={editingCategory?.translations?.find(t => t.locale === 'ar')?.description || ''}
                  />
                </FormRow>
                <FormRow>
                  <FormField
                    label="Color" name="color" type="color"
                    defaultValue={editingCategory?.color || '#470ae2'}
                  />
                  <FormField
                    label="Icon" name="icon"
                    defaultValue={editingCategory?.icon || ''}
                    placeholder="tag, star…"
                    helpText="Optional icon name"
                  />
                </FormRow>
                <button type="submit" className={styles.btnPrimary}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </form>
            </div>
          </div>

          <DataTable
            data={catData}
            columns={catColumns}
            editUrl="/admin/blog/categories?editCat=:id"
            deleteAction={deleteBlogCategory}
            searchable={false}
          />
        </div>

        {/* ── TAGS ───────────────────────────────────────────────────── */}
        <div>
          <h2 style={{ marginBottom: 16 }}>Tags</h2>

          <div className={styles.card} style={{ marginBottom: 24 }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                {editingTag
                  ? `Edit: ${editingTag.translations?.find(t => t.locale === 'en')?.name || editingTag.slug}`
                  : 'New Tag'}
              </h3>
              {editingTag && (
                <Link href="/admin/blog/categories" style={{ fontSize: 12, color: '#888' }}>Cancel</Link>
              )}
            </div>
            <div className={styles.cardContent}>
              <form action={upsertBlogTag}>
                {editingTag && (
                  <input type="hidden" name="tagId" value={editingTag.id} />
                )}
                <FormField
                  label="Slug" name="slug" required
                  defaultValue={editingTag?.slug || ''}
                  placeholder="noon, electronics, fashion…"
                  helpText="URL-safe, lowercase, hyphens only"
                />
                <FormRow>
                  <FormField
                    label="Name (EN)" name="name_en" required
                    defaultValue={editingTag?.translations?.find(t => t.locale === 'en')?.name || ''}
                    placeholder="Noon"
                  />
                  <FormField
                    label="Name (AR)" name="name_ar" dir="rtl"
                    defaultValue={editingTag?.translations?.find(t => t.locale === 'ar')?.name || ''}
                    placeholder="نون"
                  />
                </FormRow>
                <button type="submit" className={styles.btnPrimary}>
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </button>
              </form>
            </div>
          </div>

          <DataTable
            data={tagData}
            columns={tagColumns}
            editUrl="/admin/blog/categories?editTag=:id"
            deleteAction={deleteBlogTag}
            searchable={false}
          />
        </div>
      </div>
    </div>
  );
}
