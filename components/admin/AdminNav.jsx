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
      icon: 'storefront', // Good! Alternative: 'store' or 'shopping_bag'
      href: '/admin/stores'
    },
    {
      label: 'Vouchers',
      icon: 'local_offer', // Good! Alternative: 'coupon' or 'confirmation_number'
      href: '/admin/vouchers'
    },
    {
      label: 'Categories',
      icon: 'category', // Good! Alternative: 'list' or 'folder'
      href: '/admin/categories'
    },
    {
      label: 'Countries',
      icon: 'public', // Good! Alternative: 'language' or 'map'
      href: '/admin/countries'
    },
    {
      label: 'Payment Methods',
      icon: 'payments', // Better: 'payments' (plural) is more specific
      href: '/admin/payment-methods'
    },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' });
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
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <span class="material-symbols-sharp">person</span>
            </div>
            <div className="user-details">
              <div className="user-name">{user.name || 'Admin'}</div>
              <div className="user-role">{user.role}</div>
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
                className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}
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
