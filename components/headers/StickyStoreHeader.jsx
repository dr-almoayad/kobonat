'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import './StickyStoreHeader.css';

/**
 * StickyStoreHeader
 * ✅ FIXED: CTA button now renders if there is a voucher OR an external website URL.
 *           This ensures fallback redirection works for stores without active codes.
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

  // ── Observe the main header ───────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef?.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      {
        root: null,
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

  if (!store) return null;

  // ✅ FIX: Determine if we have any valid action path (Voucher OR Store Link Available)
  const hasAction = !!voucherCode || !!websiteUrl;

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
              width={40} // ✅ UX Optimization: Set explicitly to compact dimensions to prevent LCP/CLS shifts inside a sticky layout
              height={40}
              className="ssh-logo-img"
              quality={90}
            />
          ) : (
            <div className="ssh-logo-fallback">
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Store name */}
        <span className="ssh-store-name">{storeName}</span>

        {/* ✅ FIX: Now properly renders the action element even if no code is currently listed */}
        {hasAction && (
          <button
            className={`ssh-cta ${isCopied ? 'copied' : ''}`}
            onClick={handleCopyAndTrack}
            type="button"
          >
            <span className="material-symbols-sharp">
              {isCopied ? 'check_circle' : (voucherCode ? 'content_copy' : 'open_in_new')}
            </span>
            <span className="ssh-cta-label">
              {isCopied
                ? (isArabic ? 'تم النسخ!' : 'Copied!')
                : (voucherCode 
                    ? (isArabic ? 'نسخ الكود' : 'Copy Code') 
                    : (isArabic ? 'الذهاب للمتجر' : 'Go to Store'))}
            </span>
            {!isCopied && <div className="ssh-cta-ripple" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default StickyStoreHeader;
