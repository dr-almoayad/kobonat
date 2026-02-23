// app/admin/blog/authors/page.jsx
import { getBlogAuthors, getBlogAuthor } from '@/app/admin/_lib/queries';
import { upsertBlogAuthor, deleteBlogAuthor } from '@/app/admin/_lib/blog-actions';
import { DataTable } from '@/app/admin/_components/DataTable';
import { FormField, FormRow, FormSection } from '@/app/admin/_components/FormField';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../admin.module.css';

export const metadata = { title: 'Blog Authors | Admin' };

export default async function BlogAuthorsPage({ searchParams }) {
  const { edit } = await searchParams;

  const authors = await getBlogAuthors();
  const editingAuthor = edit ? await getBlogAuthor(edit) : null;

  const tableData = authors.map(a => ({
    id:     a.id,
    name:   a.name,
    nameAr: a.nameAr || '—',
    twitter:a.twitterHandle || '—',
    posts:  a._count?.posts || 0,
    avatar: a.avatar
  }));

  const columns = [
    {
      key: 'avatar',
      label: '',
      sortable: false,
      render: (val, row) => val ? (
        <img src={val} alt={row.name} width={36} height={36}
          style={{ borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle' }}
        />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#470ae2', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14
        }}>
          {row.name?.[0]?.toUpperCase()}
        </div>
      )
    },
    { key: 'name',   label: 'Name (EN)', render: (val) => <strong>{val}</strong> },
    { key: 'nameAr', label: 'Name (AR)' },
    {
      key: 'twitter',
      label: 'Twitter',
      render: (val) => val !== '—' ? (
        <a href={`https://twitter.com/${val}`} target="_blank" rel="noopener noreferrer"
          style={{ color: '#470ae2', textDecoration: 'none' }}>
          @{val}
        </a>
      ) : '—'
    },
    { key: 'posts', label: 'Posts' }
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
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

                {/* Avatar preview */}
                {editingAuthor?.avatar && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <img
                      src={editingAuthor.avatar}
                      alt={editingAuthor.name}
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <FormRow>
                  <FormField
                    label="Name (EN)"
                    name="name"
                    required
                    defaultValue={editingAuthor?.name || ''}
                    placeholder="Sara Al-Rashidi"
                  />
                  <FormField
                    label="Name (AR)"
                    name="nameAr"
                    dir="rtl"
                    defaultValue={editingAuthor?.nameAr || ''}
                    placeholder="سارة الراشدي"
                  />
                </FormRow>

                <FormField
                  label="Avatar URL"
                  name="avatar"
                  type="url"
                  defaultValue={editingAuthor?.avatar || ''}
                  placeholder="https://cdn.cobonat.me/authors/..."
                />

                <FormField
                  label="Twitter Handle"
                  name="twitterHandle"
                  defaultValue={editingAuthor?.twitterHandle || ''}
                  placeholder="cobonatme"
                  helpText="Without the @ symbol"
                />

                <FormField
                  label="Bio (EN)"
                  name="bio"
                  type="textarea"
                  rows={3}
                  defaultValue={editingAuthor?.bio || ''}
                  placeholder="Savings expert covering Middle East e-commerce deals."
                />

                <FormField
                  label="Bio (AR)"
                  name="bioAr"
                  type="textarea"
                  rows={3}
                  dir="rtl"
                  defaultValue={editingAuthor?.bioAr || ''}
                  placeholder="خبيرة توفير تغطي عروض التجارة الإلكترونية في الشرق الأوسط."
                />

                <button type="submit" className={styles.btnPrimary} style={{ width: '100%', marginTop: 8 }}>
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
