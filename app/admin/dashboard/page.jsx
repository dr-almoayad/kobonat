// app/admin/dashboard/page.jsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import './dashboard.css';

export default async function AdminDashboard() {
  // Check session directly in the page for extra safety
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.isAdmin) {
    redirect('/admin/login');
  }

  // Fetch dashboard stats
  const now = new Date();
  const [
    totalStores,
    activeStores,
    totalVouchers,
    activeVouchers,
    totalClicks,
    recentClicks
  ] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { isActive: true } }),
    prisma.voucher.count(),
    prisma.voucher.count({
      where: {
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: now } }
        ]
      }
    }),
    prisma.voucherClick.count(),
    prisma.voucherClick.count({
      where: {
        clickedAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  return (
    <div className="dashboard-container">
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Stores</h3>
          <p className="stat-number">{activeStores} / {totalStores}</p>
          <span>Active Stores</span>
        </div>
        <div className="stat-card">
          <h3>Vouchers</h3>
          <p className="stat-number">{activeVouchers} / {totalVouchers}</p>
          <span>Valid Vouchers</span>
        </div>
        <div className="stat-card">
          <h3>Traffic</h3>
          <p className="stat-number">{totalClicks.toLocaleString()}</p>
          <span>Total Clicks</span>
        </div>
        <div className="stat-card">
          <h3>30-Day Activity</h3>
          <p className="stat-number">{recentClicks.toLocaleString()}</p>
          <span>Recent Clicks</span>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <a href="/admin/stores" className="action-card">Manage Stores</a>
          <a href="/admin/vouchers" className="action-card">Manage Vouchers</a>
          <a href="/admin/categories" className="action-card">Categories</a>
          <a href="/admin/countries" className="action-card">Countries</a>
        </div>
      </div>
    </div>
  );
}