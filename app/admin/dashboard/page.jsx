// app/admin/dashboard/page.jsx
// THE canonical admin dashboard. The navbar links here (/admin/dashboard).
// app/admin/page.jsx should simply redirect here (see redirect file).
// This replaces the old stub that only showed 4 basic stats.

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from '../admin.module.css';

export const metadata = { title: 'Dashboard | Admin' };

// Re-use the same font/icon imports as the layout (no extra stylesheet needed).

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) redirect('/admin/login');

  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalStores, activeStores,
    totalVouchers, activeVouchers,
    totalClicks, recentClicks,
    totalCategories, totalCountries,
    curatedCount,
    blogTotal, blogPublished, blogDraft,
  ] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { isActive: true } }),
    prisma.voucher.count(),
    prisma.voucher.count({
      where: { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] },
    }),
    prisma.voucherClick.count(),
    prisma.voucherClick.count({ where: { clickedAt: { gte: monthAgo } } }),
    prisma.category.count(),
    prisma.country.count({ where: { isActive: true } }),
    prisma.curatedOffer.count(),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
    prisma.blogPost.count({ where: { status: 'DRAFT' } }),
  ]);

  const stats = [
    { label: 'Active Stores',   value: activeStores,   sub: `${totalStores} total`,   href: '/admin/stores',   color: '#2563eb' },
    { label: 'Active Vouchers', value: activeVouchers,  sub: `${totalVouchers} total`, href: '/admin/vouchers', color: '#7c3aed' },
    { label: 'Clicks (30 d)',   value: recentClicks.toLocaleString(), sub: `${totalClicks.toLocaleString()} all-time`, href: null, color: '#0891b2' },
    { label: 'Categories',      value: totalCategories, sub: null,                     href: '/admin/categories', color: '#059669' },
    { label: 'Countries',       value: totalCountries,  sub: 'active',                 href: '/admin/countries',  color: '#d97706' },
    { label: 'Curated Offers',  value: curatedCount,    sub: 'on homepage',            href: '/admin/curated-offers', color: '#e11d48' },
  ];

  const blogStats = [
    { label: 'Total Posts',  value: blogTotal,     href: '/admin/blog' },
    { label: 'Published',    value: blogPublished, href: '/admin/blog?status=published' },
    { label: 'Drafts',       value: blogDraft,     href: '/admin/blog?status=draft' },
  ];

  const actions = [
    { label: 'Add Store',      href: '/admin/stores?create=true',   icon: 'add_business' },
    { label: 'Add Voucher',    href: '/admin/vouchers?create=true',  icon: 'add_card' },
    { label: 'Leaderboard',   href: '/admin/leaderboard',           icon: 'leaderboard' },
    { label: 'New Blog Post',  href: '/admin/blog/new',             icon: 'edit_note' },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <h1>Dashboard</h1>
      </div>

      {/* ── Main stats ──────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {stats.map(s => {
          const inner = (
            <>
              <div className={styles.statNumber} style={{ color: s.color }}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
              {s.sub && <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: '0.2rem' }}>{s.sub}</div>}
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className={styles.statCard} style={{ textDecoration: 'none' }}>
              {inner}
            </Link>
          ) : (
            <div key={s.label} className={styles.statCard}>{inner}</div>
          );
        })}
      </div>

      {/* ── Blog stats ──────────────────────────────────────────── */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text)', margin: '1.5rem 0 0.75rem' }}>
        Blog
      </h2>
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '540px' }}>
        {blogStats.map(s => (
          <Link key={s.label} href={s.href} className={styles.statCard} style={{ textDecoration: 'none' }}>
            <div className={styles.statNumber}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* ── Quick actions ────────────────────────────────────────── */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text)', margin: '1.5rem 0 0.75rem' }}>
        Quick Actions
      </h2>
      <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', maxWidth: '800px' }}>
        {actions.map(a => (
          <Link
            key={a.href}
            href={a.href}
            className={styles.card}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '1rem 1.25rem' }}
          >
            <span className="material-symbols-sharp" style={{ fontSize: '1.3rem', color: 'var(--admin-primary)' }}>{a.icon}</span>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--admin-text)' }}>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
