'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import './StickyStoreHeader.css';

/**
 * StickyStoreHeader
 *
 * A compact sticky bar that slides down from the top once the main
 * StoreHeader leaves the viewport.  It owns its own copy/track logic
 * so the two components are fully independent.
 *
 * Props
 * -----
 * sentinelRef   – a React ref attached to the main <StoreHeader>.
 *                 We observe it with IntersectionObserver.
 * store         – same store object passed to StoreHeader.
 * mostTrackedVoucher – same voucher object (needs .id, .code, .title).
 * locale        – e.g. 'ar-SA' | 'en-AE'
 * country       – { code, name, … }
 */
const StickyStoreHeader = ({
  sentinelRef,
  store,
  mostTrackedVoucher,
  locale,
  country,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const barRef = useRef(null);

  const isArabic = locale?.startsWith('ar');
  const dir = isArabic ? 'rtl' : 'ltr';

  const storeName = store?.name || 'Store';
  const storeLogo = store?.logo;
  const websiteUrl = store?.websiteUrl;
  const voucherCode = mostTrackedVoucher?.code;
  const topVoucherTitle = mostTrackedVoucher?.title || null;

  // ── Observe the main header ───────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef?.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the main header is NOT intersecting (scrolled away) → show bar
        setIsVisible(!entry.isIntersecting);
      },
      {
        root: null,
        // Trigger as soon as the very bottom edge of the header leaves the viewport
        rootMargin: '0px 0px 0px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef]);

  // ── Copy + track + open store ─────────────────────────
  const handleCopyAndTrack = async () => {
    if (!voucherCode) {
      if (websiteUrl) window.open(websiteUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      await navigator.clipboard.writeText(voucherCode);
      setIsCopied(true);
      if (navigator.vibrate) navigator.vibrate(50);

      if (mostTrackedVoucher?.id) {
        fetch('/api/vouchers/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voucherId: mostTrackedVoucher.id,
            countryCode: country?.code,
          }),
        }).catch((err) => console.error('Tracking Error:', err));
      }

      setTimeout(() => {
        if (websiteUrl) window.open(websiteUrl, '_blank', 'noopener,noreferrer');
      }, 800);

      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error('Copy failed:', err);
      if (websiteUrl) window.open(websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render anything until we actually need to show
  // (keeps the DOM clean and avoids any layout cost while scrolled to top)
  if (!store) return null;

  return (
    <div
      ref={barRef}
      className={`ssh-bar ${isVisible ? 'ssh-visible' : ''}`}
      dir={dir}
      aria-hidden={!isVisible}
    >
      <div className="ssh-inner">
        {/* Logo */}
        <div className="ssh-logo-wrap">
          {storeLogo ? (
            <Image
              src={storeLogo}
              alt={`${storeName} logo`}
              width={40}
              height={40}
              className="ssh-logo-img"
              quality={80}
            />
          ) : (
            <div className="ssh-logo-fallback">
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Store name */}
        <span className="ssh-store-name">{storeName}</span>

        {/* CTA — only render when there's a voucher title */}
        {topVoucherTitle && (
          <button
            className={`ssh-cta ${isCopied ? 'copied' : ''}`}
            onClick={handleCopyAndTrack}
            type="button"
          >
            <span className="material-symbols-sharp">
              {isCopied ? 'check_circle' : 'arrow_forward'}
            </span>
            <span className="ssh-cta-label">
              {isCopied
                ? isArabic ? 'تم النسخ!' : 'Copied!'
                : isArabic ? 'الذهاب للمتجر' : 'Go to Store'}
            </span>
            {!isCopied && <div className="ssh-cta-ripple" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default StickyStoreHeader;
