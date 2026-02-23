// =============================================================================
// components/admin/AdminNav.jsx - Admin Navigation
// =============================================================================
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import logo from '@/public/coubonat.png';
import './AdminNav.css';

export default function AdminNav({ user }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      href: '/admin/dashboard'
    },
    {
      label: 'Stores',
      icon: 'storefront',
      href: '/admin/stores'
    },
    {
      label: 'Vouchers',
      icon: 'local_offer', 
      href: '/admin/vouchers'
    },
    {
      label: 'Curated Offers',
      icon: 'auto_awesome',
      href: '/admin/curated-offers'
    },
    {
      label: 'Categories',
      icon: 'category',
      href: '/admin/categories'
    },
    {
      label: 'Countries',
      icon: 'public', 
      href: '/admin/countries'
    },
    {
      label: 'Payment Methods',
      icon: 'payments',
      href: '/admin/payment-methods'
    },
    // --- BLOG SECTION ---
    {
      label: 'Blog Posts',
      icon: 'edit_note',
      href: '/admin/blog'
    },
    {
      label: 'Categories & Tags',
      icon: 'sell',
      href: '/admin/blog/categories'
    },
    {
      label: 'Authors',
      icon: 'manage_accounts',
      href: '/admin/blog/authors'
    },
    {
      label: 'New Post',
      icon: 'add_circle',
      href: '/admin/blog/new'
    }
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  // Smart active state handler (keeps "Blog Posts" active when editing a post)
  const isItemActive = (href) => {
    if (href === '/admin/blog') {
      return pathname === href || pathname.startsWith('/admin/blog/edit');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Link href="/admin/dashboard" className="sidebar-logo">
            <Image src={logo} alt="Logo" width={110} height={20} />
            <span className="admin-badge">ADMIN</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isItemActive(item.href) ? 'active' : ''}`}
            >
              {/* Added the missing icon rendering for desktop */}
              <span className="material-symbols-sharp">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <span className="material-symbols-sharp">person</span>
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'Admin'}</div>
              <div className="user-role">{user?.role || 'ADMIN'}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="logout-btn">
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <Link href="/admin/dashboard" className="mobile-logo">
          <Image src={logo} alt="Logo" width={100} height={24} />
        </Link>
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-symbols-sharp">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item ${isItemActive(item.href) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-sharp">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mobile-menu-footer">
            <button onClick={handleSignOut} className="mobile-logout-btn">
              <span className="material-symbols-sharp">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
