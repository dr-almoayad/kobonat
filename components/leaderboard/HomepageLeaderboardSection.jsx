// components/leaderboard/HomepageLeaderboardSection.jsx
// Server Component — fetches top-5 leaderboard entries and renders them inline.
// Zero client JS required; data is cached at the edge for 1 hour.

import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentWeekIdentifier } from '@/lib/leaderboard/calculateStoreSavings';

// ─────────────────────────────────────────────────────────────────────────────
// Data layer (runs on server, same pattern as /api/leaderboard but no HTTP hop)
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
        maxSavingsPercent:
          snap.savingsOverridePercent ?? snap.calculatedMaxSavingsPercent,
      };
    });
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function MovementBadge({ movement, isRTL }) {
  if (!movement || movement === 'same') return null;

  const config = {
    up:   { symbol: '▲', color: '#16a34a', bg: '#dcfce7' },
    down: { symbol: '▼', color: '#dc2626', bg: '#fee2e2' },
    new:  { symbol: 'NEW', color: '#7c3aed', bg: '#ede9fe', fontSize: '0.6rem' },
  }[movement];

  if (!config) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        borderRadius: 4,
        background: config.bg,
        color: config.color,
        fontSize: config.fontSize || '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        marginInlineStart: 4,
      }}
    >
      {config.symbol}
    </span>
  );
}

function RankBadge({ rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  if (medals[rank]) {
    return <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{medals[rank]}</span>;
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#f3f4f6',
        color: '#6b7280',
        fontWeight: 700,
        fontSize: '0.85rem',
      }}
    >
      {rank}
    </span>
  );
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
    heading: lang === 'ar' ? 'أعلى المتاجر توفيراً هذا الأسبوع' : 'Top Saving Stores This Week',
    sub:
      lang === 'ar'
        ? 'المتاجر التي تقدم أعلى نسبة خصم موثقة هذا الأسبوع'
        : 'Stores offering the highest verified discounts this week',
    cta: lang === 'ar' ? 'عرض القائمة الكاملة' : 'View Full Leaderboard',
    savings: lang === 'ar' ? 'توفير حتى' : 'Up to',
    off: lang === 'ar' ? 'خصم' : 'off',
  };

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={labels.heading}
      className="home-section leaderboard-section"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                fontWeight: 800,
                color: '#1a1a1a',
                margin: '0 0 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-sharp" style={{ color: '#f59e0b' }}>
                emoji_events
              </span>
              {labels.heading}
            </h2>
            <p style={{ color: '#777', fontSize: '0.875rem', margin: 0 }}>{labels.sub}</p>
          </div>

          <Link
            href={`/${locale}/leaderboard`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 8,
              border: '1.5px solid #470ae2',
              color: '#470ae2',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
          >
            {labels.cta} {isRTL ? '←' : '→'}
          </Link>
        </div>

        {/* ── Leaderboard rows ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {entries.map((entry) => (
            <Link
              key={entry.storeId}
              href={`/${locale}/stores/${entry.storeSlug}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: entry.rank <= 3 ? 'linear-gradient(135deg, #fefce8 0%, #fff 100%)' : '#fff',
                  border: `1.5px solid ${entry.rank <= 3 ? '#fde68a' : '#f0f0f0'}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.15s, transform 0.1s',
                }}
              >
                {/* Rank */}
                <div style={{ flexShrink: 0, width: 32, textAlign: 'center' }}>
                  <RankBadge rank={entry.rank} />
                </div>

                {/* Store logo */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  {entry.storeLogo ? (
                    <Image
                      src={entry.storeLogo}
                      alt={entry.storeName}
                      width={40}
                      height={40}
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '1.25rem',
                        color: '#9ca3af',
                      }}
                      className="material-symbols-sharp"
                    >
                      storefront
                    </span>
                  )}
                </div>

                {/* Store name + movement */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: '#1a1a1a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.storeName}
                    </span>
                    <MovementBadge movement={entry.movement} isRTL={isRTL} />
                  </div>
                </div>

                {/* Savings badge */}
                <div
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: '#470ae2',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '6px 14px',
                    minWidth: 72,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 600 }}>
                    {labels.savings}
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2 }}>
                    {Math.round(entry.maxSavingsPercent)}%
                  </span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>{labels.off}</span>
                </div>

                {/* Chevron */}
                <span
                  className="material-symbols-sharp"
                  style={{
                    color: '#9ca3af',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                    transform: isRTL ? 'scaleX(-1)' : undefined,
                  }}
                >
                  chevron_right
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
