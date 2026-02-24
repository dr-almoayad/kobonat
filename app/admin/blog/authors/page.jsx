// app/admin/blog/authors/page.jsx
import { getBlogAuthors, getBlogAuthor } from '@/app/admin/_lib/queries';
import { upsertBlogAuthor, deleteBlogAuthor } from '@/app/admin/_lib/blog-actions';
import { DataTable } from '@/app/admin/_components/DataTable';
import { FormField, FormRow } from '@/app/admin/_components/FormField';
import Link from 'next/link';
import styles from '../../admin.module.css';

export const metadata = { title: 'Blog Authors | Admin' };

export default async function BlogAuthorsPage({ searchParams }) {
  const { edit } = await searchParams;

  const authors      = await getBlogAuthors();
  const editingAuthor = edit ? await getBlogAuthor(edit) : null;

  // Pre-compute display values as plain strings — no JSX, no functions.
  const tableData = authors.map(a => ({
    id:      a.id,
    initial: a.name?.[0]?.toUpperCase() || '?',   // avatar fallback letter
    name:    a.name,
    nameAr:  a.nameAr || '—',
    twitter: a.twitterHandle ? `@${a.twitterHandle}` : '—',
    posts:   a._count?.posts ?? 0,
  }));

  const columns = [
    { key: 'initial', label: ''          },  // avatar initial — DataTable just shows the string
    { key: 'name',    label: 'Name (EN)' },
    { key: 'nameAr',  label: 'Name (AR)' },
    { key: 'twitter', label: 'Twitter'   },
    { key: 'posts',   label: 'Posts'     },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Blog Authors</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
            {authors.length} author{authors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/admin/blog" style={{ fontSize: 13, color: '#470ae2', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to Posts
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32, alignItems: 'start' }}>

        {/* ── LEFT: Create / Edit form ── */}
        <div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                {editingAuthor ? `Edit: ${editingAuthor.name}` : 'New Author'}
              </h3>
              {editingAuthor && (
                <Link href="/admin/blog/authors" style={{ fontSize: 12, color: '#888' }}>Cancel</Link>
              )}
            </div>
            <div className={styles.cardContent}>
              <form action={upsertBlogAuthor}>
                {editingAuthor && (
                  <input type="hidden" name="authorId" value={editingAuthor.id} />
                )}
                <FormRow>
                  <FormField
                    label="Name (EN)" name="name" required
                    defaultValue={editingAuthor?.name || ''}
                    placeholder="Ahmed Al-Rashidi"
                  />
                  <FormField
                    label="Name (AR)" name="nameAr" dir="rtl"
                    defaultValue={editingAuthor?.nameAr || ''}
                    placeholder="أحمد الراشدي"
                  />
                </FormRow>
                <FormField
                  label="Avatar URL" name="avatar" type="url"
                  defaultValue={editingAuthor?.avatar || ''}
                  placeholder="https://cdn.cobonat.me/authors/ahmed.jpg"
                  helpText="Square image, at least 100×100px"
                />
                {/* Live avatar preview */}
                {editingAuthor?.avatar && (
                  <div style={{ marginBottom: 12 }}>
                    <img
                      src={editingAuthor.avatar}
                      alt={editingAuthor.name}
                      width={60} height={60}
                      style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e5e5' }}
                    />
                  </div>
                )}
                <FormField
                  label="Twitter Handle" name="twitterHandle"
                  defaultValue={editingAuthor?.twitterHandle || ''}
                  placeholder="username (no @)"
                  helpText="Used for schema.org sameAs markup"
                />
                <FormField
                  label="Bio (EN)" name="bio" type="textarea" rows={3}
                  defaultValue={editingAuthor?.bio || ''}
                  placeholder="Short bio shown on the blog post page"
                />
                <FormField
                  label="Bio (AR)" name="bioAr" type="textarea" rows={3} dir="rtl"
                  defaultValue={editingAuthor?.bioAr || ''}
                  placeholder="نبذة قصيرة تظهر في صفحة المقال"
                />
                <button type="submit" className={styles.btnPrimary}>
                  {editingAuthor ? 'Update Author' : 'Create Author'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Authors table ── */}
        <div>
          <DataTable
            data={tableData}
            columns={columns}
            editUrl="/admin/blog/authors?edit=:id"
            deleteAction={deleteBlogAuthor}
            searchable={true}
            searchPlaceholder="Search authors..."
          />
        </div>
      </div>
    </div>
  );
}
