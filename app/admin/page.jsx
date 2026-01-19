// app/admin/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch basic counts
        const [storesRes, vouchersRes, countriesRes, categoriesRes] = await Promise.all([
          fetch('/api/admin/stores?locale=en'),
          fetch('/api/admin/vouchers?locale=en'),
          fetch('/api/admin/countries?locale=en'),
          fetch('/api/admin/categories?locale=en')
        ]);

        const stores = await storesRes.json();
        const vouchers = await vouchersRes.json();
        const countries = await countriesRes.json();
        const categories = await categoriesRes.json();

        const now = new Date();
        const activeVouchers = vouchers.filter(v => 
          !v.expiryDate || new Date(v.expiryDate) >= now
        );

        setStats({
          stores: {
            total: stores.length,
            active: stores.filter(s => s.isActive).length
          },
          vouchers: {
            total: vouchers.length,
            active: activeVouchers.length,
            expired: vouchers.length - activeVouchers.length
          },
          countries: countries.countries?.length || 0,
          categories: categories.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <h1>Admin Dashboard</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats?.stores.active || 0}</div>
          <div className={styles.statLabel}>Active Stores</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 5 }}>
            {stats?.stores.total || 0} total
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats?.vouchers.active || 0}</div>
          <div className={styles.statLabel}>Active Vouchers</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 5 }}>
            {stats?.vouchers.total || 0} total
          </div>
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

      <div style={{ marginTop: 40 }}>
        <h2 style={{ marginBottom: 20 }}>Quick Actions</h2>
        <div className={styles.grid}>
          <Link href="/admin/stores" className={styles.card} style={{ textDecoration: 'none' }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Manage Stores</h3>
            </div>
            <div className={styles.cardContent}>
              View and manage all stores
            </div>
          </Link>

          <Link href="/admin/vouchers" className={styles.card} style={{ textDecoration: 'none' }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Manage Vouchers</h3>
            </div>
            <div className={styles.cardContent}>
              Create and edit vouchers
            </div>
          </Link>

          <Link href="/admin/categories" className={styles.card} style={{ textDecoration: 'none' }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Categories</h3>
            </div>
            <div className={styles.cardContent}>
              Organize stores by category
            </div>
          </Link>

          <Link href="/admin/countries" className={styles.card} style={{ textDecoration: 'none' }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Countries</h3>
            </div>
            <div className={styles.cardContent}>
              Manage supported countries
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}