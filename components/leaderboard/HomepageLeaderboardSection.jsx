// components/leaderboard/HomepageLeaderboardSection.jsx
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import './HomepageLeaderboardSection.css'; // Make sure this path is correct

// ─────────────────────────────────────────────────────────────────────────────
// Data layer (Server-side)
// ─────────────────────────────────────────────────────────────────────────────

async function getLeaderboard(lang = 'en', limit = 5) {
  try {
    const week = getCurrentWeekIdentifier();

    const snapshots = await prisma.storeSavingsSnapshot.findMany({
      where: {
        weekIdentifier: week,
        categoryId: null, // global leaderboard
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
          },
        },
      },
    });

    return snapshots.map((snap) => {
      const t = snap.store.translations[0] || {};
      return {
        rank: snap.rank,
        previousRank: snap.previousRank,
        movement: snap.movement, // 'up' | 'down' | 'same' | 'new'
        storeId: snap.storeId,
        storeName: t.name || '',
        storeSlug: t.slug || '',
        storeLogo: snap.store.logo,
        maxSavingsPercent: snap.savingsOverridePercent ?? snap.calculatedMaxSavingsPercent,
      };
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function MovementBadge({ movement, isRTL }) {
  if (!movement) return null;

  if (movement === 'up') {
    return (
      <div className="movement move-up" title="Moved Up">
        <span className="material-symbols-sharp movement-icon">arrow_drop_up</span>
      </div>
    );
  }
  if (movement === 'down') {
    return (
      <div className="movement move-down" title="Moved Down">
        <span className="material-symbols-sharp movement-icon">arrow_drop_down</span>
      </div>
    );
  }
  if (movement === 'same') {
    return (
      <div className="movement move-same" title="No Change">
        <span className="material-symbols-sharp movement-icon">remove</span>
      </div>
    );
  }
  if (movement === 'new') {
    return (
      <div className="movement move-new" title="New Entry">
        {isRTL ? 'جديد' : 'NEW'}
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default async function HomepageLeaderboardSection({ locale }) {
  const lang = locale?.split('-')[0] || 'en';
  const isRTL = lang === 'ar';

  const entries = await getLeaderboard(lang, 5);
  if (entries.length === 0) return null;

  const labels = {
    heading: lang === 'ar' ? 'صدارة التوفير' : 'Savings Leaderboard',
    sub: lang === 'ar' 
      ? 'أعلى المتاجر تقديماً للخصومات هذا الأسبوع' 
      : 'Stores offering the highest verified discounts this week',
    colRank: lang === 'ar' ? 'المركز' : 'Rank',
    colStore: lang === 'ar' ? 'المتجر' : 'Store',
    colScore: lang === 'ar' ? 'التوفير' : 'Savings',
    off: lang === 'ar' ? 'خصم' : 'OFF',
  };

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={labels.heading}
      className="leaderboard-wrapper"
    >
      {/* Header */}
      <div className="leaderboard-header-top">
        <h2 className="leaderboard-title">
          <span className="material-symbols-sharp icon">emoji_events</span>
          {labels.heading}
        </h2>
        <p className="leaderboard-subtitle">{labels.sub}</p>
      </div>

      {/* League Table */}
      <div className="league-table-container">
        
        {/* Table Header Row */}
        <div className="league-table-header league-row-grid">
          <div className="th-cell th-rank">{labels.colRank}</div>
          <div className="th-cell th-store">{labels.colStore}</div>
          <div className="th-cell th-score">{labels.colScore}</div>
        </div>

        {/* Table Body */}
        <div className="league-table-body">
          {entries.map((entry) => (
            <Link
              key={entry.storeId}
              href={`/${locale}/stores/${entry.storeSlug}`}
              className={`league-row-link rank-${entry.rank}`}
            >
              <div className="league-row-grid">
                
                {/* 1. Rank & Movement */}
                <div className="td-rank">
                  <span className="rank-number">{entry.rank}</span>
                  <MovementBadge movement={entry.movement} isRTL={isRTL} />
                </div>

                {/* 2. Store Info */}
                <div className="td-store">
                  <div className="store-logo-wrapper">
                    {entry.storeLogo ? (
                      <Image
                        src={entry.storeLogo}
                        alt={entry.storeName}
                        width={48}
                        height={48}
                        className="store-logo"
                      />
                    ) : (
                      <span className="material-symbols-sharp store-fallback-icon">
                        storefront
                      </span>
                    )}
                  </div>
                  <span className="store-name" title={entry.storeName}>
                    {entry.storeName}
                  </span>
                </div>

                {/* 3. Score (Savings) */}
                <div className="td-score">
                  <div className="score-value">
                    {Math.round(entry.maxSavingsPercent)}
                    <span className="score-symbol">%</span>
                  </div>
                  <span className="score-label">{labels.off}</span>
                </div>

              </div>
            </Link>
          ))}
        </div>
        
      </div>
    </section>
  );
}
