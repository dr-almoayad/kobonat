// components/SavingsLeaderboard/SavingsLeaderboard.jsx
// Server Component — fetches data directly from snapshot table.
// No client-side recalculation. Renders as a static league table.
// Usage:
//   <SavingsLeaderboard limit={5} locale="ar-SA" />
//   <SavingsLeaderboard categoryId={3} limit={3} locale="en-SA" />

import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import './SavingsLeaderboard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Data fetcher — reads snapshot table only, no voucher joins
// ─────────────────────────────────────────────────────────────────────────────

async function getLeaderboardData({ categoryId, limit, lang }) {
  const week = getCurrentWeekIdentifier();

  try {
    const snapshots = await prisma.storeSavingsSnapshot.findMany({
      where: {
        weekIdentifier: week,
        categoryId:     categoryId ?? null,
        calculatedMaxSavingsPercent: { gt: 0 },
      },
      orderBy: { rank: 'asc' },
      take:    limit,
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
        rank:             snap.rank,
        previousRank:     snap.previousRank,
        movement:         snap.movement,
        storeId:          snap.storeId,
        storeName:        t.name || '',
        storeSlug:        t.slug || '',
        storeLogo:        snap.store.logo,
        maxSavingsPercent: snap.savingsOverridePercent ?? snap.calculatedMaxSavingsPercent,
      };
    });
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Movement indicator
// ─────────────────────────────────────────────────────────────────────────────

function MovementBadge({ movement, previousRank }) {
  if (movement === 'NEW') {
    return <span className="lb-movement lb-movement--new" aria-label="New entry">NEW</span>;
  }
  if (movement === 'UP') {
    return (
      <span className="lb-movement lb-movement--up" aria-label={`Up from #${previousRank}`}>
        <span className="material-symbols-sharp">arrow_upward</span>
      </span>
    );
  }
  if (movement === 'DOWN') {
    return (
      <span className="lb-movement lb-movement--down" aria-label={`Down from #${previousRank}`}>
        <span className="material-symbols-sharp">arrow_downward</span>
      </span>
    );
  }
  // SAME
  return (
    <span className="lb-movement lb-movement--same" aria-label="No change">
      <span className="material-symbols-sharp">remove</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rank badge (medal colours for top 3)
// ─────────────────────────────────────────────────────────────────────────────

function RankBadge({ rank }) {
  const medal = rank === 1 ? 'lb-rank--gold' : rank === 2 ? 'lb-rank--silver' : rank === 3 ? 'lb-rank--bronze' : '';
  return (
    <span className={`lb-rank ${medal}`} aria-label={`Rank ${rank}`}>
      {rank <= 3 ? (
        <span className="material-symbols-sharp">
          {rank === 1 ? 'emoji_events' : 'workspace_premium'}
        </span>
      ) : null}
      #{rank}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default async function SavingsLeaderboard({
  locale     = 'ar-SA',
  categoryId = null,
  limit      = 5,
  title,       // optional override
}) {
  const lang   = locale.split('-')[0];
  const isRtl  = lang === 'ar';

  const rows = await getLeaderboardData({ categoryId, limit, lang });
  if (!rows.length) return null;

  const defaultTitle = isRtl ? '🏆 أعلى توفير هذا الأسبوع' : '🏆 Top Savings This Week';
  const heading = title || defaultTitle;

  return (
    <section className="lb-section" dir={isRtl ? 'rtl' : 'ltr'} aria-label={heading}>
      <div className="lb-inner">
        <h2 className="lb-heading">{heading}</h2>

        <ol className="lb-table" role="list">
          {rows.map((row) => (
            <li key={row.storeId} className="lb-row">
              <RankBadge rank={row.rank} />

              <Link
                href={`/${locale}/stores/${row.storeSlug}`}
                className="lb-store"
                aria-label={row.storeName}
              >
                {row.storeLogo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={row.storeLogo}
                    alt={row.storeName}
                    className="lb-logo"
                    loading="lazy"
                  />
                ) : (
                  <span className="lb-logo-fallback">{row.storeName[0]}</span>
                )}
                <span className="lb-store-name">{row.storeName}</span>
              </Link>

              <span className="lb-savings" aria-label={`Up to ${row.maxSavingsPercent}% off`}>
                {isRtl ? `خصم حتى` : 'Up to'}
                <strong>{row.maxSavingsPercent}%</strong>
              </span>

              <MovementBadge movement={row.movement} previousRank={row.previousRank} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
