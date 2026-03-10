// app/admin/blog/new/page.jsx
import { redirect } from 'next/navigation';
import { getBlogAuthors, getBlogCategories, getBlogTags } from '@/app/admin/_lib/queries';
import { createBlogPost } from '@/app/admin/_lib/blog-actions';
import { FormField, FormRow, FormSection } from '@/app/admin/_components/FormField';
import NewPostContentFields from '@/components/admin/RichTextEditor/NewPostContentFields';
import styles from '../../admin.module.css';

// ── Slug auto-generator ───────────────────────────────────────────────────────
const slugScript = `
  function slugify(text) {
    return text.toLowerCase().trim()
      .replace(/[^\\w\\s-]/g, '')
      .replace(/[\\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  document.getElementById('title_en')?.addEventListener('input', function() {
    const slugEl = document.getElementById('slug');
    if (!slugEl.dataset.modified) slugEl.value = slugify(this.value);
  });
  document.getElementById('slug')?.addEventListener('input', function() {
    this.dataset.modified = 'true';
  });
`;

export const metadata = { title: 'New Blog Post | Admin' };

export default async function NewBlogPostPage({ searchParams }) {
  const { error } = await searchParams;

  const [authors, categories, tags] = await Promise.all([
    getBlogAuthors(),
    getBlogCategories('en'),
    getBlogTags('en'),
  ]);

  async function handleCreate(formData) {
    'use server';
    const result = await createBlogPost(formData);
    if (result?.error) {
      console.error('createBlogPost failed:', result.error);
      redirect('/admin/blog/new?error=1');
    }
    redirect(`/admin/blog/${result.id}`);
  }

  const authorOptions = [
    { value: '', label: '— No Author —' },
    ...authors.map(a => ({ value: a.id, label: a.name })),
  ];

  const categoryOptions = [
    { value: '', label: '— No Category —' },
    ...categories.map(c => ({ value: c.id, label: c.translations?.[0]?.name || c.slug })),
  ];

  const statusOptions = [
    { value: 'DRAFT',     label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED',  label: 'Archived' },
  ];

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <h1>New Blog Post</h1>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          marginBottom: 20, padding: '12px 16px', borderRadius: 8,
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          fontSize: 14, display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span>⚠️</span>
          <span>Post could not be created. Check that the <strong>slug</strong> is unique and all required fields are filled in.</span>
        </div>
      )}

      <form action={handleCreate}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Main content ── */}
          <div>

            {/* ── English content ── */}
            <FormSection title="English Content">
              <FormField
                label="Title (EN)"
                name="title_en"
                id="title_en"
                required
                placeholder="Best Noon Coupons for 2025"
              />
              <FormField
                label="Excerpt (EN)"
                name="excerpt_en"
                type="textarea"
                rows={3}
                required
                placeholder="Short summary shown in cards and search results (1–2 sentences)"
              />

              {/*
                ── Rich text content fields ──────────────────────────────────
                NewPostContentFields is a 'use client' component.
                Each RichTextEditor inside it renders:
                  <div contenteditable …>   ← what the user types in
                  <input type="hidden" name="content_en|content_ar" …>  ← what the form submits
                So the server action receives the HTML string exactly like
                a regular textarea would.
              */}
              <NewPostContentFields />

              <FormRow>
                <FormField
                  label="Meta Title (EN)"
                  name="metaTitle_en"
                  placeholder="Leave blank to use Title"
                />
                <FormField
                  label="Meta Description (EN)"
                  name="metaDescription_en"
                  placeholder="Leave blank to use Excerpt"
                />
              </FormRow>
            </FormSection>

            {/* ── Arabic content ── */}
            <FormSection title="Arabic Content (المحتوى بالعربية)">
              <FormField
                label="العنوان (AR)"
                name="title_ar"
                dir="rtl"
                placeholder="أفضل كوبونات نون لعام 2025"
              />
              <FormField
                label="الملخص (AR)"
                name="excerpt_ar"
                type="textarea"
                rows={3}
                dir="rtl"
                placeholder="ملخص قصير يظهر في البطاقات ونتائج البحث"
              />
              {/*
                NOTE: The Arabic content RTE is already rendered by
                NewPostContentFields above (it outputs both EN and AR together
                so both hidden inputs sit inside the same <form> subtree).
                The AR meta fields below are plain text — no RTE needed.
              */}
              <FormRow>
                <FormField
                  label="عنوان SEO (AR)"
                  name="metaTitle_ar"
                  dir="rtl"
                  placeholder="اتركه فارغاً لاستخدام العنوان"
                />
                <FormField
                  label="وصف SEO (AR)"
                  name="metaDescription_ar"
                  dir="rtl"
                  placeholder="اتركه فارغاً لاستخدام الملخص"
                />
              </FormRow>
            </FormSection>

          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Publish */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Publish</h3>
              </div>
              <div className={styles.cardContent}>
                <FormField
                  label="Status"
                  name="status"
                  type="select"
                  defaultValue="DRAFT"
                  options={statusOptions}
                />
                <FormField
                  label="Publish Date"
                  name="publishedAt"
                  type="datetime-local"
                  helpText="Leave blank to publish immediately when status is Published"
                />
                <FormField
                  label="Featured Post"
                  name="isFeatured"
                  type="checkbox"
                  helpText="Show in homepage featured section"
                />
                <button type="submit" className={styles.btnPrimary} style={{ width: '100%', marginTop: 12 }}>
                  Create Post
                </button>
              </div>
            </div>

            {/* Slug */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>URL Slug</h3>
              </div>
              <div className={styles.cardContent}>
                <FormField
                  label="Slug"
                  name="slug"
                  id="slug"
                  required
                  placeholder="best-noon-coupons-2025"
                  helpText="Shared across all locales. Auto-generated from EN title."
                />
              </div>
            </div>

            {/* Author & Category */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Author & Category</h3>
              </div>
              <div className={styles.cardContent}>
                <FormField label="Author"   name="authorId"   type="select" options={authorOptions}   />
                <FormField label="Category" name="categoryId" type="select" options={categoryOptions} />
              </div>
            </div>

            {/* Featured image */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Featured Image</h3>
              </div>
              <div className={styles.cardContent}>
                <FormField
                  label="Image URL"
                  name="featuredImage"
                  type="url"
                  placeholder="https://cdn.cobonat.me/blog/..."
                />
              </div>
            </div>

            {/* Tags */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Tags</h3>
              </div>
              <div className={styles.cardContent}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                  Select existing tags for this post.
                </p>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tags.map(tag => (
                    <label key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" name="tagSlugs" value={tag.slug} />
                      {tag.translations?.[0]?.name || tag.slug}
                      <span style={{ color: '#aaa', fontSize: 11 }}>({tag._count?.posts || 0})</span>
                    </label>
                  ))}
                </div>
                {tags.length === 0 && (
                  <p style={{ fontSize: 12, color: '#aaa' }}>No tags yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: slugScript }} />
    </div>
  );
}
