// components/leaderboard/HomepageLeaderboardSection.jsx
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';
import './HomepageLeaderboardSection.css';

// ─────────────────────────────────────────────────────────────────────────────
// Data layer
// ─────────────────────────────────────────────────────────────────────────────

async function getLeagueStandings(lang = 'en', limit = 5) {
  try {
    const week = getCurrentWeekIdentifier();

    const snapshots = await prisma.storeSavingsSnapshot.findMany({
      where: {
        weekIdentifier: week,
        categoryId: null, // Global overall standings
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
      
      // Calculate specific spots moved for the "Form" column
      let spotsMoved = 0;
      if (snap.movement === 'up' || snap.movement === 'down') {
        spotsMoved = snap.previousRank ? Math.abs(snap.previousRank - snap.rank) : 0;
      }

      return {
        rank: snap.rank,
        movement: snap.movement, // 'up' | 'down' | 'same' | 'new'
        spotsMoved: spotsMoved,
        storeId: snap.storeId,
        storeName: t.name || '',
        storeSlug: t.slug || '',
        storeLogo: snap.store.logo,
        score: snap.savingsOverridePercent ?? snap.calculatedMaxSavingsPercent,
      };
    });
  } catch (error) {
    console.error("League Standings fetch error:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function FormBadge({ movement, spotsMoved, isRTL }) {
  if (!movement) return null;

  if (movement === 'up') {
    return (
      <div className="form-badge form-up" title={`Moved up ${spotsMoved} spots`}>
        <span className="form-icon">▲</span>
        {spotsMoved > 0 && <span>{spotsMoved}</span>}
      </div>
    );
  }
  if (movement === 'down') {
    return (
      <div className="form-badge form-down" title={`Dropped ${spotsMoved} spots`}>
        <span className="form-icon">▼</span>
        {spotsMoved > 0 && <span>{spotsMoved}</span>}
      </div>
    );
  }
  if (movement === 'same') {
    return (
      <div className="form-badge form-same" title="Maintained position">
        <span className="form-icon">▬</span>
      </div>
    );
  }
  if (movement === 'new') {
    return (
      <div className="form-badge form-new" title="New Entry">
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

  const standings = await getLeagueStandings(lang, 5);
  if (standings.length === 0) return null;

  // Sports-style labels
  const labels = {
    heading: lang === 'ar' ? 'جدول الترتيب' : 'League Standings',
    meta: lang === 'ar' ? 'أعلى الخصومات' : 'Top Discounts',
    colPos: lang === 'ar' ? 'مركز' : 'POS',
    colClub: lang === 'ar' ? 'المتجر' : 'CLUB',
    colForm: lang === 'ar' ? 'الحالة' : 'FORM',
    colPts: lang === 'ar' ? 'النقاط' : 'PTS',
  };

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={labels.heading}
      className="leaderboard-container"
    >
      {/* Header Area */}
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">
          <span className="material-symbols-sharp" style={{ color: '#0f172a' }}>
            leaderboard
          </span>
          {labels.heading}
        </h2>
        <span className="leaderboard-meta">{labels.meta}</span>
      </div>

      {/* Strict League Table Wrapper */}
      <div className="league-standings">
        
        {/* Table Head */}
        <div className="standings-grid standings-head">
          <div className="cell cell-pos">{labels.colPos}</div>
          <div className="cell cell-club">{labels.colClub}</div>
          <div className="cell cell-form">{labels.colForm}</div>
          <div className="cell cell-pts">{labels.colPts}</div>
        </div>

        {/* Table Body */}
        <div className="standings-body">
          {standings.map((team) => (
            <Link
              key={team.storeId}
              href={`/${locale}/stores/${team.storeSlug}`}
              className={`standings-grid standings-row pos-${team.rank}`}
            >
              {/* POS */}
              <div className="cell cell-pos">
                {team.rank}
              </div>

              {/* CLUB (Store) */}
              <div className="cell cell-club">
                <div className="club-crest">
                  {team.storeLogo ? (
                    <Image
                      src={team.storeLogo}
                      alt={team.storeName}
                      width={28}
                      height={28}
                    />
                  ) : (
                    <span className="material-symbols-sharp" style={{ fontSize: '1rem', color: '#cbd5e1' }}>
                      storefront
                    </span>
                  )}
                </div>
                <span className="club-name" title={team.storeName}>
                  {team.storeName}
                </span>
              </div>

              {/* FORM (Movement) */}
              <div className="cell cell-form">
                <FormBadge 
                  movement={team.movement} 
                  spotsMoved={team.spotsMoved} 
                  isRTL={isRTL} 
                />
              </div>

              {/* PTS (Score/Savings) */}
              <div className="cell cell-pts">
                {Math.round(team.score)}<span style={{ fontSize: '0.7em' }}>%</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
