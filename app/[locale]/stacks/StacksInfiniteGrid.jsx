// app/[locale]/stacks/StacksInfiniteGrid.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import OfferStackBox from '@/components/OfferStackBox/OfferStackBox';

export default function StacksInfiniteGrid({
  initialStacks,
  initialHasMore,
  initialTotal,
  locale,
  isAr,
}) {
  const [stacks, setStacks] = useState(initialStacks);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);

    try {
      const next = page + 1;
      const res = await fetch(`/api/stacks?page=${next}&locale=${locale}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();

      setStacks(prev => {
        const existingKeys = new Set(
          prev.map(s => `${s.storeId}-${s.items.map(i => i.id).join('-')}`)
        );
        const fresh = data.stacks.filter(
          s => !existingKeys.has(`${s.storeId}-${s.items.map(i => i.id).join('-')}`)
        );
        // Merge and re‑sort to maintain active-first order
        const merged = [...prev, ...fresh];
        return merged.sort((a, b) => {
          if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
          return new Date(b.lastModified) - new Date(a.lastModified);
        });
      });
      setPage(next);
      setHasMore(data.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, hasMore, locale]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Separate active and expired (both already sorted)
  const activeStacks = stacks.filter(s => !s.isExpired);
  const expiredStacks = stacks.filter(s => s.isExpired);

  const stackKey = s => `${s.storeId}-${s.items.map(i => i.id).join('-')}`;

  return (
    <>
      {/* ── Active stacks ── */}
      {activeStacks.length > 0 && (
        <div
          className="sp-grid"
          aria-label={isAr ? 'العروض المجمّعة النشطة' : 'Active stacked deals'}
        >
          {activeStacks.map(stack => (
            <OfferStackBox key={stackKey(stack)} stack={stack} locale={locale} />
          ))}
        </div>
      )}

      {/* ── Expired section – always at the bottom, grayed out ── */}
      {expiredStacks.length > 0 && (
        <div className="sp-expired-section" aria-label={isAr ? 'عروض منتهية' : 'Expired offers'}>
          <div className="sp-expired-divider">
            <span className="material-symbols-sharp" aria-hidden="true">schedule</span>
            {isAr ? 'عروض منتهية الصلاحية' : 'Expired offers'}
          </div>
          <div className="sp-grid sp-grid--expired">
            {expiredStacks.map(stack => (
              <div key={stackKey(stack)} className="sp-expired-wrap" aria-label={isAr ? 'عرض منتهي' : 'Expired'}>
                <div className="sp-expired-badge" aria-hidden="true">
                  {isAr ? 'منتهي' : 'Expired'}
                </div>
                <OfferStackBox stack={stack} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sentinel ── */}
      <div ref={sentinelRef} className="sp-sentinel" aria-hidden="true" />

      {/* ── Loading indicator ── */}
      {loading && (
        <div className="sp-loading" aria-live="polite" aria-label={isAr ? 'جار التحميل' : 'Loading more'}>
          <div className="sp-loading-dots" aria-hidden="true">
            <span /><span /><span />
          </div>
          <p className="sp-loading-text">
            {isAr ? 'جار التحميل…' : 'Loading more…'}
          </p>
        </div>
      )}

      {/* ── Error / retry ── */}
      {error && !loading && (
        <div className="sp-retry">
          <p>{isAr ? 'حدث خطأ أثناء التحميل' : 'Something went wrong'}</p>
          <button className="sp-retry-btn" onClick={loadMore}>
            {isAr ? 'إعادة المحاولة' : 'Try again'}
          </button>
        </div>
      )}

      {/* ── End of list ── */}
      {!hasMore && stacks.length > 0 && !loading && !error && (
        <div className="sp-end-message" aria-live="polite">
          <span className="material-symbols-sharp" aria-hidden="true">check_circle</span>
          <p>{isAr ? 'شاهدت جميع العروض المتاحة' : "You've seen all available stacks"}</p>
        </div>
      )}
    </>
  );
}
