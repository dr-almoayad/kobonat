// app/admin/page.jsx — Updated with Blog stats section
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [blogStats, setBlogStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [storesRes, vouchersRes, countriesRes, categoriesRes, blogRes] = await Promise.all([
          fetch('/api/admin/stores?locale=en'),
          fetch('/api/admin/vouchers?locale=en'),
          fetch('/api/admin/countries?locale=en'),
          fetch('/api/admin/categories?locale=en'),
          fetch('/api/admin/blog?locale=en')
        ]);

        const stores     = await storesRes.json();
        const vouchers   = await vouchersRes.json();
        const countries  = await countriesRes.json();
        const categories = await categoriesRes.json();
        const blogPosts  = await blogRes.json();

        const now = new Date();
        const activeVouchers = Array.isArray(vouchers)
          ? vouchers.filter(v => !v.expiryDate || new Date(v.expiryDate) >= now)
          : [];

        setStats({
          stores:    { total: stores.length, active: stores.filter(s => s.isActive).length },
          vouchers:  { total: vouchers.length, active: activeVouchers.length, expired: vouchers.length - activeVouchers.length },
          countries: countries.countries?.length || 0,
          categories:categories.length
        });

        // Blog stats from the fetched posts
        if (Array.isArray(blogPosts)) {
          const published = blogPosts.filter(p => p.status === 'PUBLISHED').length;
          const draft     = blogPosts.filter(p => p.status === 'DRAFT').length;
          const featured  = blogPosts.filter(p => p.isFeatured).length;
          setBlogStats({ total: blogPosts.length, published, draft, featured });
        }

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <div className={styles.page}>Loading...</div>;

  return (
    <div className={styles.page}>
      <h1>Admin Dashboard</h1>

      {/* ── Core stats ───────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats?.stores.active || 0}</div>
          <div className={styles.statLabel}>Active Stores</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 5 }}>{stats?.stores.total || 0} total</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats?.vouchers.active || 0}</div>
          <div className={styles.statLabel}>Active Vouchers</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 5 }}>{stats?.vouchers.total || 0} total</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats?.countries || 0}</div>
          <div className={styles.statLabel}>Countries</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats?.categories || 0}</div>
          <div className={styles.statLabel}>Categories</div>
        </div>
      </div>

      {/* ── Blog stats ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: 40, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Blog</h2>
          <Link href="/admin/blog/new" className={styles.btnPrimary} style={{ textDecoration: 'none', padding: '8px 16px' }}>
            + New Post
          </Link>
        </div>

        <div className={styles.statsGrid}>
          <Link href="/admin/blog" className={styles.statCard} style={{ textDecoration: 'none' }}>
            <div className={styles.statNumber}>{blogStats?.total || 0}</div>
            <div className={styles.statLabel}>Total Posts</div>
          </Link>
          <Link href="/admin/blog?status=published" className={styles.statCard} style={{ textDecoration: 'none' }}>
            <div className={styles.statNumber} style={{ color: '#059669' }}>{blogStats?.published || 0}</div>
            <div className={styles.statLabel}>Published</div>
          </Link>
          <Link href="/admin/blog?status=draft" className={styles.statCard} style={{ textDecoration: 'none' }}>
            <div className={styles.statNumber} style={{ color: '#d97706' }}>{blogStats?.draft || 0}</div>
            <div className={styles.statLabel}>Drafts</div>
          </Link>
          <div className={styles.statCard}>
            <div className={styles.statNumber} style={{ color: '#f59e0b' }}>★ {blogStats?.featured || 0}</div>
            <div className={styles.statLabel}>Featured</div>
          </div>
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 20 }}>Quick Actions</h2>
        <div className={styles.grid}>

          {/* Store management */}
          <Link href="/admin/stores" className={styles.card} style={{ textDecoration: 'none' }}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Manage Stores</h3></div>
            <div className={styles.cardContent}>View and manage all stores</div>
          </Link>

          <Link href="/admin/vouchers" className={styles.card} style={{ textDecoration: 'none' }}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Manage Vouchers</h3></div>
            <div className={styles.cardContent}>Create and edit vouchers</div>
          </Link>

          <Link href="/admin/categories" className={styles.card} style={{ textDecoration: 'none' }}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Store Categories</h3></div>
            <div className={styles.cardContent}>Organize stores by category</div>
          </Link>

          <Link href="/admin/countries" className={styles.card} style={{ textDecoration: 'none' }}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Countries</h3></div>
            <div className={styles.cardContent}>Manage supported countries</div>
          </Link>

          {/* Blog management */}
          <Link href="/admin/blog" className={styles.card} style={{ textDecoration: 'none', borderLeft: '4px solid #470ae2' }}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>📝 Blog Posts</h3></div>
            <div className={styles.cardContent}>Write and manage blog articles</div>
          </Link>

          <Link href="/admin/blog/categories" className={styles.card} style={{ textDecoration: 'none', borderLeft: '4px solid #470ae2' }}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>🏷️ Blog Categories & Tags</h3></div>
            <div className={styles.cardContent}>Organize blog content</div>
          </Link>

          <Link href="/admin/blog/authors" className={styles.card} style={{ textDecoration: 'none', borderLeft: '4px solid #470ae2' }}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>✍️ Authors</h3></div>
            <div className={styles.cardContent}>Manage blog author profiles</div>
          </Link>

          <Link href="/admin/blog/new" className={styles.card} style={{ textDecoration: 'none', borderLeft: '4px solid #059669' }}>
            <div className={styles.cardHeader}><h3 className={styles.cardTitle}>+ New Blog Post</h3></div>
            <div className={styles.cardContent}>Start writing a new article</div>
          </Link>

        </div>
      </div>
    </div>
  );
}
