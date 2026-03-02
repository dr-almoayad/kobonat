import Image from 'next/image';
import Link from 'next/link';
import styles from './LeaderboardSection.module.css';
import { prisma } from '@/lib/prisma';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';

// Data fetching (same pattern as original)
async function getLeaderboardData(lang = 'en', limit = 10) {
  try {
    const week = getCurrentWeekIdentifier();

    const snapshots = await prisma.storeSavingsSnapshot.findMany({
      where: {
        weekIdentifier: week,
        categoryId: null,
        calculatedMaxSavingsPercent: { gt: 0 },
      },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        store: {
          select: {
            id: true,
            logo: true,
            translations: {
              where: { locale: lang },
              select: { name: true, slug: true },
            },
            // Additional metrics (optional – you can join savingsMetrics)
            savingsMetrics: {
              orderBy: { monthIdentifier: 'desc' },
              take: 1,
              select: {
                totalActiveOffers: true,
                codeSuccessRate: true,
              },
            },
          },
        },
      },
    });

    return snapshots.map((snap) => {
      const t = snap.store.translations[0] || {};
      const metrics = snap.store.savingsMetrics?.[0] || {};
      return {
        rank: snap.rank,
        previousRank: snap.previousRank,
        movement: snap.movement?.toLowerCase() || 'same',
        storeId: snap.storeId,
        storeName: t.name || 'Unknown',
        storeSlug: t.slug || '',
        storeLogo: snap.store.logo,
        savings: snap.savingsOverridePercent ?? snap.calculatedMaxSavingsPercent,
        offers: metrics.totalActiveOffers || 0,
        successRate: metrics.codeSuccessRate || 0,
      };
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return [];
  }
}

// Helper to determine movement symbol and color
const movementConfig = {
  up:    { symbol: '▲', color: '#16a34a', label: 'up' },
  down:  { symbol: '▼', color: '#dc2626', label: 'down' },
  same:  { symbol: '•', color: '#6b7280', label: 'same' },
  new:   { symbol: 'NEW', color: '#7c3aed', label: 'new', short: true },
};

// Medal emojis for top 3
const medals = ['🥇', '🥈', '🥉'];

export default async function LeaderboardSection({ locale = 'en' }) {
  const lang = locale.split('-')[0];
  const isRTL = lang === 'ar';
  const entries = await getLeaderboardData(lang, 10);

  if (!entries.length) return null;

  const labels = {
    title: lang === 'ar' ? 'ترتيب المتاجر' : 'Store Leaderboard',
    subtitle: lang === 'ar' ? 'أعلى المتاجر توفيراً هذا الأسبوع' : 'Top saving stores this week',
    savings: lang === 'ar' ? 'التوفير' : 'Savings',
    offers: lang === 'ar' ? 'العروض' : 'Offers',
    success: lang === 'ar' ? 'نجاح الكود' : 'Code Success',
    trend: lang === 'ar' ? 'الاتجاه' : 'Trend',
    viewAll: lang === 'ar' ? 'عرض الكل' : 'View Full Leaderboard',
  };

  return (
    <section className={styles.leaderboard} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              <span className="material-symbols-sharp">emoji_events</span>
              {labels.title}
            </h2>
            <p className={styles.subtitle}>{labels.subtitle}</p>
          </div>
          <Link href={`/${locale}/leaderboard`} className={styles.viewAll}>
            {labels.viewAll}
            <span className="material-symbols-sharp">
              {isRTL ? 'chevron_left' : 'chevron_right'}
            </span>
          </Link>
        </div>

        {/* Desktop column headers (hidden on mobile) */}
        <div className={styles.columnHeaders}>
          <div>#</div>
          <div>{lang === 'ar' ? 'المتجر' : 'Store'}</div>
          <div>{labels.savings}</div>
          <div>{labels.offers}</div>
          <div>{labels.success}</div>
          <div>{labels.trend}</div>
        </div>

        {/* Rows */}
        <div className={styles.rows}>
          {entries.map((entry) => (
            <Link
              key={entry.storeId}
              href={`/${locale}/stores/${entry.storeSlug}`}
              className={styles.rowLink}
            >
              <div className={styles.row}>
                {/* Rank with medal for top 3 */}
                <div className={styles.rank}>
                  {entry.rank <= 3 ? (
                    <span className={styles.medal}>{medals[entry.rank - 1]}</span>
                  ) : (
                    <span className={styles.rankNumber}>#{entry.rank}</span>
                  )}
                </div>

                {/* Store info */}
                <div className={styles.store}>
                  <div className={styles.logoWrapper}>
                    {entry.storeLogo ? (
                      <Image
                        src={entry.storeLogo}
                        alt={entry.storeName}
                        width={36}
                        height={36}
                        className={styles.logo}
                      />
                    ) : (
                      <span className="material-symbols-sharp">store</span>
                    )}
                  </div>
                  <span className={styles.storeName}>{entry.storeName}</span>
                </div>

                {/* Savings badge (always visible) */}
                <div className={styles.savingsBadge}>
                  <span className={styles.savingsValue}>{Math.round(entry.savings)}%</span>
                  <span className={styles.savingsLabel}>{labels.savings}</span>
                </div>

                {/* Desktop-only stats */}
                <div className={styles.desktopStats}>
                  <div className={styles.stat}>{entry.offers}</div>
                  <div className={styles.stat}>
                    {entry.successRate ? `${Math.round(entry.successRate)}%` : '—'}
                  </div>
                  <div className={styles.trend}>
                    <span
                      className={styles.movement}
                      style={{ color: movementConfig[entry.movement]?.color }}
                    >
                      {movementConfig[entry.movement]?.symbol}
                    </span>
                  </div>
                </div>

                {/* Mobile extra details (shown below row) */}
                <div className={styles.mobileDetails}>
                  <div className={styles.mobileStat}>
                    <span>{labels.offers}:</span> {entry.offers}
                  </div>
                  <div className={styles.mobileStat}>
                    <span>{labels.success}:</span>{' '}
                    {entry.successRate ? `${Math.round(entry.successRate)}%` : '—'}
                  </div>
                  <div className={styles.mobileTrend}>
                    <span
                      className={styles.movement}
                      style={{ color: movementConfig[entry.movement]?.color }}
                    >
                      {movementConfig[entry.movement]?.symbol}
                    </span>
                    <span>{movementConfig[entry.movement]?.label}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
