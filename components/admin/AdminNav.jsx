// components/admin/AdminNav.jsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import logo from '@/public/coubonat.png';
import './AdminNav.css';

const NAV = [
  { label: 'Dashboard',       icon: 'dashboard',       href: '/admin/dashboard' },

  { label: '─', separator: true },
  { label: 'Stores',          icon: 'storefront',      href: '/admin/stores' },
  { label: 'Leaderboard',     icon: 'leaderboard',     href: '/admin/leaderboard' },
  { label: 'Vouchers',        icon: 'local_offer',     href: '/admin/vouchers' },
  { label: 'Curated Offers',  icon: 'auto_awesome',    href: '/admin/curated-offers' },
  { label: 'Offer Stacks',    icon: 'layers',          href: '/admin/stacks',},
  { label: 'Categories',      icon: 'category',        href: '/admin/categories' },
  { label: 'Countries',       icon: 'public',          href: '/admin/countries' },
  { label: 'Payment Methods', icon: 'payments',        href: '/admin/payment-methods' },

  { label: '─', separator: true },
  { label: 'Seasonal Pages',           icon: 'percent_discount', href: '/admin/seasonal-pages' },  // ← new

  { label: '─', separator: true },
  { label: 'Banks',           icon: 'account_balance', href: '/admin/banks' },  // ← new

  { label: '─', separator: true },
  { label: 'Blog Posts',      icon: 'edit_note',       href: '/admin/blog' },
  { label: 'Categories & Tags', icon: 'sell',          href: '/admin/blog/categories' },
  { label: 'Authors',         icon: 'manage_accounts', href: '/admin/blog/authors' },
  { label: 'New Post',        icon: 'add_circle',      href: '/admin/blog/new' },
];


export default function AdminNav({ user }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * Active-state rules:
   *  - /admin/blog → active for pathname === /admin/blog OR /admin/blog/edit/…
   *    (NOT for /admin/blog/categories or /admin/blog/authors)
   *  - /admin/stores → active for /admin/stores ONLY — NOT for /admin/stores/123/…
   *    because intelligence/offers sub-pages should not highlight "Stores"
   *  - /admin/leaderboard → active for /admin/leaderboard AND /admin/leaderboard/methodology
   *  - All other items: exact match or direct child
   */
  function isActive(href) {
    if (href === '/admin/blog') {
      return pathname === '/admin/blog' || pathname.startsWith('/admin/blog/edit');
    }
    if (href === '/admin/stores') {
      // Only exact /admin/stores or /admin/stores?… (list page)
      return pathname === '/admin/stores';
    }
    if (href === '/admin/leaderboard') {
      return pathname === '/admin/leaderboard' || pathname.startsWith('/admin/leaderboard/');
    }
    if (href === '/admin/banks') {
      return pathname === '/admin/banks' || pathname.startsWith('/admin/banks/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const navLinks = NAV.filter(item => !item.separator);

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Link href="/admin/dashboard" className="sidebar-logo">
            <Image src={logo} alt="Logo" width={110} height={20} priority />
            <span className="admin-badge">ADMIN</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) =>
            item.separator ? (
              <div key={i} style={{ height: '1px', background: 'var(--admin-border)', margin: '0.5rem 0' }} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${isActive(item.href) ? ' active' : ''}`}
              >
                <span className="material-symbols-sharp">{item.icon}</span>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <span className="material-symbols-sharp">person</span>
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name || user?.email || 'Admin'}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
          <button className="logout-btn" onClick={() => signOut({ callbackUrl: '/admin/login' })}>
            <span className="material-symbols-sharp">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ───────────────────────────────────────────── */}
      <header className="admin-mobile-header">
        <Link href="/admin/dashboard" className="sidebar-logo">
          <Image src={logo} alt="Logo" width={90} height={16} priority />
        </Link>
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
          <span className="material-symbols-sharp">{mobileOpen ? 'close' : 'menu'}</span>
        </button>
      </header>

      {/* ── Mobile Slide Menu ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="mobile-menu" onClick={() => setMobileOpen(false)}>
          <nav className="mobile-nav">
            {navLinks.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item${isActive(item.href) ? ' active' : ''}`}
              >
                <span className="material-symbols-sharp">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mobile-menu-footer">
            <button className="mobile-logout-btn" onClick={() => signOut({ callbackUrl: '/admin/login' })}>
              <span className="material-symbols-sharp">logout</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
