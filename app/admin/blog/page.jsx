// app/admin/blog/page.jsx
import Link from 'next/link';
import { getBlogPosts, getBlogDashboardStats } from '@/app/admin/_lib/queries';
import { deleteBlogPost } from '@/app/admin/_lib/blog-actions';
import { DataTable } from '@/app/admin/_components/DataTable';
import styles from '../admin.module.css';

export const metadata = { title: 'Blog Posts | Admin' };

// ── Status badge helper ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PUBLISHED: { label: 'Published', bg: '#d1fae5', color: '#065f46' },
    DRAFT:     { label: 'Draft',     bg: '#fef3c7', color: '#92400e' },
    ARCHIVED:  { label: 'Archived',  bg: '#f3f4f6', color: '#6b7280' }
  };
  const s = map[status] || map.DRAFT;
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 12, fontSize: 12,
      fontWeight: 600, background: s.bg, color: s.color
    }}>
      {s.label}
    </span>
  );
}

export default async function BlogPage({ searchParams }) {
  const { status: statusFilter } = await searchParams;
  const [posts, stats] = await Promise.all([
    getBlogPosts('en'),
    getBlogDashboardStats()
  ]);

  // Apply status filter server-side
  const filtered = statusFilter
    ? posts.filter(p => p.status === statusFilter.toUpperCase())
    : posts;

  const tableData = filtered.map(post => {
    const t = post.translations?.[0] || {};
    return {
      id:       post.id,
      title:    t.title || '—',
      slug:     post.slug,
      status:   post.status,
      category: post.category?.translations?.[0]?.name || '—',
      author:   post.author?.name || '—',
      featured: post.isFeatured,
      tags:     post.tags?.length || 0,
      date:     post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('en-GB')
        : '—'
    };
  });

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{val}</span>
      )
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (val) => (
        <code style={{ fontSize: 11, background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
          {val}
        </code>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    { key: 'category', label: 'Category' },
    { key: 'author',   label: 'Author' },
    {
      key: 'featured',
      label: 'Featured',
      render: (val) => val ? (
        <span style={{ color: '#f59e0b', fontWeight: 700 }}>★</span>
      ) : '—'
    },
    { key: 'tags', label: 'Tags' },
    { key: 'date', label: 'Published' }
  ];

  return (
    <div className={styles.page}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Blog Posts</h1>
          <p style={{ color: '#666', marginTop: 4, fontSize: 14 }}>
            {stats.total} total · {stats.published} published · {stats.draft} draft
          </p>
        </div>
        <Link href="/admin/blog/new" className={styles.btnPrimary}>
          + New Post
        </Link>
      </div>

      {/* ── Quick stats ── */}
      <div className={styles.statsGrid} style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Posts',     value: stats.total,      href: '/admin/blog' },
          { label: 'Published',       value: stats.published,  href: '/admin/blog?status=published' },
          { label: 'Drafts',          value: stats.draft,      href: '/admin/blog?status=draft' },
          { label: 'Categories',      value: stats.categories, href: '/admin/blog/categories' },
          { label: 'Authors',         value: stats.authors,    href: '/admin/blog/authors' },
        ].map(s => (
          <Link key={s.label} href={s.href} className={styles.statCard} style={{ textDecoration: 'none' }}>
            <div className={styles.statNumber}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* ── Status filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'All',       value: '' },
          { label: 'Published', value: 'published' },
          { label: 'Draft',     value: 'draft' },
          { label: 'Archived',  value: 'archived' }
        ].map(tab => {
          const isActive = (statusFilter || '') === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/blog?status=${tab.value}` : '/admin/blog'}
              style={{
                padding: '6px 16px', borderRadius: 20,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                background: isActive ? '#470ae2' : '#f0f0f0',
                color: isActive ? '#fff' : '#555'
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* ── Sub-nav ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/blog/categories" style={{ fontSize: 13, color: '#470ae2', textDecoration: 'none', fontWeight: 500 }}>
          Manage Categories →
        </Link>
        <Link href="/admin/blog/authors" style={{ fontSize: 13, color: '#470ae2', textDecoration: 'none', fontWeight: 500 }}>
          Manage Authors →
        </Link>
      </div>

      {/* ── Data table ── */}
      <DataTable
        data={tableData}
        columns={columns}
        editUrl="/admin/blog/:id"
        deleteAction={deleteBlogPost}
        searchable={true}
        searchPlaceholder="Search posts..."
      />
    </div>
  );
}
