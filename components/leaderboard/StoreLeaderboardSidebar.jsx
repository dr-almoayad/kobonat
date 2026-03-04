// components/leaderboard/StoreLeaderboardSidebar.jsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './StoreLeaderboardSidebar.css';

function MovementBadge({ movement, rank, previousRank }) {
  if (movement === 'NEW') {
    return <span className={styles.mvNew}>NEW</span>;
  }
  if (movement === 'UP') {
    const diff = (previousRank || rank) - rank;
    return (
      <span className={styles.mvUp}>
        ▲{diff > 0 ? diff : ''}
      </span>
    );
  }
  if (movement === 'DOWN') {
    const diff = rank - (previousRank || rank);
    return (
      <span className={styles.mvDown}>
        ▼{diff > 0 ? diff : ''}
      </span>
    );
  }
  return <span className={styles.mvEqual}>—</span>;
}

/**
 * StoreLeaderboardSidebar
 *
 * Props:
 *   snapshots     – array from prisma.storeSavingsSnapshot (top 10, global, current week)
 *   currentStoreId – highlight the current store's row
 *   locale        – 'en-SA' | 'ar-SA'
 *   weekLabel     – e.g. "2026-W10"
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
      className={styles.container}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>{heading}</span>
          <span className={styles.headerWeek}>{weekTxt}</span>
        </div>
        <Link href={`/${locale}/leaderboard`} className={styles.viewAllLink}>
          {viewAll} →
        </Link>
      </div>

      {/* Column headers */}
      <div className={styles.colHeaders}>
        <span className={styles.colRank}>#</span>
        <span className={styles.colStore}>
          {lang === 'ar' ? 'المتجر' : 'Store'}
        </span>
        <span className={styles.colSavings}>{savingsLbl}</span>
      </div>

      {/* Rows */}
      <div className={styles.rows}>
        {snapshots.length === 0 ? (
          <p className={styles.empty}>{emptyTxt}</p>
        ) : (
          snapshots.map(entry => {
            const name    = entry.store?.translations?.[0]?.name || '—';
            const slug    = entry.store?.translations?.[0]?.slug || '';
            const logo    = entry.store?.bigLogo || entry.store?.logo;
            const savings = entry.savingsOverridePercent ?? entry.calculatedMaxSavingsPercent ?? 0;
            const isCurrent = entry.store?.id === currentStoreId;

            // Determine row background modifiers
            let rowModifier = '';
            if (isCurrent) {
              rowModifier = styles.rowCurrent;
            } else if (entry.rank === 1) {
              rowModifier = styles.rowTop1;
            } else if (entry.rank === 2) {
              rowModifier = styles.rowTop2;
            } else if (entry.rank === 3) {
              rowModifier = styles.rowTop3;
            }

            return (
              <Link
                key={entry.id ?? entry.rank}
                href={slug ? `/${locale}/stores/${slug}` : '#'}
                className={`${styles.row} ${rowModifier}`}
              >
                {/* Rank */}
                <div className={styles.rankCell}>
                  {entry.rank <= 3 ? (
                    <span className={`${styles.medal} ${styles[`medal${entry.rank}`]}`}>
                      {entry.rank}
                    </span>
                  ) : (
                    <span className={styles.rankNumber}>{entry.rank}</span>
                  )}
                </div>

                {/* Store info */}
                <div className={styles.storeCell}>
                  <div className={styles.logoWrapper}>
                    {logo ? (
                      <Image
                        src={logo}
                        alt={name}
                        width={32}
                        height={32}
                        className={styles.logo}
                      />
                    ) : (
                      <span className={styles.logoFallback}>
                        {name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className={styles.nameStack}>
                    <span className={styles.storeName}>{name}</span>
                    <MovementBadge
                      movement={entry.movement}
                      rank={entry.rank}
                      previousRank={entry.previousRank}
                    />
                  </div>
                </div>

                {/* Savings pill */}
                <div className={styles.savingsCell}>
                  <span className={`${styles.savingsPill} ${savings > 0 ? styles.savingsPositive : ''}`}>
                    {savings > 0 ? `${Math.round(savings)}%` : '—'}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
