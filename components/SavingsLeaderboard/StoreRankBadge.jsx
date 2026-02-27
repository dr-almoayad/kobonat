// components/SavingsLeaderboard/StoreRankBadge.jsx
// Server Component — shows current rank + savings inline in StoreHeader.
// Designed to be unobtrusive: renders nothing if no snapshot exists.
//
// Usage in StoreHeader:
//   import StoreRankBadge from '@/components/SavingsLeaderboard/StoreRankBadge';
//   <StoreRankBadge storeId={store.id} locale={locale} />

import { prisma } from '@/lib/prisma';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import './StoreRankBadge.css';

async function getStoreRank(storeId, weekIdentifier) {
  try {
    return await prisma.storeSavingsSnapshot.findUnique({
      where: {
        storeId_categoryId_weekIdentifier: {
          storeId,
          categoryId:     null, // global rank
          weekIdentifier,
        },
      },
      select: {
        rank:                        true,
        previousRank:                true,
        movement:                    true,
        calculatedMaxSavingsPercent: true,
        savingsOverridePercent:      true,
      },
    });
  } catch {
    return null;
  }
}

export default async function StoreRankBadge({ storeId, locale = 'ar-SA' }) {
  const lang   = locale.split('-')[0];
  const isRtl  = lang === 'ar';
  const week   = getCurrentWeekIdentifier();
  const snap   = await getStoreRank(storeId, week);

  if (!snap) return null;

  const savings = snap.savingsOverridePercent ?? snap.calculatedMaxSavingsPercent;
  if (savings <= 0) return null;

  const movementIcon =
    snap.movement === 'UP'   ? '↑' :
    snap.movement === 'DOWN' ? '↓' : '–';

  const movementClass =
    snap.movement === 'UP'   ? 'srb-trend--up'   :
    snap.movement === 'DOWN' ? 'srb-trend--down' : 'srb-trend--same';

  const labels = isRtl
    ? { rank: 'الترتيب', savings: 'أعلى توفير', trend: 'الأسبوع الماضي' }
    : { rank: 'Rank',    savings: 'Max Savings', trend: 'vs last week' };

  return (
    <div className="srb-wrapper" dir={isRtl ? 'rtl' : 'ltr'} aria-label="Savings rank this week">
      {/* Rank */}
      <div className="srb-stat">
        <span className="srb-label">{labels.rank}</span>
        <span className="srb-value srb-value--rank">
          #{snap.rank}
          <span className={`srb-trend ${movementClass}`} aria-label={snap.movement}>
            {movementIcon}
          </span>
        </span>
      </div>

      {/* Divider */}
      <div className="srb-divider" aria-hidden="true" />

      {/* Max savings */}
      <div className="srb-stat">
        <span className="srb-label">{labels.savings}</span>
        <span className="srb-value srb-value--savings">{savings}%</span>
      </div>
    </div>
  );
}
