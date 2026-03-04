// components/leaderboard/StoreLeaderboardSidebar.jsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

function MovementBadge({ movement, rank, previousRank }) {
  if (movement === 'NEW') {
    return (
      <span style={{
        fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.05em',
        background: '#dbeafe', color: '#1d4ed8',
        padding: '1px 4px', borderRadius: 3,
        fontFamily: "'Alexandria', 'Open Sans', sans-serif",
      }}>NEW</span>
    );
  }
  if (movement === 'UP') {
    const diff = (previousRank || rank) - rank;
    return (
      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#16a34a',
        fontFamily: "'Alexandria', 'Open Sans', sans-serif" }}>
        ▲{diff > 0 ? diff : ''}
      </span>
    );
  }
  if (movement === 'DOWN') {
    const diff = rank - (previousRank || rank);
    return (
      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#dc2626',
        fontFamily: "'Alexandria', 'Open Sans', sans-serif" }}>
        ▼{diff > 0 ? diff : ''}
      </span>
    );
  }
  return <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>—</span>;
}

/**
 * StoreLeaderboardSidebar
 *
 * Props:
 *   snapshots   — array from prisma.storeSavingsSnapshot (top 10, global, current week)
 *   currentStoreId — highlight the current store's row
 *   locale      — 'en-SA' | 'ar-SA'
 *   weekLabel   — e.g. "2026-W10"
 */
export default function StoreLeaderboardSidebar({
  snapshots = [],
  currentStoreId,
  locale = 'en-SA',
  weekLabel,
}) {
  const lang  = locale?.split('-')[0] || 'en';
  const isRTL = lang === 'ar';

  const heading   = lang === 'ar' ? 'جدول توفير المتاجر' : 'Store Savings Leaderboard';
  const viewAll   = lang === 'ar' ? 'عرض الكل' : 'View all';
  const savingsLbl = lang === 'ar' ? 'توفير' : 'Savings';
  const weekTxt   = lang === 'ar' ? 'هذا الأسبوع' : weekLabel || 'This Week';
  const emptyTxt  = lang === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet';

  return (
    <aside
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        fontFamily: "'Alexandria', 'Open Sans', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', borderBottom: '1px solid #f1f5f9',
        background: '#fafbfc',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#1e293b',
          }}>
            {heading}
          </span>
          <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 500 }}>
            {weekTxt}
          </span>
        </div>
        <Link
          href={`/${locale}/leaderboard`}
          style={{ fontSize: '0.68rem', fontWeight: 600, color: '#470ae2', textDecoration: 'none' }}
        >
          {viewAll} →
        </Link>
      </div>

      {/* ── Column headers ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 52px',
        padding: '5px 14px',
        background: '#f8fafc',
        borderBottom: '1px solid #f1f5f9',
        gap: 6,
      }}>
        {['#', lang === 'ar' ? 'المتجر' : 'Store', savingsLbl].map((col, i) => (
          <span key={i} style={{
            fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: '#94a3b8',
            textAlign: i === 2 ? 'end' : 'start',
          }}>{col}</span>
        ))}
      </div>

      {/* ── Rows ── */}
      {snapshots.length === 0 ? (
        <p style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
          {emptyTxt}
        </p>
      ) : (
        <div>
          {snapshots.map(entry => {
            const name    = entry.store?.translations?.[0]?.name || '—';
            const slug    = entry.store?.translations?.[0]?.slug || '';
            const logo    = entry.store?.bigLogo || entry.store?.logo;
            const savings = entry.savingsOverridePercent ?? entry.calculatedMaxSavingsPercent ?? 0;
            const isCurrent = entry.store?.id === currentStoreId;

            const medalColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
            const medalBg = {
              1: 'linear-gradient(135deg,#FFD700,#FFA500)',
              2: 'linear-gradient(135deg,#C0C0C0,#A0A0A0)',
              3: 'linear-gradient(135deg,#CD7F32,#A0522D)',
            };

            return (
              <Link
                key={entry.id ?? entry.rank}
                href={slug ? `/${locale}/stores/${slug}` : '#'}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr 52px',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderBottom: '1px solid #f8fafc',
                  textDecoration: 'none',
                  background: isCurrent
                    ? 'linear-gradient(90deg, #f0ebff 0%, #faf5ff 100%)'
                    : entry.rank === 1 ? 'rgba(255,200,0,0.04)'
                    : entry.rank === 2 ? 'rgba(180,188,200,0.03)'
                    : entry.rank === 3 ? 'rgba(180,100,40,0.03)'
                    : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = '#faf5ff'; }}
                onMouseLeave={e => {
                  if (!isCurrent) {
                    e.currentTarget.style.background =
                      entry.rank === 1 ? 'rgba(255,200,0,0.04)' :
                      entry.rank === 2 ? 'rgba(180,188,200,0.03)' :
                      entry.rank === 3 ? 'rgba(180,100,40,0.03)' : 'transparent';
                  }
                }}
              >
                {/* Rank */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {entry.rank <= 3 ? (
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: medalBg[entry.rank],
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.58rem', fontWeight: 800,
                      boxShadow: entry.rank === 1 ? '0 2px 5px rgba(255,165,0,.35)' : 'none',
                    }}>
                      {entry.rank}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isCurrent ? '#470ae2' : '#94a3b8' }}>
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Store */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: '#f1f5f9', border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                    outline: isCurrent ? '2px solid #470ae2' : 'none',
                    outlineOffset: 1,
                  }}>
                    {logo ? (
                      <Image src={logo} alt={name} width={26} height={26} style={{ objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#470ae2' }}>
                        {name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent ? '#470ae2' : '#1e293b',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {name}
                    </span>
                    <MovementBadge
                      movement={entry.movement}
                      rank={entry.rank}
                      previousRank={entry.previousRank}
                    />
                  </div>
                </div>

                {/* Savings */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{
                    fontSize: '0.63rem', fontWeight: 700,
                    color: savings > 0 ? '#059669' : '#94a3b8',
                    background: savings > 0 ? '#ecfdf5' : '#f8fafc',
                    border: `1px solid ${savings > 0 ? '#a7f3d0' : '#e2e8f0'}`,
                    padding: '2px 6px', borderRadius: 20,
                    whiteSpace: 'nowrap',
                  }}>
                    {savings > 0 ? `${Math.round(savings)}%` : '—'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
