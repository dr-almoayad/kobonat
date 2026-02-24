// app/admin/blog/[id]/page.jsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost, getBlogAuthors, getBlogCategories, getBlogTags } from '@/app/admin/_lib/queries';
import { updateBlogPost, deleteBlogPost } from '@/app/admin/_lib/blog-actions';
import { FormField, FormRow, FormSection } from '@/app/admin/_components/FormField';
import BlogDeleteButton from '@/app/admin/blog/_components/BlogDeleteButton';
import styles from '../../admin.module.css';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const post = await getBlogPost(id, 'en');
  return { title: `Edit: ${post?.translations?.[0]?.title || id} | Admin` };
}

export default async function EditBlogPostPage({ params }) {
  const { id } = await params;

  const [post, authors, categories, tags] = await Promise.all([
    getBlogPost(id, 'en'),
    getBlogAuthors(),
    getBlogCategories('en'),
    getBlogTags('en')
  ]);

  if (!post) notFound();

  const tEn = post.translations?.find(t => t.locale === 'en') || {};
  const tAr = post.translations?.find(t => t.locale === 'ar') || {};

  const activeTags = new Set(post.tags?.map(pt => pt.tag.slug) || []);

  async function handleUpdate(formData) {
    'use server';
    const result = await updateBlogPost(id, formData);
    if (result?.error) {
      console.error('updateBlogPost failed:', result.error);
      return;
    }
    redirect('/admin/blog');
  }

  async function handleDelete() {
    'use server';
    await deleteBlogPost(id);
    redirect('/admin/blog');
  }

  const authorOptions = [
    { value: '', label: '— No Author —' },
    ...authors.map(a => ({ value: a.id, label: a.name }))
  ];

  const categoryOptions = [
    { value: '', label: '— No Category —' },
    ...categories.map(c => ({ value: c.id, label: c.translations?.[0]?.name || c.slug }))
  ];

  const statusOptions = [
    { value: 'DRAFT',     label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED',  label: 'Archived' }
  ];

  const publishedAtForInput = post.publishedAt
    ? new Date(post.publishedAt).toISOString().slice(0, 16)
    : '';

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Edit Post</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
            ID: {post.id} · Slug: <code style={{ background: '#f5f5f5', padding: '1px 6px', borderRadius: 4 }}>{post.slug}</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/ar-SA/blog/${post.slug}`}
            target="_blank"
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e5e5', textDecoration: 'none', fontSize: 13 }}
          >
            Preview →
          </Link>
          {/* Delete button — client component handles the confirm() dialog */}
          <form action={handleDelete}>
            <BlogDeleteButton label="Delete Post" confirmMessage="Delete this post permanently? This cannot be undone." />
          </form>
        </div>
      </div>

      <form action={handleUpdate}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Content ── */}
          <div>
            <FormSection title="English Content">
              <FormField
                label="Title (EN)"
                name="title_en"
                required
                defaultValue={tEn.title}
              />
              <FormField
                label="Excerpt (EN)"
                name="excerpt_en"
                type="textarea"
                rows={3}
                required
                defaultValue={tEn.excerpt}
              />
              <FormField
                label="Content (EN)"
                name="content_en"
                type="textarea"
                rows={18}
                defaultValue={tEn.content}
              />
              <FormRow>
                <FormField
                  label="Meta Title (EN)"
                  name="metaTitle_en"
                  defaultValue={tEn.metaTitle}
                />
                <FormField
                  label="Meta Description (EN)"
                  name="metaDescription_en"
                  defaultValue={tEn.metaDescription}
                />
              </FormRow>
            </FormSection>

            <FormSection title="Arabic Content (المحتوى بالعربية)">
              <FormField
                label="العنوان (AR)"
                name="title_ar"
                dir="rtl"
                defaultValue={tAr.title}
              />
              <FormField
                label="الملخص (AR)"
                name="excerpt_ar"
                type="textarea"
                rows={3}
                dir="rtl"
                defaultValue={tAr.excerpt}
              />
              <FormField
                label="المحتوى (AR)"
                name="content_ar"
                type="textarea"
                rows={18}
                dir="rtl"
                defaultValue={tAr.content}
              />
              <FormRow>
                <FormField
                  label="عنوان SEO (AR)"
                  name="metaTitle_ar"
                  dir="rtl"
                  defaultValue={tAr.metaTitle}
                />
                <FormField
                  label="وصف SEO (AR)"
                  name="metaDescription_ar"
                  dir="rtl"
                  defaultValue={tAr.metaDescription}
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
                  defaultValue={post.status}
                  options={statusOptions}
                />
                <FormField
                  label="Publish Date"
                  name="publishedAt"
                  type="datetime-local"
                  defaultValue={publishedAtForInput}
                />
                <FormField
                  label="Featured Post"
                  name="isFeatured"
                  type="checkbox"
                  defaultValue={post.isFeatured}
                  helpText="Show in homepage featured section"
                />
                <button type="submit" className={styles.btnPrimary} style={{ width: '100%', marginTop: 12 }}>
                  Save Changes
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
                  required
                  defaultValue={post.slug}
                  helpText="Changing this breaks existing links"
                />
              </div>
            </div>

            {/* Author & Category */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Author & Category</h3>
              </div>
              <div className={styles.cardContent}>
                <FormField
                  label="Author"
                  name="authorId"
                  type="select"
                  defaultValue={post.authorId || ''}
                  options={authorOptions}
                />
                <FormField
                  label="Category"
                  name="categoryId"
                  type="select"
                  defaultValue={post.categoryId || ''}
                  options={categoryOptions}
                />
              </div>
            </div>

            {/* Featured image */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Featured Image</h3>
              </div>
              <div className={styles.cardContent}>
                {post.featuredImage && (
                  <img
                    src={post.featuredImage}
                    alt="Featured"
                    style={{ width: '100%', borderRadius: 8, marginBottom: 8, objectFit: 'cover', maxHeight: 120 }}
                  />
                )}
                <FormField
                  label="Image URL"
                  name="featuredImage"
                  type="url"
                  defaultValue={post.featuredImage || ''}
                />
              </div>
            </div>

            {/* Tags */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Tags</h3>
              </div>
              <div className={styles.cardContent}>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tags.map(tag => (
                    <label key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="tagSlugs"
                        value={tag.slug}
                        defaultChecked={activeTags.has(tag.slug)}
                      />
                      {tag.translations?.[0]?.name || tag.slug}
                      <span style={{ color: '#aaa', fontSize: 11 }}>({tag._count?.posts || 0})</span>
                    </label>
                  ))}
                </div>
                {tags.length === 0 && (
                  <p style={{ fontSize: 12, color: '#aaa' }}>
                    No tags yet. <Link href="/admin/blog/categories" style={{ color: '#470ae2' }}>Create tags →</Link>
                  </p>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Info</h3>
              </div>
              <div className={styles.cardContent} style={{ fontSize: 12, color: '#777', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>Created: {new Date(post.createdAt).toLocaleString('en-GB')}</div>
                <div>Updated: {new Date(post.updatedAt).toLocaleString('en-GB')}</div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
